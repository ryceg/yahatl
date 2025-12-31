"""Binary sensor platform for YAHATL."""

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import YahatlCoordinator
from .entity import YahatlEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up YAHATL binary sensors."""
    coordinator: YahatlCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]

    entities = [
        YahatlPomodoroActiveSensor(coordinator),
        YahatlHasOverdueSensor(coordinator),
    ]

    async_add_entities(entities)


class YahatlPomodoroActiveSensor(YahatlEntity, BinarySensorEntity):
    """Binary sensor for Pomodoro active state."""

    _attr_icon = "mdi:timer"
    _attr_device_class = BinarySensorDeviceClass.RUNNING

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "pomodoro_active")
        self._attr_translation_key = "pomodoro_active"

    @property
    def is_on(self) -> bool:
        """Return True if a Pomodoro session is active."""
        return self.coordinator.data.get("pomodoro_active", False)


class YahatlHasOverdueSensor(YahatlEntity, BinarySensorEntity):
    """Binary sensor for whether there are overdue tasks."""

    _attr_icon = "mdi:alert-circle-outline"
    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "has_overdue")
        self._attr_translation_key = "has_overdue"

    @property
    def is_on(self) -> bool:
        """Return True if there are overdue tasks."""
        overdue = self.coordinator.data.get("stats", {}).get("overdue_count", 0)
        return overdue > 0
