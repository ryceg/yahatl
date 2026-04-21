# UI-First Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every yahatl feature accessible through the Home Assistant UI — no service calls required for day-to-day use.

**Architecture:** WebSocket API for rich data retrieval, modal item editor as a web component, upgraded existing cards for interactivity, auto-registration of frontend resources, 3 new built-in sensors, cleanup of workaround files.

**Tech Stack:** Python (HA integration), vanilla JS web components (Lovelace cards), HA WebSocket API, voluptuous schemas, pytest with asyncio.

---

### Task 1: Add `deferred_until` to `update_item` service

**Files:**
- Modify: `custom_components/yahatl/services.py:127-139` (schema) and `services.py:394-417` (handler)
- Modify: `custom_components/yahatl/services.yaml:94-168` (service definition)
- Test: `tests/test_services_deferred.py`

**Step 1: Write the failing test**

Create `tests/test_services_deferred.py`:

```python
"""Tests for deferred_until field in update_item service."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.yahatl.models import YahtlItem, YahtlList


class TestUpdateItemDeferred:
    """Test update_item service accepts deferred_until."""

    def test_update_item_schema_accepts_deferred_until(self):
        """Test that the update_item schema allows deferred_until field."""
        from custom_components.yahatl.services import SERVICE_UPDATE_ITEM_SCHEMA

        tomorrow = datetime.now() + timedelta(days=1)
        data = {
            "entity_id": "todo.yahatl_test",
            "item_id": "abc-123",
            "deferred_until": tomorrow,
        }
        # Should not raise
        result = SERVICE_UPDATE_ITEM_SCHEMA(data)
        assert result["deferred_until"] == tomorrow

    def test_update_item_schema_accepts_none_deferred(self):
        """Test that the update_item schema allows clearing deferred_until."""
        from custom_components.yahatl.services import SERVICE_UPDATE_ITEM_SCHEMA

        data = {
            "entity_id": "todo.yahatl_test",
            "item_id": "abc-123",
        }
        # deferred_until is optional — should not raise
        result = SERVICE_UPDATE_ITEM_SCHEMA(data)
        assert "deferred_until" not in result
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_services_deferred.py -v`
Expected: FAIL — `deferred_until` not in schema, voluptuous rejects it.

**Step 3: Write minimal implementation**

In `services.py`, add `deferred_until` to the schema (line ~138):

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
        vol.Optional(ATTR_DEFERRED_UNTIL): vol.Any(cv.datetime, None),
    }
)
```

In `handle_update_item` (line ~414), add:

```python
        if ATTR_DEFERRED_UNTIL in call.data:
            item.deferred_until = call.data[ATTR_DEFERRED_UNTIL]
```

In `services.yaml`, add to the `update_item` fields section:

```yaml
    deferred_until:
      name: Deferred Until
      description: Defer the item until this date/time. Set to null to clear deferral.
      required: false
      selector:
        datetime:
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_services_deferred.py -v`
Expected: PASS

**Step 5: Run full test suite**

Run: `python -m pytest tests/ -v`
Expected: All existing tests still pass.

**Step 6: Commit**

```bash
git add custom_components/yahatl/services.py custom_components/yahatl/services.yaml tests/test_services_deferred.py
git commit -m "feat: add deferred_until to update_item service"
```

---

### Task 2: Add 3 new built-in sensors

**Files:**
- Modify: `custom_components/yahatl/sensor.py`
- Modify: `custom_components/yahatl/const.py` (add TRAIT_NOTE constant reference)
- Test: `tests/test_sensor.py` (add new test classes)

**Step 1: Write failing tests**

Add to `tests/test_sensor.py`:

```python
from custom_components.yahatl.sensor import (
    YahtlBlockedCountSensor,
    YahtlDueTodaySensor,
    YahtlInboxCountSensor,
    YahtlNextTaskSensor,
    YahtlNotesCountSensor,
    YahtlOverdueSensor,
    YahtlStreakRiskSensor,
)
from custom_components.yahatl.models import RecurrenceConfig, YahtlItem, YahtlList
from datetime import datetime, timedelta


