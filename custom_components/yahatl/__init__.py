"""The yahatl integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_STORAGE_KEY, DOMAIN
from .reactivity import ReactivityManager
from .services import async_setup_services, async_unload_services
from .store import get_store_path, YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO, Platform.SENSOR]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})
    await async_setup_services(hass)
    from .websocket_api import async_register_websocket_commands
    async_register_websocket_commands(hass)

    # Register all frontend card resources and auto-register as Lovelace resources
    from .const import VERSION
    cards = [
        "yahatl-item-card.js",
        "yahatl-queue-card.js",
        "yahatl-item-editor.js",
    ]
    for card in cards:
        url = f"/yahatl/{card}"
        hass.http.register_static_path(
            url,
            hass.config.path(f"custom_components/yahatl/www/{card}"),
            cache_headers=False,
        )
        # Auto-register as Lovelace resource (storage mode only)
        try:
            resource_url = f"{url}?v={VERSION}"
            resources = await hass.components.lovelace.resources.async_get_info()
            existing_urls = {r["url"] for r in resources}
            if resource_url not in existing_urls:
                await hass.components.lovelace.resources.async_create_item(
                    {"res_type": "module", "url": resource_url}
                )
        except Exception:  # noqa: BLE001
            _LOGGER.debug("Could not auto-register Lovelace resource %s", url)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})

    # Store will be initialized by todo platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Start ReactivityManager after platforms are set up
    entry_data = hass.data[DOMAIN].get(entry.entry_id)
    if entry_data and "store" in entry_data:
        def all_lists_fn():
            result = []
            for ed in hass.data.get(DOMAIN, {}).values():
                if isinstance(ed, dict) and "data" in ed:
                    result.append(ed["data"])
            return result

        def data_fn():
            ed = hass.data[DOMAIN].get(entry.entry_id)
            return ed["data"] if ed and "data" in ed else None

        manager = ReactivityManager(hass, entry_data["store"], all_lists_fn, data_fn)
        entry_data["reactivity_manager"] = manager
        await manager.async_start()

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    entry_data = hass.data[DOMAIN].get(entry.entry_id)
    if entry_data and "reactivity_manager" in entry_data:
        await entry_data["reactivity_manager"].async_stop()

    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    storage_key = entry.data[CONF_STORAGE_KEY]
    store_path = get_store_path(hass, storage_key)
    store = YahtlStore(hass, store_path)
    await store.async_delete()
