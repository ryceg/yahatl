"""Calendar platform for YAHATL."""

from datetime import datetime, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import YahatlCoordinator
from .entity import YahatlEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up YAHATL calendar."""
    coordinator: YahatlCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]

    async_add_entities([YahatlCalendar(coordinator)])


class YahatlCalendar(YahatlEntity, CalendarEntity):
    """Calendar entity for YAHATL tasks and chores."""

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the calendar."""
        super().__init__(coordinator, "calendar")
        self._attr_name = "YAHATL"

    @property
    def event(self) -> CalendarEvent | None:
        """Return the next upcoming event."""
        events = self._get_all_events()
        if not events:
            return None

        now = dt_util.now()
        upcoming = [e for e in events if e.start >= now]
        if upcoming:
            return min(upcoming, key=lambda e: e.start)
        return None

    async def async_get_events(
        self,
        hass: HomeAssistant,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CalendarEvent]:
        """Return calendar events within a datetime range."""
        all_events = self._get_all_events()
        return [
            e
            for e in all_events
            if start_date <= e.start <= end_date or start_date <= e.end <= end_date
        ]

    def _get_all_events(self) -> list[CalendarEvent]:
        """Get all events from tasks and chores."""
        events = []

        # Task events
        tasks = self.coordinator.data.get("tasks", [])
        for note, task in tasks:
            if task.due_date and task.status != "Complete":
                start = task.due_date
                if start.tzinfo is None:
                    start = dt_util.as_local(start)

                events.append(
                    CalendarEvent(
                        start=start,
                        end=start + timedelta(hours=1),
                        summary=f"📋 {note.title}",
                        description=f"Priority: {task.priority}",
                        uid=f"task_{note.id}",
                    )
                )

        # Chore events
        chores = self.coordinator.data.get("chores", [])
        for note, chore in chores:
            if chore.next_due:
                start = chore.next_due
                if start.tzinfo is None:
                    start = dt_util.as_local(start)

                events.append(
                    CalendarEvent(
                        start=start,
                        end=start + timedelta(hours=1),
                        summary=f"🧹 {note.title}",
                        description=f"Repeat every {chore.interval_days} days",
                        uid=f"chore_{note.id}",
                    )
                )

        return sorted(events, key=lambda e: e.start)
