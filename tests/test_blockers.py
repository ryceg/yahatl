"""Tests for requirements checking logic."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.blockers import check_requirements_met
from custom_components.yahatl.models import (
    RequirementsConfig,
    YahtlItem,
)


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
