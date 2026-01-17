"""Tests for blocker and requirements checking logic."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.blockers import check_requirements_met, is_item_blocked
from custom_components.yahatl.models import (
    BlockerConfig,
    RequirementsConfig,
    YahtlItem,
    YahtlList,
)


class TestIsItemBlocked:
    """Test is_item_blocked function."""

    @pytest.mark.asyncio
    async def test_no_blockers(self, mock_hass):
        """Test item with no blockers is not blocked."""
        item = YahtlItem.create(title="Task")

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_item_blocker_not_completed(self, mock_hass):
        """Test item blocked by incomplete task."""
        blocker_item = YahtlItem.create(title="Blocker Task")
        blocker_item.status = "pending"

        item = YahtlItem.create(title="Blocked Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)
        yahatl_list.add_item(item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        assert is_blocked is True
        assert len(reasons) > 0
        assert "not completed" in reasons[0].lower()

    @pytest.mark.asyncio
    async def test_item_blocker_completed(self, mock_hass):
        """Test item not blocked when blocker task is completed."""
        blocker_item = YahtlItem.create(title="Blocker Task")
        blocker_item.status = "completed"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)
        yahatl_list.add_item(item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        assert is_blocked is False
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_sensor_blocker_on(self, mock_hass, mock_sensor_state):
        """Test item blocked when sensor is on."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test"],
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
        assert len(reasons) > 0

    @pytest.mark.asyncio
    async def test_sensor_blocker_off(self, mock_hass, mock_sensor_state):
        """Test item not blocked when sensor is off."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "off")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.test"],
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_sensor_blocker_not_found(self, mock_hass):
        """Test item not blocked when sensor doesn't exist."""
        mock_hass.states.get = MagicMock(return_value=None)

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            sensors=["binary_sensor.nonexistent"],
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_blocker_mode_any_one_active(self, mock_hass, mock_sensor_state):
        """Test ANY mode with one blocker active."""
        # Item blocker completed, but sensor blocker active
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "completed"

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
            sensors=["binary_sensor.test"],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should be blocked because sensor is on (ANY mode)
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_blocker_mode_any_none_active(self, mock_hass, mock_sensor_state):
        """Test ANY mode with no blockers active."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "completed"

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "off")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
            sensors=["binary_sensor.test"],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_blocker_mode_all_both_active(self, mock_hass, mock_sensor_state):
        """Test ALL mode with both blockers active."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",
            items=[blocker_item.uid],
            sensors=["binary_sensor.test"],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should be blocked because both are active (ALL mode)
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_blocker_mode_all_one_active(self, mock_hass, mock_sensor_state):
        """Test ALL mode with only one blocker active."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "completed"  # Not blocking

        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")  # Blocking
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",
            items=[blocker_item.uid],
            sensors=["binary_sensor.test"],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should NOT be blocked because only one is active (ALL mode requires all)
        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_blocker_mode_all_only_items(self, mock_hass):
        """Test ALL mode with only item blockers."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",
            items=[blocker_item.uid],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker_item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_blocker_mode_all_only_sensors(self, mock_hass, mock_sensor_state):
        """Test ALL mode with only sensor blockers."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")
        )

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ALL",
            sensors=["binary_sensor.test"],
        )

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_multiple_item_blockers(self, mock_hass):
        """Test multiple item blockers."""
        blocker1 = YahtlItem.create(title="Blocker 1")
        blocker1.status = "completed"

        blocker2 = YahtlItem.create(title="Blocker 2")
        blocker2.status = "pending"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker1.uid, blocker2.uid],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(blocker1)
        yahatl_list.add_item(blocker2)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should be blocked because blocker2 is pending
        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_blocker_across_multiple_lists(self, mock_hass):
        """Test blocker item in different list."""
        blocker_item = YahtlItem.create(title="Blocker")
        blocker_item.status = "pending"

        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=[blocker_item.uid],
        )

        list1 = YahtlList(list_id="list1", name="List 1")
        list1.add_item(blocker_item)

        list2 = YahtlList(list_id="list2", name="List 2")
        list2.add_item(item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [list1, list2])

        assert is_blocked is True

    @pytest.mark.asyncio
    async def test_blocker_item_not_found(self, mock_hass):
        """Test blocker item that doesn't exist."""
        item = YahtlItem.create(title="Task")
        item.blockers = BlockerConfig(
            mode="ANY",
            items=["nonexistent-uid"],
        )

        yahatl_list = YahtlList(list_id="test", name="Test")
        yahatl_list.add_item(item)

        is_blocked, reasons = await is_item_blocked(mock_hass, item, [yahatl_list])

        # Should not be blocked if blocker not found
        assert is_blocked is False


