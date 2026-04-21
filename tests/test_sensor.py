"""Tests for sensor entities."""
from __future__ import annotations

from datetime import datetime, timedelta

from custom_components.yahatl.models import BlockerConfig, RecurrenceConfig, YahtlItem, YahtlList
from custom_components.yahatl.sensor import (
    YahtlBlockedCountSensor,
    YahtlDueTodaySensor,
    YahtlInboxCountSensor,
    YahtlNextTaskSensor,
    YahtlNotesCountSensor,
    YahtlOverdueSensor,
    YahtlStreakRiskSensor,
)


def _make_list(*items: YahtlItem) -> YahtlList:
    yahtl_list = YahtlList(list_id="test", name="Test")
    for item in items:
        yahtl_list.add_item(item)
    return yahtl_list


def _actionable_item(title: str, **kwargs) -> YahtlItem:
    item = YahtlItem.create(title=title)
    item.traits = ["actionable"]
    for k, v in kwargs.items():
        setattr(item, k, v)
    return item


class TestOverdueSensor:
    def test_counts_overdue_items(self):
        now = datetime.now()
        items = [
            _actionable_item("Past due", due=now - timedelta(hours=1)),
            _actionable_item("Also past", due=now - timedelta(days=2)),
            _actionable_item("Not due yet", due=now + timedelta(days=1)),
            _actionable_item("No due date"),
        ]
        data = _make_list(*items)
        sensor = YahtlOverdueSensor.__new__(YahtlOverdueSensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_excludes_completed(self):
        now = datetime.now()
        item = _actionable_item("Done", due=now - timedelta(hours=1), status="completed")
        data = _make_list(item)
        sensor = YahtlOverdueSensor.__new__(YahtlOverdueSensor)
        sensor._data = data
        assert sensor.native_value == 0

    def test_zero_when_empty(self):
        data = _make_list()
        sensor = YahtlOverdueSensor.__new__(YahtlOverdueSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestDueTodaySensor:
    def test_counts_due_today(self):
        now = datetime.now()
        items = [
            _actionable_item("Today", due=now + timedelta(hours=2)),
            _actionable_item("Today too", due=now.replace(hour=23, minute=59)),
            _actionable_item("Tomorrow", due=now + timedelta(days=1)),
            _actionable_item("Yesterday", due=now - timedelta(days=1)),
        ]
        data = _make_list(*items)
        sensor = YahtlDueTodaySensor.__new__(YahtlDueTodaySensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_zero_when_nothing_due(self):
        data = _make_list(_actionable_item("No due"))
        sensor = YahtlDueTodaySensor.__new__(YahtlDueTodaySensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestNextTaskSensor:
    def test_returns_most_overdue(self):
        now = datetime.now()
        items = [
            _actionable_item("Less overdue", due=now - timedelta(hours=1)),
            _actionable_item("Most overdue", due=now - timedelta(days=3)),
            _actionable_item("Future", due=now + timedelta(days=1)),
        ]
        data = _make_list(*items)
        sensor = YahtlNextTaskSensor.__new__(YahtlNextTaskSensor)
        sensor._data = data
        assert sensor.native_value == "Most overdue"

    def test_returns_soonest_due_when_none_overdue(self):
        now = datetime.now()
        items = [
            _actionable_item("Later", due=now + timedelta(days=5)),
            _actionable_item("Sooner", due=now + timedelta(days=1)),
        ]
        data = _make_list(*items)
        sensor = YahtlNextTaskSensor.__new__(YahtlNextTaskSensor)
        sensor._data = data
        assert sensor.native_value == "Sooner"

    def test_returns_first_item_when_no_due_dates(self):
        items = [
            _actionable_item("First"),
            _actionable_item("Second"),
        ]
        data = _make_list(*items)
        sensor = YahtlNextTaskSensor.__new__(YahtlNextTaskSensor)
        sensor._data = data
        assert sensor.native_value == "First"

    def test_returns_none_when_empty(self):
        data = _make_list()
        sensor = YahtlNextTaskSensor.__new__(YahtlNextTaskSensor)
        sensor._data = data
        assert sensor.native_value is None

    def test_extra_state_attributes(self):
        items = [_actionable_item("A"), _actionable_item("B")]
        data = _make_list(*items)
        sensor = YahtlNextTaskSensor.__new__(YahtlNextTaskSensor)
        sensor._data = data
        assert sensor.extra_state_attributes == {"total_actionable": 2}


class TestBlockedCountSensor:
    def test_counts_items_with_blockers(self):
        blocked = _actionable_item("Blocked")
        blocked.blockers = BlockerConfig(items=["some_id"])
        unblocked = _actionable_item("Free")
        data = _make_list(blocked, unblocked)
        sensor = YahtlBlockedCountSensor.__new__(YahtlBlockedCountSensor)
        sensor._data = data
        assert sensor.native_value == 1

    def test_counts_sensor_blockers(self):
        blocked = _actionable_item("Sensor blocked")
        blocked.blockers = BlockerConfig(sensors=["binary_sensor.test"])
        data = _make_list(blocked)
        sensor = YahtlBlockedCountSensor.__new__(YahtlBlockedCountSensor)
        sensor._data = data
        assert sensor.native_value == 1

    def test_zero_when_no_blockers(self):
        data = _make_list(_actionable_item("Free"))
        sensor = YahtlBlockedCountSensor.__new__(YahtlBlockedCountSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestInboxCountSensor:
    def test_counts_needs_detail_items(self):
        items = [
            _actionable_item("Needs detail", needs_detail=True),
            _actionable_item("Needs detail 2", needs_detail=True),
            _actionable_item("Fleshed out", needs_detail=False),
        ]
        data = _make_list(*items)
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_zero_when_no_inbox_items(self):
        data = _make_list(_actionable_item("Normal"))
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 0

    def test_excludes_completed_items(self):
        item = _actionable_item("Done", needs_detail=True, status="completed")
        data = _make_list(item)
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestNotesCountSensor:
    def test_counts_note_trait_items(self):
        note1 = YahtlItem.create(title="Note 1")
        note1.traits = ["note"]
        note2 = YahtlItem.create(title="Note 2")
        note2.traits = ["note"]
        task = _actionable_item("Task")
        data = _make_list(note1, note2, task)
        sensor = YahtlNotesCountSensor.__new__(YahtlNotesCountSensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_zero_when_no_notes(self):
        data = _make_list(_actionable_item("Task"))
        sensor = YahtlNotesCountSensor.__new__(YahtlNotesCountSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestStreakRiskSensor:
    def test_counts_at_risk_habits(self):
        habit = YahtlItem.create(title="Daily Run")
        habit.traits = ["actionable", "habit"]
        habit.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        habit.last_completed = datetime.now() - timedelta(days=1, hours=1)

        safe_habit = YahtlItem.create(title="Safe Habit")
        safe_habit.traits = ["actionable", "habit"]
        safe_habit.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        safe_habit.last_completed = datetime.now() - timedelta(hours=6)

        data = _make_list(habit, safe_habit)
        sensor = YahtlStreakRiskSensor.__new__(YahtlStreakRiskSensor)
        sensor._data = data
        assert sensor.native_value == 1

    def test_zero_when_no_habits(self):
        data = _make_list(_actionable_item("Task"))
        sensor = YahtlStreakRiskSensor.__new__(YahtlStreakRiskSensor)
        sensor._data = data
        assert sensor.native_value == 0
