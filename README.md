# yahatl - Yet Another Home Assistant Todo List

A comprehensive task/habit/chore/reminder/notes system for Home Assistant.

## Features

### Phase 1 - Core Integration

- **Extended todo items** with traits (actionable, habit, chore, reminder, note)
- **Custom tags** for organization
- **Completion history tracking** - know who completed what and when
- **Status tracking** - pending, in_progress, completed, missed
- **Time estimates and buffers** for day planning
- **Needs detail flag** for quick capture and later triage
- **List sharing** - private or shared lists

### Phase 2 - Recurrence & Blocking

- **Calendar-based recurrence** - daily, weekly, monthly, yearly patterns
- **Elapsed-based recurrence** - repeat X time after last completion
- **Frequency goals** - complete N times per period with thresholds
- **Task blockers** - block items until other tasks are completed
- **Sensor blockers** - block items while sensors are active
- **Requirements** - location, people, time, context, and sensor requirements
- **Streak tracking** - maintain habit streaks with automatic calculation

### Phase 3 - Queue & Context

- **Priority queue algorithm** - dynamic task prioritization based on context
- **Scoring system** - weights for overdue, due dates, streaks, frequency goals, and explicit priority
- **Context-aware filtering** - tasks appear based on location, people, time, and available contexts
- **Manual context override** - set current location, people present, and available contexts
- **Automatic context detection** - infers context from Home Assistant state
- **Time-based filtering** - filter tasks by available time

### Phase 4 - Dashboard

- **Lovelace dashboard** - Beautiful UI with Mushroom cards
- **Planning tab** - Priority queue, context status, quick stats, pomodoro timer
- **Capture tab** - Quick capture input, inbox management, triage workflow
- **Notes tab** - Search, tag filtering, notes list
- **Custom card** - Rich item display with traits, tags, streaks, blockers
- **Template sensors** - Real-time statistics (queue count, overdue, habits at risk)
- **Automations** - Auto-refresh queue, notifications, location-based updates
- **Scripts** - Common operations (quick add, triage, snooze, pomodoro)

See [dashboards/SETUP_GUIDE.md](dashboards/SETUP_GUIDE.md) for installation and configuration.

### Phase 5 - Real-Time Updates & Advanced Blocking (NEW!)

- **Dispatcher-based signaling** - Instant intra-integration updates using HA's dispatcher (faster than bus events)
- **Sensor entities** - Overdue count, due today, next task, blocked count, and queue sensors update in real time
- **Time blockers** - Suppress tasks during time windows (e.g., no chores 10pm-6am) or allow only during windows (e.g., morning routine 6-9am). Supports overnight windows and day-of-week filtering
- **Item deferral** - Snooze tasks until a future date with `defer_item` service. Deferred items are hidden from the queue
- **Condition triggers** - React to HA entity state changes (e.g., washing machine finishes → "hang out washing" surfaces). Supports `boost` (score increase) and `set_due` (auto-set due date) modes
- **Active state listening** - `ReactivityManager` subscribes to HA entity state changes in real time using `async_track_state_change_event` for instant queue updates
- **Periodic time blocker refresh** - 60-second timer ensures time-based blocking boundaries are respected

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

### yahatl.set_recurrence (Phase 2)

Configure recurrence rules for an item.

```yaml
# Calendar-based: weekly
service: yahatl.set_recurrence
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  recurrence_type: calendar
  calendar_pattern: "weekly"

# Elapsed-based: 3 months since last completion
service: yahatl.set_recurrence
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  recurrence_type: elapsed
  elapsed_interval: 3
  elapsed_unit: months

# Frequency goal: 3 times per 30 days
service: yahatl.set_recurrence
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  recurrence_type: frequency
  frequency_count: 3
  frequency_period: 30
  frequency_unit: days
  thresholds:
    - at_days_remaining: 10
      priority: medium
    - at_days_remaining: 3
      priority: high
```

### yahatl.set_blockers (Phase 2)

Configure blockers for an item.

```yaml
service: yahatl.set_blockers
data:
  entity_id: todo.yahatl_my_list
  item_id: "clean_oven"
  mode: ANY  # Block if ANY blocker is active
  items:
    - "defrost_oven"  # UID of blocking task
  sensors:
    - binary_sensor.too_hot_for_oven_cleaning
```

### yahatl.set_requirements (Phase 2)

Configure requirements for an item.

```yaml
service: yahatl.set_requirements
data:
  entity_id: todo.yahatl_my_list
  item_id: "mow_lawn"
  mode: ALL  # All requirements must be met
  location:
    - home
  time_constraints:
    - weekend
  sensors:
    - binary_sensor.good_weather
```

### yahatl.get_queue (Phase 3)

Generate a prioritized task queue based on current context.

```yaml
# Get queue with auto-detected context
service: yahatl.get_queue

# Get queue with manual context override
service: yahatl.get_queue
data:
  available_time: 60  # Only show tasks <= 60 minutes
  location: "home"
  people:
    - "John"
    - "Jane"
  contexts:
    - "computer"

# Queue is returned via yahatl_queue_updated event
```

### yahatl.update_context (Phase 3)

Manually update the current context for queue generation.

```yaml
service: yahatl.update_context
data:
  location: "office"
  people:
    - "John"
  contexts:
    - "computer"
    - "phone"
```

### yahatl.set_time_blockers (Phase 5)

Configure time-based blocking for an item.

```yaml
# Suppress chores between 10pm and 6am
service: yahatl.set_time_blockers
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  time_blockers:
    - start_time: "22:00"
      end_time: "06:00"
      mode: suppress

# Only allow morning routine 6am-9am on weekdays
service: yahatl.set_time_blockers
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  time_blockers:
    - start_time: "06:00"
      end_time: "09:00"
      mode: allow
      days: [0, 1, 2, 3, 4]  # Mon-Fri
```

### yahatl.defer_item (Phase 5)

Defer an item until a future date. Omit `deferred_until` to clear the deferral.

```yaml
# Defer until next week
service: yahatl.defer_item
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  deferred_until: "2026-04-28T00:00:00"

# Clear deferral
service: yahatl.defer_item
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
```

### yahatl.set_condition_triggers (Phase 5)

Set condition triggers that react to HA entity state changes.

```yaml
# When washing machine finishes, surface the task (score boost only)
service: yahatl.set_condition_triggers
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  condition_triggers:
    - entity_id: sensor.washing_machine
      operator: eq
      value: "idle"
      on_match: boost

# When temperature exceeds 25°C, set due date automatically
service: yahatl.set_condition_triggers
data:
  entity_id: todo.yahatl_my_list
  item_id: "abc-123"
  condition_triggers:
    - entity_id: climate.living_room
      attribute: current_temperature
      operator: gte
      value: "25"
      on_match: set_due
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

