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

### Phase 3 - Queue & Context (NEW!)

- **Priority queue algorithm** - dynamic task prioritization based on context
- **Scoring system** - weights for overdue, due dates, streaks, frequency goals, and explicit priority
- **Context-aware filtering** - tasks appear based on location, people, time, and available contexts
- **Manual context override** - set current location, people present, and available contexts
- **Automatic context detection** - infers context from Home Assistant state
- **Time-based filtering** - filter tasks by available time

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

### Phase 2: Recurrence & Blocking ✅ COMPLETED
- ✅ Calendar-based recurrence
- ✅ Elapsed-based recurrence
- ✅ Frequency goals with thresholds
- ✅ Task and sensor blockers
- ✅ Requirements (location, people, time, context, sensors)
- ✅ Streak tracking for habits

### Phase 3: Queue & Context ✅ COMPLETED
- ✅ Priority queue algorithm
- ✅ Context-aware task surfacing
- ✅ Automatic and manual context management
- ✅ Scoring system with configurable weights
- ✅ get_queue and update_context services

### Phase 4+: React Native App & Dashboard
- Mobile app for Android
- Home Assistant dashboard with Mushroom cards