def _make_list(*items):
    lst = YahtlList(list_id="test", name="Test")
    for item in items:
        lst.add_item(item)
    return lst


def _actionable_item(title, **kwargs):
    item = YahtlItem.create(title=title)
    item.traits = ["actionable"]
    for k, v in kwargs.items():
        setattr(item, k, v)
    return item


class TestInboxCountSensor:
    def test_counts_needs_detail_items(self):
        items = [
            _actionable_item("Needs detail", needs_detail=True),
            _actionable_item("Needs detail 2", needs_detail=True),
            _actionable_item("Fleshed out", needs_detail=False),
        ]
        data = _make_list(*items)
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_zero_when_no_inbox_items(self):
        data = _make_list(_actionable_item("Normal"))
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 0

    def test_excludes_completed_items(self):
        item = _actionable_item("Done", needs_detail=True, status="completed")
        data = _make_list(item)
        sensor = YahtlInboxCountSensor.__new__(YahtlInboxCountSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestNotesCountSensor:
    def test_counts_note_trait_items(self):
        note1 = YahtlItem.create(title="Note 1")
        note1.traits = ["note"]
        note2 = YahtlItem.create(title="Note 2")
        note2.traits = ["note"]
        task = _actionable_item("Task")
        data = _make_list(note1, note2, task)
        sensor = YahtlNotesCountSensor.__new__(YahtlNotesCountSensor)
        sensor._data = data
        assert sensor.native_value == 2

    def test_zero_when_no_notes(self):
        data = _make_list(_actionable_item("Task"))
        sensor = YahtlNotesCountSensor.__new__(YahtlNotesCountSensor)
        sensor._data = data
        assert sensor.native_value == 0


class TestStreakRiskSensor:
    def test_counts_at_risk_habits(self):
        habit = YahtlItem.create(title="Daily Run")
        habit.traits = ["actionable", "habit"]
        habit.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        habit.last_completed = datetime.now() - timedelta(days=1, hours=1)

        safe_habit = YahtlItem.create(title="Safe Habit")
        safe_habit.traits = ["actionable", "habit"]
        safe_habit.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        safe_habit.last_completed = datetime.now() - timedelta(hours=6)

        data = _make_list(habit, safe_habit)
        sensor = YahtlStreakRiskSensor.__new__(YahtlStreakRiskSensor)
        sensor._data = data
        assert sensor.native_value == 1

    def test_zero_when_no_habits(self):
        data = _make_list(_actionable_item("Task"))
        sensor = YahtlStreakRiskSensor.__new__(YahtlStreakRiskSensor)
        sensor._data = data
        assert sensor.native_value == 0
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_sensor.py::TestInboxCountSensor -v`
Expected: FAIL — `YahtlInboxCountSensor` does not exist.

**Step 3: Write minimal implementation**

Add to `custom_components/yahatl/sensor.py`, after the existing sensor classes:

```python
class YahtlInboxCountSensor(_YahtlBaseSensor):
    """Count of items flagged as needing more detail."""

    _attr_icon = "mdi:inbox"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "inbox_count")
        self._attr_name = f"{data.name} Inbox"

    @property
    def native_value(self) -> int:
        return sum(
            1 for i in self._actionable_items()
            if i.needs_detail
        )


class YahtlNotesCountSensor(_YahtlBaseSensor):
    """Count of items with the note trait."""

    _attr_icon = "mdi:note-multiple"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "notes_count")
        self._attr_name = f"{data.name} Notes"

    @property
    def native_value(self) -> int:
        return sum(1 for i in self._data.items if TRAIT_NOTE in i.traits)


class YahtlStreakRiskSensor(_YahtlBaseSensor):
    """Count of habits with streaks at risk of breaking."""

    _attr_icon = "mdi:fire-alert"

    def __init__(self, hass, data, store, storage_key):
        super().__init__(hass, data, store, storage_key, "streak_risk")
        self._attr_name = f"{data.name} Streak Risk"

    @property
    def native_value(self) -> int:
        return sum(
            1 for i in self._data.items
            if TRAIT_HABIT in i.traits and is_streak_at_risk(i)
        )
