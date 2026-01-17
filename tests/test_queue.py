"""Tests for queue algorithm and scoring."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.models import (
    BlockerConfig,
    CompletionRecord,
    RecurrenceConfig,
    RecurrenceThreshold,
    RequirementsConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.queue import (
    _calculate_score,
    _get_time_constraint,
    get_current_context_from_hass,
    get_prioritized_queue,
)


class TestGetPrioritizedQueue:
    """Test get_prioritized_queue function."""

    @pytest.mark.asyncio
    async def test_empty_lists(self, mock_hass):
        """Test queue generation with no items."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 0

    @pytest.mark.asyncio
    async def test_only_actionable_items(self, mock_hass):
        """Test that only actionable items are included."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        actionable = YahtlItem.create(title="Actionable Task")
        actionable.traits = ["actionable"]

        note = YahtlItem.create(title="Note")
        note.traits = ["note"]

        yahatl_list.add_item(actionable)
        yahatl_list.add_item(note)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 1
        assert queue[0]["item"]["title"] == "Actionable Task"

    @pytest.mark.asyncio
    async def test_excludes_completed_items(self, mock_hass):
        """Test that completed items are excluded."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        pending = YahtlItem.create(title="Pending Task")
        pending.status = "pending"

        completed = YahtlItem.create(title="Completed Task")
        completed.status = "completed"

        yahatl_list.add_item(pending)
        yahatl_list.add_item(completed)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 1
        assert queue[0]["item"]["title"] == "Pending Task"

    @pytest.mark.asyncio
    async def test_excludes_missed_items(self, mock_hass):
        """Test that missed items are excluded."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        pending = YahtlItem.create(title="Pending Task")
        pending.status = "pending"

        missed = YahtlItem.create(title="Missed Task")
        missed.status = "missed"

        yahatl_list.add_item(pending)
        yahatl_list.add_item(missed)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 1
        assert queue[0]["item"]["title"] == "Pending Task"

    @pytest.mark.asyncio
    async def test_filters_by_available_time(self, mock_hass):
        """Test filtering by available time."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        short_task = YahtlItem.create(title="Short Task")
        short_task.time_estimate = 30

        long_task = YahtlItem.create(title="Long Task")
        long_task.time_estimate = 120

        yahatl_list.add_item(short_task)
        yahatl_list.add_item(long_task)

        queue = await get_prioritized_queue(
            mock_hass, [yahatl_list], available_time=60
        )

        assert len(queue) == 1
        assert queue[0]["item"]["title"] == "Short Task"

    @pytest.mark.asyncio
    async def test_excludes_blocked_items(self, mock_hass):
        """Test that blocked items are excluded."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        blocker = YahtlItem.create(title="Blocker")
        blocker.status = "pending"

        blocked = YahtlItem.create(title="Blocked Task")
        blocked.blockers = BlockerConfig(mode="ANY", items=[blocker.uid])

        unblocked = YahtlItem.create(title="Unblocked Task")

        yahatl_list.add_item(blocker)
        yahatl_list.add_item(blocked)
        yahatl_list.add_item(unblocked)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        # Should include blocker and unblocked, but not blocked
        assert len(queue) == 2
        titles = [item["item"]["title"] for item in queue]
        assert "Blocked Task" not in titles

    @pytest.mark.asyncio
    async def test_excludes_unmet_requirements(self, mock_hass):
        """Test that items with unmet requirements are excluded."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        required = YahtlItem.create(title="Required Task")
        required.requirements = RequirementsConfig(
            mode="ALL",
            location=["office"],
        )

        no_requirements = YahtlItem.create(title="No Requirements")

        yahatl_list.add_item(required)
        yahatl_list.add_item(no_requirements)

        context = {"location": "home"}
        queue = await get_prioritized_queue(mock_hass, [yahatl_list], context)

        # Required task shouldn't be in queue
        assert len(queue) == 1
        assert queue[0]["item"]["title"] == "No Requirements"

    @pytest.mark.asyncio
    async def test_sorts_by_score(self, mock_hass):
        """Test that items are sorted by score."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        low_priority = YahtlItem.create(title="Low Priority")
        low_priority.priority = "low"

        high_priority = YahtlItem.create(title="High Priority")
        high_priority.priority = "high"

        medium_priority = YahtlItem.create(title="Medium Priority")
        medium_priority.priority = "medium"

        yahatl_list.add_item(low_priority)
        yahatl_list.add_item(high_priority)
        yahatl_list.add_item(medium_priority)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        # Should be sorted high, medium, low
        assert queue[0]["item"]["title"] == "High Priority"
        assert queue[1]["item"]["title"] == "Medium Priority"
        assert queue[2]["item"]["title"] == "Low Priority"

    @pytest.mark.asyncio
    async def test_multiple_lists(self, mock_hass):
        """Test queue generation with multiple lists."""
        list1 = YahtlList(list_id="list1", name="List 1")
        list2 = YahtlList(list_id="list2", name="List 2")

        item1 = YahtlItem.create(title="Task 1")
        item2 = YahtlItem.create(title="Task 2")

        list1.add_item(item1)
        list2.add_item(item2)

        queue = await get_prioritized_queue(mock_hass, [list1, list2])

        assert len(queue) == 2

    @pytest.mark.asyncio
    async def test_queue_includes_metadata(self, mock_hass):
        """Test that queue items include metadata."""
        yahatl_list = YahtlList(list_id="test_list", name="Test List")
        item = YahtlItem.create(title="Task")
        yahatl_list.add_item(item)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 1
        queue_item = queue[0]

        assert "item" in queue_item
        assert "list_id" in queue_item
        assert "list_name" in queue_item
        assert "score" in queue_item

        assert queue_item["list_name"] == "Test List"
        assert isinstance(queue_item["score"], int)


class TestCalculateScore:
    """Test _calculate_score function."""

    @pytest.mark.asyncio
    async def test_base_score_zero(self, mock_hass):
        """Test that items with no special attributes have score 0."""
        item = YahtlItem.create(title="Basic Task")

        score = await _calculate_score(mock_hass, item, {})

        assert score == 0

    @pytest.mark.asyncio
    async def test_overdue_task(self, mock_hass):
        """Test overdue task scoring."""
        item = YahtlItem.create(title="Overdue Task")
        item.due = datetime.now() - timedelta(days=1)

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 100  # Overdue bonus

    @pytest.mark.asyncio
    async def test_due_today(self, mock_hass):
        """Test task due today."""
        item = YahtlItem.create(title="Due Today")
        item.due = datetime.now() + timedelta(hours=2)

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 50  # Due today bonus

    @pytest.mark.asyncio
    async def test_due_this_week(self, mock_hass):
        """Test task due this week."""
        item = YahtlItem.create(title="Due This Week")
        item.due = datetime.now() + timedelta(days=3)

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 20  # Due this week bonus

    @pytest.mark.asyncio
    async def test_frequency_threshold_critical(self, mock_hass):
        """Test frequency threshold scoring - critical."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
            thresholds=[
                RecurrenceThreshold(at_days_remaining=1, priority="critical"),
            ],
        )

        # Add completions to trigger threshold
        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=6)),
        ]
        item.last_completed = now - timedelta(days=6)

        score = await _calculate_score(mock_hass, item, {})

        # Should have critical priority bonus (90)
        assert score >= 90

    @pytest.mark.asyncio
    async def test_frequency_threshold_high(self, mock_hass):
        """Test frequency threshold scoring - high."""
        item = YahtlItem.create(title="Habit")
        item.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
            thresholds=[
                RecurrenceThreshold(at_days_remaining=3, priority="high"),
            ],
        )

        now = datetime.now()
        item.completion_history = [
            CompletionRecord(user_id="user1", timestamp=now - timedelta(days=5)),
        ]
        item.last_completed = now - timedelta(days=5)

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 60

    @pytest.mark.asyncio
    async def test_habit_streak_at_risk(self, mock_hass):
        """Test habit with streak at risk."""
        item = YahtlItem.create(title="Daily Habit")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="daily",
        )
        item.last_completed = datetime.now() - timedelta(days=1)

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 40  # Streak at risk bonus

    @pytest.mark.asyncio
    async def test_explicit_priority_high(self, mock_hass):
        """Test explicit high priority."""
        item = YahtlItem.create(title="High Priority Task")
        item.priority = "high"

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 50

    @pytest.mark.asyncio
    async def test_explicit_priority_medium(self, mock_hass):
        """Test explicit medium priority."""
        item = YahtlItem.create(title="Medium Priority Task")
        item.priority = "medium"

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 25

    @pytest.mark.asyncio
    async def test_explicit_priority_low(self, mock_hass):
        """Test explicit low priority."""
        item = YahtlItem.create(title="Low Priority Task")
        item.priority = "low"

        score = await _calculate_score(mock_hass, item, {})

        assert score >= 10

    @pytest.mark.asyncio
    async def test_context_match_all_mode(self, mock_hass):
        """Test context match bonus for ALL mode."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ALL",
            location=["home"],
        )

        context = {"location": "home"}

        score = await _calculate_score(mock_hass, item, context)

        assert score >= 10  # Context match bonus

    @pytest.mark.asyncio
    async def test_context_match_any_mode_multiple(self, mock_hass):
        """Test context match bonus for ANY mode with multiple matches."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["home"],
            people=["John"],
        )

        context = {
            "location": "home",
            "people": ["John"],
        }

        score = await _calculate_score(mock_hass, item, context)

        assert score >= 10  # Multiple context matches

    @pytest.mark.asyncio
    async def test_combined_scoring(self, mock_hass):
        """Test multiple scoring factors combined."""
        item = YahtlItem.create(title="Complex Task")
        item.due = datetime.now() - timedelta(hours=1)  # Overdue: +100
        item.priority = "high"  # +50
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="daily",
        )
        item.last_completed = datetime.now() - timedelta(days=1)  # At risk: +40

        score = await _calculate_score(mock_hass, item, {})

        # Should be at least 190 (100 + 50 + 40)
        assert score >= 190

    @pytest.mark.asyncio
    async def test_score_is_integer(self, mock_hass):
        """Test that score is always an integer."""
        item = YahtlItem.create(title="Task")
        item.due = datetime.now() + timedelta(hours=5)

        score = await _calculate_score(mock_hass, item, {})

        assert isinstance(score, int)


