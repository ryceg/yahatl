"""Tests for QueueEngine -- the deepened queue module."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.queue import QueueEngine, QueueResult
from custom_components.yahatl.models import YahtlItem, YahtlList, BlockerConfig


class TestQueueResult:
    def test_construction(self):
        result = QueueResult(
            items=[],
            context={"location": "home"},
            overdue_count=0,
            due_today_count=0,
            blocked_count=0,
            next_task_title=None,
            total_actionable=0,
            generated_at=datetime.now(),
        )
        assert result.items == []
        assert result.overdue_count == 0

    def test_immutable(self):
        result = QueueResult(
            items=[], context={}, overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
            generated_at=datetime.now(),
        )
        try:
            result.overdue_count = 5
            assert False, "Should have raised"
        except AttributeError:
            pass


class TestQueueEngineGenerate:
    @pytest.mark.asyncio
    async def test_empty_lists(self, mock_hass):
        engine = QueueEngine(mock_hass)
        result = await engine.generate([])
        assert result.items == []
        assert result.overdue_count == 0
        assert result.total_actionable == 0
        assert isinstance(result, QueueResult)

    @pytest.mark.asyncio
    async def test_scores_and_sorts_items(self, mock_hass):
        overdue = YahtlItem.create(title="Overdue")
        overdue.due = datetime.now() - timedelta(days=1)

        normal = YahtlItem.create(title="Normal")

        yl = YahtlList(list_id="l", name="L", items=[normal, overdue])

        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert len(result.items) == 2
        assert result.items[0]["item"]["title"] == "Overdue"
        assert result.overdue_count == 1

    @pytest.mark.asyncio
    async def test_blocked_items_excluded_and_counted(self, mock_hass, mock_sensor_state):
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.x", "on")
        )

        blocked = YahtlItem.create(title="Blocked")
        blocked.blockers = BlockerConfig(mode="ANY", sensors=["binary_sensor.x"])

        free = YahtlItem.create(title="Free")

        yl = YahtlList(list_id="l", name="L", items=[blocked, free])
        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert len(result.items) == 1
        assert result.items[0]["item"]["title"] == "Free"
        assert result.blocked_count == 1

    @pytest.mark.asyncio
    async def test_context_auto_resolves(self, mock_hass):
        mock_hass.states.async_all = MagicMock(return_value=[])

        item = YahtlItem.create(title="Task")
        yl = YahtlList(list_id="l", name="L", items=[item])

        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert "location" in result.context
        assert "time_constraint" in result.context

    @pytest.mark.asyncio
    async def test_due_today_count(self, mock_hass):
        today = YahtlItem.create(title="Today")
        today.due = datetime.now() + timedelta(hours=2)

        tomorrow = YahtlItem.create(title="Tomorrow")
        tomorrow.due = datetime.now() + timedelta(days=2)

        yl = YahtlList(list_id="l", name="L", items=[today, tomorrow])
        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert result.due_today_count == 1

    @pytest.mark.asyncio
    async def test_next_task_title(self, mock_hass):
        item = YahtlItem.create(title="Top Task")
        yl = YahtlList(list_id="l", name="L", items=[item])

        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert result.next_task_title == "Top Task"

    @pytest.mark.asyncio
    async def test_skips_completed_items(self, mock_hass):
        done = YahtlItem.create(title="Done")
        done.status = "completed"

        pending = YahtlItem.create(title="Pending")

        yl = YahtlList(list_id="l", name="L", items=[done, pending])
        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert len(result.items) == 1
        assert result.items[0]["item"]["title"] == "Pending"

    @pytest.mark.asyncio
    async def test_skips_non_actionable(self, mock_hass):
        note = YahtlItem.create(title="Note")
        note.traits = ["note"]

        task = YahtlItem.create(title="Task")

        yl = YahtlList(list_id="l", name="L", items=[note, task])
        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl])

        assert len(result.items) == 1
        assert result.items[0]["item"]["title"] == "Task"

    @pytest.mark.asyncio
    async def test_available_time_filter(self, mock_hass):
        quick = YahtlItem.create(title="Quick")
        quick.time_estimate = 15

        long_task = YahtlItem.create(title="Long")
        long_task.time_estimate = 120

        yl = YahtlList(list_id="l", name="L", items=[quick, long_task])
        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl], available_time=30)

        assert len(result.items) == 1
        assert result.items[0]["item"]["title"] == "Quick"

    @pytest.mark.asyncio
    async def test_explicit_context_used(self, mock_hass):
        item = YahtlItem.create(title="Task")
        yl = YahtlList(list_id="l", name="L", items=[item])

        engine = QueueEngine(mock_hass)
        result = await engine.generate([yl], context={"location": "office"})

        assert result.context["location"] == "office"
