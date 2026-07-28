"""Recurrence logic for yahatl."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.util import dt as dt_util

if TYPE_CHECKING:
    from .models import YahtlItem, RecurrenceConfig

_LOGGER = logging.getLogger(__name__)


def _unit_to_days(count: int, unit: str) -> int:
    multipliers = {"days": 1, "weeks": 7, "months": 30, "years": 365}
    return count * multipliers.get(unit, 1)


def _get_calendar_period_days(recurrence: RecurrenceConfig) -> int | None:
    """Get the effective period in days for a calendar recurrence."""
    if recurrence.calendar_preset:
        preset = recurrence.calendar_preset.lower()
        if preset == "daily":
            return 1
        elif preset in ("weekdays", "weekends"):
            return 1  # checked daily, filtered by day
    # Truthiness, not `is not None`: the frontend can save an empty list
    # alongside a populated sibling field, and [] must read as "absent".
    if recurrence.calendar_days:
        return 7  # weekly cycle
    if recurrence.calendar_days_of_month:
        return 30  # monthly cycle
    return None


def _next_matching_day(from_time: datetime, recurrence: RecurrenceConfig) -> datetime | None:
    """Find the next date matching the calendar recurrence after from_time."""
    if recurrence.calendar_preset:
        preset = recurrence.calendar_preset.lower()
        if preset == "daily":
            return from_time + timedelta(days=1)
        elif preset == "weekdays":
            candidate = from_time + timedelta(days=1)
            while candidate.weekday() >= 5:  # skip Sat/Sun
                candidate += timedelta(days=1)
            return candidate
        elif preset == "weekends":
            candidate = from_time + timedelta(days=1)
            while candidate.weekday() < 5:  # skip Mon-Fri
                candidate += timedelta(days=1)
            return candidate

    # Truthiness: an empty list must fall through to the next field, not
    # short-circuit generation (a frontend save can produce e.g.
    # calendar_days=[] next to calendar_days_of_month=[1]).
    if recurrence.calendar_days:
        # Find next day-of-week that matches
        # calendar_days uses ISO: 0=Mon..6=Sun
        target_days = sorted(recurrence.calendar_days)
        candidate = from_time + timedelta(days=1)
        for _ in range(8):  # at most 7 days ahead
            if candidate.weekday() in target_days:
                return candidate
            candidate += timedelta(days=1)
        return None

    if recurrence.calendar_days_of_month:
        target_days = sorted(recurrence.calendar_days_of_month)
        candidate = from_time + timedelta(days=1)
        for _ in range(62):  # at most ~2 months ahead
            if candidate.day in target_days:
                return candidate
            candidate += timedelta(days=1)
        return None

    return None


def _is_matching_day(dt: datetime, recurrence: RecurrenceConfig) -> bool:
    """Check if a datetime falls on a day matching the calendar recurrence."""
    if recurrence.calendar_preset:
        preset = recurrence.calendar_preset.lower()
        if preset == "daily":
            return True
        elif preset == "weekdays":
            return dt.weekday() < 5
        elif preset == "weekends":
            return dt.weekday() >= 5

    # Truthiness: an empty list is "absent", fall through (see _next_matching_day).
    if recurrence.calendar_days:
        return dt.weekday() in recurrence.calendar_days

    if recurrence.calendar_days_of_month:
        return dt.day in recurrence.calendar_days_of_month

    return False


def calculate_next_due(item: YahtlItem, completion_time: datetime | None = None) -> datetime | None:
    if not item.recurrence:
        return None

    completion_time = completion_time or dt_util.now()
    recurrence = item.recurrence

    if recurrence.type == "calendar":
        return _next_matching_day(completion_time, recurrence)
    elif recurrence.type == "elapsed":
        return _calculate_elapsed_next(recurrence, completion_time)
    elif recurrence.type == "frequency":
        return None  # Frequency goals don't have a "next due"

    return None


def _calculate_elapsed_next(recurrence: RecurrenceConfig, from_time: datetime) -> datetime:
    interval = recurrence.elapsed_interval or 1
    unit = recurrence.elapsed_unit or "days"
    return from_time + timedelta(days=_unit_to_days(interval, unit))


def ensure_recurring_due(item: YahtlItem) -> bool:
    """Give a recurring elapsed/calendar item a concrete next-due if it has none.

    Lead-time surfacing (see lead.py) is anchored on ``due``: an item with no
    due is invisible to it and so sits in the queue permanently. A recurring
    item's natural due is its next occurrence, anchored on the last completion —
    or on creation for one never completed (which then reads as overdue, i.e. it
    should have been done by now, and surfaces until it is).

    Frequency goals are skipped: they surface by progress, not a due date, and
    ``calculate_next_due`` returns None for them. Returns True if a due was set,
    so the caller knows to persist.
    """
    if item.due is not None or item.recurrence is None:
        return False
    if item.recurrence.type == "frequency":
        return False

    tz = dt_util.now().tzinfo
    anchor = item.last_completed or item.created_at
    if anchor.tzinfo is None:
        # created_at is stored naive; lead compares against tz-aware now().
        anchor = anchor.replace(tzinfo=tz)

    nxt = calculate_next_due(item, anchor)
    if nxt is None:
        return False
    if nxt.tzinfo is None:
        nxt = nxt.replace(tzinfo=tz)
    item.due = nxt
    return True


def calculate_streak(item: YahtlItem) -> int:
    if not item.completion_history:
        return 0

    if not item.recurrence or "habit" not in item.traits:
        return 0

    sorted_history = sorted(
        item.completion_history,
        key=lambda x: x.timestamp,
        reverse=True
    )

    recurrence = item.recurrence
    now = dt_util.now()
    streak = 0

    if recurrence.type == "calendar":
        streak = _calculate_calendar_streak(recurrence, sorted_history, now)
    elif recurrence.type == "elapsed":
        streak = _calculate_elapsed_streak(recurrence, sorted_history)
    elif recurrence.type == "frequency":
        streak = _calculate_frequency_streak(recurrence, sorted_history, now)

    return streak


def _calculate_calendar_streak(recurrence: RecurrenceConfig, history: list, now: datetime) -> int:
    period_days = _get_calendar_period_days(recurrence)
    if not period_days:
        return 0

    streak = 0
    expected_time = now

    for completion in history:
        period_start = expected_time - timedelta(days=period_days)

        if period_start <= completion.timestamp <= expected_time:
            streak += 1
            expected_time = period_start
        else:
            break

    return streak


def _calculate_elapsed_streak(recurrence: RecurrenceConfig, history: list) -> int:
    if len(history) < 2:
        return len(history)

    interval = recurrence.elapsed_interval or 1
    unit = recurrence.elapsed_unit or "days"
    interval_days = _unit_to_days(interval, unit)

    streak = 1

    for i in range(len(history) - 1):
        current = history[i].timestamp
        previous = history[i + 1].timestamp
        days_between = (current - previous).days
        max_days = interval_days * 1.2

        if days_between <= max_days:
            streak += 1
        else:
            break

    return streak


def _calculate_frequency_streak(recurrence: RecurrenceConfig, history: list, now: datetime) -> int:
    target_count = recurrence.frequency_count or 1
    period = recurrence.frequency_period or 30
    unit = recurrence.frequency_unit or "days"
    period_days = _unit_to_days(period, unit)

    streak = 0
    period_end = now

    while True:
        period_start = period_end - timedelta(days=period_days)
        completions_in_period = sum(
            1 for c in history
            if period_start <= c.timestamp <= period_end
        )

        if completions_in_period >= target_count:
            streak += 1
            period_end = period_start
        else:
            break

        if streak > 1000:
            break

    return streak


def is_streak_at_risk(item: YahtlItem) -> bool:
    if not item.recurrence or "habit" not in item.traits:
        return False

    if not item.last_completed:
        return False

    recurrence = item.recurrence
    now = dt_util.now()

    if recurrence.type == "calendar":
        period_days = _get_calendar_period_days(recurrence)
        if period_days:
            days_since = (now - item.last_completed).days
            # Only at risk on a day the schedule actually matches — e.g. a
            # weekdays habit can't be at risk over the weekend.
            return days_since >= period_days and _is_matching_day(now, recurrence)

    elif recurrence.type == "elapsed":
        interval = recurrence.elapsed_interval or 1
        unit = recurrence.elapsed_unit or "days"
        threshold_days = _unit_to_days(interval, unit)
        days_since = (now - item.last_completed).days
        return days_since >= (threshold_days - 1)

    return False


def get_frequency_progress(item: YahtlItem) -> dict[str, Any]:
    """Progress of a frequency goal over its rolling window ending now.

    ``count`` is the completions inside the window; ``complete`` is whether the
    target is met. ``days_remaining`` is the number of days until the in-window
    count drops below target: if the target is met, that happens when the
    target-th most recent completion ages out of the window (its timestamp +
    period_days); if the target is not met, it is 0 — already behind, so the
    most urgent threshold applies.
    """
    if not item.recurrence or item.recurrence.type != "frequency":
        return {}

    recurrence = item.recurrence
    target_count = recurrence.frequency_count or 1
    period = recurrence.frequency_period or 30
    unit = recurrence.frequency_unit or "days"
    period_days = _unit_to_days(period, unit)

    now = dt_util.now()
    period_start = now - timedelta(days=period_days)

    in_window = sorted(
        (c.timestamp for c in item.completion_history if c.timestamp >= period_start),
        reverse=True,
    )
    count = len(in_window)

    if count >= target_count:
        # Deadline: when the target-th most recent completion leaves the window.
        deadline = in_window[target_count - 1] + timedelta(days=period_days)
        days_remaining = max(0, (deadline - now).days)
    else:
        days_remaining = 0

    priority = None
    for threshold in sorted(recurrence.thresholds, key=lambda t: t.at_days_remaining, reverse=True):
        if days_remaining <= threshold.at_days_remaining:
            priority = threshold.priority

    return {
        "count": count,
        "target": target_count,
        "period_end": (period_start + timedelta(days=period_days)).isoformat(),
        "days_remaining": days_remaining,
        "threshold_priority": priority,
        "complete": count >= target_count,
    }