class TestGetCurrentContextFromHass:
    """Test get_current_context_from_hass function."""

    def test_default_context(self, mock_hass):
        """Test default context when no entities."""
        context = get_current_context_from_hass(mock_hass)

        assert "location" in context
        assert "people" in context
        assert "time_constraint" in context
        assert "contexts" in context

    def test_person_home(self, mock_hass):
        """Test detecting people at home."""
        person1 = MagicMock()
        person1.state = "home"
        person1.attributes = {"friendly_name": "John"}
        person1.entity_id = "person.john"

        person2 = MagicMock()
        person2.state = "away"
        person2.attributes = {"friendly_name": "Jane"}
        person2.entity_id = "person.jane"

        mock_hass.states.async_all = MagicMock(return_value=[person1, person2])

        context = get_current_context_from_hass(mock_hass)

        assert "John" in context["people"]
        assert "Jane" not in context["people"]

    def test_location_away_when_no_people(self, mock_hass):
        """Test location set to away when no one home."""
        mock_hass.states.async_all = MagicMock(return_value=[])

        context = get_current_context_from_hass(mock_hass)

        assert context["location"] == "away"

    def test_location_home_when_people_home(self, mock_hass):
        """Test location set to home when people are home."""
        person = MagicMock()
        person.state = "home"
        person.attributes = {"friendly_name": "John"}

        mock_hass.states.async_all = MagicMock(return_value=[person])

        context = get_current_context_from_hass(mock_hass)

        assert context["location"] == "home"


