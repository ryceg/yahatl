"""The yahatl integration."""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import logging

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_LIST_NAME, CONF_STORAGE_KEY, DOMAIN
from .coordinator import YahtlCoordinator
from .meta_store import MetaStore
from .models import YahtlList
from .services import async_setup_services, async_unload_services
from .store import YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO, Platform.SENSOR]


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

    # Register frontend bundle and auto-register as Lovelace resource
    from .const import VERSION
    bundle = "yahatl.js"
    bundle_url = f"/yahatl/{bundle}"
    bundle_path = hass.config.path(f"custom_components/yahatl/www/{bundle}")
    await hass.http.async_register_static_paths(
        [StaticPathConfig(bundle_url, bundle_path, False)]
    )
    try:
        # Cache-buster derived from bundle *content*, so every rebuild busts
        # browser caches even when manifest VERSION is unchanged. Version-based
        # busting only fires on a version bump — easy to forget, and the source
        # of the stale-bundle drift this replaces. Same content -> same URL, so
        # unchanged rebuilds keep the browser cache warm.
        try:
            digest = hashlib.md5(
                await hass.async_add_executor_job(_read_bytes, bundle_path)
            ).hexdigest()[:8]
        except OSError:
            digest = VERSION
        resource_url = f"{bundle_url}?v={digest}"
        # Access the Lovelace resource collection directly. The old
        # hass.components.lovelace accessor is deprecated, and its
        # async_get_info() returns a {"resources": <count>} dict — not a list —
        # so the previous loop raised and was swallowed, which is why the
        # resource silently stopped updating (its cache-buster never changed).
        from homeassistant.components.lovelace.const import LOVELACE_DATA
        from homeassistant.components.lovelace.resources import ResourceStorageCollection

        lovelace_data = hass.data.get(LOVELACE_DATA)
        resources = getattr(lovelace_data, "resources", None)
        if not isinstance(resources, ResourceStorageCollection):
            # YAML-managed dashboards edit resources in configuration.yaml.
            _LOGGER.debug("Lovelace resources not storage-managed; skipping %s", resource_url)
        else:
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
    except Exception:  # noqa: BLE001
        _LOGGER.warning("Could not auto-register Lovelace resource %s", bundle_url)

    return True


async def async_setup_entry(hass: HomeAssistant, entry: YahtlConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})

    storage_key = entry.data[CONF_STORAGE_KEY]
    list_name = entry.data[CONF_LIST_NAME]
    store = YahtlStore(hass, storage_key)

    data = await store.async_load()
    if data is None:
        data = YahtlList(list_id=storage_key, name=list_name)
        await store.async_save(data)

    coordinator = YahtlCoordinator(hass, entry, store)
    entry.runtime_data = YahtlRuntimeData(store=store, data=data, coordinator=coordinator)

    # Compute the first snapshot before entities are added so sensors render
    # populated immediately (and the entry retries if the queue engine fails).
    await coordinator.async_config_entry_first_refresh()

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: YahtlConfigEntry) -> bool:
    # The coordinator registers its own async_shutdown via config_entry.async_on_unload
    # at construction, so unloading the platforms is all that's needed here.
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    storage_key = entry.data[CONF_STORAGE_KEY]
    store = YahtlStore(hass, storage_key)
    await store.async_delete()
