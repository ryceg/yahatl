"""Recurrence logic for yahatl."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import YahtlItem, RecurrenceConfig

_LOGGER = logging.getLogger(__name__)


def calculate_next_due(item: YahtlItem, completion_time: datetime | None = None) -> datetime | None:
    """Calculate the next due date based on recurrence configuration.

    Args:
        item: The item with recurrence configuration
        completion_time: When the item was completed (defaults to now)

    Returns:
        Next due date, or None if item doesn't recur
    """
    if not item.recurrence:
        return None

    completion_time = completion_time or datetime.now()
    recurrence = item.recurrence

    if recurrence.type == "calendar":
        # Calendar-based: use the pattern to calculate next occurrence
        # For now, simple implementation - can be enhanced with croniter later
        return _calculate_calendar_next(recurrence, completion_time)

    elif recurrence.type == "elapsed":
        # Elapsed-based: add interval from last completion
        return _calculate_elapsed_next(recurrence, completion_time)

    elif recurrence.type == "frequency":
        # Frequency-based: doesn't set a hard due date
        # Instead, we track completions within the period
        return None  # Frequency goals don't have a "next due"

    return None


def _calculate_calendar_next(recurrence: RecurrenceConfig, from_time: datetime) -> datetime | None:
    """Calculate next occurrence for calendar-based recurrence."""
    if not recurrence.calendar_pattern:
        return None

    # Simple pattern parsing (can be enhanced with croniter)
    pattern = recurrence.calendar_pattern.lower()

    # Handle simple patterns
    if "daily" in pattern:
        return from_time + timedelta(days=1)
    elif "weekly" in pattern or "week" in pattern:
        return from_time + timedelta(weeks=1)
    elif "monthly" in pattern or "month" in pattern:
        # Approximate: 30 days
        return from_time + timedelta(days=30)
    elif "yearly" in pattern or "year" in pattern:
        return from_time + timedelta(days=365)

    # For more complex patterns, would use croniter
    _LOGGER.warning("Complex calendar pattern not yet supported: %s", pattern)
    return None


def _calculate_elapsed_next(recurrence: RecurrenceConfig, from_time: datetime) -> datetime:
    """Calculate next occurrence for elapsed-based recurrence."""
    interval = recurrence.elapsed_interval or 1
    unit = recurrence.elapsed_unit or "days"

    if unit == "days":
        return from_time + timedelta(days=interval)
    elif unit == "weeks":
        return from_time + timedelta(weeks=interval)
    elif unit == "months":
        # Approximate: 30 days per month
        return from_time + timedelta(days=interval * 30)
    elif unit == "years":
        return from_time + timedelta(days=interval * 365)

    return from_time + timedelta(days=interval)


def calculate_streak(item: YahtlItem) -> int:
    """Calculate current streak for habit tracking.

    A streak is maintained if the item is completed at least once
    within each period defined by the recurrence.

    Args:
        item: The item to calculate streak for

    Returns:
        Current streak count
    """
    if not item.completion_history:
        return 0

    if not item.recurrence or "habit" not in item.traits:
        return 0

    # Sort completion history by timestamp (most recent first)
    sorted_history = sorted(
        item.completion_history,
        key=lambda x: x.timestamp,
        reverse=True
    )

    recurrence = item.recurrence
    now = datetime.now()
    streak = 0

    if recurrence.type == "calendar":
        streak = _calculate_calendar_streak(recurrence, sorted_history, now)
    elif recurrence.type == "elapsed":
        streak = _calculate_elapsed_streak(recurrence, sorted_history)
    elif recurrence.type == "frequency":
        streak = _calculate_frequency_streak(recurrence, sorted_history, now)

    return streak


def _calculate_calendar_streak(recurrence: RecurrenceConfig, history: list, now: datetime) -> int:
    """Calculate streak for calendar-based recurrence."""
    if not recurrence.calendar_pattern:
        return 0

    pattern = recurrence.calendar_pattern.lower()

    # Determine period length
    if "daily" in pattern:
        period_days = 1
    elif "weekly" in pattern:
        period_days = 7
    elif "monthly" in pattern:
        period_days = 30
    else:
        return 0

    streak = 0
    expected_time = now

    for completion in history:
        # Check if completion falls within expected period
        period_start = expected_time - timedelta(days=period_days)

        if period_start <= completion.timestamp <= expected_time:
            streak += 1
            expected_time = period_start
        else:
            # Gap found, streak broken
            break

    return streak


def _calculate_elapsed_streak(recurrence: RecurrenceConfig, history: list) -> int:
    """Calculate streak for elapsed-based recurrence."""
    if len(history) < 2:
        return len(history)

    interval = recurrence.elapsed_interval or 1
    unit = recurrence.elapsed_unit or "days"

    # Convert to days for comparison
    if unit == "days":
        interval_days = interval
    elif unit == "weeks":
        interval_days = interval * 7
    elif unit == "months":
        interval_days = interval * 30
    elif unit == "years":
        interval_days = interval * 365
    else:
        interval_days = interval

    streak = 1  # Start with most recent completion

    for i in range(len(history) - 1):
        current = history[i].timestamp
        previous = history[i + 1].timestamp

        days_between = (current - previous).days

        # Allow some tolerance (20% grace period)
        max_days = interval_days * 1.2

        if days_between <= max_days:
            streak += 1
        else:
            # Gap too large, streak broken
            break

    return streak


def _calculate_frequency_streak(recurrence: RecurrenceConfig, history: list, now: datetime) -> int:
    """Calculate streak for frequency-based goals."""
    target_count = recurrence.frequency_count or 1
    period = recurrence.frequency_period or 30
    unit = recurrence.frequency_unit or "days"

    # Convert period to days
    if unit == "days":
        period_days = period
    elif unit == "weeks":
        period_days = period * 7
    elif unit == "months":
        period_days = period * 30
    else:
        period_days = period

    streak = 0
    period_end = now

    while True:
        period_start = period_end - timedelta(days=period_days)

        # Count completions in this period
        completions_in_period = sum(
            1 for c in history
            if period_start <= c.timestamp <= period_end
        )

        if completions_in_period >= target_count:
            streak += 1
            period_end = period_start
        else:
            # Goal not met in this period, streak broken
            break

        # Safety limit
        if streak > 1000:
            break

    return streak


def is_streak_at_risk(item: YahtlItem) -> bool:
    """Check if a habit streak is at risk of being broken.

    Returns True if the item needs to be completed today to maintain streak.
    """
    if not item.recurrence or "habit" not in item.traits:
        return False

    if not item.last_completed:
        return False

    recurrence = item.recurrence
    now = datetime.now()

    if recurrence.type == "calendar":
        pattern = (recurrence.calendar_pattern or "").lower()

        if "daily" in pattern:
            # Must complete each day
            days_since = (now - item.last_completed).days
            return days_since >= 1

        elif "weekly" in pattern:
            # Must complete within 7 days
            days_since = (now - item.last_completed).days
            return days_since >= 7

        elif "monthly" in pattern:
            # Must complete within 30 days
            days_since = (now - item.last_completed).days
            return days_since >= 30

    elif recurrence.type == "elapsed":
        interval = recurrence.elapsed_interval or 1
        unit = recurrence.elapsed_unit or "days"

        if unit == "days":
            threshold_days = interval
        elif unit == "weeks":
            threshold_days = interval * 7
        elif unit == "months":
            threshold_days = interval * 30
        elif unit == "years":
            threshold_days = interval * 365
        else:
            threshold_days = interval

        days_since = (now - item.last_completed).days
        # At risk if we're within 1 day of the deadline
        return days_since >= (threshold_days - 1)

    return False


def get_frequency_progress(item: YahtlItem) -> dict[str, Any]:
    """Get progress toward frequency goal.

    Returns:
        Dict with count, target, period_end, days_remaining, threshold_priority
    """
    if not item.recurrence or item.recurrence.type != "frequency":
        return {}

    recurrence = item.recurrence
    target_count = recurrence.frequency_count or 1
    period = recurrence.frequency_period or 30
    unit = recurrence.frequency_unit or "days"

    # Convert period to days
    if unit == "days":
        period_days = period
    elif unit == "weeks":
        period_days = period * 7
    elif unit == "months":
        period_days = period * 30
    else:
        period_days = period

    now = datetime.now()
    period_start = now - timedelta(days=period_days)

    # Count completions in current period
    count = sum(
        1 for c in item.completion_history
        if c.timestamp >= period_start
    )

    days_remaining = period_days
    if item.last_completed:
        # Calculate from last completion
        days_since_start = (now - period_start).days
        days_remaining = period_days - days_since_start

    # Check thresholds
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
