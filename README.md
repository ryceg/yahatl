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
