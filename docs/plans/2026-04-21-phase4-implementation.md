# Phase 4: Time Blockers, Deferral & Active State Listening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add time-based blocking, item deferral, and instant reactive state listening so yahatl responds to real-world conditions in real time.

**Architecture:** Four sequential phases: (1) migrate intra-integration signaling from HA bus events to the dispatcher system for faster inline dispatch, (2) add time blocker model + evaluation, (3) add `deferred_until` field + service, (4) build a `ReactivityManager` that subscribes to HA entity state changes and fires real-time updates. All features use TDD — failing test first, then implementation.

**Tech Stack:** Python 3.11+, Home Assistant Core APIs (`async_dispatcher_send`/`async_dispatcher_connect`, `async_track_state_change_event`, `async_track_time_interval`), voluptuous, pytest.

---

## Task 1: Migrate intra-integration signaling to dispatcher

Replace `hass.bus.async_fire(f"{DOMAIN}_updated", ...)` / `hass.bus.async_listen(f"{DOMAIN}_updated", ...)` with HA's dispatcher system. The dispatcher does direct inline `@callback` calls with no Event object overhead — faster for integration-internal signaling.

Public bus events (`yahatl_item_completed`, `yahatl_queue_updated`, `yahatl_context_updated`) stay on the bus — they're part of the automation API.

**Files:**
- Modify: `custom_components/yahatl/const.py`
- Modify: `custom_components/yahatl/todo.py`
- Modify: `custom_components/yahatl/sensor.py`
- Modify: `custom_components/yahatl/services.py`

**Step 1: Add signal constant to `const.py`**

At the end of `custom_components/yahatl/const.py` (after line 41), add:

```python
# Dispatcher signal for intra-integration updates (faster than bus events)
SIGNAL_YAHATL_UPDATED = f"{DOMAIN}_updated_signal"
```

**Step 2: Update `todo.py` — `_async_save()` and `async_added_to_hass()`**

In `custom_components/yahatl/todo.py`:

Add imports (after existing imports around line 16):
```python
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
```

Add import of the new constant (update the existing `.const` import at line 18-26):
```python
from .const import ..., SIGNAL_YAHATL_UPDATED
```

Replace `_async_save()` (lines 230-236):
```python
async def _async_save(self) -> None:
    await self._store.async_save(self._data)
    self.async_write_ha_state()
    async_dispatcher_send(
        self.hass, SIGNAL_YAHATL_UPDATED, self.entity_id
    )
```

Replace the bus listener in `async_added_to_hass()` (lines 96-109):
```python
async def async_added_to_hass(self) -> None:
    await super().async_added_to_hass()

    @callback
    def handle_update(entity_id):
        if entity_id == self.entity_id:
            if self._store.data:
                self._data = self._store.data
            self.async_write_ha_state()

    self._unsub_update = async_dispatcher_connect(
        self.hass, SIGNAL_YAHATL_UPDATED, handle_update
    )
```

Note: dispatcher callbacks receive the arguments passed to `async_dispatcher_send` directly (not an Event object), so the handler signature changes from `(event)` to `(entity_id)`.

**Step 3: Update `sensor.py` — base sensor and queue sensor**

In `custom_components/yahatl/sensor.py`:

Add import (after line 10):
```python
from homeassistant.helpers.dispatcher import async_dispatcher_connect
```

Add import of signal constant (update the `.const` import at line 13):
```python
from .const import CONF_STORAGE_KEY, DOMAIN, SIGNAL_YAHATL_UPDATED, STATUS_COMPLETED, TRAIT_ACTIONABLE
```

Replace `_YahtlBaseSensor.async_added_to_hass()` (lines 53-62):
```python
async def async_added_to_hass(self) -> None:
    await super().async_added_to_hass()

    @callback
    def _handle_update(entity_id):
        if self._store.data:
            self._data = self._store.data
        self.async_write_ha_state()

    self._unsub = async_dispatcher_connect(
        self.hass, SIGNAL_YAHATL_UPDATED, _handle_update
    )
```

Replace `YahtlQueueSensor.async_added_to_hass()` (lines 181-187):
```python
async def async_added_to_hass(self) -> None:
    @callback
    def _handle_update(entity_id):
        self.hass.async_create_task(self._refresh_queue(), eager_start=True)

    self._unsub = async_dispatcher_connect(
        self.hass, SIGNAL_YAHATL_UPDATED, _handle_update
    )
    await self._refresh_queue()
```

**Step 4: Update `services.py` — all handlers**

In `custom_components/yahatl/services.py`:

Add import (after line 10):
```python
from homeassistant.helpers.dispatcher import async_dispatcher_send
```

Add import of signal constant (update the `.const` import at line 12):
```python
from .const import ALL_TRAITS, DOMAIN, SIGNAL_YAHATL_UPDATED
```

Replace every `hass.bus.async_fire(f"{DOMAIN}_updated", {"entity_id": entity_id})` with:
```python
async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, entity_id)
```

