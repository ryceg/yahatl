# Phase 1: yahatl Core Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a working Home Assistant custom integration that extends the todo platform with yahatl's rich item schema, supporting traits, tags, status, and completion history.

**Architecture:** Custom integration extending HA's TodoListEntity. Uses JSON file storage (not ical) for flexibility with extended schema. Config flow for creating lists. Custom services for yahatl-specific operations.

**Tech Stack:** Python 3.11+, Home Assistant Core APIs, voluptuous for schema validation, asyncio for async operations.

---

## Prerequisites

Before starting, ensure you have:
- A Home Assistant development environment (devcontainer recommended)
- Python 3.11+
- Basic understanding of Home Assistant's integration structure

**Reference Documentation:**
- [Creating your first integration](https://developers.home-assistant.io/docs/creating_component_index/)
- [Todo Entity](https://developers.home-assistant.io/docs/core/entity/todo)
- [Integration Services](https://developers.home-assistant.io/docs/dev_101_services/)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `custom_components/yahatl/__init__.py`
- Create: `custom_components/yahatl/manifest.json`
- Create: `custom_components/yahatl/const.py`
- Create: `hacs.json`

**Step 1: Create directory structure**

```bash
mkdir -p custom_components/yahatl
```

**Step 2: Create manifest.json**

```json
{
  "domain": "yahatl",
  "name": "yahatl - Yet Another Home Assistant Todo List",
  "codeowners": ["@rhysg"],
  "config_flow": true,
  "documentation": "https://github.com/rhysg/yahatl-core",
  "iot_class": "local_push",
  "requirements": [],
  "version": "0.1.0"
}
```

**Step 3: Create const.py**

```python
"""Constants for yahatl integration."""

DOMAIN = "yahatl"

# Config keys
CONF_LIST_NAME = "list_name"
CONF_STORAGE_KEY = "storage_key"

# Item traits (composable flags)
TRAIT_ACTIONABLE = "actionable"
TRAIT_RECURRING = "recurring"
TRAIT_HABIT = "habit"
TRAIT_CHORE = "chore"
TRAIT_REMINDER = "reminder"
TRAIT_NOTE = "note"

ALL_TRAITS = [
    TRAIT_ACTIONABLE,
    TRAIT_RECURRING,
    TRAIT_HABIT,
    TRAIT_CHORE,
    TRAIT_REMINDER,
    TRAIT_NOTE,
]

# Item status
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_MISSED = "missed"

ALL_STATUSES = [STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_MISSED]

# Storage
STORAGE_VERSION = 1
COMPLETION_HISTORY_CAP = 365

# Defaults
DEFAULT_TIME_ESTIMATE = 30  # minutes
DEFAULT_BUFFER_BEFORE = 0
DEFAULT_BUFFER_AFTER = 0
```

**Step 4: Create minimal __init__.py**

```python
"""The yahatl integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up yahatl from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Store will be initialized by todo platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
```

**Step 5: Create hacs.json**

```json
{
  "name": "yahatl",
  "render_readme": true
}
```

**Step 6: Commit**

```bash
git add custom_components/yahatl/ hacs.json
git commit -m "feat: add yahatl integration scaffolding"
```

---

## Task 2: Storage Implementation

**Files:**
- Create: `custom_components/yahatl/store.py`
- Create: `custom_components/yahatl/models.py`

**Step 1: Create models.py with data classes**

```python
"""Data models for yahatl."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
import uuid


@dataclass
class CompletionRecord:
    """Record of a task completion."""

    user_id: str
    timestamp: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CompletionRecord:
        """Create from dictionary."""
        return cls(
            user_id=data["user_id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
        )


@dataclass
class YahtlItem:
    """A yahatl todo item with extended schema."""

    uid: str
    title: str
    description: str = ""

    # Type & Organization
    traits: list[str] = field(default_factory=lambda: ["actionable"])
    tags: list[str] = field(default_factory=list)

    # Status
    status: str = "pending"
    needs_detail: bool = False

    # Scheduling
    due: datetime | None = None
    time_estimate: int | None = None  # minutes
    buffer_before: int = 0
    buffer_after: int = 0

    # Tracking
    completion_history: list[CompletionRecord] = field(default_factory=list)
    current_streak: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = ""

    @classmethod
    def create(cls, title: str, created_by: str = "") -> YahtlItem:
        """Create a new item with generated UID."""
        return cls(
            uid=str(uuid.uuid4()),
            title=title,
            created_by=created_by,
            created_at=datetime.now(),
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "uid": self.uid,
            "title": self.title,
            "description": self.description,
            "traits": self.traits,
            "tags": self.tags,
            "status": self.status,
            "needs_detail": self.needs_detail,
            "due": self.due.isoformat() if self.due else None,
            "time_estimate": self.time_estimate,
            "buffer_before": self.buffer_before,
            "buffer_after": self.buffer_after,
            "completion_history": [r.to_dict() for r in self.completion_history],
            "current_streak": self.current_streak,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> YahtlItem:
        """Create from dictionary."""
        return cls(
            uid=data["uid"],
            title=data["title"],
            description=data.get("description", ""),
            traits=data.get("traits", ["actionable"]),
            tags=data.get("tags", []),
            status=data.get("status", "pending"),
            needs_detail=data.get("needs_detail", False),
            due=datetime.fromisoformat(data["due"]) if data.get("due") else None,
            time_estimate=data.get("time_estimate"),
            buffer_before=data.get("buffer_before", 0),
            buffer_after=data.get("buffer_after", 0),
            completion_history=[
                CompletionRecord.from_dict(r)
                for r in data.get("completion_history", [])
            ],
            current_streak=data.get("current_streak", 0),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
            created_by=data.get("created_by", ""),
        )


@dataclass
class YahtlList:
    """A yahatl todo list."""

    list_id: str
    name: str
    owner: str = ""
    visibility: str = "private"  # private or shared
    shared_with: list[str] = field(default_factory=list)
    is_inbox: bool = False
    items: list[YahtlItem] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "list_id": self.list_id,
            "name": self.name,
            "owner": self.owner,
            "visibility": self.visibility,
            "shared_with": self.shared_with,
            "is_inbox": self.is_inbox,
            "items": [item.to_dict() for item in self.items],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> YahtlList:
        """Create from dictionary."""
        return cls(
            list_id=data["list_id"],
            name=data["name"],
            owner=data.get("owner", ""),
            visibility=data.get("visibility", "private"),
            shared_with=data.get("shared_with", []),
            is_inbox=data.get("is_inbox", False),
            items=[YahtlItem.from_dict(i) for i in data.get("items", [])],
        )

    def get_item(self, uid: str) -> YahtlItem | None:
        """Get an item by UID."""
        for item in self.items:
            if item.uid == uid:
                return item
        return None

    def add_item(self, item: YahtlItem) -> None:
        """Add an item to the list."""
        self.items.append(item)

    def remove_item(self, uid: str) -> bool:
        """Remove an item by UID. Returns True if found and removed."""
        for i, item in enumerate(self.items):
            if item.uid == uid:
                self.items.pop(i)
                return True
        return False
```

**Step 2: Create store.py**

```python
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
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/models.py custom_components/yahatl/store.py
git commit -m "feat: add yahatl data models and storage"
```

---

## Task 3: Config Flow

**Files:**
- Create: `custom_components/yahatl/config_flow.py`
- Create: `custom_components/yahatl/strings.json`

**Step 1: Create config_flow.py**

```python
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
```

**Step 2: Create strings.json**

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Create a yahatl list",
        "description": "Enter a name for your new todo list.",
        "data": {
          "list_name": "List name"
        }
      }
    },
    "abort": {
      "already_configured": "A list with this name already exists."
    }
  }
}
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/config_flow.py custom_components/yahatl/strings.json
git commit -m "feat: add config flow for creating yahatl lists"
```

---

## Task 4: Todo Entity Implementation

**Files:**
- Create: `custom_components/yahatl/todo.py`
- Modify: `custom_components/yahatl/__init__.py`

**Step 1: Create todo.py**

```python
"""Todo platform for yahatl integration."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    COMPLETION_HISTORY_CAP,
    CONF_LIST_NAME,
    CONF_STORAGE_KEY,
    DOMAIN,
    STATUS_COMPLETED,
    STATUS_PENDING,
    TRAIT_ACTIONABLE,
)
from .models import CompletionRecord, YahtlItem, YahtlList
from .store import YahtlStore, get_store_path

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up yahatl todo entities from a config entry."""
    storage_key = config_entry.data[CONF_STORAGE_KEY]
    list_name = config_entry.data[CONF_LIST_NAME]

    # Initialize storage
    store_path = get_store_path(hass, storage_key)
    store = YahtlStore(hass, store_path)

    # Load existing data or create new list
    data = await store.async_load()
    if data is None:
        data = YahtlList(
            list_id=storage_key,
            name=list_name,
        )
        await store.async_save(data)

    # Store reference for services
    hass.data[DOMAIN][config_entry.entry_id] = {
        "store": store,
        "data": data,
    }

    entity = YahtlTodoListEntity(
        store=store,
        data=data,
        unique_id=storage_key,
    )

    async_add_entities([entity])


