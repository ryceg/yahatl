"""Todo platform for yahatl integration."""
from __future__ import annotations

import logging
from datetime import datetime

from homeassistant.util import dt as dt_util
from typing import Any, Callable

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    COMPLETION_HISTORY_CAP,
    CONF_STORAGE_KEY,
    DOMAIN,
    STATUS_COMPLETED,
    STATUS_PENDING,
    TRAIT_ACTIONABLE,
)
from .coordinator import YahtlCoordinator
from .models import CompletionRecord, YahtlItem, YahtlList
from .store import YahtlStore

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    runtime = config_entry.runtime_data
    entity = YahtlTodoListEntity(
        coordinator=runtime.coordinator,
        store=runtime.store,
        data=runtime.data,
        unique_id=config_entry.data[CONF_STORAGE_KEY],
    )
    async_add_entities([entity])


class YahtlTodoListEntity(CoordinatorEntity[YahtlCoordinator], TodoListEntity):
    """A yahatl todo list entity."""

    _attr_has_entity_name = True
    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.MOVE_TODO_ITEM
        | TodoListEntityFeature.SET_DUE_DATE_ON_ITEM
        | TodoListEntityFeature.SET_DUE_DATETIME_ON_ITEM
        | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
    )

    def __init__(
        self,
        coordinator: YahtlCoordinator,
        store: YahtlStore,
        data: YahtlList,
        unique_id: str,
    ) -> None:
        super().__init__(coordinator)
        self._store = store
        self._data = data
        self._attr_unique_id = unique_id
        self._attr_name = data.name
        # Group the todo entity with this list's sensors under one device.
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, unique_id)},
            name=data.name,
            manufacturer="yahatl",
            model="Todo list",
            entry_type=DeviceEntryType.SERVICE,
        )

    @callback
    def _handle_coordinator_update(self) -> None:
        data = self.coordinator.list_data
        if data is not None:
            self._data = data
        self.async_write_ha_state()

    @property
    def todo_items(self) -> list[TodoItem]:
        items = []
        for yahtl_item in self._data.items:
            # Only show actionable items that are not completed
            if TRAIT_ACTIONABLE not in yahtl_item.traits:
                continue

            status = (
                TodoItemStatus.COMPLETED
                if yahtl_item.status == STATUS_COMPLETED
                else TodoItemStatus.NEEDS_ACTION
            )

            items.append(
                TodoItem(
                    uid=yahtl_item.uid,
                    summary=yahtl_item.title,
                    description=yahtl_item.description or None,
                    due=yahtl_item.due,
                    status=status,
                )
            )
        return items

    async def async_create_todo_item(self, item: TodoItem) -> None:
        yahtl_item = YahtlItem.create(
            title=item.summary or "Untitled",
        )

        if item.description:
            yahtl_item.description = item.description
        if item.due:
            yahtl_item.due = item.due if isinstance(item.due, datetime) else datetime.combine(item.due, datetime.min.time())

        self._data.add_item(yahtl_item)
        await self._async_save()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        yahtl_item = self._data.get_item(item.uid)
        if yahtl_item is None:
            return

        if item.summary is not None:
            yahtl_item.title = item.summary
        if item.description is not None:
            yahtl_item.description = item.description
        if item.due is not None:
            yahtl_item.due = item.due if isinstance(item.due, datetime) else datetime.combine(item.due, datetime.min.time())
        elif hasattr(item, 'due') and item.due is None:
            # Explicitly cleared
            yahtl_item.due = None

        if item.status is not None:
            if item.status == TodoItemStatus.COMPLETED:
                await self._complete_item(yahtl_item)
            else:
                yahtl_item.status = STATUS_PENDING

        await self._async_save()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        for uid in uids:
            self._data.remove_item(uid)
        await self._async_save()

    async def async_move_todo_item(
        self, uid: str, previous_uid: str | None = None
    ) -> None:
        # Find the item to move
        item_to_move = None
        item_index = None
        for i, item in enumerate(self._data.items):
            if item.uid == uid:
                item_to_move = item
                item_index = i
                break

        if item_to_move is None:
            return

        # Remove from current position
        self._data.items.pop(item_index)

        # Find new position
        if previous_uid is None:
            # Move to beginning
            self._data.items.insert(0, item_to_move)
        else:
            # Find previous item and insert after it
            for i, item in enumerate(self._data.items):
                if item.uid == previous_uid:
                    self._data.items.insert(i + 1, item_to_move)
                    break
            else:
                # Previous not found, add to end
                self._data.items.append(item_to_move)

        await self._async_save()

    async def _complete_item(self, item: YahtlItem, user_id: str = "") -> None:
        """Mark an item as completed and record history."""
        item.status = STATUS_COMPLETED
        item.deferred_until = None

        # Add completion record
        record = CompletionRecord(
            user_id=user_id,
            timestamp=dt_util.now(),
        )
        item.completion_history.append(record)

        # Cap history
        if len(item.completion_history) > COMPLETION_HISTORY_CAP:
            item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

    async def _async_save(self) -> None:
        await self._store.async_save(self._data)
        self.async_write_ha_state()
        await self.coordinator.async_request_refresh()