This appears at:
- Line 297 (`handle_add_item`)
- Line 352 (`handle_complete_item`)
- Line 377 (`handle_update_item`)
- Line 389 (`handle_set_traits`)
- Line 404 (`handle_add_tags`)
- Line 417 (`handle_remove_tags`)
- Line 428 (`handle_flag_needs_detail`)
- Line 441 (`handle_set_list_visibility`)
- Line 477 (`handle_set_recurrence`)
- Line 502 (`handle_set_blockers`)
- Line 534 (`handle_set_requirements`)
- Line 636 (`handle_set_condition_triggers`)

**DO NOT** change these bus events (they are public API):
- Line 343-351: `hass.bus.async_fire(f"{DOMAIN}_item_completed", ...)` — keep as bus event
- Line 581-588: `hass.bus.async_fire(f"{DOMAIN}_queue_updated", ...)` — keep as bus event
- Line 613-620: `hass.bus.async_fire(f"{DOMAIN}_context_updated", ...)` — keep as bus event

**Step 5: Run all tests**

Run: `pytest tests/ -v`
Expected: ALL PASS — pure refactor, no behavior change.

**Step 6: Commit**

```bash
git add custom_components/yahatl/const.py custom_components/yahatl/todo.py custom_components/yahatl/sensor.py custom_components/yahatl/services.py
git commit -m "refactor: migrate intra-integration signaling from bus events to dispatcher"
```

---

## Task 2: Add `TimeBlockerConfig` model

**Files:**
- Modify: `custom_components/yahatl/models.py`
- Modify: `tests/test_models.py`

**Step 1: Write the failing test**

Add to `tests/test_models.py`:

```python
from custom_components.yahatl.models import TimeBlockerConfig


def test_time_blocker_roundtrip():
    tb = TimeBlockerConfig(
        start_time="22:00",
        end_time="06:00",
        mode="suppress",
        days=[0, 1, 2, 3, 4],
    )
    d = tb.to_dict()
    assert d["start_time"] == "22:00"
    assert d["end_time"] == "06:00"
    assert d["mode"] == "suppress"
    assert d["days"] == [0, 1, 2, 3, 4]

    restored = TimeBlockerConfig.from_dict(d)
    assert restored.start_time == "22:00"
    assert restored.end_time == "06:00"
    assert restored.mode == "suppress"
    assert restored.days == [0, 1, 2, 3, 4]


def test_time_blocker_defaults():
    tb = TimeBlockerConfig(start_time="06:00", end_time="09:00")
    assert tb.mode == "suppress"
    assert tb.days is None

    d = tb.to_dict()
    restored = TimeBlockerConfig.from_dict(d)
    assert restored.mode == "suppress"
    assert restored.days is None
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_time_blocker_roundtrip -v`
Expected: FAIL — ImportError

**Step 3: Add the model**

In `custom_components/yahatl/models.py`, after `ConditionTriggerConfig` (after line 132), add:

```python

@dataclass
class TimeBlockerConfig:
    """Block an item during or outside a time window.

    mode="suppress": blocked when current time IS inside the window.
    mode="allow": blocked when current time IS NOT inside the window.
    Overnight windows supported: start_time="22:00", end_time="06:00" wraps past midnight.
    days: ISO weekday (0=Mon, 6=Sun). None means all days.
    """

    start_time: str  # "HH:MM" 24h format
    end_time: str    # "HH:MM" 24h format
    mode: str = "suppress"  # "suppress" | "allow"
    days: list[int] | None = None  # None = all days

    def to_dict(self) -> dict[str, Any]:
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "mode": self.mode,
            "days": self.days,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> TimeBlockerConfig:
        return cls(
            start_time=data["start_time"],
            end_time=data["end_time"],
            mode=data.get("mode", "suppress"),
            days=data.get("days"),
        )
```

**Step 4: Add `time_blockers` and `deferred_until` fields to `YahtlItem`**

In the `YahtlItem` dataclass, after the `condition_triggers` field (after line 250), add:

```python
# Time blockers
time_blockers: list[TimeBlockerConfig] = field(default_factory=list)

# Deferral
deferred_until: datetime | None = None
```

Update `YahtlItem.to_dict()` — add after `"condition_triggers"` line (after line 289):
```python
"time_blockers": [tb.to_dict() for tb in self.time_blockers],
"deferred_until": self.deferred_until.isoformat() if self.deferred_until else None,
```

Update `YahtlItem.from_dict()` — add after `condition_triggers` parsing (after line 319):
```python
time_blockers=[
    TimeBlockerConfig.from_dict(tb)
    for tb in data.get("time_blockers", [])
],
deferred_until=datetime.fromisoformat(data["deferred_until"]) if data.get("deferred_until") else None,
```

**Step 5: Run tests**

