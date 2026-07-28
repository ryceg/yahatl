"""Diagnostics support for yahatl.

Home Assistant discovers this module automatically (no PLATFORMS entry).
This is a self-hosted family instance, so item titles are included — they
are the most useful field when debugging queue/recurrence behaviour.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant

if TYPE_CHECKING:
    from . import YahtlConfigEntry
    from .models import YahtlItem


def _item_summary(item: "YahtlItem") -> dict[str, Any]:
    """One-line-ish view of an item: enough to debug, no full config dump."""
    return {
        "uid": item.uid,
        "title": item.title,
        "status": item.status,
        "traits": item.traits,
        "due": item.due.isoformat() if item.due else None,
        "has_recurrence": item.recurrence is not None,
        "recurrence_type": item.recurrence.type if item.recurrence else None,
        "has_blockers": item.blockers is not None,
        "has_requirements": item.requirements is not None,
        "has_condition_triggers": bool(item.condition_triggers),
        "has_time_blockers": bool(item.time_blockers),
        "deferred_until": item.deferred_until.isoformat() if item.deferred_until else None,
        "assigned_to_count": len(item.assigned_to),
        "completion_count": len(item.completion_history),
        "streak": item.current_streak,
        "last_completed": item.last_completed.isoformat() if item.last_completed else None,
    }


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: "YahtlConfigEntry"
) -> dict[str, Any]:
    """Return diagnostics for a yahatl config entry."""
    diagnostics: dict[str, Any] = {
        "entry": {
            "title": entry.title,
            "data": dict(entry.data),
            "options": dict(entry.options),
        },
    }

    runtime = getattr(entry, "runtime_data", None)
    if runtime is None or runtime.data is None:
        diagnostics["list"] = None
        return diagnostics

    data = runtime.data
    diagnostics["list"] = {
        "list_id": data.list_id,
        "name": data.name,
        "visibility": data.visibility,
        "is_inbox": data.is_inbox,
        "item_count": len(data.items),
    }
    diagnostics["items"] = [_item_summary(item) for item in data.items]

    # Current coordinator snapshot aggregates (None until the first refresh).
    snapshot = runtime.coordinator.data
    diagnostics["snapshot"] = (
        {
            "overdue_count": snapshot.overdue_count,
            "due_today_count": snapshot.due_today_count,
            "blocked_count": snapshot.blocked_count,
            "queue_length": len(snapshot.queue),
            "next_task_title": snapshot.next_task_title,
            "total_actionable": snapshot.total_actionable,
        }
        if snapshot is not None
        else None
    )

    return diagnostics
