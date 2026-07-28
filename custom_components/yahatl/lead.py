"""Derived lead-time logic for yahatl.

Works out, from an item's *own* attributes, how many days before its due date it
should start surfacing in the queue — so a yearly task gets a long run-up while a
weekly chore appears only just in time.

This is a **derived** property: it is evaluated live in the blocker resolver and
never persisted, so it survives recurrence regeneration with zero completion-time
bookkeeping (unlike deferral, which is wiped on every completion).

Scope:
- Any item with a `due` gets an automatic lead. Recurring items scale their
  run-up from the repeat period (a yearly task is seen weeks out, a weekly chore
  only just in time); one-off dated tasks have no period, so they use a flat base
  (`_ONEOFF_LEAD_DAYS`). Both are then shifted by the same kind-of-task factors.
- Undated items are unaffected (they are the always-visible backlog).
- `lead_override_days` on the item short-circuits the formula entirely.

Phase 2 (learning): `compute_lead_days()` is the single seam. A per-item
`lead_factor` (nudged from completion_history: late/missed -> earlier, surfaced-
but-ignored -> later) will multiply the base right where the comment marks it.
"""
from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from homeassistant.util import dt as dt_util

if TYPE_CHECKING:
    from .models import RecurrenceConfig, YahtlItem

_UNIT_DAYS = {"days": 1, "weeks": 7, "months": 30, "years": 365}

# Formula tuning — named so the shape is easy to reason about and adjust.
_LEAD_COEFF = 0.9        # base = _LEAD_COEFF * period_days ** _LEAD_EXP
_LEAD_EXP = 0.6          # sub-linear: a yearly task needs more run-up than a weekly one, not 52x
_LEAD_MIN_DAYS = 1
_LEAD_MAX_DAYS = 45
_ONEOFF_LEAD_DAYS = 14   # flat base run-up for a one-off dated task (no period to scale from)

# Kind-of-task multipliers. Highest matching trait wins.
_TRAIT_FACTORS = {
    "chore": 0.7,        # quick, do-it-now — surface late
    "errand": 1.3,       # depends on shops / opening hours — needs runway
    "admin": 1.4,        # paperwork, often blocks on other things
}
_PRIORITY_FACTORS = {"high": 1.4, "medium": 1.0, "low": 0.8}


def recurrence_period_days(recurrence: RecurrenceConfig | None) -> int | None:
    """Canonical repeat period in days, or None if not usefully recurring."""
    if recurrence is None:
        return None
    if recurrence.type == "elapsed":
        interval = recurrence.elapsed_interval or 1
        unit = recurrence.elapsed_unit or "days"
        return interval * _UNIT_DAYS.get(unit, 1)
    if recurrence.type == "calendar":
        preset = (recurrence.calendar_preset or "").lower()
        if preset in ("daily", "weekdays", "weekends"):
            return 1
        if recurrence.calendar_days:
            return 7
        if recurrence.calendar_days_of_month:
            return 30
        return None
    if recurrence.type == "frequency":
        period = recurrence.frequency_period or 30
        unit = recurrence.frequency_unit or "days"
        return period * _UNIT_DAYS.get(unit, 1)
    return None


def compute_lead_days(item: YahtlItem) -> int:
    """How many days before its due an item should start surfacing.

    Returns 0 when there's nothing to base a lead on (undated item and no
    override), i.e. the item just surfaces normally.
    """
    if item.lead_override_days is not None:
        return max(0, item.lead_override_days)

    period = recurrence_period_days(item.recurrence)
    if period:
        # Recurring: scale the run-up from the repeat period, and never lead by
        # the whole period (it must hide for at least a day).
        base = _LEAD_COEFF * (period ** _LEAD_EXP)
        ceiling = min(_LEAD_MAX_DAYS, max(_LEAD_MIN_DAYS, period - 1))
    elif item.due is not None:
        # One-off dated task: no period to scale from — flat base run-up, capped.
        base = float(_ONEOFF_LEAD_DAYS)
        ceiling = _LEAD_MAX_DAYS
    else:
        return 0

    # Longer jobs need to be seen sooner: +~0.5 day per hour of estimate.
    estimate_factor = 1.0
    if item.time_estimate:
        estimate_factor += item.time_estimate / 120.0

    # Highest matching trait factor wins (default 1.0 if none match).
    trait_factor = max(
        (_TRAIT_FACTORS[t] for t in item.traits if t in _TRAIT_FACTORS),
        default=1.0,
    )
    priority_factor = _PRIORITY_FACTORS.get(item.priority or "medium", 1.0)

    # Requirements that narrow the actionable window (need a place / other people)
    # mean fewer chances to act — surface a bit earlier.
    requirement_factor = 1.0
    if item.requirements and (item.requirements.location or item.requirements.people):
        requirement_factor = 1.2

    lead = base * estimate_factor * trait_factor * priority_factor * requirement_factor
    # Phase 2 seam:  lead *= getattr(item, "lead_factor", 1.0)

    return int(max(_LEAD_MIN_DAYS, min(round(lead), ceiling)))


def lead_block_reason(item: YahtlItem) -> str | None:
    """If the item shouldn't surface yet (still before its lead window), the reason; else None."""
    if not item.due:
        return None
    lead = compute_lead_days(item)
    if lead <= 0:
        return None
    surface_at = item.due - timedelta(days=lead)
    if dt_util.now() < surface_at:
        return f"surfaces {surface_at.strftime('%Y-%m-%d')} ({lead}d before due)"
    return None
