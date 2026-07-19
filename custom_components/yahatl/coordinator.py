"""DataUpdateCoordinator for yahatl.

Replaces the hand-rolled ReactivePipeline (snapshot + dispatcher signals +
manual per-sensor subscriptions + a bespoke timer) with the standard HA
coordinator: ``coordinator.data`` holds the computed snapshot, the update
interval drives periodic refreshes, and CoordinatorEntity manages
subscribe/unsubscribe for every entity automatically.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from homeassistant.util import dt as dt_util

from .conditions import evaluate_condition
from .const import DOMAIN
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)

_UPDATE_INTERVAL = timedelta(seconds=60)
_COOLDOWN_SECONDS = 60


@dataclass(frozen=True)
class YahtlSnapshot:
    """Immutable snapshot of the prioritized-queue computation for one refresh."""

    queue: list[dict[str, Any]]
    overdue_count: int
    due_today_count: int
    blocked_count: int
    next_task_title: str | None
    total_actionable: int


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
        )

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
