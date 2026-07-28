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
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
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
    runtime = config_entry.runtime_data
    storage_key = config_entry.data[CONF_STORAGE_KEY]
    async_add_entities([YahtlCalendar(hass, config_entry, runtime.data, storage_key)])


class YahtlCalendar(CalendarEntity):
    """A calendar view over a yahatl list's scheduled items."""

    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_name = "Schedule"
    _attr_icon = "mdi:calendar-check"

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: ConfigEntry,
        data: YahtlList,
        storage_key: str,
    ) -> None:
        self._hass = hass
        self._config_entry = config_entry
        self._data = data
        self._storage_key = storage_key
        self._attr_unique_id = f"yahatl_calendar_{storage_key}"
        # Group with this list's todo entity and sensors under one device.
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, storage_key)},
            name=data.name,
            manufacturer="yahatl",
            model="Todo list",
            entry_type=DeviceEntryType.SERVICE,
        )
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
    def _handle_update(self, list_id: str) -> None:
        """Refresh when THIS list is saved (signal payload is the list_id)."""
        if list_id != self._storage_key:
            return
        # Re-bind from runtime_data in case the list object was replaced
        # (mirrors the CoordinatorEntity rebind pattern in todo.py/sensor.py).
        runtime = getattr(self._config_entry, "runtime_data", None)
        if runtime is not None and runtime.data is not None:
            self._data = runtime.data
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
            # Calendar entities are shared surfaces — never show private items.
            if item.private:
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
            # Anchor expansion on the concrete due when there is one (the
            # coordinator backfills one on every calendar/elapsed item), so
            # the projected occurrences line up with the real next-due rather
            # than duplicating it at a different time-of-day. Frequency goals
            # have no next-due (calculate_next_due returns None) and
            # empty calendar day-lists read as absent, ending the loop.
            nxt = calculate_next_due(item, item.due or dt_util.now())
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