class YahtlTodoListEntity(TodoListEntity):
    """A yahatl todo list entity."""

    _attr_has_entity_name = True
    _attr_should_poll = False
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
        store: YahtlStore,
        data: YahtlList,
        unique_id: str,
    ) -> None:
        """Initialize the entity."""
        self._store = store
        self._data = data
        self._attr_unique_id = unique_id
        self._attr_name = data.name

    @property
    def todo_items(self) -> list[TodoItem]:
        """Return the list of todo items."""
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
        """Create a todo item."""
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
        """Update a todo item."""
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
        """Delete todo items."""
        for uid in uids:
            self._data.remove_item(uid)
        await self._async_save()

    async def async_move_todo_item(
        self, uid: str, previous_uid: str | None = None
    ) -> None:
        """Move a todo item."""
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

        # Add completion record
        record = CompletionRecord(
            user_id=user_id,
            timestamp=datetime.now(),
        )
        item.completion_history.append(record)

        # Cap history
        if len(item.completion_history) > COMPLETION_HISTORY_CAP:
            item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

    async def _async_save(self) -> None:
        """Save changes and notify HA."""
        await self._store.async_save(self._data)
        self.async_write_ha_state()
```

**Step 2: Update __init__.py to handle removal**

```python
"""The yahatl integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_STORAGE_KEY, DOMAIN
from .store import get_store_path, YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up yahatl from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle removal of a config entry."""
    storage_key = entry.data[CONF_STORAGE_KEY]
    store_path = get_store_path(hass, storage_key)
    store = YahtlStore(hass, store_path)
    await store.async_delete()
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/todo.py custom_components/yahatl/__init__.py
git commit -m "feat: implement todo entity with extended yahatl schema"
```

---

## Task 5: Custom Services for Traits and Tags

**Files:**
- Create: `custom_components/yahatl/services.py`
- Create: `custom_components/yahatl/services.yaml`
- Modify: `custom_components/yahatl/__init__.py`

**Step 1: Create services.py**

```python
"""Services for yahatl integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.helpers import config_validation as cv

from .const import ALL_TRAITS, DOMAIN

_LOGGER = logging.getLogger(__name__)

SERVICE_SET_TRAITS = "set_traits"
SERVICE_ADD_TAGS = "add_tags"
SERVICE_REMOVE_TAGS = "remove_tags"
SERVICE_FLAG_NEEDS_DETAIL = "flag_needs_detail"

ATTR_ENTITY_ID = "entity_id"
ATTR_ITEM_ID = "item_id"
ATTR_TRAITS = "traits"
ATTR_TAGS = "tags"
ATTR_NEEDS_DETAIL = "needs_detail"

SERVICE_SET_TRAITS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_TRAITS): vol.All(cv.ensure_list, [vol.In(ALL_TRAITS)]),
    }
)

SERVICE_TAGS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_TAGS): vol.All(cv.ensure_list, [cv.string]),
    }
)

SERVICE_FLAG_NEEDS_DETAIL_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_NEEDS_DETAIL, default=True): cv.boolean,
    }
)


def _get_entry_data(hass: HomeAssistant, entity_id: str) -> dict[str, Any] | None:
    """Get entry data for an entity."""
    # Entity ID format: todo.yahatl_{storage_key}
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            expected_entity = f"todo.{list_data.list_id}"
            if entity_id == expected_entity:
                return data
    return None


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up yahatl services."""

    async def handle_set_traits(call: ServiceCall) -> None:
        """Handle set_traits service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        traits = call.data[ATTR_TRAITS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        item.traits = traits
        await store.async_save(list_data)

        # Notify entity to update state
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_add_tags(call: ServiceCall) -> None:
        """Handle add_tags service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        tags = call.data[ATTR_TAGS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Add tags (no duplicates)
        for tag in tags:
            if tag not in item.tags:
                item.tags.append(tag)

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_remove_tags(call: ServiceCall) -> None:
        """Handle remove_tags service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        tags = call.data[ATTR_TAGS]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Remove tags
        item.tags = [t for t in item.tags if t not in tags]

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    async def handle_flag_needs_detail(call: ServiceCall) -> None:
        """Handle flag_needs_detail service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        needs_detail = call.data[ATTR_NEEDS_DETAIL]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        item.needs_detail = needs_detail

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})

    hass.services.async_register(
        DOMAIN, SERVICE_SET_TRAITS, handle_set_traits, schema=SERVICE_SET_TRAITS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_TAGS, handle_add_tags, schema=SERVICE_TAGS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REMOVE_TAGS, handle_remove_tags, schema=SERVICE_TAGS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_FLAG_NEEDS_DETAIL,
        handle_flag_needs_detail,
        schema=SERVICE_FLAG_NEEDS_DETAIL_SCHEMA,
    )


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload yahatl services."""
    hass.services.async_remove(DOMAIN, SERVICE_SET_TRAITS)
    hass.services.async_remove(DOMAIN, SERVICE_ADD_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_REMOVE_TAGS)
    hass.services.async_remove(DOMAIN, SERVICE_FLAG_NEEDS_DETAIL)
```

**Step 2: Create services.yaml**

```yaml
set_traits:
  name: Set Traits
  description: Set the traits (type flags) for a yahatl item.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to update.
      required: true
      selector:
        text:
    traits:
      name: Traits
      description: List of traits to set on the item.
      required: true
      selector:
        select:
          multiple: true
          options:
            - actionable
            - recurring
            - habit
            - chore
            - reminder
            - note

add_tags:
  name: Add Tags
  description: Add tags to a yahatl item.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to update.
      required: true
      selector:
        text:
    tags:
      name: Tags
      description: Tags to add to the item.
      required: true
      selector:
        text:

remove_tags:
  name: Remove Tags
  description: Remove tags from a yahatl item.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to update.
      required: true
      selector:
        text:
    tags:
      name: Tags
      description: Tags to remove from the item.
      required: true
      selector:
        text:

flag_needs_detail:
  name: Flag Needs Detail
  description: Mark an item as needing more detail (for later fleshing out).
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to flag.
      required: true
      selector:
        text:
    needs_detail:
      name: Needs Detail
      description: Whether the item needs more detail.
      required: false
      default: true
      selector:
        boolean:
```

**Step 3: Update __init__.py to register services**

```python
"""The yahatl integration."""
from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import CONF_STORAGE_KEY, DOMAIN
from .services import async_setup_services, async_unload_services
from .store import get_store_path, YahtlStore

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.TODO]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the yahatl component."""
    hass.data.setdefault(DOMAIN, {})
    await async_setup_services(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up yahatl from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle removal of a config entry."""
    storage_key = entry.data[CONF_STORAGE_KEY]
    store_path = get_store_path(hass, storage_key)
    store = YahtlStore(hass, store_path)
    await store.async_delete()
```

**Step 4: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml custom_components/yahatl/__init__.py
git commit -m "feat: add yahatl services for traits, tags, and needs_detail flag"
```

---

## Task 6: Extended Add Item Service

**Files:**
- Modify: `custom_components/yahatl/services.py`
- Modify: `custom_components/yahatl/services.yaml`

**Step 1: Add yahatl.add_item service to services.py**

Add these constants at the top:

```python
SERVICE_ADD_ITEM = "add_item"

ATTR_TITLE = "title"
ATTR_DESCRIPTION = "description"
ATTR_DUE = "due"
ATTR_TIME_ESTIMATE = "time_estimate"
```

Add this schema:

```python
SERVICE_ADD_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_TITLE): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_TRAITS): vol.All(cv.ensure_list, [vol.In(ALL_TRAITS)]),
        vol.Optional(ATTR_TAGS): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional(ATTR_DUE): cv.datetime,
        vol.Optional(ATTR_TIME_ESTIMATE): cv.positive_int,
        vol.Optional(ATTR_NEEDS_DETAIL, default=False): cv.boolean,
    }
)
```

Add this handler in `async_setup_services`:

```python
    async def handle_add_item(call: ServiceCall) -> None:
        """Handle add_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        # Create new item
        from .models import YahtlItem
        item = YahtlItem.create(
            title=call.data[ATTR_TITLE],
        )

        if ATTR_DESCRIPTION in call.data:
            item.description = call.data[ATTR_DESCRIPTION]
        if ATTR_TRAITS in call.data:
            item.traits = call.data[ATTR_TRAITS]
        if ATTR_TAGS in call.data:
            item.tags = call.data[ATTR_TAGS]
        if ATTR_DUE in call.data:
            item.due = call.data[ATTR_DUE]
        if ATTR_TIME_ESTIMATE in call.data:
            item.time_estimate = call.data[ATTR_TIME_ESTIMATE]
        if ATTR_NEEDS_DETAIL in call.data:
            item.needs_detail = call.data[ATTR_NEEDS_DETAIL]

        list_data.add_item(item)
        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})
