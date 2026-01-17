"""Tests for yahatl data models."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from custom_components.yahatl.models import (
    BlockerConfig,
    CompletionRecord,
    ContextOverride,
    RecurrenceConfig,
    RecurrenceThreshold,
    RequirementsConfig,
    YahtlItem,
    YahtlList,
)


class TestCompletionRecord:
    """Test CompletionRecord model."""

    def test_create_completion_record(self):
        """Test creating a completion record."""
        timestamp = datetime.now()
        record = CompletionRecord(user_id="test_user", timestamp=timestamp)

        assert record.user_id == "test_user"
        assert record.timestamp == timestamp

    def test_to_dict(self):
        """Test serialization to dict."""
        timestamp = datetime.now()
        record = CompletionRecord(user_id="test_user", timestamp=timestamp)
        data = record.to_dict()

        assert data["user_id"] == "test_user"
        assert data["timestamp"] == timestamp.isoformat()

    def test_from_dict(self):
        """Test deserialization from dict."""
        timestamp = datetime.now()
        data = {
            "user_id": "test_user",
            "timestamp": timestamp.isoformat(),
        }
        record = CompletionRecord.from_dict(data)

        assert record.user_id == "test_user"
        assert record.timestamp == timestamp

    def test_roundtrip(self):
        """Test serialization roundtrip."""
        original = CompletionRecord(user_id="test_user", timestamp=datetime.now())
        data = original.to_dict()
        restored = CompletionRecord.from_dict(data)

        assert original.user_id == restored.user_id
        assert original.timestamp == restored.timestamp


class TestRecurrenceConfig:
    """Test RecurrenceConfig model."""

    def test_calendar_recurrence(self):
        """Test calendar-based recurrence."""
        recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="weekly",
        )

        assert recurrence.type == "calendar"
        assert recurrence.calendar_pattern == "weekly"
        assert recurrence.elapsed_interval is None
        assert len(recurrence.thresholds) == 0

    def test_elapsed_recurrence(self):
        """Test elapsed-based recurrence."""
        recurrence = RecurrenceConfig(
            type="elapsed",
            elapsed_interval=3,
            elapsed_unit="months",
        )

        assert recurrence.type == "elapsed"
        assert recurrence.elapsed_interval == 3
        assert recurrence.elapsed_unit == "months"

    def test_frequency_recurrence_with_thresholds(self):
        """Test frequency-based recurrence with thresholds."""
        thresholds = [
            RecurrenceThreshold(at_days_remaining=10, priority="medium"),
            RecurrenceThreshold(at_days_remaining=3, priority="high"),
        ]
        recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=30,
            frequency_unit="days",
            thresholds=thresholds,
        )

        assert recurrence.type == "frequency"
        assert recurrence.frequency_count == 3
        assert recurrence.frequency_period == 30
        assert len(recurrence.thresholds) == 2

    def test_recurrence_roundtrip(self):
        """Test recurrence serialization roundtrip."""
        original = RecurrenceConfig(
            type="frequency",
            frequency_count=5,
            frequency_period=7,
            frequency_unit="days",
            thresholds=[
                RecurrenceThreshold(at_days_remaining=2, priority="critical"),
            ],
        )
        data = original.to_dict()
        restored = RecurrenceConfig.from_dict(data)

        assert original.type == restored.type
        assert original.frequency_count == restored.frequency_count
        assert len(original.thresholds) == len(restored.thresholds)


class TestBlockerConfig:
    """Test BlockerConfig model."""

    def test_blocker_with_items(self):
        """Test blocker config with item blockers."""
        blocker = BlockerConfig(
            mode="ALL",
            items=["item1", "item2"],
        )

        assert blocker.mode == "ALL"
        assert len(blocker.items) == 2
        assert "item1" in blocker.items

    def test_blocker_with_sensors(self):
        """Test blocker config with sensor blockers."""
        blocker = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test"],
        )

        assert blocker.mode == "ANY"
        assert len(blocker.sensors) == 1

    def test_blocker_default_mode(self):
        """Test blocker default mode."""
        blocker = BlockerConfig()
        assert blocker.mode == "ALL"

    def test_blocker_roundtrip(self):
        """Test blocker serialization roundtrip."""
        original = BlockerConfig(
            mode="ANY",
            items=["item1"],
            sensors=["sensor1"],
        )
        data = original.to_dict()
        restored = BlockerConfig.from_dict(data)

        assert original.mode == restored.mode
        assert original.items == restored.items
        assert original.sensors == restored.sensors


class TestRequirementsConfig:
    """Test RequirementsConfig model."""

    def test_requirements_all_fields(self):
        """Test requirements with all fields."""
        requirements = RequirementsConfig(
            mode="ALL",
            location=["home", "office"],
            people=["John", "Jane"],
            time_constraints=["weekend", "evening"],
            context=["computer", "phone"],
            sensors=["binary_sensor.good_weather"],
        )

        assert requirements.mode == "ALL"
        assert len(requirements.location) == 2
        assert len(requirements.people) == 2
        assert len(requirements.time_constraints) == 2
        assert len(requirements.context) == 2
        assert len(requirements.sensors) == 1

    def test_requirements_default_mode(self):
        """Test requirements default mode."""
        requirements = RequirementsConfig()
        assert requirements.mode == "ANY"

    def test_requirements_roundtrip(self):
        """Test requirements serialization roundtrip."""
        original = RequirementsConfig(
            mode="ANY",
            location=["home"],
            people=["John"],
        )
        data = original.to_dict()
        restored = RequirementsConfig.from_dict(data)

        assert original.mode == restored.mode
        assert original.location == restored.location


class TestYahtlItem:
    """Test YahtlItem model."""

    def test_create_item(self):
        """Test creating a new item."""
        item = YahtlItem.create(title="Test Task", created_by="user1")

        assert item.title == "Test Task"
        assert item.created_by == "user1"
        assert item.uid  # Should have generated UUID
        assert "actionable" in item.traits
        assert item.status == "pending"

    def test_item_with_all_fields(self):
        """Test item with all fields populated."""
        due_date = datetime.now() + timedelta(days=1)
        item = YahtlItem(
            uid="test-123",
            title="Complete Task",
            description="Do the thing",
            traits=["actionable", "habit"],
            tags=["urgent", "work"],
            status="in_progress",
            due=due_date,
            time_estimate=60,
            buffer_before=10,
            buffer_after=5,
            priority="high",
        )

        assert item.uid == "test-123"
        assert item.title == "Complete Task"
        assert item.description == "Do the thing"
        assert len(item.traits) == 2
        assert len(item.tags) == 2
        assert item.status == "in_progress"
        assert item.due == due_date
        assert item.time_estimate == 60
        assert item.priority == "high"

    def test_item_with_recurrence(self):
        """Test item with recurrence config."""
        item = YahtlItem.create(title="Weekly Task")
        item.recurrence = RecurrenceConfig(
            type="calendar",
            calendar_pattern="weekly",
        )

        assert item.recurrence is not None
        assert item.recurrence.type == "calendar"

    def test_item_with_blockers(self):
        """Test item with blockers."""
        item = YahtlItem.create(title="Blocked Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=["blocker1"],
        )

        assert item.blockers is not None
        assert item.blockers.mode == "ANY"

    def test_item_with_requirements(self):
        """Test item with requirements."""
        item = YahtlItem.create(title="Required Task")
        item.requirements = RequirementsConfig(
            mode="ALL",
            location=["home"],
        )

        assert item.requirements is not None
        assert "home" in item.requirements.location

    def test_item_completion_history(self):
        """Test item completion history."""
        item = YahtlItem.create(title="Task")
        assert len(item.completion_history) == 0

        record = CompletionRecord(user_id="user1", timestamp=datetime.now())
        item.completion_history.append(record)

        assert len(item.completion_history) == 1
        assert item.completion_history[0].user_id == "user1"

    def test_item_streak_tracking(self):
        """Test item streak tracking fields."""
        item = YahtlItem.create(title="Habit")

        assert item.current_streak == 0
        assert item.last_completed is None

        item.current_streak = 5
        item.last_completed = datetime.now()

        assert item.current_streak == 5
        assert item.last_completed is not None

    def test_item_to_dict(self):
        """Test item serialization to dict."""
        item = YahtlItem.create(title="Test")
        item.tags = ["tag1", "tag2"]
        data = item.to_dict()

        assert data["title"] == "Test"
        assert data["uid"] == item.uid
        assert len(data["tags"]) == 2
        assert "created_at" in data

    def test_item_from_dict(self):
        """Test item deserialization from dict."""
        due_date = datetime.now()
        data = {
            "uid": "test-123",
            "title": "Test Task",
            "description": "Description",
            "traits": ["actionable"],
            "tags": ["tag1"],
            "status": "pending",
            "needs_detail": False,
            "due": due_date.isoformat(),
            "time_estimate": 30,
            "buffer_before": 0,
            "buffer_after": 0,
            "recurrence": None,
            "blockers": None,
            "requirements": None,
            "priority": None,
            "completion_history": [],
            "current_streak": 0,
            "last_completed": None,
            "created_at": datetime.now().isoformat(),
            "created_by": "user",
        }
        item = YahtlItem.from_dict(data)

        assert item.uid == "test-123"
        assert item.title == "Test Task"
        assert item.time_estimate == 30

    def test_item_roundtrip_with_nested_objects(self):
        """Test item serialization roundtrip with nested objects."""
        original = YahtlItem.create(title="Complex Task")
        original.recurrence = RecurrenceConfig(
            type="frequency",
            frequency_count=3,
            frequency_period=7,
            frequency_unit="days",
        )
        original.blockers = BlockerConfig(mode="ANY", items=["blocker1"])
        original.requirements = RequirementsConfig(mode="ALL", location=["home"])
        original.completion_history = [
            CompletionRecord(user_id="user1", timestamp=datetime.now())
        ]

        data = original.to_dict()
        restored = YahtlItem.from_dict(data)

        assert original.title == restored.title
        assert restored.recurrence is not None
        assert restored.recurrence.type == "frequency"
        assert restored.blockers is not None
        assert restored.requirements is not None
        assert len(restored.completion_history) == 1

    def test_item_none_recurrence_serialization(self):
        """Test that None recurrence serializes correctly."""
        item = YahtlItem.create(title="No Recurrence")
        data = item.to_dict()

        assert data["recurrence"] is None

        restored = YahtlItem.from_dict(data)
        assert restored.recurrence is None


class TestYahtlList:
    """Test YahtlList model."""

    def test_create_list(self):
        """Test creating a list."""
        yahatl_list = YahtlList(
            list_id="test_list",
            name="Test List",
            owner="user1",
        )

        assert yahatl_list.list_id == "test_list"
        assert yahatl_list.name == "Test List"
        assert yahatl_list.owner == "user1"
        assert yahatl_list.visibility == "private"
        assert len(yahatl_list.items) == 0

    def test_add_item(self):
        """Test adding items to list."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task 1")

        yahatl_list.add_item(item)

        assert len(yahatl_list.items) == 1
        assert yahatl_list.items[0].title == "Task 1"

    def test_get_item(self):
        """Test getting item by UID."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task 1")
        yahatl_list.add_item(item)

        found = yahatl_list.get_item(item.uid)

        assert found is not None
        assert found.uid == item.uid

    def test_get_item_not_found(self):
        """Test getting non-existent item."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        found = yahatl_list.get_item("nonexistent")

        assert found is None

    def test_remove_item(self):
        """Test removing item by UID."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task 1")
        yahatl_list.add_item(item)

        result = yahatl_list.remove_item(item.uid)

        assert result is True
        assert len(yahatl_list.items) == 0

    def test_remove_item_not_found(self):
        """Test removing non-existent item."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        result = yahatl_list.remove_item("nonexistent")

        assert result is False

    def test_list_visibility(self):
        """Test list visibility settings."""
        yahatl_list = YahtlList(
            list_id="test",
            name="Test",
            visibility="shared",
            shared_with=["user1", "user2"],
        )

        assert yahatl_list.visibility == "shared"
        assert len(yahatl_list.shared_with) == 2

    def test_list_to_dict(self):
        """Test list serialization."""
        yahatl_list = YahtlList(list_id="test", name="Test")
        item = YahtlItem.create(title="Task 1")
        yahatl_list.add_item(item)

        data = yahatl_list.to_dict()

        assert data["list_id"] == "test"
        assert data["name"] == "Test"
        assert len(data["items"]) == 1

    def test_list_from_dict(self):
        """Test list deserialization."""
        data = {
            "list_id": "test",
            "name": "Test List",
            "owner": "user1",
            "visibility": "private",
            "shared_with": [],
            "is_inbox": False,
            "items": [
                {
                    "uid": "item-1",
                    "title": "Task 1",
                    "description": "",
                    "traits": ["actionable"],
                    "tags": [],
                    "status": "pending",
                    "needs_detail": False,
                    "due": None,
                    "time_estimate": None,
                    "buffer_before": 0,
                    "buffer_after": 0,
                    "recurrence": None,
                    "blockers": None,
                    "requirements": None,
                    "priority": None,
                    "completion_history": [],
                    "current_streak": 0,
                    "last_completed": None,
                    "created_at": datetime.now().isoformat(),
                    "created_by": "",
                }
            ],
        }

        yahatl_list = YahtlList.from_dict(data)

        assert yahatl_list.list_id == "test"
        assert len(yahatl_list.items) == 1

    def test_list_roundtrip(self):
        """Test list serialization roundtrip."""
        original = YahtlList(
            list_id="test",
            name="Test List",
            owner="user1",
            visibility="shared",
            shared_with=["user2"],
        )
        item = YahtlItem.create(title="Task 1")
        original.add_item(item)

        data = original.to_dict()
        restored = YahtlList.from_dict(data)

        assert original.list_id == restored.list_id
        assert original.name == restored.name
        assert original.visibility == restored.visibility
        assert len(restored.items) == 1