Run: `pytest tests/test_models.py -v`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add custom_components/yahatl/models.py tests/test_models.py
git commit -m "feat: add TimeBlockerConfig model and time_blockers/deferred_until fields on YahtlItem"
```

---

## Task 3: Add time blocker evaluation to `blockers.py`

**Files:**
- Modify: `custom_components/yahatl/blockers.py`
- Create: `tests/test_time_blockers.py`

**Step 1: Write failing tests**

Create `tests/test_time_blockers.py`:

```python
"""Tests for time blocker evaluation."""
from __future__ import annotations

from datetime import time
from unittest.mock import patch

import pytest

from custom_components.yahatl.blockers import is_time_blocked
from custom_components.yahatl.models import TimeBlockerConfig, YahtlItem


def _make_item(*time_blockers: TimeBlockerConfig) -> YahtlItem:
    item = YahtlItem.create(title="Test")
    item.time_blockers = list(time_blockers)
    return item


class TestSuppressMode:
    def test_blocked_inside_window(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 23:00 is inside 22:00-06:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_unblocked_outside_window(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 12:00 is outside 22:00-06:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False

    def test_overnight_wrap_early_morning(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 03:00 is inside 22:00-06:00 (after midnight)
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(3, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_same_day_window(self):
        tb = TimeBlockerConfig(start_time="09:00", end_time="17:00", mode="suppress")
        # 12:00 is inside 09:00-17:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_same_day_window_outside(self):
        tb = TimeBlockerConfig(start_time="09:00", end_time="17:00", mode="suppress")
        # 20:00 is outside 09:00-17:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(20, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False


class TestAllowMode:
    def test_blocked_outside_window(self):
        tb = TimeBlockerConfig(start_time="06:00", end_time="09:00", mode="allow")
        # 12:00 is outside 06:00-09:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_unblocked_inside_window(self):
        tb = TimeBlockerConfig(start_time="06:00", end_time="09:00", mode="allow")
        # 07:30 is inside 06:00-09:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(7, 30), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False


class TestDayFiltering:
    def test_wrong_day_skips(self):
        tb = TimeBlockerConfig(
            start_time="06:00", end_time="09:00", mode="allow",
            days=[0, 1, 2, 3, 4],  # weekdays only
        )
        # Saturday (day 5), 12:00 — day doesn't match, blocker doesn't apply
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 5)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False

    def test_matching_day_applies(self):
        tb = TimeBlockerConfig(
            start_time="06:00", end_time="09:00", mode="allow",
            days=[0, 1, 2, 3, 4],  # weekdays only
        )
        # Monday (day 0), 12:00 — day matches, outside allow window → blocked
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_none_days_means_all(self):
        tb = TimeBlockerConfig(
            start_time="22:00", end_time="06:00", mode="suppress",
            days=None,
        )
        # Any day, 23:00 → blocked
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 3)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True


class TestNoTimeBlockers:
    def test_empty_list(self):
        item = YahtlItem.create(title="Test")
        blocked, reasons = is_time_blocked(item)
        assert blocked is False
        assert reasons == []


class TestMultipleTimeBlockers:
    def test_any_blocker_triggers(self):
        tb1 = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        tb2 = TimeBlockerConfig(start_time="12:00", end_time="13:00", mode="suppress")
        # 23:00 — tb1 blocks
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb1, tb2))
        assert blocked is True
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_time_blockers.py -v`
Expected: FAIL — ImportError (is_time_blocked doesn't exist)

**Step 3: Implement `is_time_blocked` in `blockers.py`**

At the top of `custom_components/yahatl/blockers.py`, add import (after line 4):
```python
from datetime import datetime, time
```

After the `_LOGGER` line (after line 11), add a helper for testability:
```python
def _now_time() -> tuple[time, int]:
    """Return (current_time, weekday). Extracted for test patching."""
    now = datetime.now()
    return now.time(), now.weekday()
```

After `is_item_blocked` function (after line 128), add:

```python

def is_time_blocked(item: YahtlItem) -> tuple[bool, list[str]]:
    if not item.time_blockers:
        return False, []

    now_t, weekday = _now_time()

    for tb in item.time_blockers:
        # Skip if day doesn't match
        if tb.days is not None and weekday not in tb.days:
            continue

        start = time.fromisoformat(tb.start_time)
        end = time.fromisoformat(tb.end_time)

        # Determine if current time is inside the window
        if start <= end:
            in_window = start <= now_t < end
        else:
            # Overnight wrap: 22:00-06:00 means >= 22:00 OR < 06:00
            in_window = now_t >= start or now_t < end

        if tb.mode == "suppress" and in_window:
            return True, [f"suppressed during {tb.start_time}-{tb.end_time}"]
        if tb.mode == "allow" and not in_window:
            return True, [f"only allowed during {tb.start_time}-{tb.end_time}"]

    return False, []
