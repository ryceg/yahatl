"""Tests for queue algorithm and scoring."""
from __future__ import annotations

from datetime import datetime, timedelta
from homeassistant.util import dt as dt_util
from unittest.mock import MagicMock

import pytest
from freezegun import freeze_time

from custom_components.yahatl.models import (
    ConditionTriggerConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.queue import (
    QueueEngine,
    _calculate_score,
    _get_time_constraint,
    get_current_context_from_hass,
)


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

    @freeze_time("2024-01-06 12:00:00")  # Saturday
    def test_weekend(self):
        """Test weekend detection."""
        assert _get_time_constraint() == "weekend"

    @freeze_time("2024-01-01 07:00:00")  # Monday 7am
    def test_morning(self):
        """Test morning time constraint."""
        assert _get_time_constraint() == "morning"

    @freeze_time("2024-01-01 14:00:00")  # Monday 2pm
    def test_business_hours(self):
        """Test business hours time constraint."""
        assert _get_time_constraint() == "business_hours"

    @freeze_time("2024-01-01 19:00:00")  # Monday 7pm
    def test_evening(self):
        """Test evening time constraint."""
        assert _get_time_constraint() == "evening"

    @freeze_time("2024-01-01 23:00:00")  # Monday 11pm
    def test_night(self):
        """Test night time constraint."""
        assert _get_time_constraint() == "night"


class TestQueueEdgeCases:
    """Test edge cases in queue generation."""

    @pytest.mark.asyncio
    async def test_large_number_of_items(self, mock_hass):
        """Test queue with many items."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        for i in range(1000):
            item = YahtlItem.create(title=f"Task {i}")
            yahatl_list.add_item(item)

        result = await QueueEngine(mock_hass).generate([yahatl_list])
        queue = result.items

        assert len(queue) == 1000

    @pytest.mark.asyncio
    async def test_items_with_same_score(self, mock_hass):
        """Test sorting when items have same score."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        older = YahtlItem.create(title="Older Task")
        older.created_at = dt_util.now() - timedelta(days=2)

        newer = YahtlItem.create(title="Newer Task")
        newer.created_at = dt_util.now()

        yahatl_list.add_item(newer)
        yahatl_list.add_item(older)

        result = await QueueEngine(mock_hass).generate([yahatl_list])
        queue = result.items

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

        result = await QueueEngine(mock_hass).generate([yahatl_list], available_time=60)
        queue = result.items

        # Both should be included (None doesn't exceed limit)
        assert len(queue) == 2

    @pytest.mark.asyncio
    async def test_empty_context(self, mock_hass):
        """Test queue generation with empty context."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task")
        yahatl_list.add_item(item)

        result = await QueueEngine(mock_hass).generate([yahatl_list], context={})
        queue = result.items

        assert len(queue) == 1

    @pytest.mark.asyncio
    async def test_none_context(self, mock_hass):
        """Test queue generation with None context."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task")
        yahatl_list.add_item(item)

        result = await QueueEngine(mock_hass).generate([yahatl_list], context=None)
        queue = result.items

        assert len(queue) == 1


class TestConditionTriggerScoring:
    @pytest.mark.asyncio
    async def test_active_condition_boosts_score(self, mock_hass):
        """Test that an active condition trigger adds +75 to score."""
        item = YahtlItem.create(title="Hang washing")
        item.traits = ["actionable"]
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washing_machine",
                operator="eq",
                value="idle",
            ),
        ]

        # Mock the entity state to match the trigger
        mock_state = MagicMock()
        mock_state.state = "idle"
        mock_state.attributes = {}
        mock_hass.states.get = MagicMock(return_value=mock_state)

        score = await _calculate_score(mock_hass, item, {})
        assert score >= 75

    @pytest.mark.asyncio
    async def test_inactive_condition_no_boost(self, mock_hass):
        """Test that an inactive condition trigger doesn't boost score."""
        item = YahtlItem.create(title="Hang washing")
        item.traits = ["actionable"]
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washing_machine",
                operator="eq",
                value="idle",
            ),
        ]

        # Mock the entity state to NOT match
        mock_state = MagicMock()
        mock_state.state = "running"
        mock_state.attributes = {}
        mock_hass.states.get = MagicMock(return_value=mock_state)

        score = await _calculate_score(mock_hass, item, {})
        assert score < 75

    @pytest.mark.asyncio
    async def test_condition_with_attribute(self, mock_hass):
        """Test condition trigger checking an attribute."""
        item = YahtlItem.create(title="Cool down house")
        item.traits = ["actionable"]
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="climate.living_room",
                attribute="current_temperature",
                operator="gte",
                value="25",
            ),
        ]

        mock_state = MagicMock()
        mock_state.state = "cool"
        mock_state.attributes = {"current_temperature": "27"}
        mock_hass.states.get = MagicMock(return_value=mock_state)

        score = await _calculate_score(mock_hass, item, {})
        assert score >= 75
