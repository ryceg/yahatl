"""Sensor platform for yahatl — surfaces queue and status data for dashboards."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.util import dt as dt_util

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .blockers import BlockerResolver
from .const import DOMAIN, STATUS_COMPLETED, TRAIT_ACTIONABLE, TRAIT_HABIT, TRAIT_NOTE
from .coordinator import YahtlCoordinator
from .models import YahtlList
from .recurrence import is_streak_at_risk

if TYPE_CHECKING:
    from . import YahtlConfigEntry


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    runtime = config_entry.runtime_data
    coordinator = runtime.coordinator
    data = runtime.data
    storage_key = data.list_id

    async_add_entities([
        YahtlOverdueSensor(coordinator, data, storage_key),
        YahtlDueTodaySensor(coordinator, data, storage_key),
        YahtlNextTaskSensor(coordinator, data, storage_key),
        YahtlBlockedCountSensor(coordinator, data, storage_key),
        YahtlQueueSensor(coordinator, data, storage_key),
        YahtlInboxCountSensor(coordinator, data, storage_key),
        YahtlNotesCountSensor(coordinator, data, storage_key),
        YahtlActiveProjectsSensor(coordinator, data, storage_key),
        YahtlSomedayCountSensor(coordinator, data, storage_key),
        YahtlStreakRiskSensor(coordinator, data, storage_key),
    ])


class _YahtlBaseSensor(CoordinatorEntity[YahtlCoordinator], SensorEntity):
    """Base sensor that re-renders when the coordinator refreshes.

    Counts are computed from ``self._data`` (this list); the coordinator drives
    when to recompute and manages subscribe/unsubscribe for us.
    """

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: YahtlCoordinator,
        data: YahtlList,
        storage_key: str,
        suffix: str,
    ) -> None:
        super().__init__(coordinator)
        self._data = data
        self._attr_unique_id = f"{storage_key}_{suffix}"
        # Group every entity of this list under one device.
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, storage_key)},
            name=data.name,
            manufacturer="yahatl",
            model="Todo list",
            entry_type=DeviceEntryType.SERVICE,
        )

    @callback
    def _handle_coordinator_update(self) -> None:
        # The list object is stable, but re-bind from the coordinator in case
        # the entry's runtime data was replaced, then re-render.
        data = self.coordinator.list_data
        if data is not None:
            self._data = data
        self.async_write_ha_state()

    def _actionable_items(self):
        return [
            i for i in self._data.items
            if TRAIT_ACTIONABLE in i.traits and i.status != STATUS_COMPLETED
        ]


class YahtlOverdueSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:alert-circle"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "overdue")
        self._attr_name = f"{data.name} Overdue"

    @property
    def native_value(self) -> int:
        now = dt_util.now()
        return sum(1 for i in self._actionable_items() if i.due and i.due < now)


class YahtlDueTodaySensor(_YahtlBaseSensor):
    _attr_icon = "mdi:calendar-today"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "due_today")
        self._attr_name = f"{data.name} Due Today"

    @property
    def native_value(self) -> int:
        now = dt_util.now()
        return sum(
            1 for i in self._actionable_items()
            if i.due and i.due.date() == now.date()
        )


class YahtlNextTaskSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:checkbox-marked-circle-outline"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "next_task")
        self._attr_name = f"{data.name} Next Task"

    @property
    def native_value(self) -> str | None:
        items = self._actionable_items()
        if not items:
            return None
        now = dt_util.now()
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
        return {"total_actionable": len(self._actionable_items())}


class YahtlBlockedCountSensor(_YahtlBaseSensor):
    _attr_icon = "mdi:block-helper"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "blocked")
        self._attr_name = f"{data.name} Blocked"

    @property
    def native_value(self) -> int:
        resolver = BlockerResolver(self.hass, [self._data])
        return sum(1 for i in self._actionable_items() if resolver.resolve(i))


class YahtlQueueSensor(_YahtlBaseSensor):
    """Exposes the prioritized queue (computed by the coordinator) for cards.

    native_value = title of the #1 task.
    extra_state_attributes = full ranked queue list + queue_length.
    """

    _attr_icon = "mdi:format-list-numbered"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "queue")
        self._attr_name = f"{data.name} Queue"

    def _queue(self) -> list[dict]:
        snap = getattr(self, "coordinator", None) and self.coordinator.data
        return snap.queue if snap else []

    @property
    def native_value(self) -> str | None:
        queue = self._queue()
        if queue:
            first = queue[0]
            return first.get("item", {}).get("title") if isinstance(first, dict) else None
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        queue = self._queue()
        snap = getattr(self, "coordinator", None) and self.coordinator.data
        upcoming = snap.upcoming if snap else []
        return {"queue": queue, "queue_length": len(queue), "upcoming": upcoming}


class YahtlInboxCountSensor(_YahtlBaseSensor):
    """Count of items flagged as needing more detail."""

    _attr_icon = "mdi:inbox"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "inbox_count")
        self._attr_name = f"{data.name} Inbox"

    @property
    def native_value(self) -> int:
        return sum(1 for i in self._actionable_items() if i.needs_detail)


class YahtlNotesCountSensor(_YahtlBaseSensor):
    """Count of items with the note trait."""

    _attr_icon = "mdi:note-multiple"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "notes_count")
        self._attr_name = f"{data.name} Notes"

    @property
    def native_value(self) -> int:
        return sum(1 for i in self._data.items if TRAIT_NOTE in i.traits)


class YahtlActiveProjectsSensor(_YahtlBaseSensor):
    """Count of distinct active projects (>=1 pending/in-progress item)."""

    _attr_icon = "mdi:folder-multiple"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "active_projects")
        self._attr_name = f"{data.name} Active Projects"

    def _active_projects(self) -> set[str]:
        projects: set[str] = set()
        for i in self._data.items:
            if i.project and i.status in ("pending", "in_progress"):
                projects.add(i.project)
        return projects

    @property
    def native_value(self) -> int:
        return len(self._active_projects())

    @property
    def extra_state_attributes(self) -> dict:
        return {"projects": sorted(self._active_projects())}


class YahtlSomedayCountSensor(_YahtlBaseSensor):
    """Count of items with the someday trait."""

    _attr_icon = "mdi:clock-outline"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "someday_count")
        self._attr_name = f"{data.name} Someday"

    @property
    def native_value(self) -> int:
        from .const import TRAIT_SOMEDAY
        return sum(1 for i in self._data.items if TRAIT_SOMEDAY in i.traits)


class YahtlStreakRiskSensor(_YahtlBaseSensor):
    """Count of habits with streaks at risk of breaking."""

    _attr_icon = "mdi:fire-alert"

    def __init__(self, coordinator, data, storage_key):
        super().__init__(coordinator, data, storage_key, "streak_risk")
        self._attr_name = f"{data.name} Streak Risk"

    @property
    def native_value(self) -> int:
        return sum(
            1 for i in self._data.items
            if TRAIT_HABIT in i.traits and is_streak_at_risk(i)
        )
