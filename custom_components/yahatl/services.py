"""Services for yahatl integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv

from .const import ALL_TRAITS, DOMAIN

_LOGGER = logging.getLogger(__name__)

SERVICE_ADD_ITEM = "add_item"
SERVICE_UPDATE_ITEM = "update_item"
SERVICE_COMPLETE_ITEM = "complete_item"
SERVICE_SET_TRAITS = "set_traits"
SERVICE_ADD_TAGS = "add_tags"
SERVICE_REMOVE_TAGS = "remove_tags"
SERVICE_FLAG_NEEDS_DETAIL = "flag_needs_detail"
SERVICE_SET_LIST_VISIBILITY = "set_list_visibility"
SERVICE_SET_RECURRENCE = "set_recurrence"
SERVICE_SET_BLOCKERS = "set_blockers"
SERVICE_SET_REQUIREMENTS = "set_requirements"

ATTR_ENTITY_ID = "entity_id"
ATTR_ITEM_ID = "item_id"
ATTR_TITLE = "title"
ATTR_DESCRIPTION = "description"
ATTR_TRAITS = "traits"
ATTR_TAGS = "tags"
ATTR_STATUS = "status"
ATTR_DUE = "due"
ATTR_TIME_ESTIMATE = "time_estimate"
ATTR_BUFFER_BEFORE = "buffer_before"
ATTR_BUFFER_AFTER = "buffer_after"
ATTR_NEEDS_DETAIL = "needs_detail"
ATTR_USER_ID = "user_id"
ATTR_VISIBILITY = "visibility"
ATTR_SHARED_WITH = "shared_with"

# Recurrence attributes
ATTR_RECURRENCE_TYPE = "recurrence_type"
ATTR_CALENDAR_PATTERN = "calendar_pattern"
ATTR_ELAPSED_INTERVAL = "elapsed_interval"
ATTR_ELAPSED_UNIT = "elapsed_unit"
ATTR_FREQUENCY_COUNT = "frequency_count"
ATTR_FREQUENCY_PERIOD = "frequency_period"
ATTR_FREQUENCY_UNIT = "frequency_unit"
ATTR_THRESHOLDS = "thresholds"

# Blocker attributes
ATTR_BLOCKER_MODE = "mode"
ATTR_BLOCKER_ITEMS = "items"
ATTR_BLOCKER_SENSORS = "sensors"

# Requirements attributes
ATTR_REQ_MODE = "mode"
ATTR_LOCATION = "location"
ATTR_PEOPLE = "people"
ATTR_TIME_CONSTRAINTS = "time_constraints"
ATTR_CONTEXT = "context"
ATTR_REQ_SENSORS = "sensors"

SERVICE_SET_TRAITS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_TRAITS): vol.All(cv.ensure_list, [vol.In(ALL_TRAITS)]),
    }
)

SERVICE_TAGS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_TAGS): vol.All(cv.ensure_list, [cv.string]),
    }
)

SERVICE_FLAG_NEEDS_DETAIL_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_NEEDS_DETAIL, default=True): cv.boolean,
    }
)

SERVICE_ADD_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_TITLE): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_TRAITS): vol.All(cv.ensure_list, [vol.In(ALL_TRAITS)]),
        vol.Optional(ATTR_TAGS): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_DUE): cv.datetime,
        vol.Optional(ATTR_TIME_ESTIMATE): cv.positive_int,
        vol.Optional(ATTR_NEEDS_DETAIL, default=False): cv.boolean,
    }
)

SERVICE_COMPLETE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_USER_ID): cv.string,
    }
)

SERVICE_UPDATE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_TITLE): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_STATUS): vol.In(["pending", "in_progress", "completed", "missed"]),
        vol.Optional(ATTR_DUE): cv.datetime,
        vol.Optional(ATTR_TIME_ESTIMATE): cv.positive_int,
        vol.Optional(ATTR_BUFFER_BEFORE): cv.positive_int,
        vol.Optional(ATTR_BUFFER_AFTER): cv.positive_int,
    }
)

SERVICE_SET_LIST_VISIBILITY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_VISIBILITY): vol.In(["private", "shared"]),
        vol.Optional(ATTR_SHARED_WITH): vol.All(cv.ensure_list, [cv.string]),
    }
)

SERVICE_SET_RECURRENCE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_RECURRENCE_TYPE): vol.In(["calendar", "elapsed", "frequency", "none"]),
        vol.Optional(ATTR_CALENDAR_PATTERN): cv.string,
        vol.Optional(ATTR_ELAPSED_INTERVAL): cv.positive_int,
        vol.Optional(ATTR_ELAPSED_UNIT): vol.In(["days", "weeks", "months", "years"]),
        vol.Optional(ATTR_FREQUENCY_COUNT): cv.positive_int,
        vol.Optional(ATTR_FREQUENCY_PERIOD): cv.positive_int,
        vol.Optional(ATTR_FREQUENCY_UNIT): vol.In(["days", "weeks", "months"]),
        vol.Optional(ATTR_THRESHOLDS): vol.All(cv.ensure_list, [dict]),
    }
)

SERVICE_SET_BLOCKERS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_BLOCKER_MODE, default="ALL"): vol.In(["ANY", "ALL"]),
        vol.Optional(ATTR_BLOCKER_ITEMS): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_BLOCKER_SENSORS): vol.All(cv.ensure_list, [cv.entity_id]),
    }
)

SERVICE_SET_REQUIREMENTS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_REQ_MODE, default="ANY"): vol.In(["ANY", "ALL"]),
        vol.Optional(ATTR_LOCATION): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_PEOPLE): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_TIME_CONSTRAINTS): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_CONTEXT): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_REQ_SENSORS): vol.All(cv.ensure_list, [cv.entity_id]),
    }
)


def _get_entry_data(hass: HomeAssistant, entity_id: str) -> dict[str, Any] | None:
    """Get entry data for an entity."""
    # Entity ID format: todo.yahatl_{storage_key}
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            expected_entity = f"todo.{list_data.list_id}"
            if entity_id == expected_entity:
                return data
    return None


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up yahatl services."""

    async def handle_add_item(call: ServiceCall) -> None:
        """Handle add_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        # Create new item
        from .models import YahtlItem
        item = YahtlItem.create(
            title=call.data[ATTR_TITLE],
        )

        if ATTR_DESCRIPTION in call.data:
            item.description = call.data[ATTR_DESCRIPTION]
        if ATTR_TRAITS in call.data:
            item.traits = call.data[ATTR_TRAITS]
        if ATTR_TAGS in call.data:
            item.tags = call.data[ATTR_TAGS]
        if ATTR_DUE in call.data:
            item.due = call.data[ATTR_DUE]
        if ATTR_TIME_ESTIMATE in call.data:
            item.time_estimate = call.data[ATTR_TIME_ESTIMATE]
        if ATTR_NEEDS_DETAIL in call.data:
            item.needs_detail = call.data[ATTR_NEEDS_DETAIL]

        list_data.add_item(item)
        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_complete_item(call: ServiceCall) -> None:
        """Handle complete_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        user_id = call.data.get(ATTR_USER_ID, "")

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Mark as completed with history
        from datetime import datetime
        from .models import CompletionRecord
        from .const import COMPLETION_HISTORY_CAP, STATUS_COMPLETED

        item.status = STATUS_COMPLETED

        record = CompletionRecord(
            user_id=user_id,
            timestamp=datetime.now(),
        )
        item.completion_history.append(record)

        # Cap history
        if len(item.completion_history) > COMPLETION_HISTORY_CAP:
            item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

        await store.async_save(list_data)

        # Fire completion event
        hass.bus.async_fire(
            f"{DOMAIN}_item_completed",
            {
                "entity_id": entity_id,
                "item_id": item_id,
                "item_title": item.title,
                "user_id": user_id,
            },
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_update_item(call: ServiceCall) -> None:
        """Handle update_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Update fields if provided
        if ATTR_TITLE in call.data:
            item.title = call.data[ATTR_TITLE]
        if ATTR_DESCRIPTION in call.data:
            item.description = call.data[ATTR_DESCRIPTION]
        if ATTR_STATUS in call.data:
            item.status = call.data[ATTR_STATUS]
        if ATTR_DUE in call.data:
            item.due = call.data[ATTR_DUE]
        if ATTR_TIME_ESTIMATE in call.data:
            item.time_estimate = call.data[ATTR_TIME_ESTIMATE]
        if ATTR_BUFFER_BEFORE in call.data:
            item.buffer_before = call.data[ATTR_BUFFER_BEFORE]
        if ATTR_BUFFER_AFTER in call.data:
            item.buffer_after = call.data[ATTR_BUFFER_AFTER]

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_set_traits(call: ServiceCall) -> None:
        """Handle set_traits service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        traits = call.data[ATTR_TRAITS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        item.traits = traits
        await store.async_save(list_data)

        # Notify entity to update state
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_add_tags(call: ServiceCall) -> None:
        """Handle add_tags service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        tags = call.data[ATTR_TAGS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Add tags (no duplicates)
        for tag in tags:
            if tag not in item.tags:
                item.tags.append(tag)

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_remove_tags(call: ServiceCall) -> None:
        """Handle remove_tags service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        tags = call.data[ATTR_TAGS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Remove tags
        item.tags = [t for t in item.tags if t not in tags]

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_flag_needs_detail(call: ServiceCall) -> None:
        """Handle flag_needs_detail service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        needs_detail = call.data[ATTR_NEEDS_DETAIL]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        item.needs_detail = needs_detail

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_set_list_visibility(call: ServiceCall) -> None:
        """Handle set_list_visibility service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        visibility = call.data[ATTR_VISIBILITY]
        shared_with = call.data.get(ATTR_SHARED_WITH, [])

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        list_data.visibility = visibility
        list_data.shared_with = shared_with

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_set_recurrence(call: ServiceCall) -> None:
        """Handle set_recurrence service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        recurrence_type = call.data[ATTR_RECURRENCE_TYPE]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        from .models import RecurrenceConfig, RecurrenceThreshold

        if recurrence_type == "none":
            item.recurrence = None
        else:
            # Create recurrence config
            recurrence = RecurrenceConfig(type=recurrence_type)

            if recurrence_type == "calendar":
                recurrence.calendar_pattern = call.data.get(ATTR_CALENDAR_PATTERN)
            elif recurrence_type == "elapsed":
                recurrence.elapsed_interval = call.data.get(ATTR_ELAPSED_INTERVAL)
                recurrence.elapsed_unit = call.data.get(ATTR_ELAPSED_UNIT, "days")
            elif recurrence_type == "frequency":
                recurrence.frequency_count = call.data.get(ATTR_FREQUENCY_COUNT)
                recurrence.frequency_period = call.data.get(ATTR_FREQUENCY_PERIOD)
                recurrence.frequency_unit = call.data.get(ATTR_FREQUENCY_UNIT, "days")

                # Handle thresholds
                thresholds_data = call.data.get(ATTR_THRESHOLDS, [])
                recurrence.thresholds = [
                    RecurrenceThreshold.from_dict(t) for t in thresholds_data
                ]

            item.recurrence = recurrence

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_set_blockers(call: ServiceCall) -> None:
        """Handle set_blockers service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        from .models import BlockerConfig

        # Create or update blocker config
        if item.blockers is None:
            item.blockers = BlockerConfig()

        item.blockers.mode = call.data.get(ATTR_BLOCKER_MODE, "ALL")
        item.blockers.items = call.data.get(ATTR_BLOCKER_ITEMS, [])
        item.blockers.sensors = call.data.get(ATTR_BLOCKER_SENSORS, [])

        # If no blockers specified, remove the config
        if not item.blockers.items and not item.blockers.sensors:
            item.blockers = None

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_set_requirements(call: ServiceCall) -> None:
        """Handle set_requirements service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        from .models import RequirementsConfig

        # Create or update requirements config
        if item.requirements is None:
            item.requirements = RequirementsConfig()

        item.requirements.mode = call.data.get(ATTR_REQ_MODE, "ANY")
        item.requirements.location = call.data.get(ATTR_LOCATION, [])
        item.requirements.people = call.data.get(ATTR_PEOPLE, [])
        item.requirements.time_constraints = call.data.get(ATTR_TIME_CONSTRAINTS, [])
        item.requirements.context = call.data.get(ATTR_CONTEXT, [])
        item.requirements.sensors = call.data.get(ATTR_REQ_SENSORS, [])

        # If no requirements specified, remove the config
        if not any([
            item.requirements.location,
            item.requirements.people,
            item.requirements.time_constraints,
            item.requirements.context,
            item.requirements.sensors,
        ]):
            item.requirements = None

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    hass.services.async_register(
        DOMAIN, SERVICE_ADD_ITEM, handle_add_item, schema=SERVICE_ADD_ITEM_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COMPLETE_ITEM,
        handle_complete_item,
        schema=SERVICE_COMPLETE_ITEM_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE_ITEM, handle_update_item, schema=SERVICE_UPDATE_ITEM_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SET_TRAITS, handle_set_traits, schema=SERVICE_SET_TRAITS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_TAGS, handle_add_tags, schema=SERVICE_TAGS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_TAGS, handle_remove_tags, schema=SERVICE_TAGS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_FLAG_NEEDS_DETAIL,
        handle_flag_needs_detail,
        schema=SERVICE_FLAG_NEEDS_DETAIL_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_LIST_VISIBILITY,
        handle_set_list_visibility,
        schema=SERVICE_SET_LIST_VISIBILITY_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_RECURRENCE,
        handle_set_recurrence,
        schema=SERVICE_SET_RECURRENCE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_BLOCKERS,
        handle_set_blockers,
        schema=SERVICE_SET_BLOCKERS_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_REQUIREMENTS,
        handle_set_requirements,
        schema=SERVICE_SET_REQUIREMENTS_SCHEMA,
    )


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload yahatl services."""
    hass.services.async_remove(DOMAIN, SERVICE_ADD_ITEM)
    hass.services.async_remove(DOMAIN, SERVICE_UPDATE_ITEM)
    hass.services.async_remove(DOMAIN, SERVICE_COMPLETE_ITEM)
    hass.services.async_remove(DOMAIN, SERVICE_SET_TRAITS)
    hass.services.async_remove(DOMAIN, SERVICE_ADD_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_REMOVE_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_FLAG_NEEDS_DETAIL)
    hass.services.async_remove(DOMAIN, SERVICE_SET_LIST_VISIBILITY)
    hass.services.async_remove(DOMAIN, SERVICE_SET_RECURRENCE)
    hass.services.async_remove(DOMAIN, SERVICE_SET_BLOCKERS)
    hass.services.async_remove(DOMAIN, SERVICE_SET_REQUIREMENTS)
