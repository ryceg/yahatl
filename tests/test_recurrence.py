"""Tests for recurrence logic."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from custom_components.yahatl.models import (
    CompletionRecord,
    RecurrenceConfig,
    RecurrenceThreshold,
    YahtlItem,
)
from custom_components.yahatl.recurrence import (
    calculate_next_due,
    calculate_streak,
    get_frequency_progress,
    is_streak_at_risk,
)


class TestCalculateNextDue:
    """Test calculate_next_due function."""

    def test_no_recurrence(self):
        """Test item without recurrence."""
        item = YahtlItem.create(title="Task")
        next_due = calculate_next_due(item)

        assert next_due is None

    def test_calendar_daily(self):
        """Test daily calendar recurrence."""
        item = YahtlItem.create(title="Daily Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="daily",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        assert next_due == datetime(2024, 1, 2, 12, 0)

    def test_calendar_weekly(self):
        """Test weekly calendar recurrence."""
        item = YahtlItem.create(title="Weekly Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="weekly",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        expected = completion + timedelta(weeks=1)
        assert next_due == expected

    def test_calendar_monthly(self):
        """Test monthly calendar recurrence."""
        item = YahtlItem.create(title="Monthly Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="monthly",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        # Approximate: 30 days
        expected = completion + timedelta(days=30)
        assert next_due == expected

    def test_calendar_yearly(self):
        """Test yearly calendar recurrence."""
        item = YahtlItem.create(title="Yearly Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="yearly",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        expected = completion + timedelta(days=365)
        assert next_due == expected

    def test_calendar_case_insensitive(self):
        """Test that calendar patterns are case insensitive."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="WEEKLY",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        assert next_due is not None

    def test_elapsed_days(self):
        """Test elapsed recurrence in days."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=5,
            elapsed_unit="days",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        assert next_due == datetime(2024, 1, 6, 12, 0)

    def test_elapsed_weeks(self):
        """Test elapsed recurrence in weeks."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=2,
            elapsed_unit="weeks",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        expected = completion + timedelta(weeks=2)
        assert next_due == expected

    def test_elapsed_months(self):
        """Test elapsed recurrence in months."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=3,
            elapsed_unit="months",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        # Approximate: 30 days per month
        expected = completion + timedelta(days=90)
        assert next_due == expected

    def test_elapsed_years(self):
        """Test elapsed recurrence in years."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=1,
            elapsed_unit="years",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        expected = completion + timedelta(days=365)
        assert next_due == expected

    def test_frequency_no_due_date(self):
        """Test that frequency goals don't set due dates."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        next_due = calculate_next_due(item)

        assert next_due is None

    def test_default_completion_time(self):
        """Test that default completion time is now."""
        item = YahtlItem.create(title="Daily Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="daily",
        )

        before = datetime.now()
        next_due = calculate_next_due(item)
        after = datetime.now()

        # Next due should be approximately 1 day from now
        assert next_due is not None
        expected_min = before + timedelta(days=1)
        expected_max = after + timedelta(days=1)
        assert expected_min <= next_due <= expected_max

    def test_elapsed_default_unit(self):
        """Test elapsed with default unit (should be days)."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=7,
            elapsed_unit=None,
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        # Should default to days
        assert next_due == datetime(2024, 1, 8, 12, 0)

    def test_elapsed_default_interval(self):
        """Test elapsed with default interval (should be 1)."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=None,
            elapsed_unit="days",
        )

        completion = datetime(2024, 1, 1, 12, 0)
        next_due = calculate_next_due(item, completion)

        # Should default to 1 day
        assert next_due == datetime(2024, 1, 2, 12, 0)


class TestCalculateStreak:
    """Test calculate_streak function."""

    def test_no_completion_history(self):
        """Test streak with no completions."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        streak = calculate_streak(item)

        assert streak == 0

    def test_not_a_habit(self):
        """Test streak for non-habit items."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=datetime.now())
        ]

        streak = calculate_streak(item)

        assert streak == 0

    def test_no_recurrence(self):
        """Test streak for items without recurrence."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=datetime.now())
        ]

        streak = calculate_streak(item)

        assert streak == 0

    def test_daily_streak_consecutive(self):
        """Test daily streak with consecutive days."""
        item = YahtlItem.create(title="Daily Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        now = datetime.now()
        for i in range(5):
            record = CompletionRecord(
                user_id="user1",
                timestamp=now - timedelta(days=i),
            )
            item.completion_history.append(record)

        streak = calculate_streak(item)

        assert streak == 5

    def test_daily_streak_broken(self):
        """Test daily streak with gap."""
        item = YahtlItem.create(title="Daily Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        now = datetime.now()
        # Complete today and yesterday
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=1)),
            # Gap - missing day 2
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=3)),
        ]

        streak = calculate_streak(item)

        # Should only count the first 2
        assert streak == 2

    def test_weekly_streak(self):
        """Test weekly streak."""
        item = YahtlItem.create(title="Weekly Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="weekly")

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=7)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=14)),
        ]

        streak = calculate_streak(item)

        assert streak == 3

    def test_elapsed_streak(self):
        """Test elapsed-based streak."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=5,
            elapsed_unit="days",
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=5)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=10)),
        ]

        streak = calculate_streak(item)

        assert streak == 3

    def test_elapsed_streak_with_grace_period(self):
        """Test elapsed streak with 20% grace period."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=10,
            elapsed_unit="days",
        )

        now = datetime.now()
        # Complete at 11 days (within 20% grace of 10 days)
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=11)),
        ]

        streak = calculate_streak(item)

        # Should count both (11 days <= 10 * 1.2 = 12 days)
        assert streak == 2

    def test_elapsed_streak_exceeds_grace(self):
        """Test elapsed streak that exceeds grace period."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=10,
            elapsed_unit="days",
        )

        now = datetime.now()
        # Gap of 15 days exceeds grace period
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=15)),
        ]

        streak = calculate_streak(item)

        # Should only count most recent
        assert streak == 1

    def test_frequency_streak(self):
        """Test frequency-based streak."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        now = datetime.now()
        # Complete 3 times in current week
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=2)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=4)),
            # Complete 3 times in previous week
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=8)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=10)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=12)),
        ]

        streak = calculate_streak(item)

        assert streak == 2

    def test_frequency_streak_broken(self):
        """Test frequency streak that's broken."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        now = datetime.now()
        # Only 2 completions in current period (goal is 3)
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=2)),
        ]

        streak = calculate_streak(item)

        # Should be 0 because we haven't met the goal
        assert streak == 0

    def test_streak_safety_limit(self):
        """Test that streak calculation has safety limit."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=1,
            frequency_period=1,
            frequency_unit="days",
        )

        # Create many completions to test safety limit
        now = datetime.now()
        for i in range(2000):
            item.completion_history.append(
                CompletionRecord(user_id="user1", timestamp=now - timedelta(days=i))
            )

        streak = calculate_streak(item)

        # Should stop at 1000 per safety limit
        assert streak <= 1000


