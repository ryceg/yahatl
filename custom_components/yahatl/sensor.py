"""Sensor platform for yahatl — surfaces queue and status data for dashboards."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .blockers import is_item_blocked
from .const import CONF_STORAGE_KEY, DOMAIN, STATUS_COMPLETED, TRAIT_ACTIONABLE
from .models import YahtlList
from .queue import get_prioritized_queue
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

    async_add_entities([
        YahtlOverdueSensor(hass, data, store, storage_key),
        YahtlDueTodaySensor(hass, data, store, storage_key),
        YahtlNextTaskSensor(hass, data, store, storage_key),
        YahtlBlockedCountSensor(hass, data, store, storage_key),
        YahtlQueueSensor(hass, data, store, storage_key),
    ])


class _YahtlBaseSensor(SensorEntity):
    """Base sensor that listens for yahatl_updated bus events and re-renders."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, hass: HomeAssistant, data: YahtlList, store, storage_key: str, suffix: str) -> None:
        self._data = data
        self._store = store
        self._attr_unique_id = f"{storage_key}_{suffix}"
        self._unsub: Callable[[], None] | None = None

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def _handle_update(event):
            if self._store.data:
                self._data = self._store.data
            self.async_write_ha_state()

        self._unsub = self.hass.bus.async_listen(f"{DOMAIN}_updated", _handle_update)

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

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "overdue")
        self._attr_name = f"{data.name} Overdue"

    @property
    def native_value(self) -> int:
        now = datetime.now()
        return sum(1 for i in self._actionable_items() if i.due and i.due < now)


class YahtlDueTodaySensor(_YahtlBaseSensor):
    _attr_icon = "mdi:calendar-today"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "due_today")
        self._attr_name = f"{data.name} Due Today"

    @property
    def native_value(self) -> int:
        now = datetime.now()
        return sum(
            1 for i in self._actionable_items()
            if i.due and i.due.date() == now.date()
        )


class YahtlNextTaskSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:checkbox-marked-circle-outline"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "next_task")
        self._attr_name = f"{data.name} Next Task"

    @property
    def native_value(self) -> str | None:
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
        items = self._actionable_items()
        return {"total_actionable": len(items)}


class YahtlBlockedCountSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:block-helper"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "blocked")
        self._attr_name = f"{data.name} Blocked"

    @property
    def native_value(self) -> int:
        # Simplified sync check — counts items with blockers configured.
        # is_item_blocked is async so can't be used in sync native_value.
        return sum(
            1 for i in self._actionable_items()
            if i.blockers and (i.blockers.items or i.blockers.sensors)
        )


class YahtlQueueSensor(_YahtlBaseSensor):
    """Exposes the prioritized queue as state attributes for Lovelace cards.

    native_value = title of the #1 task.
    extra_state_attributes = full ranked queue list + queue_length.
    """

    _attr_icon = "mdi:format-list-numbered"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "queue")
        self._attr_name = f"{data.name} Queue"
        self._queue_cache: list[dict] = []

    @property
    def native_value(self) -> str | None:
        if self._queue_cache:
            return self._queue_cache[0].get("title")
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "queue": self._queue_cache,
            "queue_length": len(self._queue_cache),
        }

    async def async_added_to_hass(self) -> None:
        @callback
        def _handle_update(event):
            self.hass.async_create_task(self._refresh_queue())

        self._unsub = self.hass.bus.async_listen(f"{DOMAIN}_updated", _handle_update)
        await self._refresh_queue()

    async def _refresh_queue(self) -> None:
        all_lists = []
        for entry_data in self.hass.data.get(DOMAIN, {}).values():
            if isinstance(entry_data, dict) and "data" in entry_data:
                all_lists.append(entry_data["data"])
        self._queue_cache = await get_prioritized_queue(self.hass, all_lists)
        self.async_write_ha_state()