class TestCheckRequirementsMet:
    """Test check_requirements_met function."""

    @pytest.mark.asyncio
    async def test_no_requirements(self, mock_hass):
        """Test item with no requirements."""
        item = YahtlItem.create(title="Task")

        met, reasons = await check_requirements_met(mock_hass, item)

        assert met is True
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_location_requirement_met(self, mock_hass):
        """Test location requirement met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["home", "office"],
        )

        context = {"location": "home"}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is True
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_location_requirement_not_met(self, mock_hass):
        """Test location requirement not met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["home"],
        )

        context = {"location": "office"}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is False
        assert len(reasons) > 0

    @pytest.mark.asyncio
    async def test_people_requirement_met(self, mock_hass):
        """Test people requirement met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            people=["John", "Jane"],
        )

        context = {"people": ["John", "Bob"]}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        # John is present, so requirement met
        assert met is True

    @pytest.mark.asyncio
    async def test_people_requirement_not_met(self, mock_hass):
        """Test people requirement not met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            people=["John", "Jane"],
        )

        context = {"people": ["Bob", "Alice"]}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is False

    @pytest.mark.asyncio
    async def test_time_constraint_met(self, mock_hass):
        """Test time constraint requirement met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            time_constraints=["weekend", "evening"],
        )

        context = {"time_constraint": "weekend"}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is True

    @pytest.mark.asyncio
    async def test_context_requirement_met(self, mock_hass):
        """Test context requirement met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            context=["computer", "phone"],
        )

        context = {"contexts": ["computer", "desk"]}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is True

    @pytest.mark.asyncio
    async def test_sensor_requirement_met(self, mock_hass, mock_sensor_state):
        """Test sensor requirement met."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.good_weather", "on")
        )

        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            sensors=["binary_sensor.good_weather"],
        )

        met, reasons = await check_requirements_met(mock_hass, item)

        assert met is True

    @pytest.mark.asyncio
    async def test_sensor_requirement_not_met(self, mock_hass, mock_sensor_state):
        """Test sensor requirement not met."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.good_weather", "off")
        )

        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            sensors=["binary_sensor.good_weather"],
        )

        met, reasons = await check_requirements_met(mock_hass, item)

        assert met is False

    @pytest.mark.asyncio
    async def test_requirements_mode_all_all_met(self, mock_hass, mock_sensor_state):
        """Test ALL mode with all requirements met."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "on")
        )

        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ALL",
            location=["home"],
            people=["John"],
            sensors=["binary_sensor.test"],
        )

        context = {
            "location": "home",
            "people": ["John", "Jane"],
        }

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is True
        assert len(reasons) == 0

    @pytest.mark.asyncio
    async def test_requirements_mode_all_one_not_met(self, mock_hass, mock_sensor_state):
        """Test ALL mode with one requirement not met."""
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.test", "off")
        )

        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ALL",
            location=["home"],
            sensors=["binary_sensor.test"],
        )

        context = {"location": "home"}

        met, reasons = await check_requirements_met(mock_hass, item, context)

        # Sensor is off, so not all requirements met
        assert met is False

    @pytest.mark.asyncio
    async def test_requirements_mode_any_one_met(self, mock_hass):
        """Test ANY mode with one requirement met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["office"],  # Not met
            people=["John"],  # Met
        )

        context = {
            "location": "home",
            "people": ["John"],
        }

        met, reasons = await check_requirements_met(mock_hass, item, context)

        # People requirement is met, so overall met
        assert met is True

    @pytest.mark.asyncio
    async def test_requirements_mode_any_none_met(self, mock_hass):
        """Test ANY mode with no requirements met."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["office"],
            people=["Jane"],
        )

        context = {
            "location": "home",
            "people": ["John"],
        }

        met, reasons = await check_requirements_met(mock_hass, item, context)

        assert met is False

    @pytest.mark.asyncio
    async def test_empty_context(self, mock_hass):
        """Test with empty context."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["home"],
        )

        met, reasons = await check_requirements_met(mock_hass, item, {})

        assert met is False

    @pytest.mark.asyncio
    async def test_none_context(self, mock_hass):
        """Test with None context."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            location=["home"],
        )

        met, reasons = await check_requirements_met(mock_hass, item, None)

        assert met is False

    @pytest.mark.asyncio
    async def test_multiple_sensors(self, mock_hass):
        """Test multiple sensor requirements."""
        def get_state(entity_id):
            if entity_id == "binary_sensor.weather":
                state = MagicMock()
                state.state = "on"
                return state
            elif entity_id == "binary_sensor.time":
                state = MagicMock()
                state.state = "off"
                return state
            return None

        mock_hass.states.get = get_state

        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(
            mode="ANY",
            sensors=["binary_sensor.weather", "binary_sensor.time"],
        )

        met, reasons = await check_requirements_met(mock_hass, item)

        # Weather sensor is on, so requirement met
        assert met is True

    @pytest.mark.asyncio
    async def test_requirements_any_mode_no_requirements_specified(self, mock_hass):
        """Test ANY mode with no requirements specified."""
        item = YahtlItem.create(title="Task")
        item.requirements = RequirementsConfig(mode="ANY")

        met, reasons = await check_requirements_met(mock_hass, item)

        # No requirements means always met
        assert met is True
