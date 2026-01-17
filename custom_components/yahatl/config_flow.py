"""Config flow for yahatl integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.util import slugify

from .const import CONF_LIST_NAME, CONF_STORAGE_KEY, DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_LIST_NAME): str,
    }
)


class YahtlConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for yahatl."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}

        if user_input is not None:
            # Generate storage key from list name
            storage_key = slugify(user_input[CONF_LIST_NAME])

            # Check for duplicate
            self._async_abort_entries_match({CONF_STORAGE_KEY: storage_key})

            # Add storage key to data
            user_input[CONF_STORAGE_KEY] = storage_key

            return self.async_create_entry(
                title=user_input[CONF_LIST_NAME],
                data=user_input,
            )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )
