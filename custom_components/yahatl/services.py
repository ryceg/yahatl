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
SERVICE_SET_TRAITS = "set_traits"
SERVICE_ADD_TAGS = "add_tags"
SERVICE_REMOVE_TAGS = "remove_tags"
SERVICE_FLAG_NEEDS_DETAIL = "flag_needs_detail"

ATTR_ENTITY_ID = "entity_id"
ATTR_ITEM_ID = "item_id"
ATTR_TITLE = "title"
ATTR_DESCRIPTION = "description"
ATTR_TRAITS = "traits"
ATTR_TAGS = "tags"
ATTR_DUE = "due"
ATTR_TIME_ESTIMATE = "time_estimate"
ATTR_NEEDS_DETAIL = "needs_detail"

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

    hass.services.async_register(
        DOMAIN, SERVICE_ADD_ITEM, handle_add_item, schema=SERVICE_ADD_ITEM_SCHEMA
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


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload yahatl services."""
    hass.services.async_remove(DOMAIN, SERVICE_ADD_ITEM)
    hass.services.async_remove(DOMAIN, SERVICE_SET_TRAITS)
    hass.services.async_remove(DOMAIN, SERVICE_ADD_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_REMOVE_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_FLAG_NEEDS_DETAIL)
