# YAHATL Home Assistant Dashboard

Complete Home Assistant dashboard for YAHATL that provides the **full YAHATL experience** through Home Assistant, including viewing all metadata and editing item properties.

## Prerequisites

### Required HACS Integrations

Install these via HACS → Frontend:

| Integration | Purpose |
|-------------|---------|
| **Mushroom Cards** | Primary UI components |
| **auto-entities** | Dynamic card generation from sensor data |
| **layout-card** | Grid layouts for card lists |

Optional:
- **Mushroom Themes** - Enhanced visuals

### Create Access Token

1. Go to your HA Profile → Security
2. Create a Long-Lived Access Token
3. Add to `secrets.yaml`:
   ```yaml
   yahatl_token: "Bearer YOUR_TOKEN_HERE"
   ```

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `yahatl-dashboard.yaml` | Main Lovelace dashboard |
| `input-helpers.yaml` | Input entities for forms |
| `automations.yaml` | REST commands for API calls |
| `README.md` | This documentation |

---

## Installation

### Step 1: Add Input Helpers

Copy `input-helpers.yaml` contents to your `configuration.yaml` or include it:

```yaml
input_text: !include dashboards/input-helpers.yaml
```

### Step 2: Add REST Commands

Copy `automations.yaml` contents to your `configuration.yaml`:

```yaml
rest_command: !include dashboards/automations.yaml
```

### Step 3: Install Dashboard

**Option A: UI**
1. Settings → Dashboards → Add Dashboard
2. Take Control → Manual
3. Paste `yahatl-dashboard.yaml` contents

**Option B: YAML**
```yaml
lovelace:
  dashboards:
    yahatl:
      mode: yaml
      title: YAHATL
      filename: dashboards/yahatl-dashboard.yaml
```

### Step 4: Restart Home Assistant

---

## Features

### Full Metadata Display

Every item shows ALL its metadata:

**Tasks:**
- Title, priority (color-coded), due date
- Status badge for overdue items
- Tap to complete, hold for details

**Chores:**
- Title, interval (days), next due date
- Days until due / overdue status
- Color-coded urgency
- Tap to complete, hold for interval settings

**Habits:**
- Title, current streak 🔥, longest streak
- Frequency goal (daily, weekly, etc.)
- Completed today indicator
- Tap to log, hold for frequency settings

**Inbox:**
- Title, capture date
- Tap to process (convert to task/chore/habit)

### Edit Capabilities

**From Dashboard Cards:**
- Complete tasks, chores
- Log habits
- Archive inbox items

**From Detail Views:**
- Task priority (Low/Normal/High/Urgent)
- Chore interval (1-365 days, preset buttons)
- Habit frequency (daily, weekly, etc.)

**From Create Views:**
- New task with priority & due date
- New chore with interval
- New habit with frequency goal
- Quick capture to inbox

---

## Dashboard Structure

### Main Views

| View | Path | Description |
|------|------|-------------|
| Dashboard | `/yahatl/dashboard` | Main overview with all items |
| Inbox | `/yahatl/inbox` | Process captured items |

### Detail Views (Subviews)

| View | Path | Actions |
|------|------|---------|
| Task Detail | `/yahatl/task/{id}` | Edit priority |
| Chore Detail | `/yahatl/chore/{id}` | Edit interval |
| Habit Detail | `/yahatl/habit/{id}` | Edit frequency |
| Process Item | `/yahatl/process/{id}` | Convert inbox item |

### Create Views (Subviews)

| View | Path | Creates |
|------|------|---------|
| Capture | `/yahatl/capture` | Inbox item |
| New Task | `/yahatl/new-task` | Task with metadata |
| New Chore | `/yahatl/new-chore` | Chore with interval |
| New Habit | `/yahatl/new-habit` | Habit with frequency |

---

## New Sensors

The integration now exposes **list sensors** with full item data:

| Entity | Attributes |
|--------|------------|
| `sensor.yahatl_tasks_list` | `items`: Array of {id, title, status, priority, due_date, ...} |
| `sensor.yahatl_habits_list` | `items`: Array of {id, title, current_streak, frequency_goal, ...} |
| `sensor.yahatl_chores_list` | `items`: Array of {id, title, interval_days, next_due, is_overdue, ...} |
| `sensor.yahatl_inbox_list` | `items`: Array of {id, title, created_at, ...} |

These enable the `auto-entities` card to dynamically generate Mushroom cards for each item.

---

## REST Commands Available

### Capture & Create
- `rest_command.yahatl_capture`
- `rest_command.yahatl_create_task`
- `rest_command.yahatl_create_chore`
- `rest_command.yahatl_create_habit`

### Complete Actions
- `rest_command.yahatl_complete_task`
- `rest_command.yahatl_complete_chore`
- `rest_command.yahatl_log_habit`

### Update Task
- `rest_command.yahatl_update_task_priority`
- `rest_command.yahatl_update_task_due_date`
- `rest_command.yahatl_update_task_status`

### Update Chore
- `rest_command.yahatl_update_chore_interval`

### Update Habit
- `rest_command.yahatl_update_habit_frequency`

### Other
- `rest_command.yahatl_archive_note`
- `rest_command.yahatl_add_task_behaviour`
- `rest_command.yahatl_add_chore_behaviour`
- `rest_command.yahatl_add_habit_behaviour`

---

## How It Works

### Dynamic Card Generation

The dashboard uses `auto-entities` with a template filter that reads from the list sensor attributes:

```yaml
- type: custom:auto-entities
  card:
    type: custom:layout-card
  filter:
    template: |-
      {% set items = state_attr('sensor.yahatl_tasks_list', 'items') or [] %}
      {% for task in items %}
        {{ { "type": "custom:mushroom-template-card", ... } }},
      {% endfor %}
```

### API Integration

Mushroom cards use `tap_action` to call REST commands:

```yaml
tap_action:
  action: call-service
  service: rest_command.yahatl_complete_task
  data:
    note_id: "{{ task.id }}"
```

---

## Troubleshooting

### Cards Not Generating

1. Verify `auto-entities` and `layout-card` are installed
2. Check sensor has items: Developer Tools → States → `sensor.yahatl_tasks_list`
3. Look for errors in browser console

### REST Commands Failing

1. Check `secrets.yaml` has `yahatl_token`
2. Verify token is valid (test in Developer Tools → Services)
3. Watch Home Assistant logs for errors

### Items Not Updating

The coordinator refreshes every 60 seconds by default. To force refresh, reload the YAHATL integration.
