"""Sensor platform for yahatl — surfaces queue and status data for dashboards."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .blockers import BlockerResolver
from .const import CONF_STORAGE_KEY, DOMAIN, SIGNAL_YAHATL_SNAPSHOT, SIGNAL_YAHATL_UPDATED, STATUS_COMPLETED, TRAIT_ACTIONABLE, TRAIT_HABIT, TRAIT_NOTE
from .models import YahtlList
from .recurrence import is_streak_at_risk


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    entry_data = hass.data[DOMAIN].get(config_entry.entry_id)
    if entry_data is None:
        return

    storage_key = config_entry.data[CONF_STORAGE_KEY]
    data = entry_data["data"]
    store = entry_data["store"]
    pipeline = entry_data.get("pipeline")

    async_add_entities([
        YahtlOverdueSensor(hass, data, store, storage_key, pipeline),
        YahtlDueTodaySensor(hass, data, store, storage_key, pipeline),
        YahtlNextTaskSensor(hass, data, store, storage_key, pipeline),
        YahtlBlockedCountSensor(hass, data, store, storage_key, pipeline),
        YahtlQueueSensor(hass, data, store, storage_key, pipeline),
        YahtlInboxCountSensor(hass, data, store, storage_key),
        YahtlNotesCountSensor(hass, data, store, storage_key),
        YahtlStreakRiskSensor(hass, data, store, storage_key),
    ])


class _YahtlBaseSensor(SensorEntity):
    """Base sensor that listens for yahatl update signals and re-renders."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _pipeline = None

    def __init__(self, hass: HomeAssistant, data: YahtlList, store, storage_key: str, suffix: str, pipeline=None) -> None:
        self._data = data
        self._store = store
        self._pipeline = pipeline
        self._attr_unique_id = f"{storage_key}_{suffix}"
        self._unsub: Callable[[], None] | None = None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def _handle_update(*args):
            if self._store.data:
                self._data = self._store.data
            self.async_write_ha_state()

        signal = SIGNAL_YAHATL_SNAPSHOT if self._pipeline else SIGNAL_YAHATL_UPDATED
        self._unsub = async_dispatcher_connect(self.hass, signal, _handle_update)

    async def async_will_remove_from_hass(self) -> None:
        if self._unsub:
            self._unsub()

    def _actionable_items(self):
        return [
            i for i in self._data.items
            if TRAIT_ACTIONABLE in i.traits and i.status != STATUS_COMPLETED
        ]


class YahtlOverdueSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:alert-circle"

    def __init__(self, hass, data, store, storage_key, pipeline=None):
        super().__init__(hass, data, store, storage_key, "overdue", pipeline)
        self._attr_name = f"{data.name} Overdue"

    @property
    def native_value(self) -> int:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return snap.overdue_count
        now = datetime.now()
        return sum(1 for i in self._actionable_items() if i.due and i.due < now)


class YahtlDueTodaySensor(_YahtlBaseSensor):
    _attr_icon = "mdi:calendar-today"

    def __init__(self, hass, data, store, storage_key, pipeline=None):
        super().__init__(hass, data, store, storage_key, "due_today", pipeline)
        self._attr_name = f"{data.name} Due Today"

    @property
    def native_value(self) -> int:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return snap.due_today_count
        now = datetime.now()
        return sum(
            1 for i in self._actionable_items()
            if i.due and i.due.date() == now.date()
        )


class YahtlNextTaskSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:checkbox-marked-circle-outline"

    def __init__(self, hass, data, store, storage_key, pipeline=None):
        super().__init__(hass, data, store, storage_key, "next_task", pipeline)
        self._attr_name = f"{data.name} Next Task"

    @property
    def native_value(self) -> str | None:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return snap.next_task_title
        items = self._actionable_items()
        if not items:
            return None
        now = datetime.now()
        overdue = sorted(
            [i for i in items if i.due and i.due < now],
            key=lambda i: i.due,
        )
        if overdue:
            return overdue[0].title
        with_due = sorted(
            [i for i in items if i.due],
            key=lambda i: i.due,
        )
        if with_due:
            return with_due[0].title
        return items[0].title

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return {"total_actionable": snap.total_actionable}
        items = self._actionable_items()
        return {"total_actionable": len(items)}


class YahtlBlockedCountSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:block-helper"

    def __init__(self, hass, data, store, storage_key, pipeline=None):
        super().__init__(hass, data, store, storage_key, "blocked", pipeline)
        self._attr_name = f"{data.name} Blocked"

    @property
    def native_value(self) -> int:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return snap.blocked_count
        resolver = BlockerResolver(self.hass, [self._data])
        return sum(1 for i in self._actionable_items() if resolver.resolve(i))


class YahtlQueueSensor(_YahtlBaseSensor):
    """Exposes the prioritized queue as state attributes for Lovelace cards.

    native_value = title of the #1 task.
    extra_state_attributes = full ranked queue list + queue_length.
    """

    _attr_icon = "mdi:format-list-numbered"

    def __init__(self, hass, data, store, storage_key, pipeline=None):
        super().__init__(hass, data, store, storage_key, "queue", pipeline)
        self._attr_name = f"{data.name} Queue"
        self._queue_cache: list[dict] = []

    @property
    def native_value(self) -> str | None:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap and snap.queue:
                return snap.queue[0].get("title")
            return None
        if self._queue_cache:
            return self._queue_cache[0].get("title")
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        if self._pipeline:
            snap = self._pipeline.get_snapshot()
            if snap:
                return {"queue": snap.queue, "queue_length": len(snap.queue)}
        return {"queue": self._queue_cache, "queue_length": len(self._queue_cache)}

    async def async_added_to_hass(self) -> None:
        if self._pipeline:
            @callback
            def _handle_snapshot(*args):
                self.async_write_ha_state()

            self._unsub = async_dispatcher_connect(
                self.hass, SIGNAL_YAHATL_SNAPSHOT, _handle_snapshot
            )
        else:
            @callback
            def _handle_update(entity_id):
                self.hass.async_create_task(self._refresh_queue(), eager_start=True)

            self._unsub = async_dispatcher_connect(
                self.hass, SIGNAL_YAHATL_UPDATED, _handle_update
            )
            await self._refresh_queue()

    async def _refresh_queue(self) -> None:
        from .queue import QueueEngine
        all_lists = []
        for entry_data in self.hass.data.get(DOMAIN, {}).values():
            if isinstance(entry_data, dict) and "data" in entry_data:
                all_lists.append(entry_data["data"])
        engine = QueueEngine(self.hass)
        result = await engine.generate(all_lists)
        self._queue_cache = result.items
        self.async_write_ha_state()


class YahtlInboxCountSensor(_YahtlBaseSensor):
    """Count of items flagged as needing more detail."""

    _attr_icon = "mdi:inbox"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "inbox_count")
        self._attr_name = f"{data.name} Inbox"

    @property
    def native_value(self) -> int:
        return sum(
            1 for i in self._actionable_items()
            if i.needs_detail
        )


class YahtlNotesCountSensor(_YahtlBaseSensor):
    """Count of items with the note trait."""

    _attr_icon = "mdi:note-multiple"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "notes_count")
        self._attr_name = f"{data.name} Notes"

    @property
    def native_value(self) -> int:
        return sum(1 for i in self._data.items if TRAIT_NOTE in i.traits)


class YahtlStreakRiskSensor(_YahtlBaseSensor):
    """Count of habits with streaks at risk of breaking."""

    _attr_icon = "mdi:fire-alert"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "streak_risk")
        self._attr_name = f"{data.name} Streak Risk"

    @property
    def native_value(self) -> int:
        return sum(
            1 for i in self._data.items
            if TRAIT_HABIT in i.traits and is_streak_at_risk(i)
        )
