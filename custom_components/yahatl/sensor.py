"""Sensor platform for YAHATL."""

from homeassistant.components.sensor import SensorEntity, SensorStateClass
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
    """Set up YAHATL sensors."""
    coordinator: YahatlCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]

    entities = [
        YahatlOverdueSensor(coordinator),
        YahatlDueTodaySensor(coordinator),
        YahatlInboxSensor(coordinator),
        YahatlStreaksAtRiskSensor(coordinator),
        YahatlBlockedSensor(coordinator),
    ]

    async_add_entities(entities)


class YahatlOverdueSensor(YahatlEntity, SensorEntity):
    """Sensor for overdue task count."""

    _attr_icon = "mdi:alert-circle"
    _attr_native_unit_of_measurement = "tasks"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "overdue_count")
        self._attr_translation_key = "overdue_count"

    @property
    def native_value(self) -> int:
        """Return the number of overdue tasks."""
        return self.coordinator.data.get("stats", {}).get("overdue_count", 0)


class YahatlDueTodaySensor(YahatlEntity, SensorEntity):
    """Sensor for tasks due today."""

    _attr_icon = "mdi:calendar-today"
    _attr_native_unit_of_measurement = "tasks"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "due_today")
        self._attr_translation_key = "due_today"

    @property
    def native_value(self) -> int:
        """Return the number of tasks due today."""
        return self.coordinator.data.get("stats", {}).get("due_today", 0)


class YahatlInboxSensor(YahatlEntity, SensorEntity):
    """Sensor for inbox count."""

    _attr_icon = "mdi:inbox"
    _attr_native_unit_of_measurement = "items"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "inbox_count")
        self._attr_translation_key = "inbox_count"

    @property
    def native_value(self) -> int:
        """Return the inbox count."""
        return self.coordinator.data.get("stats", {}).get("inbox_count", 0)


class YahatlStreaksAtRiskSensor(YahatlEntity, SensorEntity):
    """Sensor for habits with streaks at risk."""

    _attr_icon = "mdi:fire-alert"
    _attr_native_unit_of_measurement = "habits"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "streaks_at_risk")
        self._attr_translation_key = "streaks_at_risk"

    @property
    def native_value(self) -> int:
        """Return the number of habits at risk."""
        return self.coordinator.data.get("stats", {}).get("streaks_at_risk", 0)


class YahatlBlockedSensor(YahatlEntity, SensorEntity):
    """Sensor for blocked items count."""

    _attr_icon = "mdi:block-helper"
    _attr_native_unit_of_measurement = "items"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "blocked_count")
        self._attr_translation_key = "blocked_count"

    @property
    def native_value(self) -> int:
        """Return the number of blocked items."""
        return self.coordinator.data.get("stats", {}).get("blocked_count", 0)