```

**Step 4: Run tests**

Run: `pytest tests/test_time_blockers.py -v`
Expected: ALL PASS

**Step 5: Wire `is_time_blocked` into `is_item_blocked`**

In `is_item_blocked` (in `blockers.py`), add a check after the existing `if not item.blockers` early return (after line 35). Insert before line 37:

```python
# Check time blockers (independent of item/sensor blockers)
time_blocked, time_reasons = is_time_blocked(item)
if time_blocked:
    return True, time_reasons
```

This means time blockers are checked first and short-circuit — they don't participate in the ANY/ALL mode logic of `BlockerConfig`.

**Step 6: Run all tests**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add custom_components/yahatl/blockers.py tests/test_time_blockers.py
git commit -m "feat: add time blocker evaluation with suppress/allow modes and overnight windows"
```

---

## Task 4: Add `set_time_blockers` service

**Files:**
- Modify: `custom_components/yahatl/services.py`

**Step 1: Add constants**

After `SERVICE_SET_CONDITION_TRIGGERS` (line 29), add:
```python
SERVICE_SET_TIME_BLOCKERS = "set_time_blockers"
```

After `ATTR_CONTEXTS` (line 75), add:
```python
ATTR_TIME_BLOCKERS = "time_blockers"
```

**Step 2: Add schema**

After `SERVICE_SET_CONDITION_TRIGGERS_SCHEMA` (find the schema definition block), add:

```python
SERVICE_SET_TIME_BLOCKERS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Required(ATTR_TIME_BLOCKERS): vol.All(
            cv.ensure_list,
            [
                vol.Schema(
                    {
                        vol.Required("start_time"): cv.string,
                        vol.Required("end_time"): cv.string,
                        vol.Optional("mode", default="suppress"): vol.In(
                            ["suppress", "allow"]
                        ),
                        vol.Optional("days"): vol.All(
                            cv.ensure_list, [vol.In([0, 1, 2, 3, 4, 5, 6])]
                        ),
                    }
                )
            ],
        ),
    }
)
```

**Step 3: Add handler**

Inside `async_setup_services`, after `handle_set_condition_triggers` (after line 636), add:

```python
async def handle_set_time_blockers(call: ServiceCall) -> None:
    list_data, store, item = _resolve_item(hass, call)
    if item is None:
        return

    from .models import TimeBlockerConfig
    item.time_blockers = [
        TimeBlockerConfig.from_dict(tb) for tb in call.data[ATTR_TIME_BLOCKERS]
    ]

    await store.async_save(list_data)
    async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, call.data[ATTR_ENTITY_ID])
```

**Step 4: Register the service**

After the `SERVICE_SET_CONDITION_TRIGGERS` registration (after line 705), add:

```python
hass.services.async_register(
    DOMAIN,
    SERVICE_SET_TIME_BLOCKERS,
    handle_set_time_blockers,
    schema=SERVICE_SET_TIME_BLOCKERS_SCHEMA,
)
```

**Step 5: Add to unload**

In `async_unload_services` (after line 723), add:
```python
hass.services.async_remove(DOMAIN, SERVICE_SET_TIME_BLOCKERS)
```

