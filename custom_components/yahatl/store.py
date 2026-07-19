"""Storage for yahatl lists, backed by Home Assistant's Store helper.

Using ``helpers.storage.Store`` (rather than hand-written JSON) gives us
atomic writes (temp file + rename, so a crash mid-write can't corrupt the
list), debounced/delayed saves, and a standard versioned envelope with a
migration hook. A one-time migration imports the pre-Store JSON file.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_VERSION
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)


def _legacy_path(hass: HomeAssistant, storage_key: str) -> Path:
    """Location of the pre-Store hand-written JSON file (for migration)."""
    return Path(hass.config.path(f".storage/{DOMAIN}.{storage_key}.json"))


class YahtlStore:
    """Persist a single yahatl list via HA's Store helper."""

    def __init__(self, hass: HomeAssistant, storage_key: str) -> None:
        self._hass = hass
        self._storage_key = storage_key
        # Store writes to .storage/<key>; keep the same yahatl.<key> namespace.
        self._store: Store[dict] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{storage_key}")
        self._data: YahtlList | None = None

    @property
    def data(self) -> YahtlList | None:
        return self._data

    async def async_load(self) -> YahtlList | None:
        raw = await self._store.async_load()
        if raw is None:
            raw = await self._async_migrate_legacy()
        if raw is not None:
            try:
                self._data = YahtlList.from_dict(raw)
            except (KeyError, TypeError, ValueError) as err:
                _LOGGER.error("Error loading yahatl data: %s", err)
                self._data = None
        return self._data

    async def async_save(self, data: YahtlList) -> None:
        self._data = data
        await self._store.async_save(data.to_dict())

    async def async_delete(self) -> None:
        await self._store.async_remove()
        # Clean up any leftover legacy file too.
        legacy = _legacy_path(self._hass, self._storage_key)

        def _remove_legacy() -> None:
            if legacy.exists():
                legacy.unlink()

        await self._hass.async_add_executor_job(_remove_legacy)

    async def _async_migrate_legacy(self) -> dict | None:
        """Import the old ``{"version", "data"}`` JSON file exactly once."""
        legacy = _legacy_path(self._hass, self._storage_key)

        def _read() -> str | None:
            if not legacy.exists():
                return None
            return legacy.read_text(encoding="utf-8")

        content = await self._hass.async_add_executor_job(_read)
        if not content:
            return None
        try:
            payload = json.loads(content)
        except json.JSONDecodeError as err:
            _LOGGER.error("Error migrating legacy yahatl data: %s", err)
            return None
        data = payload.get("data", {})
        # Persist into the Store, then retire the legacy file.
        await self._store.async_save(data)
        await self._hass.async_add_executor_job(legacy.unlink)
        _LOGGER.info("Migrated yahatl storage '%s' to the Store helper", self._storage_key)
        return data