class TestContextOverride:
    """Test ContextOverride model."""

    def test_create_context_override(self):
        """Test creating context override."""
        context = ContextOverride(
            location="office",
            people=["John", "Jane"],
            contexts=["computer", "phone"],
        )

        assert context.location == "office"
        assert len(context.people) == 2
        assert len(context.contexts) == 2

    def test_context_override_defaults(self):
        """Test context override defaults."""
        context = ContextOverride()

        assert context.location is None
        assert len(context.people) == 0
        assert len(context.contexts) == 0

    def test_context_override_roundtrip(self):
        """Test context override serialization roundtrip."""
        original = ContextOverride(
            location="home",
            people=["Alice"],
            contexts=["computer"],
        )

        data = original.to_dict()
        restored = ContextOverride.from_dict(data)

        assert original.location == restored.location
        assert original.people == restored.people
        assert original.contexts == restored.contexts


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_item_with_empty_strings(self):
        """Test item with empty string fields."""
        item = YahtlItem(
            uid="test",
            title="",
            description="",
        )

        assert item.title == ""
        assert item.description == ""

    def test_item_with_very_long_title(self):
        """Test item with very long title."""
        long_title = "A" * 10000
        item = YahtlItem.create(title=long_title)

        assert len(item.title) == 10000

    def test_item_with_future_dates(self):
        """Test item with far future dates."""
        far_future = datetime.now() + timedelta(days=36500)  # 100 years
        item = YahtlItem.create(title="Future Task")
        item.due = far_future

        assert item.due == far_future

    def test_item_with_past_dates(self):
        """Test item with past dates."""
        past = datetime.now() - timedelta(days=36500)  # 100 years ago
        item = YahtlItem.create(title="Past Task")
        item.due = past

        assert item.due == past

    def test_large_completion_history(self):
        """Test item with large completion history."""
        item = YahtlItem.create(title="Popular Task")

        for i in range(1000):
            record = CompletionRecord(
                user_id=f"user{i}",
                timestamp=datetime.now() - timedelta(days=i),
            )
            item.completion_history.append(record)

        assert len(item.completion_history) == 1000

    def test_list_with_many_items(self):
        """Test list with many items."""
        yahatl_list = YahtlList(list_id="test", name="Test")

        for i in range(1000):
            item = YahtlItem.create(title=f"Task {i}")
            yahatl_list.add_item(item)

        assert len(yahatl_list.items) == 1000

    def test_special_characters_in_fields(self):
        """Test special characters in various fields."""
        item = YahtlItem.create(
            title="Task with 🎉 emojis & <html> 'quotes'",
        )
        item.description = "Line 1\nLine 2\tTabbed"
        item.tags = ["tag-1", "tag_2", "tag.3"]

        data = item.to_dict()
        restored = YahtlItem.from_dict(data)

        assert restored.title == item.title
        assert restored.description == item.description
        assert restored.tags == item.tags
