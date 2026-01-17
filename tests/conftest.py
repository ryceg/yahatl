"""Fixtures for yahatl tests."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

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


@pytest.fixture
def mock_hass():
    """Mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.states = MagicMock()
    hass.states.async_all = MagicMock(return_value=[])
    hass.states.get = MagicMock(return_value=None)
    hass.bus = MagicMock()
    hass.bus.async_fire = AsyncMock()
    return hass


@pytest.fixture
def basic_item():
    """Create a basic YahtlItem for testing."""
    return YahtlItem.create(
        title="Test Task",
        created_by="test_user",
    )


@pytest.fixture
def habit_item():
    """Create a habit item with recurrence."""
    item = YahtlItem.create(title="Daily Exercise", created_by="test_user")
    item.traits = ["actionable", "habit"]
    item.recurrence = RecurrenceConfig(
        type="calendar",
        calendar_pattern="daily",
    )
    return item


@pytest.fixture
def frequency_item():
    """Create an item with frequency-based recurrence."""
    item = YahtlItem.create(title="Exercise 3x/week", created_by="test_user")
    item.traits = ["actionable", "habit"]
    item.recurrence = RecurrenceConfig(
        type="frequency",
        frequency_count=3,
        frequency_period=7,
        frequency_unit="days",
        thresholds=[
            RecurrenceThreshold(at_days_remaining=2, priority="high"),
            RecurrenceThreshold(at_days_remaining=5, priority="medium"),
        ],
    )
    return item


@pytest.fixture
def blocked_item():
    """Create an item with blockers."""
    item = YahtlItem.create(title="Clean Oven", created_by="test_user")
    item.blockers = BlockerConfig(
        mode="ANY",
        items=["blocker_task_id"],
        sensors=["binary_sensor.oven_hot"],
    )
    return item


@pytest.fixture
def required_item():
    """Create an item with requirements."""
    item = YahtlItem.create(title="Mow Lawn", created_by="test_user")
    item.requirements = RequirementsConfig(
        mode="ALL",
        location=["home"],
        time_constraints=["weekend"],
        sensors=["binary_sensor.good_weather"],
    )
    return item


@pytest.fixture
def sample_list(basic_item):
    """Create a sample YahtlList."""
    yahatl_list = YahtlList(
        list_id="test_list",
        name="Test List",
        owner="test_user",
    )
    yahatl_list.add_item(basic_item)
    return yahatl_list


@pytest.fixture
def overdue_item():
    """Create an overdue item."""
    item = YahtlItem.create(title="Overdue Task", created_by="test_user")
    item.due = datetime.now() - timedelta(days=1)
    item.priority = "high"
    return item


@pytest.fixture
def due_today_item():
    """Create an item due today."""
    item = YahtlItem.create(title="Today Task", created_by="test_user")
    item.due = datetime.now() + timedelta(hours=2)
    return item


@pytest.fixture
def mock_sensor_state():
    """Create a mock sensor state."""
    def _create_state(entity_id: str, state: str, attributes: dict[str, Any] | None = None):
        mock_state = MagicMock()
        mock_state.entity_id = entity_id
        mock_state.state = state
        mock_state.attributes = attributes or {}
        return mock_state
    return _create_state


@pytest.fixture
def completion_records():
    """Create a list of completion records."""
    now = datetime.now()
    return [
        CompletionRecord(user_id="user1", timestamp=now - timedelta(days=i))
        for i in range(5)
    ]
