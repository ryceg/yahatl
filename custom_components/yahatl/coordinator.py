"""DataUpdateCoordinator for YAHATL."""

import logging
from datetime import timedelta
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import DOMAIN
from .db.repository import YahatlRepository

_LOGGER = logging.getLogger(__name__)


class YahatlCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator to manage YAHATL data updates."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        repository: YahatlRepository,
        household_id: str,
        user_id: str,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=entry.options.get("scan_interval", 60)),
        )
        self.entry = entry
        self.repository = repository
        self.household_id = household_id
        self.user_id = user_id

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from the repository."""
        try:
            return await self.hass.async_add_executor_job(self._fetch_data)
        except Exception as err:
            raise UpdateFailed(f"Failed to fetch YAHATL data: {err}") from err

    def _fetch_data(self) -> dict[str, Any]:
        """Fetch all YAHATL data (runs in executor)."""
        stats = self.repository.get_stats(self.household_id)
        inbox = self.repository.get_notes(self.household_id, is_inbox=True)
        tasks = self.repository.get_tasks(self.household_id)
        habits = self.repository.get_habits(self.household_id)
        chores = self.repository.get_chores(self.household_id)
        active_pomo = self.repository.get_active_pomodoro(self.user_id)

        return {
            "stats": stats,
            "inbox": inbox,
            "tasks": tasks,
            "habits": habits,
            "chores": chores,
            "pomodoro_active": active_pomo is not None,
            "pomodoro_note_id": active_pomo.note_id if active_pomo else None,
        }

    # Action methods
    async def async_capture(self, title: str, tags: list[str] | None = None) -> None:
        """Quick capture a note to inbox."""
        await self.hass.async_add_executor_job(
            self.repository.create_note,
            title,
            self.user_id,
            self.household_id,
            None,  # body
            "Note",  # template_type
            True,  # is_inbox
            tags,
        )
        await self.async_request_refresh()

    async def async_complete_task(self, note_id: str) -> None:
        """Complete a task."""
        await self.hass.async_add_executor_job(
            self.repository.complete_task, note_id
        )
        await self.async_request_refresh()

    async def async_log_habit(self, note_id: str) -> None:
        """Log a habit completion."""
        await self.hass.async_add_executor_job(
            self.repository.log_habit, note_id
        )
        await self.async_request_refresh()

    async def async_complete_chore(self, note_id: str) -> None:
        """Complete a chore."""
        await self.hass.async_add_executor_job(
            self.repository.complete_chore, note_id
        )
        await self.async_request_refresh()

    async def async_start_pomodoro(
        self, note_id: str | None = None, duration_minutes: int = 25
    ) -> None:
        """Start a Pomodoro session."""
        await self.hass.async_add_executor_job(
            self.repository.start_pomodoro,
            self.user_id,
            note_id,
            duration_minutes,
        )
        await self.async_request_refresh()

    async def async_stop_pomodoro(self, completed: bool = True) -> None:
        """Stop the active Pomodoro session."""
        await self.hass.async_add_executor_job(
            self.repository.stop_pomodoro, self.user_id, completed
        )
        await self.async_request_refresh()
