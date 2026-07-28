"""The yahatl integration."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
import hashlib
import logging

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError, HomeAssistantError
from homeassistant.loader import async_get_integration

from .const import CONF_LIST_NAME, CONF_STORAGE_KEY, DOMAIN
from .coordinator import YahtlCoordinator
from .meta_store import MetaStore
from .models import YahtlList
from .services import async_setup_services
from .store import YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO, Platform.SENSOR, Platform.CALENDAR]

FRONTEND_BUNDLE = "yahatl.js"
FRONTEND_URL = f"/{DOMAIN}/{FRONTEND_BUNDLE}"


@dataclass
class YahtlRuntimeData:
    """Per-config-entry runtime state, held on entry.runtime_data."""

    store: YahtlStore
    data: YahtlList
    coordinator: YahtlCoordinator


type YahtlConfigEntry = ConfigEntry[YahtlRuntimeData]


def _read_bytes(path: str) -> bytes:
    """Read a file's bytes (runs in the executor; never on the event loop)."""
    with open(path, "rb") as fh:
        return fh.read()


async def _async_sync_lovelace_resource(hass: HomeAssistant) -> None:
    """Point the Lovelace resource at the bundle's current content hash.

    Called from async_setup (once) AND every async_setup_entry, so a
    no-restart `reload_config_entry` after a `vite build` refreshes the
    cache-buster. async_setup — where the static path is registered — does
    NOT re-run on entry reload; only async_setup_entry does, so without the
    per-entry call the browser keeps serving the stale bundle even though
    the file on disk changed.

    The cache-buster is the bundle's content hash: every rebuild busts
    browser caches even when the manifest version is unchanged, and an
    unchanged rebuild keeps the same URL so the cache stays warm.

    A lock serialises the entry setups HA runs concurrently, and a cached
    last-synced URL makes repeat calls for the same hash a no-op.
    """
    bundle_path = hass.config.path(
        f"custom_components/{DOMAIN}/www/{FRONTEND_BUNDLE}"
    )
    try:
        digest = hashlib.md5(
            await hass.async_add_executor_job(_read_bytes, bundle_path)
        ).hexdigest()[:8]
    except OSError:
        # Bundle unreadable: fall back to the manifest version (loader has it
        # cached; no blocking file I/O at import time).
        digest = (await async_get_integration(hass, DOMAIN)).version
    resource_url = f"{FRONTEND_URL}?v={digest}"

    lock: asyncio.Lock = hass.data[DOMAIN].setdefault(
        "_resource_lock", asyncio.Lock()
    )
    async with lock:
        if hass.data[DOMAIN].get("_resource_url") == resource_url:
            return
        try:
            # The old hass.components.lovelace accessor is deprecated and its
            # async_get_info() returns a {"resources": <count>} dict — not a
            # list — so the previous loop raised and was swallowed, which is
            # why the resource silently stopped updating. Access the
            # collection directly instead.
            from homeassistant.components.lovelace.const import LOVELACE_DATA
            from homeassistant.components.lovelace.resources import (
                ResourceStorageCollection,
            )

            lovelace_data = hass.data.get(LOVELACE_DATA)
            resources = getattr(lovelace_data, "resources", None)
            if not isinstance(resources, ResourceStorageCollection):
                # YAML-managed dashboards edit resources in configuration.yaml.
                _LOGGER.debug(
                    "Lovelace resources not storage-managed; skipping %s",
                    resource_url,
                )
                return
            # The collection loads lazily (first frontend request). At boot we
            # get here first, so an unloaded collection iterates as [] — the
            # stale entry survives and a duplicate gets created, double-loading
            # the bundle ("custom element already defined" errors). Mirror
            # lovelace's own lazy-load guard before touching the items.
            if not resources.loaded:
                await resources.async_load()
                resources.loaded = True

            stale_prefixes = ("/yahatl/", "/local/yahatl")
            found = False
            for r in resources.async_items():  # sync @callback -> list[dict]
                url = r.get("url", "")
                if url == resource_url:
                    found = True
                elif url.split("?")[0].startswith(stale_prefixes):
                    await resources.async_delete_item(r["id"])
            if not found:
                await resources.async_create_item(
                    {"res_type": "module", "url": resource_url}
                )
            hass.data[DOMAIN]["_resource_url"] = resource_url
        except Exception:  # noqa: BLE001
            _LOGGER.warning(
                "Could not auto-register Lovelace resource %s", resource_url
            )


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})
    await async_setup_services(hass)

    # Load global meta config (contexts, locations)
    meta_store = MetaStore(hass)
    await meta_store.async_load()
    hass.data[DOMAIN]["meta_store"] = meta_store

    try:
        from .websocket_api import async_register_websocket_commands
        async_register_websocket_commands(hass)
    except Exception:
        _LOGGER.exception("Failed to register yahatl websocket commands")

    # Serve the frontend bundle (once) and sync its Lovelace resource
    # cache-buster to the built file's content hash. The sync also runs from
    # async_setup_entry so a no-restart reload refreshes it — see the helper.
    bundle_path = hass.config.path(
        f"custom_components/{DOMAIN}/www/{FRONTEND_BUNDLE}"
    )
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL, bundle_path, False)]
    )
    await _async_sync_lovelace_resource(hass)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: YahtlConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})

    storage_key = entry.data[CONF_STORAGE_KEY]
    list_name = entry.data[CONF_LIST_NAME]
    store = YahtlStore(hass, storage_key)

    try:
        data = await store.async_load()
    except HomeAssistantError as err:
        # A store (or legacy) file exists but can't be parsed. Fail setup
        # permanently and visibly rather than overwriting a recoverable file.
        raise ConfigEntryError(str(err)) from err
    if data is None:
        # Genuinely no store file and no legacy file: start a fresh list.
        data = YahtlList(list_id=storage_key, name=list_name)
        await store.async_save(data)

    coordinator = YahtlCoordinator(hass, entry, store)
    entry.runtime_data = YahtlRuntimeData(store=store, data=data, coordinator=coordinator)

    # Reload on options changes (e.g. retention_days) so they take effect.
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    # Compute the first snapshot before entities are added so sensors render
    # populated immediately (and the entry retries if the queue engine fails).
    await coordinator.async_config_entry_first_refresh()

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Refresh the frontend cache-buster on every (re)load: async_setup, which
    # registers the static path, does not re-run on reload_config_entry, so
    # this per-entry call is what makes a no-restart rebuild reach the browser.
    await _async_sync_lovelace_resource(hass)
    return True


async def _async_update_listener(hass: HomeAssistant, entry: YahtlConfigEntry) -> None:
    """Reload the entry when its options (or reconfigured data) change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: YahtlConfigEntry) -> bool:
    # The coordinator registers its own async_shutdown via config_entry.async_on_unload
    # at construction, so unloading the platforms is all that's needed here.
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    storage_key = entry.data[CONF_STORAGE_KEY]
    store = YahtlStore(hass, storage_key)
    await store.async_delete()