class TestGetTimeConstraint:
    """Test _get_time_constraint function."""

    def test_weekend(self):
        """Test weekend detection."""
        # Saturday
        saturday = datetime(2024, 1, 6, 12, 0)  # Saturday
        with_time = lambda: saturday
        import custom_components.yahatl.queue as queue_module
        original_now = datetime.now
        datetime.now = with_time

        constraint = _get_time_constraint()

        datetime.now = original_now
        assert constraint == "weekend"

    def test_morning(self):
        """Test morning time constraint."""
        morning = datetime(2024, 1, 1, 7, 0)  # Monday 7am
        with_time = lambda: morning
        import custom_components.yahatl.queue as queue_module
        original_now = datetime.now
        datetime.now = with_time

        constraint = _get_time_constraint()

        datetime.now = original_now
        assert constraint == "morning"

    def test_business_hours(self):
        """Test business hours time constraint."""
        business = datetime(2024, 1, 1, 14, 0)  # Monday 2pm
        with_time = lambda: business
        import custom_components.yahatl.queue as queue_module
        original_now = datetime.now
        datetime.now = with_time

        constraint = _get_time_constraint()

        datetime.now = original_now
        assert constraint == "business_hours"

    def test_evening(self):
        """Test evening time constraint."""
        evening = datetime(2024, 1, 1, 19, 0)  # Monday 7pm
        with_time = lambda: evening
        import custom_components.yahatl.queue as queue_module
        original_now = datetime.now
        datetime.now = with_time

        constraint = _get_time_constraint()

        datetime.now = original_now
        assert constraint == "evening"

    def test_night(self):
        """Test night time constraint."""
        night = datetime(2024, 1, 1, 23, 0)  # Monday 11pm
        with_time = lambda: night
        import custom_components.yahatl.queue as queue_module
        original_now = datetime.now
        datetime.now = with_time

        constraint = _get_time_constraint()

        datetime.now = original_now
        assert constraint == "night"


