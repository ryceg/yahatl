"""Storage for yahatl lists."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import slugify

from .const import STORAGE_VERSION
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)


class YahtlStore:
    """Handle storage for a yahatl list."""

    def __init__(self, hass: HomeAssistant, path: Path) -> None:
        """Initialize the store."""
        self._hass = hass
        self._path = path
        self._lock = asyncio.Lock()
        self._data: YahtlList | None = None

    @property
    def data(self) -> YahtlList | None:
        """Return the loaded list data."""
        return self._data

    async def async_load(self) -> YahtlList | None:
        """Load the list from storage."""
        async with self._lock:
            content = await self._hass.async_add_executor_job(self._load)
            if content:
                try:
                    raw_data = json.loads(content)
                    self._data = YahtlList.from_dict(raw_data.get("data", {}))
                except (json.JSONDecodeError, KeyError) as err:
                    _LOGGER.error("Error loading yahatl data: %s", err)
                    self._data = None
            return self._data

    def _load(self) -> str:
        """Load content from file (sync)."""
        if not self._path.exists():
            return ""
        return self._path.read_text(encoding="utf-8")

    async def async_save(self, data: YahtlList) -> None:
        """Save the list to storage."""
        self._data = data
        async with self._lock:
            content = json.dumps(
                {
                    "version": STORAGE_VERSION,
                    "data": data.to_dict(),
                },
                indent=2,
            )
            await self._hass.async_add_executor_job(self._save, content)

    def _save(self, content: str) -> None:
        """Save content to file (sync)."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(content, encoding="utf-8")

    async def async_delete(self) -> None:
        """Delete the storage file."""
        async with self._lock:
            await self._hass.async_add_executor_job(self._delete)

    def _delete(self) -> None:
        """Delete the file (sync)."""
        if self._path.exists():
            self._path.unlink()


def get_store_path(hass: HomeAssistant, storage_key: str) -> Path:
    """Get the path for a storage file."""
    return Path(hass.config.path(f".storage/yahatl.{storage_key}.json"))