```

Register the service:

```python
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_ITEM, handle_add_item, schema=SERVICE_ADD_ITEM_SCHEMA
    )
```

Add to `async_unload_services`:

```python
    hass.services.async_remove(DOMAIN, SERVICE_ADD_ITEM)
```

**Step 2: Add service definition to services.yaml**

```yaml
add_item:
  name: Add Item
  description: Add a new item to a yahatl list with extended properties.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    title:
      name: Title
      description: The title of the item.
      required: true
      selector:
        text:
    description:
      name: Description
      description: Optional description for the item.
      required: false
      selector:
        text:
          multiline: true
    traits:
      name: Traits
      description: Traits to set on the item.
      required: false
      selector:
        select:
          multiple: true
          options:
            - actionable
            - recurring
            - habit
            - chore
            - reminder
            - note
    tags:
      name: Tags
      description: Tags to add to the item.
      required: false
      selector:
        text:
    due:
      name: Due
      description: Due date/time for the item.
      required: false
      selector:
        datetime:
    time_estimate:
      name: Time Estimate
      description: Estimated time to complete in minutes.
      required: false
      selector:
        number:
          min: 1
          max: 480
          unit_of_measurement: minutes
    needs_detail:
      name: Needs Detail
      description: Flag the item as needing more detail.
      required: false
      default: false
      selector:
        boolean:
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml
git commit -m "feat: add yahatl.add_item service with extended properties"
```

---

## Task 7: Complete Item Service with History

**Files:**
- Modify: `custom_components/yahatl/services.py`
- Modify: `custom_components/yahatl/services.yaml`

**Step 1: Add complete_item service to services.py**

Add constant:

```python
SERVICE_COMPLETE_ITEM = "complete_item"
ATTR_USER_ID = "user_id"
```

Add schema:

```python
SERVICE_COMPLETE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_USER_ID): cv.string,
    }
)
```

Add handler in `async_setup_services`:

```python
    async def handle_complete_item(call: ServiceCall) -> None:
        """Handle complete_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]
        user_id = call.data.get(ATTR_USER_ID, "")

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Mark as completed with history
        from datetime import datetime
        from .models import CompletionRecord
        from .const import COMPLETION_HISTORY_CAP, STATUS_COMPLETED

        item.status = STATUS_COMPLETED

        record = CompletionRecord(
            user_id=user_id,
            timestamp=datetime.now(),
        )
        item.completion_history.append(record)

        # Cap history
        if len(item.completion_history) > COMPLETION_HISTORY_CAP:
            item.completion_history = item.completion_history[-COMPLETION_HISTORY_CAP:]

        await store.async_save(list_data)

        # Fire completion event
        hass.bus.async_fire(
            f"{DOMAIN}_item_completed",
            {
                "entity_id": entity_id,
                "item_id": item_id,
                "item_title": item.title,
                "user_id": user_id,
            },
        )
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})
```

Register the service:

```python
    hass.services.async_register(
        DOMAIN,
        SERVICE_COMPLETE_ITEM,
        handle_complete_item,
        schema=SERVICE_COMPLETE_ITEM_SCHEMA,
    )
```

Add to `async_unload_services`:

```python
    hass.services.async_remove(DOMAIN, SERVICE_COMPLETE_ITEM)
```

**Step 2: Add service definition to services.yaml**

```yaml
complete_item:
  name: Complete Item
  description: Mark an item as completed and record completion history.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to complete.
      required: true
      selector:
        text:
    user_id:
      name: User ID
      description: Optional user ID to record who completed the item.
      required: false
      selector:
        text:
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml
git commit -m "feat: add yahatl.complete_item service with completion history"
```

---

## Task 8: Update Item Service

**Files:**
- Modify: `custom_components/yahatl/services.py`
- Modify: `custom_components/yahatl/services.yaml`

**Step 1: Add update_item service to services.py**

Add constant:

```python
SERVICE_UPDATE_ITEM = "update_item"
ATTR_STATUS = "status"
ATTR_BUFFER_BEFORE = "buffer_before"
ATTR_BUFFER_AFTER = "buffer_after"
```

Add schema:

```python
SERVICE_UPDATE_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_TITLE): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_STATUS): vol.In(["pending", "in_progress", "completed", "missed"]),
        vol.Optional(ATTR_DUE): cv.datetime,
        vol.Optional(ATTR_TIME_ESTIMATE): cv.positive_int,
        vol.Optional(ATTR_BUFFER_BEFORE): cv.positive_int,
        vol.Optional(ATTR_BUFFER_AFTER): cv.positive_int,
    }
)
```

Add handler:

```python
    async def handle_update_item(call: ServiceCall) -> None:
        """Handle update_item service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        item_id = call.data[ATTR_ITEM_ID]

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        item = list_data.get_item(item_id)
        if item is None:
            _LOGGER.error("Item %s not found in %s", item_id, entity_id)
            return

        # Update fields if provided
        if ATTR_TITLE in call.data:
            item.title = call.data[ATTR_TITLE]
        if ATTR_DESCRIPTION in call.data:
            item.description = call.data[ATTR_DESCRIPTION]
        if ATTR_STATUS in call.data:
            item.status = call.data[ATTR_STATUS]
        if ATTR_DUE in call.data:
            item.due = call.data[ATTR_DUE]
        if ATTR_TIME_ESTIMATE in call.data:
            item.time_estimate = call.data[ATTR_TIME_ESTIMATE]
        if ATTR_BUFFER_BEFORE in call.data:
            item.buffer_before = call.data[ATTR_BUFFER_BEFORE]
        if ATTR_BUFFER_AFTER in call.data:
            item.buffer_after = call.data[ATTR_BUFFER_AFTER]

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})
```

Register:

```python
    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE_ITEM, handle_update_item, schema=SERVICE_UPDATE_ITEM_SCHEMA
    )
