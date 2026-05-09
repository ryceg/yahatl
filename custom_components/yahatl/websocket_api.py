"""WebSocket API for yahatl — rich data retrieval for frontend cards."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import (
    ALL_TRAITS,
    COMPLETION_HISTORY_CAP,
    DOMAIN,
    SIGNAL_YAHATL_UPDATED,
    STATUS_COMPLETED,
    STATUS_PENDING,
)
from .models import (
    BlockerConfig,
    CompletionRecord,
    ConditionTriggerConfig,
    RecurrenceConfig,
    RequirementsConfig,
    TimeBlockerConfig,
    YahtlItem,
)

_LOGGER = logging.getLogger(__name__)


# --- Helpers ---

def _resolve_list(hass: HomeAssistant, entity_id: str):
    """Resolve entity_id to (entry_id, list_data, store) or (None, None, None)."""
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            expected_entity = f"todo.{list_data.list_id}"
            if entity_id == expected_entity:
                return entry_id, list_data, data["store"]
    return None, None, None


def _resolve_item(hass: HomeAssistant, entity_id: str, item_id: str):
    """Resolve to (entry_id, list_data, store, item) or (None, None, None, None)."""
    entry_id, list_data, store = _resolve_list(hass, entity_id)
    if list_data is None:
        return None, None, None, None
    item = list_data.get_item(item_id)
    if item is None:
        return None, None, None, None
    return entry_id, list_data, store, item


async def _save_and_notify(hass, entry_id, store, list_data, entity_id):
    """Persist and notify via pipeline or fallback."""
    pipeline = hass.data[DOMAIN].get(entry_id, {}).get("pipeline")
    if pipeline:
        await pipeline.async_request_refresh("websocket")
    else:
        await store.async_save(list_data)
        async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, entity_id)


def _get_all_lists(hass: HomeAssistant) -> list:
    from .models import YahtlList
    lists = []
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            if isinstance(list_data, YahtlList):
                lists.append(list_data)
    return lists


# --- Handlers ---

@websocket_api.async_response
async def websocket_lists(hass, connection, msg):
    """Return all yahatl lists with metadata."""
    user_id = msg.get("user_id")
    result = []
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if not isinstance(data, dict) or "data" not in data:
            continue
        list_data = data["data"]
        # Filter by user visibility
        if user_id and list_data.owner:
            if list_data.owner != user_id:
                if list_data.visibility != "shared":
                    continue
                if list_data.shared_with and user_id not in list_data.shared_with:
                    continue
        result.append({
            "entity_id": f"todo.{list_data.list_id}",
            "list_id": list_data.list_id,
            "name": list_data.name,
            "owner": list_data.owner,
            "visibility": list_data.visibility,
            "shared_with": list_data.shared_with,
            "is_inbox": list_data.is_inbox,
            "item_count": len(list_data.items),
        })
    connection.send_result(msg["id"], result)


@websocket_api.async_response
async def websocket_items_list(hass, connection, msg):
    """Return summary of all items in a list, with optional filters."""
    _, list_data, _ = _resolve_list(hass, msg["entity_id"])
    if list_data is None:
        connection.send_error(msg["id"], "list_not_found", "List not found")
        return

    items = list_data.items

    # Apply filters
    status = msg.get("status")
    if status:
        items = [i for i in items if i.status == status]

    traits = msg.get("traits")
    if traits:
        items = [i for i in items if any(t in i.traits for t in traits)]

    tags = msg.get("tags")
    if tags:
        items = [i for i in items if any(t in i.tags for t in tags)]

    needs_detail = msg.get("needs_detail")
    if needs_detail is not None:
        items = [i for i in items if i.needs_detail == needs_detail]

    assigned_to = msg.get("assigned_to")
    if assigned_to:
        items = [i for i in items if not i.assigned_to or assigned_to in i.assigned_to]

    result = [
        {
            "uid": item.uid,
            "title": item.title,
            "status": item.status,
            "traits": item.traits,
            "tags": item.tags,
            "priority": item.priority,
            "due": item.due.isoformat() if item.due else None,
            "needs_detail": item.needs_detail,
            "assigned_to": item.assigned_to,
            "time_estimate": item.time_estimate,
            "deferred_until": item.deferred_until.isoformat() if item.deferred_until else None,
            "has_recurrence": item.recurrence is not None,
            "has_blockers": item.blockers is not None,
            "current_streak": item.current_streak,
        }
        for item in items
    ]
    connection.send_result(msg["id"], result)


@websocket_api.async_response
async def websocket_item_details(hass, connection, msg):
    """Return full item data for the editor."""
    _, _, _, item = _resolve_item(hass, msg["entity_id"], msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.async_response
async def websocket_item_create(hass, connection, msg):
    """Create a new item with all fields."""
    entry_id, list_data, store = _resolve_list(hass, msg["entity_id"])
    if list_data is None:
        connection.send_error(msg["id"], "list_not_found", "List not found")
        return

    item = YahtlItem.create(title=msg["title"])

    # Simple fields
    for field in ("description", "priority", "needs_detail",
                  "time_estimate", "buffer_before", "buffer_after"):
        if field in msg:
            setattr(item, field, msg[field])

    if "traits" in msg:
        item.traits = msg["traits"]
    if "tags" in msg:
        item.tags = msg["tags"]
    if "assigned_to" in msg:
        item.assigned_to = msg["assigned_to"]
    if "due" in msg:
        item.due = datetime.fromisoformat(msg["due"]) if msg["due"] else None
    if "deferred_until" in msg:
        item.deferred_until = datetime.fromisoformat(msg["deferred_until"]) if msg["deferred_until"] else None

    # Complex nested objects
    if "recurrence" in msg and msg["recurrence"]:
        item.recurrence = RecurrenceConfig.from_dict(msg["recurrence"])
    if "blockers" in msg and msg["blockers"]:
        item.blockers = BlockerConfig.from_dict(msg["blockers"])
    if "requirements" in msg and msg["requirements"]:
        item.requirements = RequirementsConfig.from_dict(msg["requirements"])
    if "condition_triggers" in msg and msg["condition_triggers"]:
        item.condition_triggers = [ConditionTriggerConfig.from_dict(t) for t in msg["condition_triggers"]]
    if "time_blockers" in msg and msg["time_blockers"]:
        item.time_blockers = [TimeBlockerConfig.from_dict(tb) for tb in msg["time_blockers"]]

    list_data.add_item(item)
    await _save_and_notify(hass, entry_id, store, list_data, msg["entity_id"])
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.async_response
async def websocket_item_save(hass, connection, msg):
    """Save any combination of item fields in one round-trip."""
    entity_id = msg["entity_id"]
    entry_id, list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
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
    if "assigned_to" in msg:
        item.assigned_to = msg["assigned_to"]

    if "due" in msg:
        item.due = datetime.fromisoformat(msg["due"]) if msg["due"] else None
    if "deferred_until" in msg:
        item.deferred_until = datetime.fromisoformat(msg["deferred_until"]) if msg["deferred_until"] else None

    # Complex nested objects
    if "recurrence" in msg:
        item.recurrence = RecurrenceConfig.from_dict(msg["recurrence"]) if msg["recurrence"] else None
    if "blockers" in msg:
        item.blockers = BlockerConfig.from_dict(msg["blockers"]) if msg["blockers"] else None
    if "requirements" in msg:
        item.requirements = RequirementsConfig.from_dict(msg["requirements"]) if msg["requirements"] else None
    if "condition_triggers" in msg:
        item.condition_triggers = [ConditionTriggerConfig.from_dict(t) for t in msg["condition_triggers"]] if msg["condition_triggers"] else []
    if "time_blockers" in msg:
        item.time_blockers = [TimeBlockerConfig.from_dict(tb) for tb in msg["time_blockers"]] if msg["time_blockers"] else []

    await _save_and_notify(hass, entry_id, store, list_data, entity_id)
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.async_response
async def websocket_item_delete(hass, connection, msg):
    """Delete an item."""
    entity_id = msg["entity_id"]
    entry_id, list_data, store = _resolve_list(hass, entity_id)
    if list_data is None:
        connection.send_error(msg["id"], "list_not_found", "List not found")
        return

    removed = list_data.remove_item(msg["item_id"])
    if not removed:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    await _save_and_notify(hass, entry_id, store, list_data, entity_id)
    connection.send_result(msg["id"], {"deleted": True})


@websocket_api.async_response
async def websocket_item_complete(hass, connection, msg):
    """Complete an item with full recurrence/streak handling."""
    entity_id = msg["entity_id"]
    entry_id, list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    from .recurrence import calculate_next_due, calculate_streak

    user_id = msg.get("user_id", "")
    now = datetime.now()

    item.status = STATUS_COMPLETED
    item.deferred_until = None
    item.last_completed = now

    record = CompletionRecord(user_id=user_id, timestamp=now)
    item.completion_history.append(record)
    if len(item.completion_history) > COMPLETION_HISTORY_CAP:
        item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

    if "habit" in item.traits:
        item.current_streak = calculate_streak(item)

    if item.recurrence:
        next_due = calculate_next_due(item, now)
        if next_due:
            item.status = STATUS_PENDING
            item.due = next_due

    hass.bus.async_fire(
        f"{DOMAIN}_item_completed",
        {
            "entity_id": entity_id,
            "item_id": item.uid,
            "item_title": item.title,
            "user_id": user_id,
        },
    )

    await _save_and_notify(hass, entry_id, store, list_data, entity_id)
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.async_response
async def websocket_item_defer(hass, connection, msg):
    """Defer an item."""
    entity_id = msg["entity_id"]
    entry_id, list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    item.deferred_until = datetime.fromisoformat(msg["deferred_until"]) if msg.get("deferred_until") else None
    await _save_and_notify(hass, entry_id, store, list_data, entity_id)
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.async_response
async def websocket_queue(hass, connection, msg):
    """Generate and return the scored queue."""
    from .queue import QueueEngine
    from .models import ContextOverride

    context = {}

    # Load stored context
    context_store_key = "yahatl_context"
    if context_store_key in hass.data.get(DOMAIN, {}):
        stored = hass.data[DOMAIN][context_store_key]
        if isinstance(stored, ContextOverride):
            context = {
                "location": stored.location,
                "people": stored.people,
                "contexts": stored.contexts,
            }

    # Override with request params
    if "location" in msg:
        context["location"] = msg["location"]
    if "people" in msg:
        context["people"] = msg["people"]
    if "contexts" in msg:
        context["contexts"] = msg["contexts"]

    available_time = msg.get("available_time")
    user_id = msg.get("user_id")
    all_lists = _get_all_lists(hass)

    engine = QueueEngine(hass)
    result = await engine.generate(
        all_lists,
        context=context or None,
        available_time=available_time,
        user_id=user_id,
    )

    connection.send_result(msg["id"], {
        "items": result.items,
        "context": result.context,
        "overdue_count": result.overdue_count,
        "due_today_count": result.due_today_count,
        "blocked_count": result.blocked_count,
        "next_task_title": result.next_task_title,
        "total_actionable": result.total_actionable,
    })


@websocket_api.async_response
async def websocket_context_get(hass, connection, msg):
    """Return the current context override."""
    from .models import ContextOverride

    context_store_key = "yahatl_context"
    stored = hass.data.get(DOMAIN, {}).get(context_store_key)
    if isinstance(stored, ContextOverride):
        connection.send_result(msg["id"], stored.to_dict())
    else:
        connection.send_result(msg["id"], {
            "location": None,
            "people": [],
            "contexts": [],
        })


@websocket_api.async_response
async def websocket_context_set(hass, connection, msg):
    """Update the context override."""
    from .models import ContextOverride

    context = ContextOverride(
        location=msg.get("location"),
        people=msg.get("people", []),
        contexts=msg.get("contexts", []),
        updated_at=datetime.now(),
    )

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["yahatl_context"] = context

    hass.bus.async_fire(
        f"{DOMAIN}_context_updated",
        {
            "location": context.location,
            "people": context.people,
            "contexts": context.contexts,
        }
    )

    connection.send_result(msg["id"], context.to_dict())


# --- Registration ---

def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands with HA."""

    websocket_api.async_register_command(
        hass,
        "yahatl/lists",
        websocket_lists,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/lists",
            vol.Optional("user_id"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/items_list",
        websocket_items_list,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/items_list",
            vol.Required("entity_id"): str,
            vol.Optional("status"): str,
            vol.Optional("traits"): [str],
            vol.Optional("tags"): [str],
            vol.Optional("needs_detail"): bool,
            vol.Optional("assigned_to"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/item_details",
        websocket_item_details,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_details",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/item_create",
        websocket_item_create,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_create",
            vol.Required("entity_id"): str,
            vol.Required("title"): str,
            vol.Optional("description"): str,
            vol.Optional("traits"): [str],
            vol.Optional("tags"): [str],
            vol.Optional("assigned_to"): [str],
            vol.Optional("priority"): vol.Any(vol.In(["low", "medium", "high"]), None),
            vol.Optional("due"): vol.Any(str, None),
            vol.Optional("time_estimate"): vol.Any(int, None),
            vol.Optional("buffer_before"): int,
            vol.Optional("buffer_after"): int,
            vol.Optional("needs_detail"): bool,
            vol.Optional("deferred_until"): vol.Any(str, None),
            vol.Optional("recurrence"): vol.Any(dict, None),
            vol.Optional("blockers"): vol.Any(dict, None),
            vol.Optional("requirements"): vol.Any(dict, None),
            vol.Optional("condition_triggers"): vol.Any([dict], None),
            vol.Optional("time_blockers"): vol.Any([dict], None),
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/item_save",
        websocket_item_save,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_save",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
            vol.Optional("title"): str,
            vol.Optional("description"): str,
            vol.Optional("traits"): [str],
            vol.Optional("tags"): [str],
            vol.Optional("assigned_to"): [str],
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

    websocket_api.async_register_command(
        hass,
        "yahatl/item_delete",
        websocket_item_delete,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_delete",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/item_complete",
        websocket_item_complete,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_complete",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
            vol.Optional("user_id"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/item_defer",
        websocket_item_defer,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_defer",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
            vol.Optional("deferred_until"): vol.Any(str, None),
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/queue",
        websocket_queue,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/queue",
            vol.Optional("user_id"): str,
            vol.Optional("available_time"): int,
            vol.Optional("location"): str,
            vol.Optional("people"): [str],
            vol.Optional("contexts"): [str],
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/context_get",
        websocket_context_get,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/context_get",
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/context_set",
        websocket_context_set,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/context_set",
            vol.Optional("location"): vol.Any(str, None),
            vol.Optional("people"): [str],
            vol.Optional("contexts"): [str],
        }),
    )