```

Add the new `TRAIT_NOTE` and `TRAIT_HABIT` imports at the top of `sensor.py`:

```python
from .const import CONF_STORAGE_KEY, DOMAIN, SIGNAL_YAHATL_UPDATED, STATUS_COMPLETED, TRAIT_ACTIONABLE, TRAIT_HABIT, TRAIT_NOTE
```

Register the new sensors in `async_setup_entry`:

```python
    async_add_entities([
        YahtlOverdueSensor(hass, data, store, storage_key),
        YahtlDueTodaySensor(hass, data, store, storage_key),
        YahtlNextTaskSensor(hass, data, store, storage_key),
        YahtlBlockedCountSensor(hass, data, store, storage_key),
        YahtlQueueSensor(hass, data, store, storage_key),
        YahtlInboxCountSensor(hass, data, store, storage_key),
        YahtlNotesCountSensor(hass, data, store, storage_key),
        YahtlStreakRiskSensor(hass, data, store, storage_key),
    ])
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_sensor.py -v`
Expected: All sensor tests PASS.

**Step 5: Run full test suite**

Run: `python -m pytest tests/ -v`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add custom_components/yahatl/sensor.py tests/test_sensor.py
git commit -m "feat: add inbox_count, notes_count, streak_risk sensors"
```

---

### Task 3: WebSocket API

**Files:**
- Create: `custom_components/yahatl/websocket_api.py`
- Modify: `custom_components/yahatl/__init__.py` (register WS commands)
- Modify: `custom_components/yahatl/manifest.json` (add dependencies)
- Test: `tests/test_websocket_api.py`

**Step 1: Write failing tests**

Create `tests/test_websocket_api.py`:

```python
"""Tests for yahatl WebSocket API."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.yahatl.models import (
    BlockerConfig,
    RecurrenceConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.websocket_api import (
    websocket_item_details,
    websocket_items_list,
    websocket_item_save,
)


def _make_hass_with_list(yahatl_list, store=None):
    """Create a mock hass with a yahatl list loaded."""
    hass = MagicMock()
    mock_store = store or MagicMock()
    mock_store.async_save = AsyncMock()
    mock_store.data = yahatl_list
    hass.data = {
        "yahatl": {
            "entry_1": {
                "data": yahatl_list,
                "store": mock_store,
            }
        }
    }
    hass.bus = MagicMock()
    hass.bus.async_fire = AsyncMock()
    return hass, mock_store


class TestWebsocketItemDetails:
    @pytest.mark.asyncio
    async def test_returns_full_item_dict(self):
        item = YahtlItem.create(title="Test Task")
        item.traits = ["actionable", "habit"]
        item.tags = ["urgent"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")

        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test", "item_id": item.uid}

        await websocket_item_details(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert result["uid"] == item.uid
        assert result["title"] == "Test Task"
        assert result["traits"] == ["actionable", "habit"]
        assert result["tags"] == ["urgent"]
        assert result["recurrence"]["type"] == "calendar"

    @pytest.mark.asyncio
    async def test_sends_error_for_missing_item(self):
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test", "item_id": "nonexistent"}

        await websocket_item_details(hass, connection, msg)

        connection.send_error.assert_called_once()


class TestWebsocketItemsList:
    @pytest.mark.asyncio
    async def test_returns_summary_list(self):
        item1 = YahtlItem.create(title="Task A")
        item1.traits = ["actionable"]
        item2 = YahtlItem.create(title="Task B")
        item2.traits = ["note"]

        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item1)
        yahatl_list.add_item(item2)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {"id": 1, "entity_id": "todo.yahatl_test"}

        await websocket_items_list(hass, connection, msg)

        connection.send_result.assert_called_once()
        result = connection.send_result.call_args[0][1]
        assert len(result) == 2
        assert result[0]["uid"] == item1.uid
        assert result[0]["title"] == "Task A"
        assert result[0]["traits"] == ["actionable"]
        assert "recurrence" not in result[0]  # summary only


class TestWebsocketItemSave:
    @pytest.mark.asyncio
    async def test_saves_basic_fields(self):
        item = YahtlItem.create(title="Original")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "title": "Updated",
            "description": "New desc",
            "priority": "high",
        }

        await websocket_item_save(hass, connection, msg)

        assert item.title == "Updated"
        assert item.description == "New desc"
        assert item.priority == "high"
        mock_store.async_save.assert_called_once()
        connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_saves_traits_and_tags(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "traits": ["actionable", "habit"],
            "tags": ["fitness", "daily"],
        }

        await websocket_item_save(hass, connection, msg)

        assert item.traits == ["actionable", "habit"]
        assert item.tags == ["fitness", "daily"]

    @pytest.mark.asyncio
    async def test_saves_recurrence(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "recurrence": {"type": "elapsed", "elapsed_interval": 7, "elapsed_unit": "days"},
        }

        await websocket_item_save(hass, connection, msg)

        assert item.recurrence is not None
        assert item.recurrence.type == "elapsed"
        assert item.recurrence.elapsed_interval == 7

    @pytest.mark.asyncio
    async def test_clears_recurrence_with_none(self):
        item = YahtlItem.create(title="Task")
        item.recurrence = RecurrenceConfig(type="calendar", calendar_pattern="daily")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "recurrence": None,
        }

        await websocket_item_save(hass, connection, msg)

        assert item.recurrence is None

    @pytest.mark.asyncio
    async def test_saves_blockers(self):
        item = YahtlItem.create(title="Task")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, mock_store = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "blockers": {
                "mode": "ANY",
                "items": ["other-uid"],
                "item_mode": "ANY",
                "sensors": ["binary_sensor.door"],
                "sensor_mode": "ALL",
            },
        }

        await websocket_item_save(hass, connection, msg)

        assert item.blockers is not None
        assert item.blockers.mode == "ANY"
        assert item.blockers.items == ["other-uid"]

    @pytest.mark.asyncio
    async def test_returns_updated_item(self):
        item = YahtlItem.create(title="Original")
        yahatl_list = YahtlList(list_id="yahatl_test", name="Test")
        yahatl_list.add_item(item)

        hass, _ = _make_hass_with_list(yahatl_list)
        connection = MagicMock()
        msg = {
            "id": 1,
            "entity_id": "todo.yahatl_test",
            "item_id": item.uid,
            "title": "Updated",
        }

        await websocket_item_save(hass, connection, msg)

        result = connection.send_result.call_args[0][1]
        assert result["title"] == "Updated"
        assert result["uid"] == item.uid
```

**Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_websocket_api.py -v`
Expected: FAIL — module `custom_components.yahatl.websocket_api` does not exist.

**Step 3: Write implementation**

Create `custom_components/yahatl/websocket_api.py`:

```python
"""WebSocket API for yahatl — rich data retrieval for frontend cards."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import DOMAIN, SIGNAL_YAHATL_UPDATED
from .models import (
    BlockerConfig,
    ConditionTriggerConfig,
    RecurrenceConfig,
    RecurrenceThreshold,
    RequirementsConfig,
    TimeBlockerConfig,
)

_LOGGER = logging.getLogger(__name__)


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_item_details)
    websocket_api.async_register_command(hass, websocket_items_list)
    websocket_api.async_register_command(hass, websocket_item_save)


def _resolve_list(hass: HomeAssistant, entity_id: str):
    """Resolve entity_id to (list_data, store) or (None, None)."""
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if isinstance(data, dict) and "data" in data:
            list_data = data["data"]
            expected_entity = f"todo.{list_data.list_id}"
            if entity_id == expected_entity:
                return list_data, data["store"]
    return None, None


def _resolve_item(hass: HomeAssistant, entity_id: str, item_id: str):
    """Resolve to (list_data, store, item) or (None, None, None)."""
    list_data, store = _resolve_list(hass, entity_id)
    if list_data is None:
        return None, None, None
    item = list_data.get_item(item_id)
    if item is None:
        return None, None, None
    return list_data, store, item


@websocket_api.websocket_command(
    {
        vol.Required("type"): "yahatl/item_details",
        vol.Required("entity_id"): str,
        vol.Required("item_id"): str,
    }
)
@websocket_api.async_response
async def websocket_item_details(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return full item data for the editor."""
    list_data, store, item = _resolve_item(hass, msg["entity_id"], msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return
    connection.send_result(msg["id"], item.to_dict())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "yahatl/items_list",
        vol.Required("entity_id"): str,
    }
)
@websocket_api.async_response
async def websocket_items_list(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return lightweight summary of all items in a list."""
    list_data, store = _resolve_list(hass, msg["entity_id"])
    if list_data is None:
        connection.send_error(msg["id"], "list_not_found", "List not found")
        return
    result = [
        {
            "uid": item.uid,
            "title": item.title,
            "status": item.status,
            "traits": item.traits,
        }
        for item in list_data.items
    ]
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "yahatl/item_save",
        vol.Required("entity_id"): str,
        vol.Required("item_id"): str,
        vol.Optional("title"): str,
        vol.Optional("description"): str,
        vol.Optional("traits"): [str],
        vol.Optional("tags"): [str],
        vol.Optional("due"): vol.Any(str, None),
        vol.Optional("time_estimate"): vol.Any(int, None),
        vol.Optional("buffer_before"): int,
        vol.Optional("buffer_after"): int,
        vol.Optional("priority"): vol.Any(vol.In(["low", "medium", "high"]), None),
        vol.Optional("needs_detail"): bool,
        vol.Optional("recurrence"): vol.Any(dict, None),
        vol.Optional("blockers"): vol.Any(dict, None),
        vol.Optional("requirements"): vol.Any(dict, None),
        vol.Optional("condition_triggers"): vol.Any([dict], None),
        vol.Optional("time_blockers"): vol.Any([dict], None),
        vol.Optional("deferred_until"): vol.Any(str, None),
    }
)
@websocket_api.async_response
async def websocket_item_save(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Save any combination of item fields in one round-trip."""
    entity_id = msg["entity_id"]
    list_data, store, item = _resolve_item(hass, entity_id, msg["item_id"])
    if item is None:
        connection.send_error(msg["id"], "item_not_found", "Item not found")
        return

    # Simple scalar fields
    for field in ("title", "description", "priority", "needs_detail",
                  "time_estimate", "buffer_before", "buffer_after"):
        if field in msg:
            setattr(item, field, msg[field])

    if "traits" in msg:
        item.traits = msg["traits"]

    if "tags" in msg:
        item.tags = msg["tags"]

    if "due" in msg:
        item.due = datetime.fromisoformat(msg["due"]) if msg["due"] else None

    if "deferred_until" in msg:
        item.deferred_until = (
            datetime.fromisoformat(msg["deferred_until"])
            if msg["deferred_until"]
            else None
        )

    # Complex nested objects
    if "recurrence" in msg:
        item.recurrence = (
            RecurrenceConfig.from_dict(msg["recurrence"])
            if msg["recurrence"]
            else None
        )

    if "blockers" in msg:
        item.blockers = (
            BlockerConfig.from_dict(msg["blockers"])
            if msg["blockers"]
            else None
        )

    if "requirements" in msg:
        item.requirements = (
            RequirementsConfig.from_dict(msg["requirements"])
            if msg["requirements"]
            else None
        )

    if "condition_triggers" in msg:
        item.condition_triggers = (
            [ConditionTriggerConfig.from_dict(t) for t in msg["condition_triggers"]]
            if msg["condition_triggers"]
            else []
        )

    if "time_blockers" in msg:
        item.time_blockers = (
            [TimeBlockerConfig.from_dict(tb) for tb in msg["time_blockers"]]
            if msg["time_blockers"]
            else []
        )

    await store.async_save(list_data)
    async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, entity_id)
    connection.send_result(msg["id"], item.to_dict())
