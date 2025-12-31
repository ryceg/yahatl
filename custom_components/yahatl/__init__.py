"""YAHATL Home Assistant integration."""

import logging
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
import voluptuous as vol
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_DURATION_MINUTES,
    ATTR_NOTE_ID,
    ATTR_TAGS,
    ATTR_TITLE,
    DOMAIN,
    PLATFORMS,
    SERVICE_CAPTURE,
    SERVICE_COMPLETE_CHORE,
    SERVICE_COMPLETE_TASK,
    SERVICE_LOG_HABIT,
    SERVICE_START_POMODORO,
    SERVICE_STOP_POMODORO,
)
from .coordinator import YahatlCoordinator
from .db.repository import YahatlRepository
from .http import setup_views

_LOGGER = logging.getLogger(__name__)

# Service schemas
SERVICE_CAPTURE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_TITLE): cv.string,
        vol.Optional(ATTR_TAGS, default=[]): vol.All(cv.ensure_list, [cv.string]),
    }
)

SERVICE_NOTE_ID_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NOTE_ID): cv.string,
    }
)

SERVICE_START_POMODORO_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_NOTE_ID): cv.string,
        vol.Optional(ATTR_DURATION_MINUTES, default=25): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=120)
        ),
    }
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up YAHATL from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Initialize database
    db_path = Path(hass.config.path(".storage")) / "yahatl.db"
    repository = await hass.async_add_executor_job(YahatlRepository, db_path)

    # Create or get household and user
    household_name = entry.data.get("household_name", "Home")
    email = entry.data.get("email", "admin@yahatl.local")
    password = entry.data.get("password", "password")

    household = await hass.async_add_executor_job(
        repository.get_or_create_household, household_name
    )

    # Simple password hash for HA context (not production secure)
    password_hash = f"ha:{password}"
    user = await hass.async_add_executor_job(
        repository.get_or_create_user, email, password_hash, household.id
    )

    # Create coordinator
    coordinator = YahatlCoordinator(
        hass, entry, repository, household.id, user.id
    )

    # Fetch initial data
    await coordinator.async_config_entry_first_refresh()

    # Store references
    hass.data[DOMAIN][entry.entry_id] = {
        "coordinator": coordinator,
        "repository": repository,
        "household_id": household.id,
        "user_id": user.id,
    }

    # Set up platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services
    await _async_register_services(hass, coordinator)

    # Register HTTP API views for mobile app
    setup_views(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok


async def _async_register_services(
    hass: HomeAssistant, coordinator: YahatlCoordinator
) -> None:
    """Register YAHATL services."""

    async def handle_capture(call: ServiceCall) -> None:
        """Handle capture service call."""
        await coordinator.async_capture(
            call.data[ATTR_TITLE],
            call.data.get(ATTR_TAGS),
        )

    async def handle_complete_task(call: ServiceCall) -> None:
        """Handle complete task service call."""
        await coordinator.async_complete_task(call.data[ATTR_NOTE_ID])

    async def handle_log_habit(call: ServiceCall) -> None:
        """Handle log habit service call."""
        await coordinator.async_log_habit(call.data[ATTR_NOTE_ID])

    async def handle_complete_chore(call: ServiceCall) -> None:
        """Handle complete chore service call."""
        await coordinator.async_complete_chore(call.data[ATTR_NOTE_ID])

    async def handle_start_pomodoro(call: ServiceCall) -> None:
        """Handle start Pomodoro service call."""
        await coordinator.async_start_pomodoro(
            call.data.get(ATTR_NOTE_ID),
            call.data.get(ATTR_DURATION_MINUTES, 25),
        )

    async def handle_stop_pomodoro(call: ServiceCall) -> None:
        """Handle stop Pomodoro service call."""
        await coordinator.async_stop_pomodoro()

    hass.services.async_register(
        DOMAIN, SERVICE_CAPTURE, handle_capture, schema=SERVICE_CAPTURE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_COMPLETE_TASK, handle_complete_task, schema=SERVICE_NOTE_ID_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_LOG_HABIT, handle_log_habit, schema=SERVICE_NOTE_ID_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_COMPLETE_CHORE, handle_complete_chore, schema=SERVICE_NOTE_ID_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_START_POMODORO, handle_start_pomodoro, schema=SERVICE_START_POMODORO_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_STOP_POMODORO, handle_stop_pomodoro)
