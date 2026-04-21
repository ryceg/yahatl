# Phase 4: Time Blockers, Deferral & Active State Listening — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add time-based blocking, item deferral, and instant reactive state listening so the yahatl integration responds to real-world conditions in real time.

**Prerequisites:** All Phase 1–3 tasks from `2026-04-21-deslopify-and-realtime.md` are complete.

---

## Decisions Made During Design

These were resolved during brainstorming and should not be revisited without good reason.

1. **Dispatcher over bus events** — intra-integration signaling uses `async_dispatcher_send`/`async_dispatcher_connect` (faster, no Event object overhead). Public events (`yahatl_item_completed`, `yahatl_queue_updated`) stay on the bus for automation consumers.
2. **`deferred_until` is a top-level field on `YahtlItem`**, not inside `BlockerConfig` — it's a simple date gate, not a composable condition.
3. **Time blockers are a separate field on `YahtlItem`** (`time_blockers: list[TimeBlockerConfig]`), not inside `BlockerConfig` — they don't participate in ANY/ALL mode logic.
4. **`on_match` field on `ConditionTriggerConfig`** — `"boost"` (default, existing behavior) or `"set_due"` (sets due date on transition). Boost is evaluated statically during queue scoring; `set_due` is transition-only.
5. **Startup behavior** — `ReactivityManager` does an initial evaluation on startup but skips `set_due` actions. Only actual `state_changed` transitions trigger `set_due`.
6. **`set_due` with existing due date** — uses `min(existing_due, now())`, never pushes a due date later.
7. **`set_due` clears `deferred_until`** — otherwise the item gets a due date but stays hidden.
8. **Completing a deferred item is allowed** — deferral is a soft visibility filter, not a hard lock.
9. **Time window staleness** — a 60-second periodic timer fires `SIGNAL_YAHATL_UPDATED` so sensors stay accurate across time boundaries.
10. **Single `ReactivityManager`** — manages both condition trigger subscriptions and the periodic timer. One class, one lifecycle per config entry.
11. **Trigger set refresh** — manager listens for `SIGNAL_YAHATL_UPDATED` and re-scans all items for condition trigger entity IDs. Only re-subscribes if the set actually changed. Cheap scan, avoids a second signal.
12. **Overnight time windows** — `start_time > end_time` wraps past midnight (check: `now >= start OR now < end`).
13. **`TimeBlockerConfig.days`** — `None` means all days.
14. **Oscillation guard** — `set_due` triggers track `last_triggered[item_uid]` with a 60-second cooldown to prevent rapid state oscillation from repeatedly resetting due dates.

---

## Architecture Overview

```
state_changed (HA entity)
        │
        ▼
┌─────────────────────┐
│  ReactivityManager  │──── async_track_state_change_event (O(1) dispatch)
│                     │──── async_track_time_interval (60s timer)
│                     │
│  On match:          │
│   • "boost" → fire SIGNAL_YAHATL_UPDATED (queue rescores)
│   • "set_due" → mutate item.due, clear deferred_until, persist, fire signal
│                     │
│  On timer tick:     │
│   • fire SIGNAL_YAHATL_UPDATED (time blockers re-evaluated)
└─────────────────────┘
        │
        ▼ SIGNAL_YAHATL_UPDATED (dispatcher, not bus)
        │
   ┌────┴────────────────────┐
   ▼                         ▼
Sensors                  TodoEntity
(recalculate)            (async_write_ha_state)
   │                         │
   ▼                         ▼
async_write_ha_state     WebSocket push
   │                     to Lovelace
   ▼
WebSocket push
to Lovelace
```

---

## Task 1: Real-Time Infrastructure Upgrade (Dispatcher Migration)

**Pure refactor — no behavior change.**

### Changes

**`const.py`** — add:
```python
SIGNAL_YAHATL_UPDATED = f"{DOMAIN}_updated_signal"
```

