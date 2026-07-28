"""Lifecycle event helpers for yahatl.

Item creation and assignment fire HA bus events so automations can react
(e.g. notify a newly assigned person, skipping the actor who did the
assigning). Both services.py and websocket_api.py funnel through these
helpers so the payloads stay identical regardless of entry point.

Completion/uncompletion events live in completion.py alongside the logic
that produces them.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN

if TYPE_CHECKING:
    from .models import YahtlItem, YahtlList

EVENT_ITEM_CREATED = f"{DOMAIN}_item_created"
EVENT_ITEM_ASSIGNED = f"{DOMAIN}_item_assigned"


@callback
def fire_item_created(
    hass: HomeAssistant,
    *,
    item: "YahtlItem",
    list_data: "YahtlList",
    entity_id: str | None,
    actor_user_id: str,
) -> None:
    """Fire ``yahatl_item_created`` for a newly created item."""
    hass.bus.async_fire(
        EVENT_ITEM_CREATED,
        {
            "uid": item.uid,
            "title": item.title,
            "entity_id": entity_id,
            "list_name": list_data.name,
            "assigned_to": list(item.assigned_to),
            "created_by": item.created_by,
            "actor_user_id": actor_user_id,
        },
    )


@callback
def fire_item_assigned(
    hass: HomeAssistant,
    *,
    item: "YahtlItem",
    list_data: "YahtlList",
    entity_id: str | None,
    actor_user_id: str,
    added: list[str],
) -> None:
    """Fire ``yahatl_item_assigned`` when assigned_to gained members.

    ``added`` is the list of user ids that were NOT previously assigned;
    the event is only fired when it is non-empty, so automations can notify
    newly assigned people (and skip the actor via ``actor_user_id``).
    """
    if not added:
        return
    hass.bus.async_fire(
        EVENT_ITEM_ASSIGNED,
        {
            "uid": item.uid,
            "title": item.title,
            "entity_id": entity_id,
            "list_name": list_data.name,
            "assigned_to_added": list(added),
            "assigned_to": list(item.assigned_to),
            "actor_user_id": actor_user_id,
            "due": item.due.isoformat() if item.due else None,
        },
    )
