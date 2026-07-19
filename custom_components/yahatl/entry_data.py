"""Helpers for reaching per-config-entry runtime state.

Per-entry state (the loaded list, its Store, and its coordinator) lives on
``entry.runtime_data``. These helpers walk the config entries so services, the
websocket API and the coordinator all read it the same way instead of each
re-implementing the lookup.
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant

from .const import DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

    from . import YahtlRuntimeData
    from .models import YahtlList


def iter_runtime(hass: HomeAssistant) -> Iterator[tuple["ConfigEntry", "YahtlRuntimeData"]]:
    """Yield (entry, runtime_data) for every loaded yahatl list."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        runtime = getattr(entry, "runtime_data", None)
        if runtime is not None and getattr(runtime, "data", None) is not None:
            yield entry, runtime


def all_lists(hass: HomeAssistant) -> list["YahtlList"]:
    """Every loaded list, across all entries."""
    return [runtime.data for _entry, runtime in iter_runtime(hass)]


def resolve_entity(hass: HomeAssistant, entity_id: str):
    """Return (entry, runtime_data) for a todo entity_id, or (None, None)."""
    for entry, runtime in iter_runtime(hass):
        if f"todo.{runtime.data.list_id}" == entity_id:
            return entry, runtime
    return None, None


def runtime_for_list(hass: HomeAssistant, target: "YahtlList"):
    """Return (entry, runtime_data) whose data IS ``target``, or (None, None)."""
    for entry, runtime in iter_runtime(hass):
        if runtime.data is target:
            return entry, runtime
    return None, None