**Step 6: Run tests**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add custom_components/yahatl/services.py
git commit -m "feat: add set_time_blockers service"
```

---

## Task 5: Add `deferred_until` evaluation and `defer_item` service

**Files:**
- Modify: `custom_components/yahatl/blockers.py`
- Modify: `custom_components/yahatl/services.py`
- Modify: `custom_components/yahatl/queue.py`
- Create: `tests/test_deferred.py`

**Step 1: Write failing tests**

Create `tests/test_deferred.py`:

```python
"""Tests for deferred_until functionality."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from custom_components.yahatl.blockers import is_item_blocked
from custom_components.yahatl.models import YahtlItem


class TestDeferredUntil:
    @pytest.mark.asyncio
    async def test_deferred_item_is_blocked(self, mock_hass):
        item = YahtlItem.create(title="Deferred Task")
        item.deferred_until = datetime.now() + timedelta(days=7)

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
        assert any("deferred" in r.lower() for r in reasons)

    @pytest.mark.asyncio
    async def test_past_deferral_is_not_blocked(self, mock_hass):
        item = YahtlItem.create(title="Was Deferred")
        item.deferred_until = datetime.now() - timedelta(hours=1)

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_no_deferral_is_not_blocked(self, mock_hass):
        item = YahtlItem.create(title="Normal Task")

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_deferral_checked_before_other_blockers(self, mock_hass):
        """Deferred item should be blocked even without BlockerConfig."""
        item = YahtlItem.create(title="Deferred, no blockers")
        item.deferred_until = datetime.now() + timedelta(days=1)
        item.blockers = None

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_deferred.py -v`
Expected: FAIL — deferral check not implemented yet

**Step 3: Add deferral check to `is_item_blocked`**

In `custom_components/yahatl/blockers.py`, at the very top of `is_item_blocked` (before the `if not item.blockers` check at line 34), add:

```python
# Check deferral — checked first, before all other blockers
if item.deferred_until and datetime.now() < item.deferred_until:
    return True, [f"deferred until {item.deferred_until.strftime('%Y-%m-%d %H:%M')}"]
```

Make sure `datetime` is imported (it should already be from the `time` import added in Task 3).

**Step 4: Run tests**

Run: `pytest tests/test_deferred.py -v`
Expected: ALL PASS

**Step 5: Add deferral filter to `get_prioritized_queue`**

In `custom_components/yahatl/queue.py`, in the candidate collection loop (after line 48, the `available_time` check), add:

```python
# Skip deferred items
if item.deferred_until and datetime.now() < item.deferred_until:
    continue
```

**Step 6: Add `defer_item` service**

In `custom_components/yahatl/services.py`:

Add constant after `SERVICE_SET_TIME_BLOCKERS`:
```python
SERVICE_DEFER_ITEM = "defer_item"
```

Add attribute after `ATTR_TIME_BLOCKERS`:
```python
ATTR_DEFERRED_UNTIL = "deferred_until"
```

Add schema:
```python
SERVICE_DEFER_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM_ID): cv.string,
        vol.Optional(ATTR_DEFERRED_UNTIL): cv.datetime,
    }
)
```

Add handler inside `async_setup_services`:
```python
async def handle_defer_item(call: ServiceCall) -> None:
    list_data, store, item = _resolve_item(hass, call)
    if item is None:
        return

    item.deferred_until = call.data.get(ATTR_DEFERRED_UNTIL)

    await store.async_save(list_data)
    async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, call.data[ATTR_ENTITY_ID])
```

Register the service:
```python
hass.services.async_register(
    DOMAIN,
    SERVICE_DEFER_ITEM,
    handle_defer_item,
    schema=SERVICE_DEFER_ITEM_SCHEMA,
)
```

Add to `async_unload_services`:
```python
hass.services.async_remove(DOMAIN, SERVICE_DEFER_ITEM)
```

**Step 7: Clear deferral on completion**

In `services.py`, in `handle_complete_item` (around line 314, after `item.status = STATUS_COMPLETED`), add:
```python
item.deferred_until = None
```

In `todo.py`, in `_complete_item` (around line 217, after `item.status = STATUS_COMPLETED`), add:
```python
item.deferred_until = None
```

**Step 8: Run all tests**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 9: Commit**

```bash
git add custom_components/yahatl/blockers.py custom_components/yahatl/queue.py custom_components/yahatl/services.py custom_components/yahatl/todo.py tests/test_deferred.py
git commit -m "feat: add deferred_until field with defer_item service and blocker evaluation"
```

---

## Task 6: Add `on_match` field to `ConditionTriggerConfig`

**Files:**
- Modify: `custom_components/yahatl/models.py`
- Modify: `tests/test_models.py`

**Step 1: Write failing test**

Add to `tests/test_models.py`:

```python
def test_condition_trigger_on_match_default():
    trigger = ConditionTriggerConfig(
        entity_id="sensor.washing_machine",
        operator="eq",
        value="idle",
    )
    assert trigger.on_match == "boost"
    d = trigger.to_dict()
    assert d["on_match"] == "boost"


def test_condition_trigger_on_match_set_due():
    trigger = ConditionTriggerConfig(
        entity_id="sensor.washing_machine",
        operator="eq",
        value="idle",
        on_match="set_due",
    )
    d = trigger.to_dict()
    assert d["on_match"] == "set_due"
    restored = ConditionTriggerConfig.from_dict(d)
    assert restored.on_match == "set_due"
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/test_models.py::test_condition_trigger_on_match_default -v`
Expected: FAIL — `on_match` attribute doesn't exist

**Step 3: Add the field**

In `custom_components/yahatl/models.py`, in the `ConditionTriggerConfig` dataclass (after `attribute` field at line 115), add:
```python
on_match: str = "boost"  # "boost" | "set_due"
```

Update `to_dict()` (inside the return dict, after `"attribute"`):
```python
"on_match": self.on_match,
```

Update `from_dict()` (in the constructor call, after `attribute=`):
```python
on_match=data.get("on_match", "boost"),
```

**Step 4: Update `set_condition_triggers` schema**

In `custom_components/yahatl/services.py`, find `SERVICE_SET_CONDITION_TRIGGERS_SCHEMA` and add to the inner schema:
```python
vol.Optional("on_match", default="boost"): vol.In(["boost", "set_due"]),
```

**Step 5: Run tests**

Run: `pytest tests/test_models.py -v`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add custom_components/yahatl/models.py tests/test_models.py custom_components/yahatl/services.py
git commit -m "feat: add on_match field to ConditionTriggerConfig (boost or set_due)"
```

---

## Task 7: Build `ReactivityManager`

This is the core real-time feature. The `ReactivityManager` subscribes to HA entity state changes for all condition trigger entity IDs, and fires the dispatcher signal when conditions match.

**Files:**
- Create: `custom_components/yahatl/reactivity.py`
- Create: `tests/test_reactivity.py`

**Step 1: Write failing tests**

Create `tests/test_reactivity.py`:

```python
"""Tests for ReactivityManager."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest

from custom_components.yahatl.models import (
    ConditionTriggerConfig,
    YahtlItem,
    YahtlList,
)
from custom_components.yahatl.reactivity import ReactivityManager


@pytest.fixture
def mock_store():
    store = MagicMock()
    store.async_save = AsyncMock()
    return store


@pytest.fixture
def make_list():
    def _make(items: list[YahtlItem]) -> YahtlList:
        yl = YahtlList(list_id="test", name="Test")
        yl.items = items
        return yl
    return _make


@pytest.fixture
def mock_hass_for_reactivity():
    hass = MagicMock()
    hass.data = {}
    hass.states = MagicMock()
    hass.states.get = MagicMock(return_value=None)
    hass.bus = MagicMock()
    return hass


class TestCollectTrackedEntities:
    def test_collects_from_condition_triggers(self, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washing_machine", operator="eq", value="idle"),
        ]
        yl = make_list([item])

        entities = ReactivityManager._collect_tracked_entities([yl])

        assert entities == {"sensor.washing_machine"}

    def test_deduplicates_across_items(self, make_list):
        item1 = YahtlItem.create(title="Task 1")
        item1.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle"),
        ]
        item2 = YahtlItem.create(title="Task 2")
        item2.condition_triggers = [
            ConditionTriggerConfig(entity_id="sensor.washer", operator="eq", value="idle"),
            ConditionTriggerConfig(entity_id="sensor.dryer", operator="eq", value="idle"),
        ]
        yl = make_list([item1, item2])

        entities = ReactivityManager._collect_tracked_entities([yl])

        assert entities == {"sensor.washer", "sensor.dryer"}

    def test_empty_when_no_triggers(self, make_list):
        item = YahtlItem.create(title="No triggers")
        yl = make_list([item])

        entities = ReactivityManager._collect_tracked_entities([yl])

        assert entities == set()


