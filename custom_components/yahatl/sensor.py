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
        # List sensors with full item data
        YahatlTasksListSensor(coordinator),
        YahatlHabitsListSensor(coordinator),
        YahatlChoresListSensor(coordinator),
        YahatlInboxListSensor(coordinator),
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


class YahatlTasksListSensor(YahatlEntity, SensorEntity):
    """Sensor exposing full task list data."""

    _attr_icon = "mdi:clipboard-list"

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "tasks_list")
        self._attr_translation_key = "tasks_list"

    @property
    def native_value(self) -> int:
        """Return the number of tasks."""
        return len(self.coordinator.data.get("tasks", []))

    @property
    def extra_state_attributes(self) -> dict:
        """Return full task data as attributes."""
        tasks = self.coordinator.data.get("tasks", [])
        items = []
        for note, task in tasks:
            items.append({
                "id": note.id,
                "title": note.title,
                "body": note.body,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            })
        return {"items": items}


class YahatlHabitsListSensor(YahatlEntity, SensorEntity):
    """Sensor exposing full habit list data."""

    _attr_icon = "mdi:fire"

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "habits_list")
        self._attr_translation_key = "habits_list"

    @property
    def native_value(self) -> int:
        """Return the number of habits."""
        return len(self.coordinator.data.get("habits", []))

    @property
    def extra_state_attributes(self) -> dict:
        """Return full habit data as attributes."""
        habits = self.coordinator.data.get("habits", [])
        items = []
        for note, habit in habits:
            items.append({
                "id": note.id,
                "title": note.title,
                "body": note.body,
                "frequency_goal": habit.frequency_goal,
                "current_streak": habit.current_streak,
                "longest_streak": habit.longest_streak,
                "last_completed": habit.last_completed.isoformat() if habit.last_completed else None,
            })
        return {"items": items}


class YahatlChoresListSensor(YahatlEntity, SensorEntity):
    """Sensor exposing full chore list data."""

    _attr_icon = "mdi:broom"

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "chores_list")
        self._attr_translation_key = "chores_list"

    @property
    def native_value(self) -> int:
        """Return the number of chores."""
        return len(self.coordinator.data.get("chores", []))

    @property
    def extra_state_attributes(self) -> dict:
        """Return full chore data as attributes."""
        from datetime import datetime
        chores = self.coordinator.data.get("chores", [])
        items = []
        now = datetime.utcnow()
        for note, chore in chores:
            days_until_due = None
            is_overdue = False
            if chore.next_due:
                delta = chore.next_due - now
                days_until_due = delta.days
                is_overdue = delta.total_seconds() < 0
            items.append({
                "id": note.id,
                "title": note.title,
                "body": note.body,
                "interval_days": chore.interval_days,
                "last_completed": chore.last_completed.isoformat() if chore.last_completed else None,
                "next_due": chore.next_due.isoformat() if chore.next_due else None,
                "days_until_due": days_until_due,
                "is_overdue": is_overdue,
            })
        return {"items": items}


class YahatlInboxListSensor(YahatlEntity, SensorEntity):
    """Sensor exposing full inbox list data."""

    _attr_icon = "mdi:inbox"

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "inbox_list")
        self._attr_translation_key = "inbox_list"

    @property
    def native_value(self) -> int:
        """Return the number of inbox items."""
        return len(self.coordinator.data.get("inbox", []))

    @property
    def extra_state_attributes(self) -> dict:
        """Return full inbox data as attributes."""
        inbox = self.coordinator.data.get("inbox", [])
        items = []
        for note in inbox:
            items.append({
                "id": note.id,
                "title": note.title,
                "body": note.body,
                "created_at": note.created_at.isoformat() if note.created_at else None,
            })
        return {"items": items}