```

Unload:

```python
    hass.services.async_remove(DOMAIN, SERVICE_UPDATE_ITEM)
```

**Step 2: Add to services.yaml**

```yaml
update_item:
  name: Update Item
  description: Update properties of an existing yahatl item.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    item_id:
      name: Item ID
      description: The unique ID of the item to update.
      required: true
      selector:
        text:
    title:
      name: Title
      description: New title for the item.
      required: false
      selector:
        text:
    description:
      name: Description
      description: New description for the item.
      required: false
      selector:
        text:
          multiline: true
    status:
      name: Status
      description: New status for the item.
      required: false
      selector:
        select:
          options:
            - pending
            - in_progress
            - completed
            - missed
    due:
      name: Due
      description: New due date/time.
      required: false
      selector:
        datetime:
    time_estimate:
      name: Time Estimate
      description: Estimated time to complete in minutes.
      required: false
      selector:
        number:
          min: 1
          max: 480
          unit_of_measurement: minutes
    buffer_before:
      name: Buffer Before
      description: Buffer time needed before task in minutes.
      required: false
      selector:
        number:
          min: 0
          max: 120
          unit_of_measurement: minutes
    buffer_after:
      name: Buffer After
      description: Buffer time needed after task in minutes.
      required: false
      selector:
        number:
          min: 0
          max: 120
          unit_of_measurement: minutes
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml
git commit -m "feat: add yahatl.update_item service"
```

---

## Task 9: List Visibility Service

**Files:**
- Modify: `custom_components/yahatl/services.py`
- Modify: `custom_components/yahatl/services.yaml`

**Step 1: Add set_list_visibility service to services.py**

Add constants:

```python
SERVICE_SET_LIST_VISIBILITY = "set_list_visibility"
ATTR_VISIBILITY = "visibility"
ATTR_SHARED_WITH = "shared_with"
```

Add schema:

```python
SERVICE_SET_LIST_VISIBILITY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_VISIBILITY): vol.In(["private", "shared"]),
        vol.Optional(ATTR_SHARED_WITH): vol.All(cv.ensure_list, [cv.string]),
    }
)
```

Add handler:

```python
    async def handle_set_list_visibility(call: ServiceCall) -> None:
        """Handle set_list_visibility service call."""
        entity_id = call.data[ATTR_ENTITY_ID]
        visibility = call.data[ATTR_VISIBILITY]
        shared_with = call.data.get(ATTR_SHARED_WITH, [])

        entry_data = _get_entry_data(hass, entity_id)
        if entry_data is None:
            _LOGGER.error("Entity %s not found", entity_id)
            return

        list_data = entry_data["data"]
        store = entry_data["store"]

        list_data.visibility = visibility
        list_data.shared_with = shared_with

        await store.async_save(list_data)
        hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})
