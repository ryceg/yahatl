"""Queue algorithm for yahatl - priority task sorting based on context."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

from .blockers import BlockerResolver, check_requirements_met
from .recurrence import is_streak_at_risk, get_frequency_progress

from .models import YahtlList

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from .models import YahtlItem

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class QueueResult:
    """Immutable result of queue generation."""

    items: list[dict[str, Any]]
    context: dict[str, Any]
    overdue_count: int
    due_today_count: int
    blocked_count: int
    next_task_title: str | None
    total_actionable: int
    generated_at: datetime



async def _calculate_score(
    hass: HomeAssistant,
    item: YahtlItem,
    current_context: dict[str, Any],
) -> int:
    """Calculate priority score for an item.

    Scoring weights:
    - Overdue: +100
    - Due today: +50
    - Due this week: +20
    - Frequency threshold: +30/60/90 (medium/high/critical)
    - Habit streak at risk: +40
    - Explicit priority: +10/25/50 (low/medium/high)
    - Recently unblocked: +15
    - Context match quality: +10
    """
    score = 0
    now = datetime.now()

    # Due date scoring
    if item.due:
        time_until_due = item.due - now

        if time_until_due.total_seconds() < 0:
            # Overdue
            score += 100
        elif time_until_due.total_seconds() < 86400:  # 24 hours
            # Due today
            score += 50
        elif time_until_due.total_seconds() < 604800:  # 7 days
            # Due this week
            score += 20

    # Frequency threshold scoring
    if item.recurrence and item.recurrence.type == "frequency":
        progress = get_frequency_progress(item)
        threshold_priority = progress.get("threshold_priority")

        if threshold_priority == "critical":
            score += 90
        elif threshold_priority == "high":
            score += 60
        elif threshold_priority == "medium":
            score += 30

    # Habit streak at risk
    if "habit" in item.traits and is_streak_at_risk(item):
        score += 40

    # Explicit priority
    priority = item.priority if hasattr(item, "priority") else None
    if priority == "high":
        score += 50
    elif priority == "medium":
        score += 25
    elif priority == "low":
        score += 10

    # Recently unblocked (if unblocked in last 24 hours)
    # This would require tracking when items became unblocked
    # For now, we'll skip this feature

    # Context match quality
    if item.requirements:
        mode = item.requirements.mode

        # If ALL requirements met (for ALL mode), give bonus
        if mode == "ALL":
            # They already passed requirements check, so they match
            score += 10
        # If ANY mode and they match multiple requirements, give bonus
        elif mode == "ANY":
            # Check how many requirements are matched
            matches = 0
            if item.requirements.location and current_context.get("location") in item.requirements.location:
                matches += 1
            if item.requirements.people:
                current_people = current_context.get("people", [])
                if any(person in item.requirements.people for person in current_people):
                    matches += 1
            if item.requirements.time_constraints and current_context.get("time_constraint") in item.requirements.time_constraints:
                matches += 1
            if item.requirements.context:
                current_contexts = current_context.get("contexts", [])
                if any(ctx in item.requirements.context for ctx in current_contexts):
                    matches += 1

            # Bonus for matching multiple requirements
            if matches > 1:
                score += 10

    # Condition trigger scoring — if any trigger condition is currently met, boost
    if item.condition_triggers:
        from .conditions import evaluate_condition
        for trigger in item.condition_triggers:
            state = hass.states.get(trigger.entity_id)
            if state is not None:
                actual = state.state
                if trigger.attribute:
                    actual = str(state.attributes.get(trigger.attribute, ""))
                if evaluate_condition(actual, trigger.operator, trigger.value):
                    score += 75  # Strong boost — condition is active right now
                    break  # One active trigger is enough

    return score


def get_current_context_from_hass(hass: HomeAssistant) -> dict[str, Any]:
    """Extract current context from Home Assistant state.

    This is a helper that can read from various HA entities to determine:
    - Location (from device trackers, zones)
    - People present (from person entities)
    - Time constraints (computed from current time)
    - Available contexts (could be sensors or input_selects)

    Returns:
        Context dictionary
    """
    context = {
        "location": "home",  # Default
        "people": [],
        "time_constraint": _get_time_constraint(),
        "contexts": [],
    }

    # Check for person entities to see who's home
    for state in hass.states.async_all("person"):
        if state.state == "home":
            # Use friendly name or entity_id
            person_name = state.attributes.get("friendly_name", state.entity_id)
            context["people"].append(person_name)

    # Could extend with more sophisticated location detection
    # For now, just check if anyone is home
    if not context["people"]:
        context["location"] = "away"

    return context


def _get_time_constraint() -> str:
    """Get current time constraint based on time of day and day of week."""
    now = datetime.now()

    # Check if weekend
    if now.weekday() >= 5:  # Saturday = 5, Sunday = 6
        return "weekend"

    # Check time of day
    hour = now.hour

    if 6 <= hour < 9:
        return "morning"
    elif 9 <= hour < 17:
        return "business_hours"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


class QueueEngine:
    """Single entry point for queue generation."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass

    async def generate(
        self,
        all_lists: list[YahtlList],
        *,
        context: dict[str, Any] | None = None,
        available_time: int | None = None,
    ) -> QueueResult:
        """Generate prioritized queue with aggregates in a single pass."""
        if context is None:
            context = get_current_context_from_hass(self._hass)
        if "time_constraint" not in context:
            context["time_constraint"] = _get_time_constraint()

        resolver = BlockerResolver(self._hass, all_lists)
        now = datetime.now()
        candidates: list[dict[str, Any]] = []
        blocked_count = 0
        overdue_count = 0
        due_today_count = 0

        for yahatl_list in all_lists:
            for item in yahatl_list.items:
                if "actionable" not in item.traits:
                    continue
                if item.status in ["completed", "missed"]:
                    continue
                if available_time and item.time_estimate and item.time_estimate > available_time:
                    continue
                if item.deferred_until and now < item.deferred_until:
                    continue

                if item.due:
                    if item.due < now:
                        overdue_count += 1
                    elif item.due.date() == now.date():
                        due_today_count += 1

                result = resolver.resolve(item)
                if result:
                    blocked_count += 1
                    continue

                requirements_met, _ = await check_requirements_met(
                    self._hass, item, context
                )
                if not requirements_met:
                    continue

                score = await _calculate_score(self._hass, item, context)
                candidates.append({
                    "item": item.to_dict(),
                    "list_id": yahatl_list.list_id,
                    "list_name": yahatl_list.name,
                    "score": score,
                })

        candidates.sort(
            key=lambda x: (
                -x["score"],
                x["item"].get("due") or "9999-12-31",
                x["item"].get("created_at") or "9999-12-31",
            )
        )

        return QueueResult(
            items=candidates,
            context=context,
            overdue_count=overdue_count,
            due_today_count=due_today_count,
            blocked_count=blocked_count,
            next_task_title=candidates[0]["item"]["title"] if candidates else None,
            total_actionable=len(candidates),
            generated_at=now,
        )
