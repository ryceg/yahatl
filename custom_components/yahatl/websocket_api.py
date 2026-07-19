"""WebSocket API for yahatl — rich data retrieval for frontend cards."""
from __future__ import annotations

import logging
from datetime import datetime

from homeassistant.util import dt as dt_util
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
from .entry_data import (
    all_lists as entry_all_lists,
    iter_runtime,
    resolve_entity,
    runtime_for_list,
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
    entry, runtime = resolve_entity(hass, entity_id)
    if runtime is None:
        return None, None, None
    return entry.entry_id, runtime.data, runtime.store


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
    """Persist the list and ask its coordinator to recompute."""
    await store.async_save(list_data)
    entry = hass.config_entries.async_get_entry(entry_id)
    runtime = getattr(entry, "runtime_data", None) if entry else None
    if runtime is not None:
        await runtime.coordinator.async_request_refresh()


def _get_all_lists(hass: HomeAssistant) -> list:
    return entry_all_lists(hass)


# --- Handlers ---

@websocket_api.async_response
async def websocket_lists(hass, connection, msg):
    """Return all yahatl lists with metadata."""
    user_id = msg.get("user_id")
    result = []
    for _entry, runtime in iter_runtime(hass):
        list_data = runtime.data
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
            "project": item.project,
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
                  "time_estimate", "buffer_before", "buffer_after", "project"):
        if field in msg:
            setattr(item, field, msg[field])

    if "traits" in msg:
        from .models import apply_trait_rules
        item.traits = apply_trait_rules(item, msg["traits"])
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
                  "time_estimate", "buffer_before", "buffer_after", "project"):
        if field in msg:
            setattr(item, field, msg[field])

    if "traits" in msg:
        from .models import apply_trait_rules
        item.traits = apply_trait_rules(item, msg["traits"])
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
    now = dt_util.now()

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
async def websocket_item_delay(hass, connection, msg):
    """Delay an item to its next valid period.

    Computes the next moment the item is schedulable from its time blockers
    (skipping the rest of today) and defers it until then.
    """
    from .blockers import next_valid_time

    entity_id = msg["entity_id"]
    entry_id, list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    item.deferred_until = next_valid_time(item, dt_util.now())
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
        updated_at=dt_util.now(),
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


# --- Meta config ---

@websocket_api.async_response
async def websocket_meta_get(hass, connection, msg):
    """Return the global meta configuration."""
    meta_store = hass.data.get(DOMAIN, {}).get("meta_store")
    if meta_store is None:
        connection.send_result(msg["id"], {"contexts": [], "locations": []})
        return
    connection.send_result(msg["id"], meta_store.data.to_dict())


@websocket_api.async_response
async def websocket_meta_set(hass, connection, msg):
    """Replace the global meta configuration.

    Handles cascade deletion: if a context or location was removed and
    items reference it, strip those references.
    """
    from .meta_store import MetaConfig

    meta_store = hass.data.get(DOMAIN, {}).get("meta_store")
    if meta_store is None:
        connection.send_error(msg["id"], "meta_store_not_found", "Meta store not initialized")
        return

    old_data = meta_store.data
    new_data = MetaConfig.from_dict(msg["data"])

    # Detect deleted contexts
    old_ctx_ids = {c.id for c in old_data.contexts}
    new_ctx_ids = {c.id for c in new_data.contexts}
    removed_ctx_ids = old_ctx_ids - new_ctx_ids

    # Detect renamed contexts
    # We track renames via the "renames" field in the message
    renames = msg.get("renames", {})  # { old_id: new_id }

    # Cascade: strip removed contexts from items, apply renames
    if removed_ctx_ids or renames:
        all_lists = _get_all_lists(hass)
        for yahatl_list in all_lists:
            dirty = False
            for item in yahatl_list.items:
                if item.requirements and item.requirements.context:
                    original = list(item.requirements.context)
                    # Apply renames
                    item.requirements.context = [
                        renames.get(c, c) for c in item.requirements.context
                    ]
                    # Remove deleted
                    item.requirements.context = [
                        c for c in item.requirements.context
                        if c not in removed_ctx_ids
                    ]
                    if item.requirements.context != original:
                        dirty = True
            if dirty:
                # Persist the list this item belongs to.
                _entry, runtime = runtime_for_list(hass, yahatl_list)
                if runtime is not None:
                    await runtime.store.async_save(yahatl_list)

    await meta_store.async_save(new_data)
    connection.send_result(msg["id"], new_data.to_dict())


# --- Tags ---

@websocket_api.async_response
async def websocket_tags_list(hass, connection, msg):
    """Scan all items and return deduplicated tags with usage counts."""
    tag_counts: dict[str, int] = {}
    all_lists = _get_all_lists(hass)
    for yahatl_list in all_lists:
        for item in yahatl_list.items:
            for tag in item.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

    result = sorted(
        [{"name": name, "count": count} for name, count in tag_counts.items()],
        key=lambda t: -t["count"],
    )
    connection.send_result(msg["id"], result)


@websocket_api.async_response
async def websocket_tag_rename(hass, connection, msg):
    """Rename a tag across all items in all lists."""
    old_name = msg["old_name"]
    new_name = msg["new_name"]

    all_lists = _get_all_lists(hass)
    for yahatl_list in all_lists:
        dirty = False
        for item in yahatl_list.items:
            if old_name in item.tags:
                item.tags = [new_name if t == old_name else t for t in item.tags]
                # Deduplicate in case new_name already existed
                seen = set()
                item.tags = [t for t in item.tags if t not in seen and not seen.add(t)]
                dirty = True
        if dirty:
            _entry, runtime = runtime_for_list(hass, yahatl_list)
            if runtime is not None:
                await runtime.store.async_save(yahatl_list)

    connection.send_result(msg["id"], {"renamed": True})


@websocket_api.async_response
async def websocket_tag_delete(hass, connection, msg):
    """Remove a tag from all items in all lists."""
    tag_name = msg["name"]

    all_lists = _get_all_lists(hass)
    for yahatl_list in all_lists:
        dirty = False
        for item in yahatl_list.items:
            if tag_name in item.tags:
                item.tags = [t for t in item.tags if t != tag_name]
                dirty = True
        if dirty:
            _entry, runtime = runtime_for_list(hass, yahatl_list)
            if runtime is not None:
                await runtime.store.async_save(yahatl_list)

    connection.send_result(msg["id"], {"deleted": True})


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
            vol.Optional("project"): vol.Any(str, None),
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
            vol.Optional("project"): vol.Any(str, None),
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
        "yahatl/item_delay",
        websocket_item_delay,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/item_delay",
            vol.Required("entity_id"): str,
            vol.Required("item_id"): str,
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

    # Meta config
    websocket_api.async_register_command(
        hass,
        "yahatl/meta_get",
        websocket_meta_get,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/meta_get",
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/meta_set",
        websocket_meta_set,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/meta_set",
            vol.Required("data"): dict,
            vol.Optional("renames"): dict,
        }),
    )

    # Tags
    websocket_api.async_register_command(
        hass,
        "yahatl/tags_list",
        websocket_tags_list,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/tags_list",
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/tag_rename",
        websocket_tag_rename,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/tag_rename",
            vol.Required("old_name"): str,
            vol.Required("new_name"): str,
        }),
    )

    websocket_api.async_register_command(
        hass,
        "yahatl/tag_delete",
        websocket_tag_delete,
        websocket_api.BASE_COMMAND_MESSAGE_SCHEMA.extend({
            vol.Required("type"): "yahatl/tag_delete",
            vol.Required("name"): str,
        }),
    )
