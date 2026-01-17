"""Blocker checking logic for yahatl."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from .models import YahtlItem, YahtlList

_LOGGER = logging.getLogger(__name__)


async def is_item_blocked(
    hass: HomeAssistant,
    item: YahtlItem,
    all_lists: list[YahtlList] | None = None,
) -> tuple[bool, list[str]]:
    """Check if an item is blocked.

    The blocker logic uses three modes:
    - item_mode: How items relate (ANY=any incomplete blocks, ALL=all must be incomplete)
    - sensor_mode: How sensors relate (ANY=any on blocks, ALL=all must be on)
    - mode: How to combine items and sensors (ANY=either blocks, ALL=both must block)

    Args:
        hass: Home Assistant instance
        item: Item to check
        all_lists: All lists (for checking item blockers)

    Returns:
        Tuple of (is_blocked, list of reasons)
    """
    if not item.blockers:
        return False, []

    blockers = item.blockers
    mode = blockers.mode
    item_mode = blockers.item_mode
    sensor_mode = blockers.sensor_mode
    reasons = []

    # Check item blockers according to item_mode
    item_category_blocks = False
    if blockers.items and all_lists:
        incomplete_items = []
        complete_items = []

        for blocker_uid in blockers.items:
            # Find the blocking item across all lists
            blocker_item = None
            for yahatl_list in all_lists:
                blocker_item = yahatl_list.get_item(blocker_uid)
                if blocker_item:
                    break

            if blocker_item:
                if blocker_item.status != "completed":
                    incomplete_items.append(f"Item '{blocker_item.title}' not completed")
                else:
                    complete_items.append(blocker_item.title)

        # Apply item_mode logic
        if item_mode == "ANY":
            # Blocked if ANY item is incomplete
            if incomplete_items:
                item_category_blocks = True
                reasons.extend(incomplete_items)
        else:  # item_mode == "ALL"
            # Blocked if ALL items are incomplete
            if incomplete_items and len(incomplete_items) == len(blockers.items):
                item_category_blocks = True
                reasons.extend(incomplete_items)
            elif incomplete_items:
                # Some but not all incomplete - not blocking in ALL mode
                reasons.append(f"Not all items incomplete (complete: {', '.join(complete_items)})")

    # Check sensor blockers according to sensor_mode
    sensor_category_blocks = False
    if blockers.sensors:
        sensors_on = []
        sensors_off = []

        for sensor_id in blockers.sensors:
            state = hass.states.get(sensor_id)
            if state and state.state == "on":
                sensors_on.append(f"Sensor {sensor_id} is on")
            else:
                sensors_off.append(sensor_id)

        # Apply sensor_mode logic
        if sensor_mode == "ANY":
            # Blocked if ANY sensor is on
            if sensors_on:
                sensor_category_blocks = True
                reasons.extend(sensors_on)
        else:  # sensor_mode == "ALL"
            # Blocked if ALL sensors are on
            if sensors_on and len(sensors_on) == len(blockers.sensors):
                sensor_category_blocks = True
                reasons.extend(sensors_on)
            elif sensors_on:
                # Some but not all on - not blocking in ALL mode
                reasons.append(f"Not all sensors on (off: {', '.join(sensors_off)})")

    # Apply mode logic to combine item and sensor categories
    has_item_blockers = bool(blockers.items)
    has_sensor_blockers = bool(blockers.sensors)

    if mode == "ALL":
        # Blocked only if ALL categories are blocking
        if has_item_blockers and has_sensor_blockers:
            is_blocked = item_category_blocks and sensor_category_blocks
        elif has_item_blockers:
            is_blocked = item_category_blocks
        elif has_sensor_blockers:
            is_blocked = sensor_category_blocks
        else:
            is_blocked = False
    else:  # mode == "ANY"
        # Blocked if ANY category is blocking
        is_blocked = item_category_blocks or sensor_category_blocks

    # Clean up reasons if not blocked
    if not is_blocked:
        reasons = []

    return is_blocked, reasons


async def check_requirements_met(
    hass: HomeAssistant,
    item: YahtlItem,
    current_context: dict[str, Any] | None = None,
) -> tuple[bool, list[str]]:
    """Check if an item's requirements are met.

    Args:
        hass: Home Assistant instance
        item: Item to check
        current_context: Current context (location, people, time, etc.)

    Returns:
        Tuple of (requirements_met, list of reasons if not met)
    """
    if not item.requirements:
        return True, []

    requirements = item.requirements
    mode = requirements.mode
    current_context = current_context or {}
    reasons = []

    # Check location requirements
    location_met = False
    if requirements.location:
        current_location = current_context.get("location", "")
        if current_location in requirements.location:
            location_met = True
        else:
            reasons.append(f"Location '{current_location}' not in required: {requirements.location}")
    else:
        location_met = True  # No location requirement

    # Check people requirements
    people_met = False
    if requirements.people:
        current_people = current_context.get("people", [])
        if any(person in requirements.people for person in current_people):
            people_met = True
        else:
            reasons.append(f"Required people not present: {requirements.people}")
    else:
        people_met = True  # No people requirement

    # Check time constraints
    time_met = False
    if requirements.time_constraints:
        current_time = current_context.get("time_constraint", "")
        if current_time in requirements.time_constraints:
            time_met = True
        else:
            reasons.append(f"Time constraint not met: needs {requirements.time_constraints}")
    else:
        time_met = True  # No time requirement

    # Check context requirements
    context_met = False
    if requirements.context:
        current_contexts = current_context.get("contexts", [])
        if any(ctx in requirements.context for ctx in current_contexts):
            context_met = True
        else:
            reasons.append(f"Required context not available: {requirements.context}")
    else:
        context_met = True  # No context requirement

    # Check sensor requirements
    sensor_met = False
    if requirements.sensors:
        sensors_on = []
        for sensor_id in requirements.sensors:
            state = hass.states.get(sensor_id)
            if state and state.state == "on":
                sensors_on.append(sensor_id)

        if sensors_on:
            sensor_met = True
        else:
            reasons.append(f"Required sensors not on: {requirements.sensors}")
    else:
        sensor_met = True  # No sensor requirement

    # Apply mode logic
    if mode == "ALL":
        # All requirements must be met
        requirements_met = all([
            location_met,
            people_met,
            time_met,
            context_met,
            sensor_met,
        ])
    else:  # mode == "ANY"
        # At least one requirement must be met
        requirements_met = any([
            location_met and requirements.location,
            people_met and requirements.people,
            time_met and requirements.time_constraints,
            context_met and requirements.context,
            sensor_met and requirements.sensors,
        ])

        # If no requirements were specified, consider it met
        if not any([
            requirements.location,
            requirements.people,
            requirements.time_constraints,
            requirements.context,
            requirements.sensors,
        ]):
            requirements_met = True

    return requirements_met, reasons if not requirements_met else []