class TestIsStreakAtRisk:
    """Test is_streak_at_risk function."""

    def test_not_a_habit(self):
        """Test non-habit items are never at risk."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        item.last_completed = datetime.now() - timedelta(days=2)

        at_risk = is_streak_at_risk(item)

        assert at_risk is False

    def test_no_recurrence(self):
        """Test items without recurrence are never at risk."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.last_completed = datetime.now() - timedelta(days=2)

        at_risk = is_streak_at_risk(item)

        assert at_risk is False

    def test_never_completed(self):
        """Test items never completed are not at risk."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        at_risk = is_streak_at_risk(item)

        assert at_risk is False

    def test_daily_at_risk(self):
        """Test daily habit at risk."""
        item = YahtlItem.create(title="Daily Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        item.last_completed = datetime.now() - timedelta(days=1, hours=1)

        at_risk = is_streak_at_risk(item)

        assert at_risk is True

    def test_daily_not_at_risk(self):
        """Test daily habit not at risk."""
        item = YahtlItem.create(title="Daily Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        item.last_completed = datetime.now() - timedelta(hours=12)

        at_risk = is_streak_at_risk(item)

        assert at_risk is False

    def test_weekly_at_risk(self):
        """Test weekly habit at risk."""
        item = YahtlItem.create(title="Weekly Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="weekly")
        item.last_completed = datetime.now() - timedelta(days=7, hours=1)

        at_risk = is_streak_at_risk(item)

        assert at_risk is True

    def test_elapsed_at_risk(self):
        """Test elapsed habit at risk."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=5,
            elapsed_unit="days",
        )
        item.last_completed = datetime.now() - timedelta(days=4)

        at_risk = is_streak_at_risk(item)

        # At risk when within 1 day of deadline
        assert at_risk is True

    def test_elapsed_not_at_risk(self):
        """Test elapsed habit not at risk."""
        item = YahtlItem.create(title="Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=10,
            elapsed_unit="days",
        )
        item.last_completed = datetime.now() - timedelta(days=5)

        at_risk = is_streak_at_risk(item)

        assert at_risk is False


