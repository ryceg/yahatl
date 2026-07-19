"""Tests for YahtlCoordinator — the DataUpdateCoordinator that replaced ReactivePipeline."""
from __future__ import annotations

from datetime import datetime, timedelta
from homeassistant.util import dt as dt_util
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.yahatl.coordinator import YahtlCoordinator, YahtlSnapshot
from custom_components.yahatl.models import YahtlItem, YahtlList


class TestYahtlSnapshot:
    def test_construction(self):
        snap = YahtlSnapshot(
            queue=[], overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
        )
        assert snap.queue == []
        assert snap.total_actionable == 0

    def test_immutable(self):
        snap = YahtlSnapshot(
            queue=[], overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
        )
        with pytest.raises(AttributeError):
            snap.overdue_count = 5  # type: ignore[misc]


def _make_coordinator(*lists: YahtlList) -> YahtlCoordinator:
    """Build a coordinator via __new__, bypassing DataUpdateCoordinator setup.

    Mirrors the sensor tests' approach so we can exercise the compute logic
    (``_async_update_data`` / ``_all_lists``) without a running hass.
    """
    hass = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.states.async_all = MagicMock(return_value=[])
    entries = [
        SimpleNamespace(runtime_data=SimpleNamespace(data=lst)) for lst in lists
    ]
    hass.config_entries.async_entries = MagicMock(return_value=entries)

    coord = YahtlCoordinator.__new__(YahtlCoordinator)
    coord.hass = hass
    coord._store = AsyncMock()
    coord._last_triggered = {}
    coord._unsub_state = None
    coord._tracked = frozenset()
    coord.config_entry = entries[0] if entries else SimpleNamespace(runtime_data=None)
    return coord


class TestUpdateData:
    @pytest.mark.asyncio
    async def test_produces_snapshot(self):
        item = YahtlItem.create(title="Task")
        data = YahtlList(list_id="l", name="L", items=[item])
        coord = _make_coordinator(data)

        snap = await coord._async_update_data()

        assert isinstance(snap, YahtlSnapshot)
        assert snap.total_actionable == 1

    @pytest.mark.asyncio
    async def test_snapshot_reflects_queue_state(self):
        overdue = YahtlItem.create(title="Overdue")
        overdue.due = dt_util.now() - timedelta(days=1)
        normal = YahtlItem.create(title="Normal")
        data = YahtlList(list_id="l", name="L", items=[overdue, normal])
        coord = _make_coordinator(data)

        snap = await coord._async_update_data()

        assert snap.overdue_count == 1
        assert snap.total_actionable == 2
        assert snap.next_task_title == "Overdue"  # overdue scores highest

    def test_all_lists_gathers_from_every_entry(self):
        a = YahtlList(list_id="a", name="A")
        b = YahtlList(list_id="b", name="B")
        coord = _make_coordinator(a, b)

        assert coord._all_lists() == [a, b]
