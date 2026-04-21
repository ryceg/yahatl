"""Blocker checking logic for yahatl."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

from .models import BlockerConfig, YahtlItem, YahtlList


@dataclass(frozen=True)
class BlockResult:
    """Immutable result of a blocker check."""

    blocked: bool
    reasons: list[str]

    def __bool__(self) -> bool:
        return self.blocked


class BlockerResolver:
    """Single entry point for all blocker resolution."""

    def __init__(
        self,
        hass: HomeAssistant | None,
        all_lists: list[YahtlList],
    ) -> None:
        self._hass = hass
        self._all_lists = all_lists
        self._uid_index: dict[str, YahtlItem] = {}
        for yl in all_lists:
            for item in yl.items:
                self._uid_index[item.uid] = item

    def resolve_sync(self, item: YahtlItem) -> BlockResult:
        """Sync-safe subset: deferral + time windows + item dependencies only."""
        if item.deferred_until and datetime.now() < item.deferred_until:
            return BlockResult(
                blocked=True,
                reasons=[f"deferred until {item.deferred_until.strftime('%Y-%m-%d %H:%M')}"],
            )
        time_blocked, time_reasons = is_time_blocked(item)
        if time_blocked:
            return BlockResult(blocked=True, reasons=time_reasons)
        if item.blockers and item.blockers.items:
            item_blocked, item_reasons = self._check_item_blockers(item.blockers)
            if item_blocked:
                return BlockResult(blocked=True, reasons=item_reasons)
        return BlockResult(blocked=False, reasons=[])

    def _check_item_blockers(self, blockers: BlockerConfig) -> tuple[bool, list[str]]:
        """Check item dependency blockers using UID index."""
        incomplete = []
        for uid in blockers.items:
            dep = self._uid_index.get(uid)
            if dep and dep.status != "completed":
                incomplete.append(f"Item '{dep.title}' not completed")
        if blockers.item_mode == "ANY":
            return bool(incomplete), incomplete
        else:  # ALL
            all_incomplete = len(incomplete) == len(blockers.items)
            return all_incomplete, incomplete if all_incomplete else []

    def resolve(self, item: YahtlItem) -> BlockResult:
        """Full resolution: deferral + time windows + item deps + sensor states. Sync."""
        if item.deferred_until and datetime.now() < item.deferred_until:
            return BlockResult(
                blocked=True,
                reasons=[f"deferred until {item.deferred_until.strftime('%Y-%m-%d %H:%M')}"],
            )
        time_blocked, time_reasons = is_time_blocked(item)
        if time_blocked:
            return BlockResult(blocked=True, reasons=time_reasons)
        if not item.blockers:
            return BlockResult(blocked=False, reasons=[])

        blockers = item.blockers
        reasons: list[str] = []

        item_category_blocks = False
        if blockers.items:
            item_category_blocks, item_reasons = self._check_item_blockers(blockers)
            reasons.extend(item_reasons)

        sensor_category_blocks = False
        if blockers.sensors and self._hass is not None:
            sensor_category_blocks, sensor_reasons = self._check_sensor_blockers(blockers)
            reasons.extend(sensor_reasons)

        has_items = bool(blockers.items)
        has_sensors = bool(blockers.sensors) and self._hass is not None

        if blockers.mode == "ALL":
            if has_items and has_sensors:
                is_blocked = item_category_blocks and sensor_category_blocks
            elif has_items:
                is_blocked = item_category_blocks
            elif has_sensors:
                is_blocked = sensor_category_blocks
            else:
                is_blocked = False
        else:  # ANY
            is_blocked = item_category_blocks or sensor_category_blocks

        if not is_blocked:
            reasons = []
        return BlockResult(blocked=is_blocked, reasons=reasons)

    def _check_sensor_blockers(self, blockers: BlockerConfig) -> tuple[bool, list[str]]:
        """Check sensor state blockers via hass.states.get()."""
        sensors_on: list[str] = []
        for sensor_id in blockers.sensors:
            state = self._hass.states.get(sensor_id)
            if state and state.state == "on":
                sensors_on.append(f"Sensor {sensor_id} is on")
        if blockers.sensor_mode == "ANY":
            return bool(sensors_on), sensors_on
        else:  # ALL
            all_on = len(sensors_on) == len(blockers.sensors)
            return all_on, sensors_on if all_on else []


_LOGGER = logging.getLogger(__name__)


def _now_time() -> tuple[time, int]:
    """Return (current_time, weekday). Extracted for test patching."""
    now = datetime.now()
    return now.time(), now.weekday()


async def is_item_blocked(
    hass: HomeAssistant,
    item: YahtlItem,
    all_lists: list[YahtlList] | None = None,
) -> tuple[bool, list[str]]:
    """Check if an item is blocked.

    .. deprecated:: Use BlockerResolver.resolve() instead.
    """
    resolver = BlockerResolver(hass, all_lists or [])
    result = resolver.resolve(item)
    return result.blocked, result.reasons


def is_time_blocked(item: YahtlItem) -> tuple[bool, list[str]]:
    """Check if an item is blocked by time-based rules.

    Each TimeBlockerConfig defines a time window and a mode:
    - suppress: blocked when current time IS inside the window
    - allow: blocked when current time IS NOT inside the window

    Overnight windows are supported (e.g. 22:00-06:00).
    If days is set, the blocker only applies on those weekdays (0=Mon, 6=Sun).

    Returns:
        Tuple of (is_blocked, list of reasons)
    """
    if not item.time_blockers:
        return False, []

    now_t, weekday = _now_time()

    for tb in item.time_blockers:
        # Skip if day doesn't match
        if tb.days is not None and weekday not in tb.days:
            continue

        start = time.fromisoformat(tb.start_time)
        end = time.fromisoformat(tb.end_time)

        # Determine if current time is inside the window
        if start <= end:
            in_window = start <= now_t < end
        else:
            # Overnight wrap: 22:00-06:00 means >= 22:00 OR < 06:00
            in_window = now_t >= start or now_t < end

        if tb.mode == "suppress" and in_window:
            return True, [f"suppressed during {tb.start_time}-{tb.end_time}"]
        if tb.mode == "allow" and not in_window:
            return True, [f"only allowed during {tb.start_time}-{tb.end_time}"]

    return False, []


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
