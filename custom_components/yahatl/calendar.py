"""Calendar platform for yahatl — surfaces scheduled tasks as calendar events.

Each yahatl list exposes a calendar entity. Items with a due date, and recurring
items (calendar/elapsed), appear as events so tasks show up in Home Assistant's
Calendar panel and can drive calendar-based automations.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import (
    CONF_STORAGE_KEY,
    DOMAIN,
    SIGNAL_YAHATL_UPDATED,
    STATUS_COMPLETED,
    STATUS_MISSED,
)
from .models import YahtlItem, YahtlList
from .recurrence import calculate_next_due

DEFAULT_EVENT_MINUTES = 30
# How far ahead to look when reporting the single "next" event.
NEXT_EVENT_HORIZON_DAYS = 90
# Safety cap on recurrence expansion within a queried range.
MAX_OCCURRENCES = 60


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the yahatl calendar entity for this list."""
    entry_data = hass.data[DOMAIN].get(config_entry.entry_id)
    if entry_data is None:
        return

    storage_key = config_entry.data[CONF_STORAGE_KEY]
    data = entry_data["data"]
    store = entry_data["store"]

    async_add_entities([YahtlCalendar(hass, data, store, storage_key)])


class YahtlCalendar(CalendarEntity):
    """A calendar view over a yahatl list's scheduled items."""

    _attr_should_poll = False
    _attr_icon = "mdi:calendar-check"

    def __init__(
        self,
        hass: HomeAssistant,
        data: YahtlList,
        store,
        storage_key: str,
    ) -> None:
        self._hass = hass
        self._data = data
        self._store = store
        self._storage_key = storage_key
        self._attr_unique_id = f"yahatl_calendar_{storage_key}"
        self._attr_name = f"{data.name} Schedule"
        self._event: CalendarEvent | None = None

    async def async_added_to_hass(self) -> None:
        """Compute the initial event and subscribe to data changes."""
        self._recompute()
        self.async_on_remove(
            async_dispatcher_connect(
                self._hass, SIGNAL_YAHATL_UPDATED, self._handle_update
            )
        )

    @callback
    def _handle_update(self, *_args) -> None:
        self._recompute()
        self.async_write_ha_state()

    @property
    def event(self) -> CalendarEvent | None:
        """Return the next (or currently active) event."""
        return self._event

    async def async_get_events(
        self,
        hass: HomeAssistant,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CalendarEvent]:
        """Return all events within the requested range."""
        return self._build_events(start_date, end_date)

    # --- Internal ---

    def _recompute(self) -> None:
        now = dt_util.now()
        horizon = now + timedelta(days=NEXT_EVENT_HORIZON_DAYS)
        upcoming = [
            e for e in self._build_events(now - timedelta(days=1), horizon)
            if e.end > now
        ]
        upcoming.sort(key=lambda e: e.start)
        self._event = upcoming[0] if upcoming else None

    def _build_events(
        self, range_start: datetime, range_end: datetime
    ) -> list[CalendarEvent]:
        events: list[CalendarEvent] = []
        for item in self._data.items:
            if item.status in (STATUS_COMPLETED, STATUS_MISSED):
                continue
            seen: set[datetime] = set()
            for start in self._occurrences(item, range_start, range_end):
                if start in seen:
                    continue
                seen.add(start)
                events.append(self._make_event(item, start))
        return events

    def _occurrences(
        self, item: YahtlItem, range_start: datetime, range_end: datetime
    ) -> list[datetime]:
        """Occurrence start times for an item within [range_start, range_end]."""
        starts: list[datetime] = []

        if item.due and range_start <= item.due <= range_end:
            starts.append(item.due)

        if item.recurrence and item.recurrence.type in ("calendar", "elapsed"):
            nxt = calculate_next_due(item, dt_util.now())
            count = 0
            while nxt and nxt <= range_end and count < MAX_OCCURRENCES:
                if nxt >= range_start:
                    starts.append(nxt)
                following = calculate_next_due(item, nxt)
                if not following or following <= nxt:
                    break
                nxt = following
                count += 1

        return starts

    def _make_event(self, item: YahtlItem, start: datetime) -> CalendarEvent:
        minutes = item.time_estimate or DEFAULT_EVENT_MINUTES
        return CalendarEvent(
            start=start,
            end=start + timedelta(minutes=minutes),
            summary=item.title,
            description=item.description or None,
            uid=item.uid,
        )