```

Update `custom_components/yahatl/__init__.py` to register WS commands and update manifest:

In `__init__.py`, add to `async_setup()`:

```python
from .websocket_api import async_register_websocket_commands
async_register_websocket_commands(hass)
```

Update `manifest.json`:

```json
{
  "domain": "yahatl",
  "name": "yahatl - Yet Another Home Assistant Todo List",
  "codeowners": ["@rhysg"],
  "config_flow": true,
  "documentation": "https://github.com/rhysg/yahatl-core",
  "iot_class": "local_push",
  "requirements": [],
  "version": "0.1.0",
  "dependencies": ["frontend", "http", "websocket_api"]
}
```

**Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_websocket_api.py -v`
Expected: All PASS.

**Step 5: Run full test suite**

Run: `python -m pytest tests/ -v`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add custom_components/yahatl/websocket_api.py custom_components/yahatl/__init__.py custom_components/yahatl/manifest.json tests/test_websocket_api.py
git commit -m "feat: add WebSocket API for item_details, items_list, item_save"
```

---

### Task 4: Auto-register frontend resources

**Files:**
- Modify: `custom_components/yahatl/__init__.py`

This task has no tests — it's HA infrastructure configuration.

**Step 1: Update `async_setup()` in `__init__.py`**

Replace the existing static path registration with full auto-registration of all card resources:

```python
async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})
    await async_setup_services(hass)

    from .websocket_api import async_register_websocket_commands
    async_register_websocket_commands(hass)

    # Register all frontend card resources
    version = "0.1.0"
    cards = [
        "yahatl-item-card.js",
        "yahatl-queue-card.js",
        "yahatl-item-editor.js",
    ]
    for card in cards:
        url = f"/yahatl/{card}"
        hass.http.register_static_path(
            url,
            hass.config.path(f"custom_components/yahatl/www/{card}"),
            cache_headers=False,
        )
        # Auto-register as Lovelace resource
        hass.data.setdefault("lovelace_resources", set())
        resource_url = f"{url}?v={version}"
        if resource_url not in hass.data["lovelace_resources"]:
            hass.data["lovelace_resources"].add(resource_url)

    return True