```

Register:

```python
    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_LIST_VISIBILITY,
        handle_set_list_visibility,
        schema=SERVICE_SET_LIST_VISIBILITY_SCHEMA,
    )
```

Unload:

```python
    hass.services.async_remove(DOMAIN, SERVICE_SET_LIST_VISIBILITY)
```

**Step 2: Add to services.yaml**

```yaml
set_list_visibility:
  name: Set List Visibility
  description: Set the visibility and sharing settings for a yahatl list.
  fields:
    entity_id:
      name: Entity
      description: The yahatl list entity.
      required: true
      selector:
        entity:
          domain: todo
          integration: yahatl
    visibility:
      name: Visibility
      description: Whether the list is private or shared.
      required: true
      selector:
        select:
          options:
            - private
            - shared
    shared_with:
      name: Shared With
      description: List of user IDs to share with (if visibility is shared). Empty means all users.
      required: false
      selector:
        text:
```

**Step 3: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml
git commit -m "feat: add yahatl.set_list_visibility service"
```

---

## Task 10: Entity State Update Listener

**Files:**
- Modify: `custom_components/yahatl/todo.py`

**Step 1: Add event listener to update entity state**

Update the `YahtlTodoListEntity.__init__` method:

```python
    def __init__(
        self,
        store: YahtlStore,
        data: YahtlList,
        unique_id: str,
    ) -> None:
        """Initialize the entity."""
        self._store = store
        self._data = data
        self._attr_unique_id = unique_id
        self._attr_name = data.name
        self._unsub_update: Callable[[], None] | None = None
```

