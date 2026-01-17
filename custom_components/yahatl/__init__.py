"""The yahatl integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_STORAGE_KEY, DOMAIN
from .services import async_setup_services, async_unload_services
from .store import get_store_path, YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the yahatl component."""
    hass.data.setdefault(DOMAIN, {})
    await async_setup_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up yahatl from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Store will be initialized by todo platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle removal of a config entry."""
    storage_key = entry.data[CONF_STORAGE_KEY]
    store_path = get_store_path(hass, storage_key)
    store = YahtlStore(hass, store_path)
    await store.async_delete()
