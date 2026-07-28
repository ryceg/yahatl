"""Config flow for yahatl integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.util import slugify

from .const import (
    CONF_LIST_NAME,
    CONF_RETENTION_DAYS,
    CONF_STORAGE_KEY,
    DEFAULT_RETENTION_DAYS,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_LIST_NAME): str,
    }
)


class YahtlConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for yahatl."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> YahtlOptionsFlow:
        """Return the options flow handler."""
        return YahtlOptionsFlow()

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

    async def async_step_import(
        self, user_input: dict[str, Any]
    ) -> ConfigFlowResult:
        """Create a list programmatically (e.g. via the yahatl.create_list service)."""
        storage_key = slugify(user_input[CONF_LIST_NAME])
        self._async_abort_entries_match({CONF_STORAGE_KEY: storage_key})
        return self.async_create_entry(
            title=user_input[CONF_LIST_NAME],
            data={
                CONF_LIST_NAME: user_input[CONF_LIST_NAME],
                CONF_STORAGE_KEY: storage_key,
            },
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Rename a list.

        Only the display name changes: CONF_STORAGE_KEY is the storage file /
        unique_id identity and must never change, so entity_ids stay stable
        and the reload simply re-derives entity/device names from the new
        data.name (todo.py/sensor.py/calendar.py build DeviceInfo from it).
        """
        entry = self._get_reconfigure_entry()

        if user_input is not None:
            new_name = user_input[CONF_LIST_NAME]

            # Update the stored list's name too, so the persisted data agrees
            # with the entry before the reload rebuilds the platforms. Guard
            # for the entry not being loaded (runtime_data only exists then);
            # in that case the rename lands in entry data alone and the store
            # keeps its old name until edited while loaded.
            if entry.state is ConfigEntryState.LOADED:
                runtime = getattr(entry, "runtime_data", None)
                if runtime is not None and runtime.data is not None:
                    runtime.data.name = new_name
                    await runtime.store.async_save(runtime.data)

            return self.async_update_reload_and_abort(
                entry,
                title=new_name,
                data={**entry.data, CONF_LIST_NAME: new_name},
            )

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_LIST_NAME, default=entry.data[CONF_LIST_NAME]
                    ): str,
                }
            ),
        )


class YahtlOptionsFlow(OptionsFlow):
    """Handle yahatl options (per-list retention window)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_RETENTION_DAYS,
                        default=self.config_entry.options.get(
                            CONF_RETENTION_DAYS, DEFAULT_RETENTION_DAYS
                        ),
                    ): vol.All(vol.Coerce(int), vol.Range(min=0)),
                }
            ),
        )