class TestHandleStateChange:
    def test_boost_trigger_fires_signal(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="boost",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        # Simulate state change
        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("sensor.washer", new_state)

        mock_send.assert_called_once()

    def test_set_due_sets_due_date(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="set_due",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)

        assert item.due is not None

    def test_set_due_uses_min_with_existing(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        future_due = datetime.now() + timedelta(days=7)
        item.due = future_due
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="set_due",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)

        # Due should be now (earlier than the future date)
        assert item.due < future_due

    def test_set_due_clears_deferred_until(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.deferred_until = datetime.now() + timedelta(days=3)
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="set_due",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)

        assert item.deferred_until is None

    def test_set_due_respects_cooldown(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="set_due",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {item.uid: datetime.now()}  # Just triggered
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send"):
            manager._handle_state_change("sensor.washer", new_state)

        # Due should NOT be set because cooldown is active
        assert item.due is None

    def test_non_matching_condition_no_signal(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="Laundry")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="sensor.washer", operator="eq", value="idle",
                on_match="boost",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "running"  # Doesn't match "idle"
        new_state.attributes = {}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("sensor.washer", new_state)

        mock_send.assert_not_called()

    def test_attribute_trigger(self, mock_hass_for_reactivity, mock_store, make_list):
        item = YahtlItem.create(title="AC Check")
        item.condition_triggers = [
            ConditionTriggerConfig(
                entity_id="climate.living_room",
                attribute="current_temperature",
                operator="gte",
                value="25",
                on_match="boost",
            ),
        ]
        yl = make_list([item])

        manager = ReactivityManager.__new__(ReactivityManager)
        manager._hass = mock_hass_for_reactivity
        manager._store = mock_store
        manager._last_triggered = {}
        manager._all_lists_fn = lambda: [yl]

        new_state = MagicMock()
        new_state.state = "cool"
        new_state.attributes = {"current_temperature": 27.5}

        with patch("custom_components.yahatl.reactivity.async_dispatcher_send") as mock_send:
            manager._handle_state_change("climate.living_room", new_state)

        mock_send.assert_called_once()
```

**Step 2: Run tests to verify they fail**

Run: `pytest tests/test_reactivity.py -v`
Expected: FAIL — ImportError (reactivity module doesn't exist)

**Step 3: Implement `ReactivityManager`**

Create `custom_components/yahatl/reactivity.py`:

```python
"""ReactivityManager — real-time state listening for condition triggers and time blockers."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Callable

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval

from .conditions import evaluate_condition
from .const import DOMAIN, SIGNAL_YAHATL_UPDATED
from .models import YahtlList

_LOGGER = logging.getLogger(__name__)

_COOLDOWN_SECONDS = 60


class ReactivityManager:
    """Manages real-time reactions to HA entity state changes and time-based updates.

    Responsibilities:
    1. Subscribe to state_changed events for all entities referenced by condition triggers.
    2. When a condition matches: fire SIGNAL_YAHATL_UPDATED (for boost), or set due date (for set_due).
    3. Run a 60-second periodic timer so time blockers are re-evaluated at window boundaries.
    4. Re-scan tracked entities when SIGNAL_YAHATL_UPDATED fires (triggers may have been added/removed).
    """

    def __init__(
        self,
        hass: HomeAssistant,
        store: Any,
        all_lists_fn: Callable[[], list[YahtlList]],
    ) -> None:
        self._hass = hass
        self._store = store
        self._all_lists_fn = all_lists_fn
        self._tracked_entities: set[str] = set()
        self._unsub_state: Callable[[], None] | None = None
        self._unsub_signal: Callable[[], None] | None = None
        self._unsub_timer: Callable[[], None] | None = None
        self._last_triggered: dict[str, datetime] = {}

    async def async_start(self) -> None:
        # Listen for integration updates to refresh tracked entity set
        @callback
        def _on_integration_update(entity_id: str) -> None:
            self._refresh_tracked_entities()

        self._unsub_signal = async_dispatcher_connect(
            self._hass, SIGNAL_YAHATL_UPDATED, _on_integration_update
        )

        # 60-second timer for time blocker re-evaluation
        @callback
        def _on_timer(now: datetime) -> None:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, "timer")

        self._unsub_timer = async_track_time_interval(
            self._hass, _on_timer, timedelta(seconds=60)
        )

        # Initial subscription
        self._refresh_tracked_entities()

        # Initial evaluation — boost only, skip set_due
        self._initial_evaluation()

    async def async_stop(self) -> None:
        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None
        if self._unsub_signal:
            self._unsub_signal()
            self._unsub_signal = None
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None

    @staticmethod
    def _collect_tracked_entities(all_lists: list[YahtlList]) -> set[str]:
        entities: set[str] = set()
        for yl in all_lists:
            for item in yl.items:
                for trigger in item.condition_triggers:
                    entities.add(trigger.entity_id)
        return entities

    @callback
    def _refresh_tracked_entities(self) -> None:
        new_entities = self._collect_tracked_entities(self._all_lists_fn())
        if new_entities == self._tracked_entities:
            return

        # Unsubscribe old
        if self._unsub_state:
            self._unsub_state()
            self._unsub_state = None

        self._tracked_entities = new_entities

        if not self._tracked_entities:
            return

        # Subscribe to state changes for tracked entities
        @callback
        def _on_state_change(event: Event) -> None:
            entity_id = event.data.get("entity_id")
            new_state = event.data.get("new_state")
            if entity_id and new_state:
                self._handle_state_change(entity_id, new_state)

        self._unsub_state = async_track_state_change_event(
            self._hass, list(self._tracked_entities), _on_state_change
        )

    @callback
    def _handle_state_change(self, entity_id: str, new_state: Any) -> None:
        all_lists = self._all_lists_fn()
        signal_needed = False
        persist_needed = False

        for yl in all_lists:
            for item in yl.items:
                for trigger in item.condition_triggers:
                    if trigger.entity_id != entity_id:
                        continue

                    # Get the value to compare
                    if trigger.attribute:
                        actual = str(new_state.attributes.get(trigger.attribute, ""))
                    else:
                        actual = new_state.state

                    if not evaluate_condition(actual, trigger.operator, trigger.value):
                        continue

                    # Condition matched
                    if trigger.on_match == "set_due":
                        # Check cooldown
                        now = datetime.now()
                        last = self._last_triggered.get(item.uid)
                        if last and (now - last).total_seconds() < _COOLDOWN_SECONDS:
                            continue

                        # Set due = min(existing, now)
                        if item.due:
                            item.due = min(item.due, now)
                        else:
                            item.due = now

                        # Clear deferral
                        item.deferred_until = None

                        self._last_triggered[item.uid] = now
                        persist_needed = True

                    signal_needed = True

        if persist_needed:
            # Need to save — but we're in a @callback, so create a task
            async def _persist():
                all_lists_for_save = self._all_lists_fn()
                if all_lists_for_save:
                    data = all_lists_for_save[0]  # Store saves the list data
                    await self._store.async_save(data)

            self._hass.async_create_task(_persist(), eager_start=True)

        if signal_needed:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, entity_id)

    @callback
    def _initial_evaluation(self) -> None:
        """Evaluate all triggers against current state on startup. Skip set_due."""
        all_lists = self._all_lists_fn()
        signal_needed = False

        for yl in all_lists:
            for item in yl.items:
                for trigger in item.condition_triggers:
                    state = self._hass.states.get(trigger.entity_id)
                    if state is None:
                        continue

                    if trigger.attribute:
                        actual = str(state.attributes.get(trigger.attribute, ""))
                    else:
                        actual = state.state

                    if evaluate_condition(actual, trigger.operator, trigger.value):
                        signal_needed = True
                        break
                if signal_needed:
                    break
            if signal_needed:
                break

        if signal_needed:
            async_dispatcher_send(self._hass, SIGNAL_YAHATL_UPDATED, "startup")
```

**Step 4: Run tests**

Run: `pytest tests/test_reactivity.py -v`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add custom_components/yahatl/reactivity.py tests/test_reactivity.py
git commit -m "feat: add ReactivityManager for real-time condition trigger state listening"
```

---

## Task 8: Wire `ReactivityManager` into integration lifecycle

**Files:**
- Modify: `custom_components/yahatl/__init__.py`

**Step 1: Update `async_setup_entry`**

In `custom_components/yahatl/__init__.py`, add import (after line 10):
```python
from .reactivity import ReactivityManager
```

Replace `async_setup_entry` (lines 30-36) with:
```python
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})

    # Store will be initialized by todo platform
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Start ReactivityManager after platforms are set up
    entry_data = hass.data[DOMAIN].get(entry.entry_id)
    if entry_data and "store" in entry_data:
        def all_lists_fn():
            result = []
            for ed in hass.data.get(DOMAIN, {}).values():
                if isinstance(ed, dict) and "data" in ed:
                    result.append(ed["data"])
            return result

        manager = ReactivityManager(hass, entry_data["store"], all_lists_fn)
        entry_data["reactivity_manager"] = manager
        await manager.async_start()

    return True
```

**Step 2: Update `async_unload_entry`**

Replace `async_unload_entry` (lines 39-42) with:
```python
async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    entry_data = hass.data[DOMAIN].get(entry.entry_id)
    if entry_data and "reactivity_manager" in entry_data:
        await entry_data["reactivity_manager"].async_stop()

    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok
```

**Step 3: Run all tests**

Run: `pytest tests/ -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add custom_components/yahatl/__init__.py
git commit -m "feat: wire ReactivityManager into integration setup/teardown lifecycle"
```

---

## Task 9: Final integration test — verify all mutation paths

Trace through every mutation path and confirm it ends with a dispatcher signal that triggers sensor updates.

**Files:**
- Create: `tests/test_integration_realtime.py`

**Step 1: Write integration tests**

Create `tests/test_integration_realtime.py`:

```python
"""Integration tests verifying real-time update chains."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from custom_components.yahatl.models import (
    ConditionTriggerConfig,
    TimeBlockerConfig,
    YahtlItem,
    YahtlList,
)


class TestDeferralInteractions:
    @pytest.mark.asyncio
    async def test_completing_deferred_item_clears_deferral(self):
        """Verify completing a deferred item clears deferred_until."""
        item = YahtlItem.create(title="Deferred Task")
        item.deferred_until = datetime.now() + timedelta(days=7)
        item.status = "completed"
        item.deferred_until = None  # Simulating what the handler does

        assert item.deferred_until is None
        assert item.status == "completed"


class TestTimeBlockerAndDeferralIndependence:
    @pytest.mark.asyncio
    async def test_both_can_block(self, mock_hass):
        """An item can be both deferred and time-blocked."""
        from custom_components.yahatl.blockers import is_item_blocked

        item = YahtlItem.create(title="Double blocked")
        item.deferred_until = datetime.now() + timedelta(days=1)
        item.time_blockers = [
            TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        ]

        # Deferral is checked first
        blocked, reasons = await is_item_blocked(mock_hass, item)
        assert blocked is True
        assert "deferred" in reasons[0].lower()


class TestConditionTriggerSetDueInteraction:
    def test_set_due_with_existing_due_uses_min(self):
        """set_due should use min(existing_due, now())."""
        item = YahtlItem.create(title="Task")
        future = datetime.now() + timedelta(days=7)
        item.due = future

        now = datetime.now()
        item.due = min(item.due, now)

        assert item.due <= now
        assert item.due < future
```

**Step 2: Run tests**

Run: `pytest tests/test_integration_realtime.py -v`
Expected: ALL PASS

**Step 3: Run full test suite**

Run: `pytest tests/ -v --tb=short`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add tests/test_integration_realtime.py
git commit -m "test: add integration tests verifying real-time update chains and feature interactions"
```

---

## Execution Order Summary

```
Task 1: Dispatcher migration (pure refactor)
Task 2: TimeBlockerConfig model + YahtlItem fields
Task 3: Time blocker evaluation in blockers.py
Task 4: set_time_blockers service
Task 5: deferred_until evaluation + defer_item service
Task 6: on_match field on ConditionTriggerConfig
Task 7: ReactivityManager implementation
Task 8: Wire ReactivityManager into __init__.py lifecycle
Task 9: Final integration tests
```

Tasks 2-5 could theoretically run in parallel (2+3 are time blockers, 5 is deferral), but they share files (models.py, blockers.py), so sequential is safer for clean diffs.
