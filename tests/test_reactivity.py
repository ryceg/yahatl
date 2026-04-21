"""Tests for ReactivityManager."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.yahatl.models import (
    ConditionTriggerConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.reactivity import ReactivityManager


@pytest.fixture
def mock_store():
    store = MagicMock()
    store.async_save = AsyncMock()
    return store


@pytest.fixture
def make_list():
    def _make(items: list[YahtlItem]) -> YahtlList:
        yl = YahtlList(list_id="test", name="Test")
        yl.items = items
        return yl
    return _make


@pytest.fixture
def mock_hass_for_reactivity():
    hass = MagicMock()
    hass.data = {}
    hass.states = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.bus = MagicMock()
    return hass


class TestCollectTrackedEntities:
    def test_collects_from_condition_triggers(self, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washing_machine", operator="eq", value="idle"),
        ]
        yl = make_list([item])
        entities = ReactivityManager._collect_tracked_entities([yl])
        assert entities == {"sensor.washing_machine"}

    def test_deduplicates_across_items(self, make_list):
        item1 = YahtlItem.create(title="Task 1")
        item1.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle"),
        ]
        item2 = YahtlItem.create(title="Task 2")
        item2.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle"),
            ConditionTriggerConfig(entity_id="sensor.dryer", operator="eq", value="idle"),
        ]
        yl = make_list([item1, item2])
        entities = ReactivityManager._collect_tracked_entities([yl])
        assert entities == {"sensor.washer", "sensor.dryer"}

    def test_empty_when_no_triggers(self, make_list):
        item = YahtlItem.create(title="No triggers")
        yl = make_list([item])
        entities = ReactivityManager._collect_tracked_entities([yl])
        assert entities == set()


class TestHandleStateChange:
    def _make_manager(self, hass, store, all_lists_fn, data_fn=None):
        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = hass
        manager._store = store
        manager._last_triggered = {}
        manager._all_lists_fn = all_lists_fn
        # data_fn returns this entry's list; defaults to first list from all_lists_fn
        manager._data_fn = data_fn or (lambda: all_lists_fn()[0] if all_lists_fn() else None)
        return manager

    def test_boost_trigger_fires_signal(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="boost"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("sensor.washer", new_state)
        mock_send.assert_called_once()

    def test_set_due_sets_due_date(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="set_due"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)
        assert item.due is not None

    def test_set_due_uses_min_with_existing(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        future_due = datetime.now() + timedelta(days=7)
        item.due = future_due
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="set_due"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)
        assert item.due < future_due

    def test_set_due_clears_deferred_until(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.deferred_until = datetime.now() + timedelta(days=3)
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="set_due"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)
        assert item.deferred_until is None

    def test_set_due_respects_cooldown(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="set_due"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])
        manager._last_triggered = {item.uid: datetime.now()}  # Just triggered

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)
        assert item.due is None  # NOT set because cooldown

    def test_non_matching_condition_no_signal(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle", on_match="boost"),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "running"  # Doesn't match
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("sensor.washer", new_state)
        mock_send.assert_not_called()

    def test_attribute_trigger(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="AC Check")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="climate.living_room", attribute="current_temperature",
                operator="gte", value="25", on_match="boost",
            ),
        ]
        yl = make_list([item])
        manager = self._make_manager(mock_hass_for_reactivity, mock_store, lambda: [yl])

        new_state = MagicMock()
        new_state.state = "cool"
        new_state.attributes = {"current_temperature": 27.5}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("climate.living_room", new_state)
        mock_send.assert_called_once()
