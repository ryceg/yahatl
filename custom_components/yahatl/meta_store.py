"""Storage for yahatl meta configuration (contexts, locations)."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN, SIGNAL_YAHATL_UPDATED

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1

DEFAULT_CONTEXTS = [
    {"id": "work_hours", "name": "Work hours", "icon": "mdi:briefcase-clock"},
    {"id": "productive", "name": "Productive", "icon": "mdi:lightning-bolt"},
    {"id": "weekend_project", "name": "Weekend project", "icon": "mdi:hammer-wrench"},
]


@dataclass
class MetaEntry:
    """A single context or location definition."""

    id: str
    name: str
    icon: str

    def to_dict(self) -> dict[str, str]:
        return {"id": self.id, "name": self.name, "icon": self.icon}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> MetaEntry:
        return cls(id=data["id"], name=data["name"], icon=data.get("icon", "mdi:label"))


@dataclass
class MetaConfig:
    """Global meta configuration."""

    contexts: list[MetaEntry] = field(default_factory=list)
    locations: list[MetaEntry] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "contexts": [c.to_dict() for c in self.contexts],
            "locations": [l.to_dict() for l in self.locations],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> MetaConfig:
        return cls(
            contexts=[MetaEntry.from_dict(c) for c in data.get("contexts", [])],
            locations=[MetaEntry.from_dict(l) for l in data.get("locations", [])],
        )

    @classmethod
    def default(cls) -> MetaConfig:
        return cls(contexts=[MetaEntry.from_dict(c) for c in DEFAULT_CONTEXTS])


class MetaStore:
    """Handle storage for yahatl meta configuration via HA's Store helper."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._hass = hass
        self._store: Store[dict] = Store(hass, STORAGE_VERSION, f"{DOMAIN}_meta")
        self._data: MetaConfig | None = None

    @property
    def data(self) -> MetaConfig:
        if self._data is None:
            return MetaConfig.default()
        return self._data

    async def async_load(self) -> MetaConfig:
        raw = await self._store.async_load()
        if raw is None:
            raw = await self._async_migrate_legacy()
        if raw is not None:
            try:
                self._data = MetaConfig.from_dict(raw)
            except (KeyError, TypeError, ValueError) as err:
                _LOGGER.error("Error loading yahatl meta: %s", err)
                self._data = MetaConfig.default()
        else:
            self._data = MetaConfig.default()
            await self._store.async_save(self._data.to_dict())
        return self._data

    async def async_save(self, data: MetaConfig) -> None:
        self._data = data
        await self._store.async_save(data.to_dict())
        # Same choke-point dispatch as YahtlStore; "meta" is the agreed
        # payload for meta-config (contexts/locations) changes.
        async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, "meta")

    async def _async_migrate_legacy(self) -> dict | None:
        """Import the old ``.storage/yahatl_meta.json`` file exactly once."""
        legacy = Path(self._hass.config.path(f".storage/{DOMAIN}_meta.json"))

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
            _LOGGER.error("Error migrating legacy yahatl meta: %s", err)
            return None
        data = payload.get("data", {})
        await self._store.async_save(data)
        await self._hass.async_add_executor_job(legacy.unlink)
        _LOGGER.info("Migrated yahatl meta storage to the Store helper")
        return data
