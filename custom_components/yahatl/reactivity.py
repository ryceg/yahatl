"""ReactivityManager — real-time state listening for condition triggers and time blockers."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Callable

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval

from .conditions import evaluate_condition
from .const import SIGNAL_YAHATL_UPDATED
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)

_COOLDOWN_SECONDS = 60


@dataclass(frozen=True)
class PipelineSnapshot:
    """Immutable snapshot of pipeline state. Sensors read from this."""

    queue: list[dict[str, Any]]
    overdue_count: int
    due_today_count: int
    blocked_count: int
    next_task_title: str | None
    total_actionable: int
    data_version: int


class ReactivityManager:
    """Manages real-time reactions to HA entity state changes and time-based updates.

    Responsibilities:
    1. Subscribe to state_changed events for all entities referenced by condition triggers.
    2. When a condition matches: fire SIGNAL_YAHATL_UPDATED (for boost), or set due date (for set_due).
    3. Run a 60-second periodic timer so time blockers are re-evaluated at window boundaries.
    4. Re-scan tracked entities when SIGNAL_YAHATL_UPDATED fires (triggers may have been added/removed).
    """

    def __init__(
        self,
        hass: HomeAssistant,
        store: Any,
        all_lists_fn: Callable[[], list[YahtlList]],
        data_fn: Callable[[], YahtlList | None],
    ) -> None:
        self._hass = hass
        self._store = store
        self._all_lists_fn = all_lists_fn
        self._data_fn = data_fn
        self._tracked_entities: set[str] = set()
        self._unsub_state: Callable[[], None] | None = None
        self._unsub_signal: Callable[[], None] | None = None
        self._unsub_timer: Callable[[], None] | None = None
        self._last_triggered: dict[str, datetime] = {}

    async def async_start(self) -> None:
        """Start listening for state changes and schedule periodic timer."""
        # Listen for integration updates to refresh tracked entity set
        @callback
        def _on_integration_update(entity_id: str) -> None:
            self._refresh_tracked_entities()

        self._unsub_signal = async_dispatcher_connect(
            self._hass, SIGNAL_YAHATL_UPDATED, _on_integration_update
        )

        # 60-second timer for time blocker re-evaluation
        @callback
        def _on_timer(now: datetime) -> None:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, "timer")

        self._unsub_timer = async_track_time_interval(
            self._hass, _on_timer, timedelta(seconds=60)
        )

        # Initial subscription
        self._refresh_tracked_entities()

        # Initial evaluation — boost only, skip set_due
        self._initial_evaluation()

    async def async_stop(self) -> None:
        """Stop all listeners and timers."""
        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None
        if self._unsub_signal:
            self._unsub_signal()
            self._unsub_signal = None
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None

    @staticmethod
    def _collect_tracked_entities(all_lists: list[YahtlList]) -> set[str]:
        """Collect all entity IDs referenced by condition triggers across all items."""
        entities: set[str] = set()
        for yl in all_lists:
            for item in yl.items:
                for trigger in item.condition_triggers:
                    entities.add(trigger.entity_id)
        return entities

    @callback
    def _refresh_tracked_entities(self) -> None:
        """Re-scan items for tracked entities and update state subscriptions."""
        new_entities = self._collect_tracked_entities(self._all_lists_fn())
        if new_entities == self._tracked_entities:
            return

        # Unsubscribe old
        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None

        self._tracked_entities = new_entities

        if not self._tracked_entities:
            return

        # Subscribe to state changes for tracked entities
        @callback
        def _on_state_change(event: Event) -> None:
            entity_id = event.data.get("entity_id")
            new_state = event.data.get("new_state")
            if entity_id and new_state:
                self._handle_state_change(entity_id, new_state)

        self._unsub_state = async_track_state_change_event(
            self._hass, list(self._tracked_entities), _on_state_change
        )

    @callback
    def _handle_state_change(self, entity_id: str, new_state: Any) -> None:
        """Process a state change event for a tracked entity."""
        # Use this entry's list for mutations
        own_data = self._data_fn()
        if not own_data:
            return

        signal_needed = False
        persist_needed = False

        for item in own_data.items:
            for trigger in item.condition_triggers:
                if trigger.entity_id != entity_id:
                    continue

                # Get the value to compare
                if trigger.attribute:
                    actual = str(new_state.attributes.get(trigger.attribute, ""))
                else:
                    actual = new_state.state

                if not evaluate_condition(actual, trigger.operator, trigger.value):
                    continue

                # Condition matched
                if trigger.on_match == "set_due":
                    # Check cooldown
                    now = datetime.now()
                    last = self._last_triggered.get(item.uid)
                    if last and (now - last).total_seconds() < _COOLDOWN_SECONDS:
                        continue

                    # Set due = min(existing, now)
                    if item.due:
                        item.due = min(item.due, now)
                    else:
                        item.due = now

                    # Clear deferral
                    item.deferred_until = None

                    self._last_triggered[item.uid] = now
                    persist_needed = True

                signal_needed = True

        if persist_needed:
            # Need to save — but we're in a @callback, so create a task
            async def _persist():
                data = self._data_fn()
                if data:
                    await self._store.async_save(data)

            self._hass.async_create_task(_persist(), eager_start=True)

        if signal_needed:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, entity_id)

    @callback
    def _initial_evaluation(self) -> None:
        """Evaluate all triggers against current state on startup. Skip set_due."""
        own_data = self._data_fn()
        if not own_data:
            return
        signal_needed = False

        for item in own_data.items:
            for trigger in item.condition_triggers:
                state = self._hass.states.get(trigger.entity_id)
                if state is None:
                    continue

                if trigger.attribute:
                    actual = str(state.attributes.get(trigger.attribute, ""))
                else:
                    actual = state.state

                if evaluate_condition(actual, trigger.operator, trigger.value):
                    signal_needed = True
                    break
            if signal_needed:
                break

        if signal_needed:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, "startup")


class ReactivePipeline:
    """Owns the full state-change-to-sensor-update flow."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        store: Any,
        data_fn: Callable[[], YahtlList | None],
        all_lists_fn: Callable[[], list[YahtlList]],
    ) -> None:
        self._hass = hass
        self._entry_id = entry_id
        self._store = store
        self._data_fn = data_fn
        self._all_lists_fn = all_lists_fn
        self._snapshot: PipelineSnapshot | None = None
        self._data_version = 0
        self._last_triggered: dict[str, datetime] = {}
        self._unsub_state: Callable[[], None] | None = None
        self._unsub_timer: Callable[[], None] | None = None

    def get_snapshot(self) -> PipelineSnapshot | None:
        return self._snapshot

    async def async_request_refresh(self, reason: str = "") -> None:
        await self._run_cycle(reason)

    async def _run_cycle(self, reason: str = "") -> None:
        from .queue import QueueEngine

        # 1. Persist
        data = self._data_fn()
        if data:
            await self._store.async_save(data)

        # 2. Compute
        all_lists = self._all_lists_fn()
        engine = QueueEngine(self._hass)
        result = await engine.generate(all_lists)

        # 3. Publish
        self._data_version += 1
        self._snapshot = PipelineSnapshot(
            queue=result.items,
            overdue_count=result.overdue_count,
            due_today_count=result.due_today_count,
            blocked_count=result.blocked_count,
            next_task_title=result.next_task_title,
            total_actionable=result.total_actionable,
            data_version=self._data_version,
        )

    async def async_start(self) -> None:
        self._refresh_tracked_entities()

        @callback
        def _on_timer(now: datetime) -> None:
            self._hass.async_create_task(
                self.async_request_refresh("timer"), eager_start=True
            )

        self._unsub_timer = async_track_time_interval(
            self._hass, _on_timer, timedelta(seconds=60)
        )

        await self._evaluate_triggers_and_refresh()

    async def async_stop(self) -> None:
        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None

    def _refresh_tracked_entities(self) -> None:
        all_lists = self._all_lists_fn()
        entities: set[str] = set()
        for yl in all_lists:
            for item in yl.items:
                for trigger in item.condition_triggers:
                    entities.add(trigger.entity_id)

        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None

        if not entities:
            return

        @callback
        def _on_state_change(event: Event) -> None:
            entity_id = event.data.get("entity_id")
            new_state = event.data.get("new_state")
            if entity_id and new_state:
                self._handle_state_change(entity_id, new_state)

        self._unsub_state = async_track_state_change_event(
            self._hass, list(entities), _on_state_change
        )

    @callback
    def _handle_state_change(self, entity_id: str, new_state: Any) -> None:
        data = self._data_fn()
        if not data:
            return

        persist_needed = False
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
                    now = datetime.now()
                    last = self._last_triggered.get(item.uid)
                    if last and (now - last).total_seconds() < _COOLDOWN_SECONDS:
                        continue
                    item.due = min(item.due, now) if item.due else now
                    item.deferred_until = None
                    self._last_triggered[item.uid] = now
                    persist_needed = True

        # Always refresh on relevant state change
        self._hass.async_create_task(
            self.async_request_refresh(f"state:{entity_id}"), eager_start=True
        )

    async def _evaluate_triggers_and_refresh(self) -> None:
        data = self._data_fn()
        if not data:
            await self.async_request_refresh("startup:no_data")
            return

        for item in data.items:
            for trigger in item.condition_triggers:
                state = self._hass.states.get(trigger.entity_id)
                if state is None:
                    continue
                actual = state.state
                if trigger.attribute:
                    actual = str(state.attributes.get(trigger.attribute, ""))
                if evaluate_condition(actual, trigger.operator, trigger.value):
                    await self.async_request_refresh("startup")
                    return

        await self.async_request_refresh("startup:no_triggers")
