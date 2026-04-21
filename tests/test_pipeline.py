"""Tests for ReactivePipeline — the deepened reactivity module."""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from unittest.mock import MagicMock, AsyncMock, patch

import pytest

from custom_components.yahatl.reactivity import PipelineSnapshot, ReactivePipeline
from custom_components.yahatl.models import YahtlItem, YahtlList, ConditionTriggerConfig


class TestPipelineSnapshot:
    def test_construction(self):
        snap = PipelineSnapshot(
            queue=[],
            overdue_count=0,
            due_today_count=0,
            blocked_count=0,
            next_task_title=None,
            total_actionable=0,
            data_version=1,
        )
        assert snap.data_version == 1
        assert snap.queue == []

    def test_immutable(self):
        snap = PipelineSnapshot(
            queue=[], overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
            data_version=1,
        )
        try:
            snap.data_version = 2
            assert False, "Should have raised"
        except AttributeError:
            pass


def _make_mock_hass():
    """Create a mock hass that works with ReactivePipeline."""
    hass = MagicMock()
    hass.data = {}
    hass.states = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.states.async_all = MagicMock(return_value=[])
    hass.bus = MagicMock()
    hass.bus.async_fire = MagicMock()
    hass.async_create_task = MagicMock(side_effect=lambda coro, **kw: asyncio.ensure_future(coro))
    return hass


class TestReactivePipelineBasic:
    @pytest.mark.asyncio
    async def test_snapshot_is_none_before_refresh(self):
        hass = _make_mock_hass()
        store = AsyncMock()
        data = YahtlList(list_id="l", name="L")

        pipeline = ReactivePipeline(
            hass=hass, entry_id="test", store=store,
            data_fn=lambda: data, all_lists_fn=lambda: [data],
        )

        assert pipeline.get_snapshot() is None

    @pytest.mark.asyncio
    async def test_refresh_produces_snapshot(self):
        hass = _make_mock_hass()
        store = AsyncMock()
        item = YahtlItem.create(title="Task")
        data = YahtlList(list_id="l", name="L", items=[item])

        pipeline = ReactivePipeline(
            hass=hass, entry_id="test", store=store,
            data_fn=lambda: data, all_lists_fn=lambda: [data],
        )

        await pipeline.async_request_refresh("test")

        snap = pipeline.get_snapshot()
        assert snap is not None
        assert snap.total_actionable == 1
        assert snap.data_version == 1

    @pytest.mark.asyncio
    async def test_refresh_increments_version(self):
        hass = _make_mock_hass()
        store = AsyncMock()
        data = YahtlList(list_id="l", name="L")

        pipeline = ReactivePipeline(
            hass=hass, entry_id="test", store=store,
            data_fn=lambda: data, all_lists_fn=lambda: [data],
        )

        await pipeline.async_request_refresh("first")
        await pipeline.async_request_refresh("second")

        snap = pipeline.get_snapshot()
        assert snap.data_version == 2

    @pytest.mark.asyncio
    async def test_refresh_persists_data(self):
        hass = _make_mock_hass()
        store = AsyncMock()
        data = YahtlList(list_id="l", name="L")

        pipeline = ReactivePipeline(
            hass=hass, entry_id="test", store=store,
            data_fn=lambda: data, all_lists_fn=lambda: [data],
        )

        await pipeline.async_request_refresh("test")

        store.async_save.assert_called_once_with(data)

    @pytest.mark.asyncio
    async def test_snapshot_reflects_queue_state(self):
        hass = _make_mock_hass()
        store = AsyncMock()

        overdue = YahtlItem.create(title="Overdue")
        overdue.due = datetime.now() - timedelta(days=1)

        normal = YahtlItem.create(title="Normal")

        data = YahtlList(list_id="l", name="L", items=[overdue, normal])

        pipeline = ReactivePipeline(
            hass=hass, entry_id="test", store=store,
            data_fn=lambda: data, all_lists_fn=lambda: [data],
        )

        await pipeline.async_request_refresh("test")

        snap = pipeline.get_snapshot()
        assert snap.overdue_count == 1
        assert snap.total_actionable == 2
        assert snap.next_task_title == "Overdue"  # Higher score due to overdue
