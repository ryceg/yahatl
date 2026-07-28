"""Unified item-completion logic for yahatl.

Every completion path — the ``complete_item`` service, the websocket
``item_complete`` command, and the native todo card / Assist (todo.py) —
funnels through :func:`complete_item` so completion history, streaks,
recurrence regeneration and the ``yahatl_item_completed`` event behave
identically regardless of entry point.
"""
from __future__ import annotations

import logging
from datetime import datetime

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import (
    COMPLETION_HISTORY_CAP,
    DOMAIN,
    STATUS_COMPLETED,
    STATUS_PENDING,
    TRAIT_HABIT,
)
from .models import CompletionRecord, YahtlItem, YahtlList, parse_stored_datetime
from .recurrence import calculate_next_due, calculate_streak

_LOGGER = logging.getLogger(__name__)


def complete_item(
    hass: HomeAssistant,
    list_data: YahtlList,
    item: YahtlItem,
    *,
    user_id: str = "",
    entity_id: str | None = None,
) -> None:
    """Mark an item completed: history, streak, recurrence, completion event.

    Mutates the item in place; the caller is responsible for persisting the
    list and refreshing its coordinator afterwards.
    """
    now = dt_util.now()

    item.status = STATUS_COMPLETED
    item.deferred_until = None
    item.last_completed = now

    record = CompletionRecord(user_id=user_id, timestamp=now)
    item.completion_history.append(record)

    # Cap history
    if len(item.completion_history) > COMPLETION_HISTORY_CAP:
        item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

    # Update streak if habit
    if TRAIT_HABIT in item.traits:
        item.current_streak = calculate_streak(item)

    # Handle recurrence
    if item.recurrence:
        if item.recurrence.type == "frequency":
            # Frequency goals have no "next due"; reset to pending so the
            # queue keeps tracking progress toward the window's target (the
            # queue hides them while the target is already met).
            item.status = STATUS_PENDING
        else:
            # calendar / elapsed: regenerate the next occurrence.
            prev_due = item.due
            next_due = calculate_next_due(item, now)
            if next_due:
                if prev_due is not None:
                    # Carry the previous due's LOCAL time-of-day onto the next
                    # occurrence so a daily 08:00 task stays 08:00 no matter
                    # when it was completed, and across DST shifts.
                    prev_local = dt_util.as_local(prev_due)
                    next_due = dt_util.as_local(next_due).replace(
                        hour=prev_local.hour,
                        minute=prev_local.minute,
                        second=prev_local.second,
                        microsecond=prev_local.microsecond,
                    )
                item.status = STATUS_PENDING
                item.due = next_due

    # Fire completion event
    hass.bus.async_fire(
        f"{DOMAIN}_item_completed",
        {
            "entity_id": entity_id,
            "item_id": item.uid,
            "item_title": item.title,
            "user_id": user_id,
        },
    )


def uncomplete_item(
    hass: HomeAssistant,
    list_data: YahtlList,
    item: YahtlItem,
    *,
    prior_status: str = STATUS_PENDING,
    prior_due: datetime | str | None = None,
    prior_deferred_until: datetime | str | None = None,
    user_id: str = "",
    entity_id: str | None = None,
) -> None:
    """Undo the most recent completion of an item.

    Intended for the frontend undo snackbar right after a completion: pops
    the most recent completion record, rewinds last_completed / streak, and
    restores the item's pre-completion status/due/deferral from the ``prior_*``
    values the caller captured before completing (recurrence regeneration may
    have overwritten them). ISO strings are accepted and parsed tz-aware.

    Mutates the item in place; the caller is responsible for persisting the
    list and refreshing its coordinator afterwards.
    """
    if item.completion_history:
        item.completion_history.pop()

    item.last_completed = (
        item.completion_history[-1].timestamp if item.completion_history else None
    )

    if TRAIT_HABIT in item.traits:
        item.current_streak = calculate_streak(item)

    if isinstance(prior_due, str):
        prior_due = parse_stored_datetime(prior_due)
    if isinstance(prior_deferred_until, str):
        prior_deferred_until = parse_stored_datetime(prior_deferred_until)

    item.status = prior_status or STATUS_PENDING
    item.due = prior_due
    item.deferred_until = prior_deferred_until

    hass.bus.async_fire(
        f"{DOMAIN}_item_uncompleted",
        {
            "uid": item.uid,
            "title": item.title,
            "entity_id": entity_id,
            "list_name": list_data.name if list_data is not None else None,
            "user_id": user_id,
        },
    )
