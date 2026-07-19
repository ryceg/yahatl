"""Tests for yahatl WebSocket API."""
from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.yahatl.models import (
    BlockerConfig,
    RecurrenceConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.websocket_api import (
    websocket_item_details,
    websocket_items_list,
    websocket_item_save,
)


def _unwrap(fn):
    """Unwrap @websocket_api.async_response decorator to get the inner async function."""
    # The decorator stores the original function; we can access it via __wrapped__
    # or by looking at the closure. Fallback to calling directly if not wrapped.
    return getattr(fn, "__wrapped__", fn)


def _make_hass_with_list(yahatl_list, store=None):
    """Create a mock hass with a yahatl list loaded on a config entry.

    Per-entry state now lives on entry.runtime_data, reached via
    hass.config_entries — so we stub those rather than hass.data[DOMAIN].
    """
    hass = MagicMock()
    mock_store = store or MagicMock()
    mock_store.async_save = AsyncMock()
    mock_store.data = yahatl_list
    coordinator = MagicMock()
    coordinator.async_request_refresh = AsyncMock()
    runtime = SimpleNamespace(data=yahatl_list, store=mock_store, coordinator=coordinator)
    entry = SimpleNamespace(entry_id="entry_1", runtime_data=runtime)
    hass.config_entries.async_entries = MagicMock(return_value=[entry])
    hass.config_entries.async_get_entry = MagicMock(return_value=entry)
    hass.data = {"yahatl": {}}  # only global state (meta_store, context) lives here now
    hass.bus = MagicMock()
    hass.bus.async_fire = AsyncMock()
    return hass, mock_store


class TestWebsocketItemDetails:
    @pytest.mark.asyncio
    async def test_returns_full_item_dict(self):
        item = YahtlItem.create(title="Test Task")
        item.traits = ["actionable", "habit"]
        item.tags = ["urgent"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_preset="daily")

        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test", "item_id": item.uid}

        await _unwrap(websocket_item_details)(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["uid"] == item.uid
        assert result["title"] == "Test Task"
        assert result["traits"] == ["actionable", "habit"]
        assert result["tags"] == ["urgent"]
        assert result["recurrence"]["type"] == "calendar"

    @pytest.mark.asyncio
    async def test_sends_error_for_missing_item(self):
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test", "item_id": "nonexistent"}

        await _unwrap(websocket_item_details)(hass, connection, msg)

        connection.send_error.assert_called_once()


class TestWebsocketItemsList:
    @pytest.mark.asyncio
    async def test_returns_summary_list(self):
        item1 = YahtlItem.create(title="Task A")
        item1.traits = ["actionable"]
        item2 = YahtlItem.create(title="Task B")
        item2.traits = ["note"]

        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item1)
        yahatl_list.add_item(item2)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test"}

        await _unwrap(websocket_items_list)(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert len(result) == 2
        assert result[0]["uid"] == item1.uid
        assert result[0]["title"] == "Task A"
        assert result[0]["traits"] == ["actionable"]
        assert "recurrence" not in result[0]  # summary only


class TestWebsocketItemSave:
    @pytest.mark.asyncio
    async def test_saves_basic_fields(self):
        item = YahtlItem.create(title="Original")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "title": "Updated",
            "description": "New desc",
            "priority": "high",
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        assert item.title == "Updated"
        assert item.description == "New desc"
        assert item.priority == "high"
        mock_store.async_save.assert_called_once()
        connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_saves_traits_and_tags(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "traits": ["actionable", "habit"],
            "tags": ["fitness", "daily"],
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        assert item.traits == ["actionable", "habit"]
        assert item.tags == ["fitness", "daily"]

    @pytest.mark.asyncio
    async def test_saves_recurrence(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "recurrence": {"type": "elapsed", "elapsed_interval": 7, "elapsed_unit": "days"},
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        assert item.recurrence is not None
        assert item.recurrence.type == "elapsed"
        assert item.recurrence.elapsed_interval == 7

    @pytest.mark.asyncio
    async def test_clears_recurrence_with_none(self):
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(type="calendar", calendar_preset="daily")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "recurrence": None,
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        assert item.recurrence is None

    @pytest.mark.asyncio
    async def test_saves_blockers(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "blockers": {
                "mode": "ANY",
                "items": ["other-uid"],
                "item_mode": "ANY",
                "sensors": ["binary_sensor.door"],
                "sensor_mode": "ALL",
            },
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        assert item.blockers is not None
        assert item.blockers.mode == "ANY"
        assert item.blockers.items == ["other-uid"]

    @pytest.mark.asyncio
    async def test_returns_updated_item(self):
        item = YahtlItem.create(title="Original")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "title": "Updated",
        }

        await _unwrap(websocket_item_save)(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["title"] == "Updated"
        assert result["uid"] == item.uid