```

**Step 2: Verify existing tests still pass**

Run: `python -m pytest tests/ -v`
Expected: All pass — this is config-only, no logic changes.

**Step 3: Commit**

```bash
git add custom_components/yahatl/__init__.py
git commit -m "feat: auto-register all frontend card resources"
```

---

### Task 5: Build the item editor dialog

**Files:**
- Create: `custom_components/yahatl/www/yahatl-item-editor.js`

This is a frontend-only web component. No Python tests — verify manually in HA.

**Step 1: Create `yahatl-item-editor.js`**

This is a large file. Key structural requirements:

1. **Document-level event listener** — listens for `yahatl-open-editor` events from any card
2. **Modal overlay** — backdrop + centered dialog, respects HA CSS variables
3. **Data loading** — calls `hass.callWS()` for `yahatl/item_details` and `yahatl/items_list`
4. **Tab navigation** — 6 tabs: Basics, Traits & Tags, Recurrence, Blockers, Requirements, Schedule
5. **Form controls** — text inputs, selects, checkboxes, date pickers, dynamic lists
6. **Save** — collects changed fields, calls `hass.callWS()` for `yahatl/item_save`
7. **Close** — click backdrop, Cancel button, or Escape key

The component should:
- Use Shadow DOM for style isolation
- Use HA CSS custom properties: `--primary-color`, `--card-background-color`, `--primary-text-color`, `--secondary-text-color`, `--divider-color`
- Max-width 500px, scrollable content area
- Save/Cancel buttons fixed at dialog bottom
- Show loading spinner while fetching data
- Show error toast on save failure

**Tab details:**

Tab 1 — Basics:
- Title: `<input type="text">`
- Description: `<textarea>`
- Priority: `<select>` with none/low/medium/high
- Due: `<input type="datetime-local">`
- Time estimate: `<input type="number">` (minutes)
- Needs detail: `<input type="checkbox">`

Tab 2 — Traits & Tags:
- Trait checkboxes: actionable, recurring, habit, chore, reminder, note
- Tags: text input + "Add" button, chips with "x" remove buttons

Tab 3 — Recurrence:
- Type selector: none/calendar/elapsed/frequency
- Conditional fields shown/hidden based on type:
  - Calendar: pattern text input
  - Elapsed: interval number + unit select (days/weeks/months/years)
  - Frequency: count number + period number + unit select + thresholds list

Tab 4 — Blockers:
- Overall mode: ANY/ALL select
- Item blockers section: multi-select dropdown populated from `items_list` WS call, with item_mode ANY/ALL
- Sensor blockers section: text input for entity IDs (comma-separated), with sensor_mode ANY/ALL

Tab 5 — Requirements:
- Mode: ANY/ALL select
- Location: text input (comma-separated)
- People: text input (comma-separated)
- Time constraints: multi-select (business_hours, weekend, evening, morning, night)
- Context: text input (comma-separated)
- Sensors: text input for entity IDs (comma-separated)

Tab 6 — Schedule:
- Time blockers: add/remove rows with start_time, end_time, mode (suppress/allow), days checkboxes
- Condition triggers: add/remove rows with entity_id, operator, value, attribute (optional), on_match (boost/set_due)
- Defer until: `<input type="datetime-local">` with clear button

**Step 2: Verify the editor loads**

Manual verification in HA:
1. Add resource `/yahatl/yahatl-item-editor.js` (should auto-register)
2. Open a dashboard with a yahatl-item-card
3. Click "Edit" on an item
4. Editor modal should appear with item data populated

**Step 3: Commit**

```bash
git add custom_components/yahatl/www/yahatl-item-editor.js
git commit -m "feat: add item editor dialog web component"
```

---

### Task 6: Upgrade yahatl-item-card.js

**Files:**
- Modify: `custom_components/yahatl/www/yahatl-item-card.js`

**Step 1: Update `showEditDialog()` to fire editor event**

Replace the existing `showEditDialog` method (line 426-429):

```javascript
showEditDialog() {
    this.dispatchEvent(new CustomEvent('yahatl-open-editor', {
        detail: {
            entityId: this.config.entity,
            itemId: (this.config.item || {}).uid,
        },
        bubbles: true,
        composed: true,
    }));
}
```

**Step 2: Add "Defer" action button**

In the actions section of `updateCard()` (around line 338), add a Defer button:

```javascript
if (this.config.show_actions !== false) {
    html += `
        <div class="actions">
            <button class="action-button secondary" data-action="edit">Edit</button>
            <button class="action-button secondary" data-action="defer">Defer</button>
            <button class="action-button secondary" data-action="snooze">Snooze</button>
            <button class="action-button" data-action="complete">Complete</button>
        </div>
    `;
}
```

**Step 3: Add defer handler in `handleAction()`**

```javascript
case 'defer':
    // Defer for 1 day using the defer_item service
    const deferDate = new Date();
    deferDate.setDate(deferDate.getDate() + 1);
    this._hass.callService('yahatl', 'defer_item', {
        entity_id: entity,
        item_id: item.uid,
        deferred_until: deferDate.toISOString(),
    });
    break;
