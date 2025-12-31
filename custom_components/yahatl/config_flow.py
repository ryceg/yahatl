"""Config flow for YAHATL integration."""

import logging
from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import CONF_HOUSEHOLD_NAME, DEFAULT_HOUSEHOLD_NAME, DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_HOUSEHOLD_NAME, default=DEFAULT_HOUSEHOLD_NAME): str,
        vol.Required("email", default="admin@yahatl.local"): str,
        vol.Required("password", default="password"): str,
    }
)


class YahatlConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for YAHATL."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.FlowResult:
        """Handle the initial step."""
        errors = {}

        if self._async_current_entries():
            return self.async_abort(reason="already_configured")

        if user_input is not None:
            # Validate input
            if len(user_input.get("password", "")) < 4:
                errors["password"] = "password_too_short"
            elif "@" not in user_input.get("email", ""):
                errors["email"] = "invalid_email"
            else:
                return self.async_create_entry(
                    title=user_input[CONF_HOUSEHOLD_NAME],
                    data=user_input,
                )

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Create the options flow."""
        return YahatlOptionsFlow(config_entry)


class YahatlOptionsFlow(config_entries.OptionsFlow):
    """Handle YAHATL options."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        "scan_interval",
                        default=self.config_entry.options.get("scan_interval", 60),
                    ): vol.All(vol.Coerce(int), vol.Range(min=10, max=300)),
                }
            ),
        )