**`todo.py`** — `_async_save()`:
- Replace `self.hass.bus.async_fire(f"{DOMAIN}_updated", ...)` with `async_dispatcher_send(self.hass, SIGNAL_YAHATL_UPDATED, self.entity_id)`
- Import: `from homeassistant.helpers.dispatcher import async_dispatcher_send`

**`sensor.py`** — `_YahtlBaseSensor`:
- Replace `self.hass.bus.async_listen(f"{DOMAIN}_updated", ...)` with `async_dispatcher_connect(self.hass, SIGNAL_YAHATL_UPDATED, _handle_update)`
- Import: `from homeassistant.helpers.dispatcher import async_dispatcher_connect`
- `YahtlQueueSensor._handle_update`: add `eager_start=True` to `async_create_task`

**`services.py`** — all handlers:
- Replace `hass.bus.async_fire(f"{DOMAIN}_updated", ...)` with `async_dispatcher_send(hass, SIGNAL_YAHATL_UPDATED, entity_id)`
- Keep `hass.bus.async_fire(f"{DOMAIN}_item_completed", ...)` and `hass.bus.async_fire(f"{DOMAIN}_queue_updated", ...)` on the bus (public API for automations)

**`todo.py`** — `handle_update` listener:
- Replace `self.hass.bus.async_listen(f"{DOMAIN}_updated", ...)` with `async_dispatcher_connect(self.hass, SIGNAL_YAHATL_UPDATED, ...)`

### Verification
- All existing tests pass with no changes (dispatcher is a drop-in replacement for this pattern)
- Manual: complete a task in HA UI, confirm sensors update instantly

---

## Task 2: Time Blockers

### Model

Add to `models.py`:

```python
@dataclass
class TimeBlockerConfig:
    """Block an item during or outside a time window.

    mode="suppress": blocked when current time IS inside the window.
    mode="allow": blocked when current time IS NOT inside the window.
    Overnight windows supported: start_time="22:00", end_time="06:00" wraps past midnight.
    """
    start_time: str           # "06:00" (24h format)
    end_time: str             # "21:00"
    mode: str = "suppress"    # "suppress" | "allow"
    days: list[int] | None = None  # ISO weekday, 0=Mon 6=Sun. None = all days.
```

Add to `YahtlItem`:
```python
time_blockers: list[TimeBlockerConfig] = field(default_factory=list)
```

### Evaluation

In `blockers.py`, add a helper `is_time_blocked(item) -> tuple[bool, list[str]]`. Called from `is_item_blocked` after existing item/sensor blocker checks.

Logic per `TimeBlockerConfig`:
1. If `days` is set and today's weekday not in `days`, this blocker doesn't apply (skip)
2. Parse `start_time`/`end_time` to `time` objects
3. If `start <= end` (same-day window): `in_window = start <= now_time < end`
4. If `start > end` (overnight window): `in_window = now_time >= start or now_time < end`
5. If `mode == "suppress"`: blocked when `in_window`
6. If `mode == "allow"`: blocked when `not in_window`

If any time blocker triggers, item is blocked.

### Service

`set_time_blockers` in `services.py` — same pattern as `set_condition_triggers`. Schema validates `mode` is `"suppress"` or `"allow"`, `start_time`/`end_time` match `HH:MM` format, `days` are 0–6.

### Tests

- Suppress mode: blocked inside window, unblocked outside
- Allow mode: blocked outside window, unblocked inside
- Overnight window wrapping
- Day-of-week filtering
- `days: None` means all days

---

## Task 3: Deferred Until

### Model

Add to `YahtlItem`:
```python
deferred_until: datetime | None = None
```

Update `to_dict`/`from_dict` accordingly.

### Evaluation

In `is_item_blocked`, check `deferred_until` first — before item blockers, sensor blockers, and time blockers:
```python
if item.deferred_until and datetime.now() < item.deferred_until:
    return True, ["deferred until {date}"]
```

Also filter in `get_prioritized_queue` candidate collection (same level as blocked check).

### Service

`defer_item` in `services.py`:
```
entity_id: required
item_id: required
deferred_until: optional (datetime string, null/omitted clears deferral)
```

Passing null or omitting `deferred_until` clears the deferral (sets to `None`).

### Interaction with completion

`handle_complete_item` does not check deferral — completing a deferred item is allowed and clears `deferred_until`.

### Tests

- Deferred item is blocked before the date
- Deferred item is unblocked after the date
- Clearing deferral unblocks immediately
- Completing a deferred item works and clears deferral

---

## Task 4: Active State Listening (ReactivityManager)

### `ConditionTriggerConfig` changes

Add field:
```python
on_match: str = "boost"  # "boost" | "set_due"
```

Update `to_dict`/`from_dict`.

### ReactivityManager (`trigger_manager.py`)

```python
class ReactivityManager:
    def __init__(self, hass, entry_id, store):
        self._hass = hass
        self._entry_id = entry_id
        self._store = store
        self._tracked_entities: set[str] = set()
        self._tracker = None          # async_track_state_change_filtered handle
        self._unsub_signal = None     # dispatcher subscription
        self._unsub_timer = None      # periodic timer
        self._last_triggered: dict[str, datetime] = {}  # uid -> last set_due time
```

**Lifecycle:**

`async_start()`:
1. Subscribe to `SIGNAL_YAHATL_UPDATED` to refresh tracked entity set
2. Start 60-second periodic timer via `async_track_time_interval`
3. Do initial entity scan and subscribe via `async_track_state_change_filtered`
4. Run initial evaluation pass (boost only, skip `set_due`)

`async_stop()`:
1. Unsubscribe all listeners, cancel timer

**On `state_changed` event** (`@callback`):
1. Get `entity_id`, `new_state` from event
2. Find all items with condition triggers referencing this entity
3. For each matching trigger, call `evaluate_condition(actual, trigger.operator, trigger.value)`
4. If matched and `on_match == "boost"`: fire `SIGNAL_YAHATL_UPDATED`
5. If matched and `on_match == "set_due"`:
   - Check 60-second cooldown (`last_triggered[item.uid]`)
   - Set `item.due = min(item.due, now())` if item has due date, else `item.due = now()`
   - Clear `item.deferred_until`
   - Persist via `store.async_save`
   - Update `last_triggered[item.uid]`
   - Fire `SIGNAL_YAHATL_UPDATED`

**On `SIGNAL_YAHATL_UPDATED`** (`@callback`):
1. Re-scan all items for condition trigger entity IDs
2. If set changed, update `async_track_state_change_filtered` via `TrackStates`

**On timer tick** (`@callback`):
1. Fire `SIGNAL_YAHATL_UPDATED` (causes sensors to re-evaluate time blockers)

**Startup guard:**
- On initial evaluation, iterate all triggers against current state
- For matches: fire `SIGNAL_YAHATL_UPDATED` (boost reflected in queue)
- Skip `set_due` — only transitions trigger due date mutations

### Integration

**`__init__.py`** — in `async_setup_entry`:
```python
manager = ReactivityManager(hass, entry.entry_id, store)
entry_data["trigger_manager"] = manager
await manager.async_start()
```

In `async_unload_entry`:
```python
await entry_data["trigger_manager"].async_stop()
```

### Tests

- State change matching condition fires dispatcher signal
- `on_match: "set_due"` sets due date on transition
- `set_due` respects 60-second cooldown
- `set_due` uses `min(existing_due, now())`
- `set_due` clears `deferred_until`
- Startup skips `set_due`, only boosts
- Tracked entity set refreshes when triggers change
- Timer fires dispatcher signal every 60 seconds

---

## Execution Order

```
Task 1 (dispatcher migration)
    │
    ├──► Task 2 (time blockers)      ── independent
    ├──► Task 3 (deferred until)     ── independent
    │
    └──► Task 4 (ReactivityManager)  ── depends on 1, interacts with 3
```

Tasks 2 and 3 can be done in parallel after Task 1. Task 4 comes last.