Add `async_added_to_hass` method:

```python
    async def async_added_to_hass(self) -> None:
        """Run when entity is added to hass."""
        await super().async_added_to_hass()

        @callback
        def handle_update(event):
            """Handle update event."""
            if event.data.get("entity_id") == self.entity_id:
                # Reload data from store
                if self._store.data:
                    self._data = self._store.data
                self.async_write_ha_state()

        self._unsub_update = self.hass.bus.async_listen(
            f"{DOMAIN}_updated", handle_update
        )
```

Add `async_will_remove_from_hass` method:

```python
    async def async_will_remove_from_hass(self) -> None:
        """Run when entity is removed from hass."""
        if self._unsub_update:
            self._unsub_update()
```

Add necessary imports at the top:

```python
from typing import Any, Callable
from homeassistant.core import callback
```

**Step 2: Commit**

```bash
git add custom_components/yahatl/todo.py
git commit -m "feat: add event listener to sync entity state with service updates"
```

---

## Task 11: Create README

**Files:**
- Create: `README.md`

**Step 1: Create README.md**

```markdown
# yahatl - Yet Another Home Assistant Todo List

A comprehensive task/habit/chore/reminder/notes system for Home Assistant.

## Features

- **Extended todo items** with traits (actionable, habit, chore, reminder, note)
- **Custom tags** for organization
- **Completion history tracking** - know who completed what and when
- **Status tracking** - pending, in_progress, completed, missed
- **Time estimates and buffers** for day planning
- **Needs detail flag** for quick capture and later triage

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click the three dots in the top right corner
3. Select "Custom repositories"
4. Add this repository URL and select "Integration" as the category
5. Install "yahatl"
6. Restart Home Assistant

### Manual

1. Copy the `custom_components/yahatl` folder to your Home Assistant's `custom_components` directory
2. Restart Home Assistant

## Configuration

1. Go to Settings → Devices & Services
2. Click "Add Integration"
3. Search for "yahatl"
4. Enter a name for your list

## Services

### yahatl.add_item

Add a new item with extended properties.

```yaml
service: yahatl.add_item
data:
  entity_id: todo.yahatl_my_list
  title: "Clean the gutters"
  traits:
    - actionable
    - chore
  tags:
    - outdoor
    - maintenance
  time_estimate: 60
  needs_detail: false
