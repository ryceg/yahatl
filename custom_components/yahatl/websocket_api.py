"""WebSocket API for yahatl — rich data retrieval for frontend cards."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import DOMAIN, SIGNAL_YAHATL_UPDATED
from .models import (
    BlockerConfig,
    ConditionTriggerConfig,
    RecurrenceConfig,
    RequirementsConfig,
    TimeBlockerConfig,
)

_LOGGER = logging.getLogger(__name__)


def _resolve_list(hass: HomeAssistant, entity_id: str):
    """Resolve entity_id to (list_data, store) or (None, None)."""
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            expected_entity = f"todo.{list_data.list_id}"
            if entity_id == expected_entity:
                return list_data, data["store"]
    return None, None


def _resolve_item(hass: HomeAssistant, entity_id: str, item_id: str):
    """Resolve to (list_data, store, item) or (None, None, None)."""
    list_data, store = _resolve_list(hass, entity_id)
    if list_data is None:
        return None, None, None
    item = list_data.get_item(item_id)
    if item is None:
        return None, None, None
    return list_data, store, item


async def websocket_item_details(hass, connection, msg):
    """Return full item data for the editor."""
    list_data, store, item = _resolve_item(hass, msg["entity_id"], msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return
    connection.send_result(msg["id"], item.to_dict())


async def websocket_items_list(hass, connection, msg):
    """Return lightweight summary of all items in a list."""
    list_data, store = _resolve_list(hass, msg["entity_id"])
    if list_data is None:
        connection.send_error(msg["id"], "list_not_found", "List not found")
        return
    result = [
        {
            "uid": item.uid,
            "title": item.title,
            "status": item.status,
            "traits": item.traits,
        }
        for item in list_data.items
    ]
    connection.send_result(msg["id"], result)


async def websocket_item_save(hass, connection, msg):
    """Save any combination of item fields in one round-trip."""
    entity_id = msg["entity_id"]
    list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    # Simple scalar fields
    for field in ("title", "description", "priority", "needs_detail",
                  "time_estimate", "buffer_before", "buffer_after"):
        if field in msg:
            setattr(item, field, msg[field])

    if "traits" in msg:
        item.traits = msg["traits"]

    if "tags" in msg:
        item.tags = msg["tags"]

    if "due" in msg:
        item.due = datetime.fromisoformat(msg["due"]) if msg["due"] else None

    if "deferred_until" in msg:
        item.deferred_until = (
            datetime.fromisoformat(msg["deferred_until"])
            if msg["deferred_until"]
            else None
        )

    # Complex nested objects
    if "recurrence" in msg:
        item.recurrence = (
            RecurrenceConfig.from_dict(msg["recurrence"])
            if msg["recurrence"]
            else None
        )

    if "blockers" in msg:
        item.blockers = (
            BlockerConfig.from_dict(msg["blockers"])
            if msg["blockers"]
            else None
        )

    if "requirements" in msg:
        item.requirements = (
            RequirementsConfig.from_dict(msg["requirements"])
            if msg["requirements"]
            else None
        )

    if "condition_triggers" in msg:
        item.condition_triggers = (
            [ConditionTriggerConfig.from_dict(t) for t in msg["condition_triggers"]]
            if msg["condition_triggers"]
            else []
        )

    if "time_blockers" in msg:
        item.time_blockers = (
            [TimeBlockerConfig.from_dict(tb) for tb in msg["time_blockers"]]
            if msg["time_blockers"]
            else []
        )

    await store.async_save(list_data)
    async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, entity_id)
    connection.send_result(msg["id"], item.to_dict())


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands with HA."""
    hass.components.websocket_api.async_register_command(
        "yahatl/item_details",
        websocket_item_details,
        vol.Schema({
            vol.Required("type"): "yahatl/item_details",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
        }),
    )
    hass.components.websocket_api.async_register_command(
        "yahatl/items_list",
        websocket_items_list,
        vol.Schema({
            vol.Required("type"): "yahatl/items_list",
            vol.Required("entity_id"): str,
        }),
    )
    hass.components.websocket_api.async_register_command(
        "yahatl/item_save",
        websocket_item_save,
        vol.Schema({
            vol.Required("type"): "yahatl/item_save",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
            vol.Optional("title"): str,
            vol.Optional("description"): str,
            vol.Optional("traits"): [str],
            vol.Optional("tags"): [str],
            vol.Optional("due"): vol.Any(str, None),
            vol.Optional("time_estimate"): vol.Any(int, None),
            vol.Optional("buffer_before"): int,
            vol.Optional("buffer_after"): int,
            vol.Optional("priority"): vol.Any(vol.In(["low", "medium", "high"]), None),
            vol.Optional("needs_detail"): bool,
            vol.Optional("recurrence"): vol.Any(dict, None),
            vol.Optional("blockers"): vol.Any(dict, None),
            vol.Optional("requirements"): vol.Any(dict, None),
            vol.Optional("condition_triggers"): vol.Any([dict], None),
            vol.Optional("time_blockers"): vol.Any([dict], None),
            vol.Optional("deferred_until"): vol.Any(str, None),
        }),
    )