```

**Step 4: Commit**

```bash
git add custom_components/yahatl/www/yahatl-item-card.js
git commit -m "feat: item card fires editor event, adds defer button"
```

---

### Task 7: Upgrade yahatl-queue-card.js

**Files:**
- Modify: `custom_components/yahatl/www/yahatl-queue-card.js`

**Step 1: Rewrite the queue card**

The current card is ~50 lines of inline HTML. Rewrite to:

1. **Make items tappable** — each queue row fires `yahatl-open-editor` on click
2. **Add Complete button** — per-item, calls `yahatl.complete_item`
3. **Add context controls in header** — location dropdown, context dropdown, available time slider
4. **Add quick capture** — text input + add button at top

Key implementation notes:
- Queue items come from `state.attributes.queue` — each has `item.uid` for the editor event
- Entity ID comes from `this.config.entity` — the queue sensor entity
- Need the todo entity ID for service calls — add `this.config.todo_entity` to card config
- Context controls call `yahatl.update_context` service
- Quick capture calls `yahatl.add_item` service

**Step 2: Manual verification in HA**

1. Tap a queue item → editor opens
2. Click Complete → item removed from queue
3. Change location dropdown → queue refreshes
4. Type in quick capture + press Enter → item added

**Step 3: Commit**

```bash
git add custom_components/yahatl/www/yahatl-queue-card.js
git commit -m "feat: interactive queue card with edit, complete, context, capture"
```

---

### Task 8: Delete workaround files

**Files:**
- Delete: `dashboards/helpers.yaml`
- Delete: `dashboards/scripts.yaml`
- Delete: `dashboards/sensors.yaml`
- Delete: `dashboards/example_configuration.yaml`

**Step 1: Delete the files**

```bash
git rm dashboards/helpers.yaml dashboards/scripts.yaml dashboards/sensors.yaml dashboards/example_configuration.yaml
```

**Step 2: Commit**

```bash
git commit -m "chore: remove workaround helpers, scripts, sensors, example config"
```

---

### Task 9: Rewrite remaining dashboard files

**Files:**
- Rename: `dashboards/automations.yaml` → `dashboards/example_automations.yaml`
- Rewrite: `dashboards/yahatl_dashboard.yaml`
- Rewrite: `dashboards/SETUP_GUIDE.md`
- Rewrite: `dashboards/README.md`

**Step 1: Rename and trim automations**

```bash
git mv dashboards/automations.yaml dashboards/example_automations.yaml
```

Edit `example_automations.yaml` — keep only these 6 automations:
- `yahatl_morning_briefing`
- `yahatl_overdue_reminder`
- `yahatl_inbox_reminder` (update to use `sensor.<list>_inbox_count` built-in sensor)
- `yahatl_streak_at_risk` (update to use `sensor.<list>_streak_risk` built-in sensor)
- `yahatl_completion_celebration`
- `yahatl_weekly_review`

Delete the other 3 (auto refresh queue, clear quick capture, suggest context, location queue refresh — all depend on deleted helpers).

**Step 2: Rewrite `yahatl_dashboard.yaml`**

Lean example (~30 lines) with:
- Queue card with context controls and quick capture
- Sensor summary row (overdue, due today, inbox, streak risk)
- Native HA todo list card for full item browsing

```yaml
title: YAHATL
views:
  - title: Tasks
    path: yahatl
    cards:
      - type: horizontal-stack
        cards:
          - type: entity
            entity: sensor.yahatl_my_list_overdue
            name: Overdue
          - type: entity
            entity: sensor.yahatl_my_list_due_today
            name: Due Today
          - type: entity
            entity: sensor.yahatl_my_list_inbox_count
            name: Inbox
          - type: entity
            entity: sensor.yahatl_my_list_streak_risk
            name: Streaks

      - type: custom:yahatl-queue-card
        entity: sensor.yahatl_my_list_queue
        todo_entity: todo.yahatl_my_list
        title: Up Next
        max_items: 8

      - type: todo-list
        entity: todo.yahatl_my_list
        title: All Items