class TestQueueEdgeCases:
    """Test edge cases in queue generation."""

    @pytest.mark.asyncio
    async def test_large_number_of_items(self, mock_hass):
        """Test queue with many items."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        for i in range(1000):
            item = YahtlItem.create(title=f"Task {i}")
            yahatl_list.add_item(item)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        assert len(queue) == 1000

    @pytest.mark.asyncio
    async def test_items_with_same_score(self, mock_hass):
        """Test sorting when items have same score."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        older = YahtlItem.create(title="Older Task")
        older.created_at = datetime.now() - timedelta(days=2)

        newer = YahtlItem.create(title="Newer Task")
        newer.created_at = datetime.now()

        yahatl_list.add_item(newer)
        yahatl_list.add_item(older)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list])

        # Older should come first when scores are equal
        assert queue[0]["item"]["title"] == "Older Task"

    @pytest.mark.asyncio
    async def test_task_with_no_time_estimate(self, mock_hass):
        """Test that tasks without time estimate are included when filtering."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        no_estimate = YahtlItem.create(title="No Estimate")
        no_estimate.time_estimate = None

        with_estimate = YahtlItem.create(title="With Estimate")
        with_estimate.time_estimate = 30

        yahatl_list.add_item(no_estimate)
        yahatl_list.add_item(with_estimate)

        queue = await get_prioritized_queue(
            mock_hass, [yahatl_list], available_time=60
        )

        # Both should be included (None doesn't exceed limit)
        assert len(queue) == 2

    @pytest.mark.asyncio
    async def test_empty_context(self, mock_hass):
        """Test queue generation with empty context."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task")
        yahatl_list.add_item(item)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list], context={})

        assert len(queue) == 1

    @pytest.mark.asyncio
    async def test_none_context(self, mock_hass):
        """Test queue generation with None context."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task")
        yahatl_list.add_item(item)

        queue = await get_prioritized_queue(mock_hass, [yahatl_list], context=None)

        assert len(queue) == 1