class TestGetFrequencyProgress:
    """Test get_frequency_progress function."""

    def test_not_frequency_type(self):
        """Test non-frequency items return empty dict."""
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        progress = get_frequency_progress(item)

        assert progress == {}

    def test_no_recurrence(self):
        """Test items without recurrence return empty dict."""
        item = YahtlItem.create(title="Task")

        progress = get_frequency_progress(item)

        assert progress == {}

    def test_frequency_no_completions(self):
        """Test frequency progress with no completions."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        progress = get_frequency_progress(item)

        assert progress["count"] == 0
        assert progress["target"] == 3
        assert progress["complete"] is False

    def test_frequency_partial_progress(self):
        """Test frequency progress with partial completions."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=1)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=3)),
        ]

        progress = get_frequency_progress(item)

        assert progress["count"] == 2
        assert progress["target"] == 3
        assert progress["complete"] is False

    def test_frequency_goal_met(self):
        """Test frequency progress with goal met."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=2)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=4)),
        ]

        progress = get_frequency_progress(item)

        assert progress["count"] == 3
        assert progress["target"] == 3
        assert progress["complete"] is True

    def test_frequency_with_thresholds(self):
        """Test frequency progress with priority thresholds."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=30,
            frequency_unit="days",
            thresholds=[
                RecurrenceThreshold(at_days_remaining=10, priority="medium"),
                RecurrenceThreshold(at_days_remaining=3, priority="high"),
            ],
        )

        item.last_completed = datetime.now() - timedelta(days=25)

        progress = get_frequency_progress(item)

        # Days remaining should be ~5, so should trigger medium threshold
        assert progress["threshold_priority"] in ["medium", "high"]

    def test_frequency_weeks_unit(self):
        """Test frequency with weeks unit."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=2,
            frequency_period=2,
            frequency_unit="weeks",
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=3)),
        ]

        progress = get_frequency_progress(item)

        assert progress["count"] == 1
        assert progress["target"] == 2

    def test_frequency_months_unit(self):
        """Test frequency with months unit."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=5,
            frequency_period=1,
            frequency_unit="months",
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=10)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=20)),
        ]

        progress = get_frequency_progress(item)

        assert progress["count"] == 2
        assert progress["target"] == 5

    def test_frequency_old_completions_ignored(self):
        """Test that old completions outside period are ignored."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )

        now = datetime.now()
        item.completion_history = [
            # Within period
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=2)),
            # Outside period
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=10)),
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=20)),
        ]

        progress = get_frequency_progress(item)

        # Should only count the one within the 7-day period
        assert progress["count"] == 1