```

**Step 3: Rewrite `SETUP_GUIDE.md`**

Short guide reflecting the new zero-config experience:
1. Install via HACS
2. Add integration (enter list name)
3. Add cards to your dashboard (queue card + todo list card)
4. Click Edit on any item to configure traits, recurrence, blockers, etc.
5. (Optional) Add example automations

**Step 4: Rewrite `README.md`**

Brief overview of what's in the dashboards folder and what each file does.

**Step 5: Commit**

```bash
git add dashboards/
git commit -m "docs: rewrite dashboard files for new UI-first experience"
```

---

### Task 10: Final verification

**Step 1: Run full test suite**

Run: `python -m pytest tests/ -v`
Expected: All tests pass.

**Step 2: Manual integration test checklist**

In a Home Assistant dev instance:
- [ ] Install integration, enter list name — entity and sensors created
- [ ] Cards auto-register — no manual resource setup needed
- [ ] Add queue card and item card to dashboard
- [ ] Create item via quick capture in queue card
- [ ] Click Edit on item → editor dialog opens with correct data
- [ ] Set traits, tags, recurrence, blockers in editor → Save → item updated
- [ ] Complete item from queue card → removed from queue
- [ ] Defer item from item card → deferred, disappears from queue
- [ ] Sensors show correct counts (overdue, due today, inbox, notes, streak risk)
- [ ] Context controls in queue card filter the queue

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during integration testing"
```