```

### yahatl.complete_item

Mark an item as completed with history tracking.

```yaml
service: yahatl.complete_item
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  user_id: "john"
```

### yahatl.update_item

Update item properties.

```yaml
service: yahatl.update_item
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  status: in_progress
  time_estimate: 45
```

### yahatl.set_traits

Set traits on an item.

```yaml
service: yahatl.set_traits
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  traits:
    - actionable
    - habit
```

### yahatl.add_tags / yahatl.remove_tags

Manage tags on an item.

```yaml
service: yahatl.add_tags
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  tags:
    - urgent
    - work
```

### yahatl.flag_needs_detail

Flag an item for later detailed planning.

```yaml
service: yahatl.flag_needs_detail
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  needs_detail: true
```

### yahatl.set_list_visibility

Configure list sharing.

```yaml
service: yahatl.set_list_visibility
data:
  entity_id: todo.yahatl_my_list
  visibility: shared
  shared_with: []  # Empty means all users
```

## Events

### yahatl_item_completed

Fired when an item is completed.

```yaml
event_type: yahatl_item_completed
event_data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  item_title: "Clean the gutters"
  user_id: "john"
```

## Roadmap

See [docs/plans/2026-01-17-yahatl-design.md](docs/plans/2026-01-17-yahatl-design.md) for the full design document.

### Phase 2: Recurrence & Blocking
- Calendar-based recurrence
- Elapsed-based recurrence
- Frequency goals with thresholds
- Task and sensor blockers

### Phase 3: Queue & Context
- Priority queue algorithm
- Context-aware task surfacing
- Location/people/time requirements

### Phase 4+: React Native App & Dashboard
- Mobile app for Android
- Home Assistant dashboard with Mushroom cards
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation and usage instructions"
```

---

## Summary

Phase 1 delivers a working yahatl integration with:

1. **Project scaffolding** - manifest, constants, HACS support
2. **Data models** - YahtlItem and YahtlList with full schema
3. **JSON storage** - file-based persistence with async operations
4. **Config flow** - UI for creating lists
5. **Todo entity** - extends HA's TodoListEntity with yahatl features
6. **Custom services**:
   - `yahatl.add_item` - create with extended properties
   - `yahatl.update_item` - modify any field
   - `yahatl.complete_item` - complete with history tracking
   - `yahatl.set_traits` - update type flags
   - `yahatl.add_tags` / `yahatl.remove_tags` - manage tags
   - `yahatl.flag_needs_detail` - mark for triage
   - `yahatl.set_list_visibility` - sharing settings
7. **Events** - `yahatl_item_completed` for automations
8. **Documentation** - README with examples

---

**Plan complete and saved to `docs/plans/2026-01-17-phase1-implementation.md`.**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
