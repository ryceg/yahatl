"""DataUpdateCoordinator for yahatl.

Replaces the hand-rolled ReactivePipeline (snapshot + dispatcher signals +
manual per-sensor subscriptions + a bespoke timer) with the standard HA
coordinator: ``coordinator.data`` holds the computed snapshot, the update
interval drives periodic refreshes, and CoordinatorEntity manages
subscribe/unsubscribe for every entity automatically.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .conditions import evaluate_condition
from .const import (
    CONF_STORAGE_KEY,
    DOMAIN,
    STATUS_COMPLETED,
    STATUS_MISSED,
    TRAIT_ACTIONABLE,
)
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)

_UPDATE_INTERVAL = timedelta(seconds=60)
_COOLDOWN_SECONDS = 60

# Event fired when an assigned item's due time passes, consumed by the
# "yahatl — due-time notification" automation which routes it to the
# assignee's phone. See automations.yaml.
_DUE_NOTIFY_EVENT = "yahatl_item_due"
# Only announce dues that elapsed within this window, so a rollout or a long
# HA downtime doesn't replay a backlog of stale dues; a due that passed during
# a brief restart still fires. Dedup across refreshes is via item.notified_due.
_DUE_NOTIFY_GRACE = timedelta(hours=3)
# Date-only items carry a due at midnight (00:00); a midnight ping is useless,
# so announce them at this hour instead. The item's actual `due` is untouched
# (scheduling/lead logic still see midnight) — only the notify time shifts.
_DATE_ONLY_NOTIFY_HOUR = 8


@dataclass(frozen=True)
class YahtlSnapshot:
    """Immutable snapshot of the prioritized-queue computation for one refresh."""

    queue: list[dict[str, Any]]
    overdue_count: int
    due_today_count: int
    blocked_count: int
    next_task_title: str | None
    total_actionable: int
    upcoming: list[dict[str, Any]] = field(default_factory=list)


class YahtlCoordinator(DataUpdateCoordinator[YahtlSnapshot]):
    """Owns the state-change-to-entity-update flow for one config entry."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, store) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}:{entry.entry_id}",
            update_interval=_UPDATE_INTERVAL,
            config_entry=entry,
        )
        self._store = store
        self._last_triggered: dict[str, datetime] = {}
        self._unsub_state: Callable[[], None] | None = None
        self._tracked: frozenset[str] = frozenset()

    @property
    def list_data(self) -> YahtlList | None:
        """This entry's list (kept on entry.runtime_data)."""
        runtime = getattr(self.config_entry, "runtime_data", None)
        return runtime.data if runtime is not None else None

    def _all_lists(self) -> list[YahtlList]:
        """Every loaded list, across all yahatl entries."""
        lists: list[YahtlList] = []
        for entry in self.hass.config_entries.async_entries(DOMAIN):
            runtime = getattr(entry, "runtime_data", None)
            if runtime is not None and getattr(runtime, "data", None) is not None:
                lists.append(runtime.data)
        return lists

    async def _async_update_data(self) -> YahtlSnapshot:
        from .queue import QueueEngine
        from .recurrence import ensure_recurring_due

        # Backfill a concrete next-due on recurring items that lack one, so
        # lead-time surfacing applies to them (see lead.py / recurrence.py).
        # No-op once every recurring item carries a due.
        data = self.list_data
        if data is not None:
            # List, not a generator — must normalize every item, not stop at the first.
            changed = [ensure_recurring_due(item) for item in data.items]
            notified = self._notify_due_items(data)
            if any(changed) or notified:
                await self._store.async_save(data)

        # Keep the condition-trigger subscriptions in sync with current items.
        self._sync_state_tracking()

        engine = QueueEngine(self.hass)
        result = await engine.generate(self._all_lists())
        return YahtlSnapshot(
            queue=result.items,
            overdue_count=result.overdue_count,
            due_today_count=result.due_today_count,
            blocked_count=result.blocked_count,
            next_task_title=result.next_task_title,
            total_actionable=result.total_actionable,
            upcoming=result.blocked,
        )

    @callback
    def _notify_due_items(self, data: YahtlList) -> bool:
        """Fire ``yahatl_item_due`` for each assigned item whose due just passed.

        Runs every refresh over this coordinator's OWN list only (so no
        cross-list duplication). An item pings once per due value: dedup is the
        persisted ``notified_due`` == the due already announced, so it fires
        again when due changes (recurrence regen / edit) but never repeats on
        the same due. Unassigned items are skipped (no target) and left
        unmarked. Deferred and non-actionable/completed items are held back.
        Returns True if any item was marked, so the caller persists.
        """
        now = dt_util.now()
        storage_key = self.config_entry.data.get(CONF_STORAGE_KEY)
        entity_id = f"todo.{storage_key}" if storage_key else None
        changed = False
        for item in data.items:
            due = item.due
            if due is None:
                continue
            if TRAIT_ACTIONABLE not in item.traits:
                continue
            if item.status in (STATUS_COMPLETED, STATUS_MISSED):
                continue
            if item.notified_due == due:
                continue
            # Compare tz-aware; legacy items may carry a naive due. Normalize a
            # local copy for the window test but store the RAW due, so the
            # notified_due == due dedup above stays consistent next refresh.
            due_cmp = due if due.tzinfo else due.replace(tzinfo=now.tzinfo)
            # Date-only items (due exactly at midnight) ping at 08:00 that day
            # instead of 00:00. Genuine midnight-timed items are treated the
            # same, but deliberately setting a task to 00:00:00 is vanishingly
            # rare vs. the date-only default.
            notify_at = due_cmp
            if (due_cmp.hour, due_cmp.minute, due_cmp.second, due_cmp.microsecond) == (0, 0, 0, 0):
                notify_at = due_cmp.replace(hour=_DATE_ONLY_NOTIFY_HOUR)
            if not (now - _DUE_NOTIFY_GRACE <= notify_at <= now):
                continue
            if item.deferred_until and item.deferred_until > now:
                continue
            if not item.assigned_to:
                continue
            self.hass.bus.async_fire(
                _DUE_NOTIFY_EVENT,
                {
                    "uid": item.uid,
                    "title": item.title,
                    "entity_id": entity_id,
                    "list_name": data.name,
                    "due": due.isoformat(),
                    "assigned_to": list(item.assigned_to),
                },
            )
            item.notified_due = due
            changed = True
        return changed

    async def async_shutdown(self) -> None:
        """Cancel the periodic refresh and drop state-change subscriptions."""
        if self._unsub_state is not None:
            self._unsub_state()
            self._unsub_state = None
        await super().async_shutdown()

    # --- Condition-trigger state tracking (ported from ReactivePipeline) ---

    @callback
    def _sync_state_tracking(self) -> None:
        """(Re)subscribe to the entities referenced by condition triggers."""
        data = self.list_data
        entities: set[str] = set()
        if data is not None:
            for item in data.items:
                for trigger in item.condition_triggers:
                    entities.add(trigger.entity_id)

        tracked = frozenset(entities)
        if tracked == self._tracked:
            return
        self._tracked = tracked

        if self._unsub_state is not None:
            self._unsub_state()
            self._unsub_state = None
        if not tracked:
            return
        self._unsub_state = async_track_state_change_event(
            self.hass, list(tracked), self._handle_tracked_state
        )

    @callback
    def _handle_tracked_state(self, event) -> None:
        entity_id = event.data.get("entity_id")
        new_state = event.data.get("new_state")
        if not entity_id or new_state is None:
            return
        data = self.list_data
        if data is None:
            return

        changed = False
        for item in data.items:
            for trigger in item.condition_triggers:
                if trigger.entity_id != entity_id:
                    continue
                actual = new_state.state
                if trigger.attribute:
                    actual = str(new_state.attributes.get(trigger.attribute, ""))
                if not evaluate_condition(actual, trigger.operator, trigger.value):
                    continue
                if trigger.on_match == "set_due":
                    now = dt_util.now()
                    last = self._last_triggered.get(item.uid)
                    if last and (now - last).total_seconds() < _COOLDOWN_SECONDS:
                        continue
                    item.due = min(item.due, now) if item.due else now
                    item.deferred_until = None
                    self._last_triggered[item.uid] = now
                    changed = True

        if changed:
            self.hass.async_create_task(
                self._store.async_save(data), eager_start=True
            )
        self.hass.async_create_task(self.async_request_refresh(), eager_start=True)
