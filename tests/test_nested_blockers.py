"""Additional tests for nested blocker modes."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.blockers import is_item_blocked
from custom_components.yahatl.models import (
    BlockerConfig,
    YahtlItem,
    YahtlList,
)


class TestNestedBlockerModes:
    """Test the new nested blocker mode system."""

    @pytest.mark.asyncio
    async def test_item_mode_any_blocks_when_any_incomplete(self, mock_hass):
        """Test item_mode=ANY blocks if any item is incomplete."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "completed"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"  # This one blocks

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker1.uid, blocker2.uid],
            item_mode="ANY",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        assert is_blocked is True
        assert "Blocker 2" in str(reasons)

    @pytest.mark.asyncio
    async def test_item_mode_all_blocks_when_all_incomplete(self, mock_hass):
        """Test item_mode=ALL blocks only if ALL items are incomplete."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "pending"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker1.uid, blocker2.uid],
            item_mode="ALL",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Both incomplete, so should be blocked
        assert is_blocked is True
        assert "Blocker 1" in str(reasons)
        assert "Blocker 2" in str(reasons)

    @pytest.mark.asyncio
    async def test_item_mode_all_does_not_block_when_one_complete(self, mock_hass):
        """Test item_mode=ALL doesn't block if one item is complete."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "completed"  # This one complete

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker1.uid, blocker2.uid],
            item_mode="ALL",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # One complete, so NOT blocked in ALL mode
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_sensor_mode_any_blocks_when_any_on(self, mock_hass, mock_sensor_state):
        """Test sensor_mode=ANY blocks if any sensor is on."""

        def get_state(entity_id):
            if entity_id == "binary_sensor.test1":
                return mock_sensor_state("binary_sensor.test1", "off")
            elif entity_id == "binary_sensor.test2":
                return mock_sensor_state("binary_sensor.test2", "on")  # This one blocks
            return None

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test1", "binary_sensor.test2"],
            sensor_mode="ANY",
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
        assert "test2" in str(reasons)

    @pytest.mark.asyncio
    async def test_sensor_mode_all_blocks_when_all_on(self, mock_hass, mock_sensor_state):
        """Test sensor_mode=ALL blocks only if ALL sensors are on."""

        def get_state(entity_id):
            if entity_id == "binary_sensor.test1":
                return mock_sensor_state("binary_sensor.test1", "on")
            elif entity_id == "binary_sensor.test2":
                return mock_sensor_state("binary_sensor.test2", "on")
            return None

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test1", "binary_sensor.test2"],
            sensor_mode="ALL",
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        # Both on, so should be blocked
        assert is_blocked is True
        assert "test1" in str(reasons)
        assert "test2" in str(reasons)

    @pytest.mark.asyncio
    async def test_sensor_mode_all_does_not_block_when_one_off(self, mock_hass, mock_sensor_state):
        """Test sensor_mode=ALL doesn't block if one sensor is off."""

        def get_state(entity_id):
            if entity_id == "binary_sensor.test1":
                return mock_sensor_state("binary_sensor.test1", "on")
            elif entity_id == "binary_sensor.test2":
                return mock_sensor_state("binary_sensor.test2", "off")  # This one off
            return None

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test1", "binary_sensor.test2"],
            sensor_mode="ALL",
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        # One off, so NOT blocked in ALL mode
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_mode_all_requires_both_categories(self, mock_hass, mock_sensor_state):
        """Test mode=ALL requires both items and sensors to block."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"  # Items would block

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")  # Sensors would block
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",  # Both categories must block
            items=[blocker_item.uid],
            item_mode="ANY",
            sensors=["binary_sensor.test"],
            sensor_mode="ANY",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Both categories blocking, so should be blocked
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_mode_all_does_not_block_when_only_items(self, mock_hass, mock_sensor_state):
        """Test mode=ALL doesn't block if only items are blocking."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"  # Items would block

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "off")  # Sensors would NOT block
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",  # Both categories must block
            items=[blocker_item.uid],
            item_mode="ANY",
            sensors=["binary_sensor.test"],
            sensor_mode="ANY",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Only items blocking, so NOT blocked in ALL mode
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_mode_any_blocks_when_either_category(self, mock_hass, mock_sensor_state):
        """Test mode=ANY blocks if either category blocks."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "completed"  # Items would NOT block

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")  # Sensors would block
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",  # Either category can block
            items=[blocker_item.uid],
            item_mode="ANY",
            sensors=["binary_sensor.test"],
            sensor_mode="ANY",
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Sensors blocking, so should be blocked even though items are not
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_complex_scenario_all_all_all(self, mock_hass, mock_sensor_state):
        """Test complex: mode=ALL, item_mode=ALL, sensor_mode=ALL."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "pending"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"

        def get_state(entity_id):
            # All sensors on
            return mock_sensor_state(entity_id, "on")

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",  # Both categories must block
            items=[blocker1.uid, blocker2.uid],
            item_mode="ALL",  # All items must be incomplete
            sensors=["binary_sensor.s1", "binary_sensor.s2"],
            sensor_mode="ALL",  # All sensors must be on
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # All items incomplete AND all sensors on, so blocked
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_complex_scenario_any_any_all(self, mock_hass, mock_sensor_state):
        """Test complex: mode=ANY, item_mode=ANY, sensor_mode=ALL."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "completed"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "completed"

        def get_state(entity_id):
            # All sensors on
            return mock_sensor_state(entity_id, "on")

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",  # Either category can block
            items=[blocker1.uid, blocker2.uid],
            item_mode="ANY",  # Any item incomplete would block
            sensors=["binary_sensor.s1", "binary_sensor.s2"],
            sensor_mode="ALL",  # All sensors must be on
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Items not blocking (all complete), but sensors blocking (all on)
        # mode=ANY means either category can block, so should be blocked
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_backward_compatibility_defaults(self, mock_hass):
        """Test that old configs work with default modes."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"

        # Old-style config without item_mode/sensor_mode (should default to ANY)
        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
            # item_mode and sensor_mode will default to ANY
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should work as before (item incomplete blocks)
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_three_items_item_mode_all(self, mock_hass):
        """Test item_mode=ALL with three blockers."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "pending"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"

        blocker3 = YahtlItem.create(title="Blocker 3")
        blocker3.status = "completed"  # One complete

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker1.uid, blocker2.uid, blocker3.uid],
            item_mode="ALL",  # All must be incomplete
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)
        yahatl_list.add_item(blocker3)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # One complete, so NOT all incomplete, so NOT blocked
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_three_sensors_sensor_mode_all(self, mock_hass, mock_sensor_state):
        """Test sensor_mode=ALL with three sensors."""

        def get_state(entity_id):
            if entity_id == "binary_sensor.s1":
                return mock_sensor_state(entity_id, "on")
            elif entity_id == "binary_sensor.s2":
                return mock_sensor_state(entity_id, "on")
            elif entity_id == "binary_sensor.s3":
                return mock_sensor_state(entity_id, "off")  # One off
            return None

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.s1", "binary_sensor.s2", "binary_sensor.s3"],
            sensor_mode="ALL",  # All must be on
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        # One off, so NOT all on, so NOT blocked
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_serialization_with_nested_modes(self, mock_hass):
        """Test that nested modes serialize and deserialize correctly."""
        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",
            items=["item1", "item2"],
            item_mode="ALL",
            sensors=["sensor1"],
            sensor_mode="ANY",
        )

        # Serialize
        data = item.to_dict()

        # Deserialize
        restored = YahtlItem.from_dict(data)

        # Check all modes preserved
        assert restored.blockers.mode == "ALL"
        assert restored.blockers.item_mode == "ALL"
        assert restored.blockers.sensor_mode == "ANY"
        assert restored.blockers.items == ["item1", "item2"]
        assert restored.blockers.sensors == ["sensor1"]
