# YAHATL Home Assistant Dashboard

This directory contains the official Home Assistant dashboard configuration for YAHATL, designed to serve as the primary frontend through Home Assistant with full metadata editing capabilities.

## Prerequisites

Before using this dashboard, install **Mushroom Cards** via HACS:

1. Open HACS in your Home Assistant instance
2. Navigate to **Frontend** section
3. Click the **+** button and search for "Mushroom"
4. Install **Mushroom Cards**
5. Restart Home Assistant

Optional: Install **Mushroom Themes** for enhanced visuals.

## Files in This Directory

| File | Purpose |
|------|---------|
| `yahatl-dashboard.yaml` | Main Lovelace dashboard configuration |
| `input-helpers.yaml` | Input helper entities for editing |
| `automations.yaml` | Automations and REST commands |
| `README.md` | This documentation |

---

## Installation

### Step 1: Install the Dashboard

**Method A: UI Configuration (Easy)**

1. Go to **Settings** → **Dashboards**
2. Click **Add Dashboard** → **Take control** → **Manual**
3. Copy contents of `yahatl-dashboard.yaml` into the editor

**Method B: YAML Configuration**

Add to `configuration.yaml`:

```yaml
lovelace:
  mode: storage
  dashboards:
    yahatl:
      mode: yaml
      title: YAHATL
      icon: mdi:checkbox-marked-outline
      show_in_sidebar: true
      filename: dashboards/yahatl-dashboard.yaml
```

### Step 2: Add Input Helpers (Optional - for Advanced Editing)

Copy the contents of `input-helpers.yaml` into your `configuration.yaml`:

```yaml
# Include input helpers for YAHATL editing
input_number: !include dashboards/yahatl-input-helpers.yaml
```

Or paste directly into `configuration.yaml`.

### Step 3: Add Automations (Optional - for Quick Capture)

Add REST commands and automations from `automations.yaml` to enable:
- Quick capture via input helper
- API-based metadata updates

---

## Dashboard Overview

### Views

| View | Path | Purpose |
|------|------|---------|
| Dashboard | `/yahatl/dashboard` | Main overview with all sections |
| Tasks | `/yahatl/tasks` | Detailed task management |
| Inbox | `/yahatl/inbox` | Quick capture items |
| Chores | `/yahatl/chores` | Recurring household tasks |
| Habits | `/yahatl/habits` | Streak tracking |
| Pomodoro | `/yahatl/pomodoro` | Full timer controls |
| Capture | `/yahatl/capture` | Quick add to inbox |
| New Task | `/yahatl/new-task` | Create new tasks |
| New Chore | `/yahatl/new-chore` | Create new chores |

### Main Dashboard Sections

1. **Header** - Title + chips for quick stats (overdue, due today, inbox, streaks at risk, pomodoro status)
2. **Summary Cards** - Mushroom template cards for each sensor with color coding
3. **Tasks** - Todo list with quick actions
4. **Chores** - Todo list for recurring items
5. **Habits** - Todo list with streak info
6. **Inbox** - Quick capture processing
7. **Pomodoro** - Timer with quick start buttons (15/25/45/60 min)
8. **Calendar** - Week view of upcoming items
9. **Quick Actions** - Buttons for capture, focus, new task, new chore

---

## Editing Metadata

### Via Todo List Cards

The native Home Assistant todo-list cards support:
- ✅ Adding items
- ✅ Completing items
- ✅ Deleting items
- ✅ Setting due dates (for tasks)

### Via API (For Advanced Editing)

The YAHATL integration exposes REST API endpoints for full metadata control:

**Update Task:**
```bash
curl -X PUT "http://homeassistant:8123/api/yahatl/notes/{noteId}/behaviours/task" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priority": "High", "dueDate": "2026-01-15T00:00:00"}'
```

**Update Chore Interval:**
```bash
curl -X PUT "http://homeassistant:8123/api/yahatl/notes/{noteId}/behaviours/chore" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intervalDays": 14}'
```

**Update Habit Frequency:**
```bash
curl -X PUT "http://homeassistant:8123/api/yahatl/notes/{noteId}/behaviours/habit" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frequencyGoal": "3x per week"}'
```

### Via Input Helpers + Automations

For a more integrated experience, configure the input helpers and automations.

---

## Entity Reference

### Sensors

| Entity | Purpose |
|--------|---------|
| `sensor.yahatl_overdue_count` | Overdue tasks count |
| `sensor.yahatl_due_today` | Tasks due today |
| `sensor.yahatl_inbox_count` | Inbox items |
| `sensor.yahatl_streaks_at_risk` | Habits at risk |
| `sensor.yahatl_blocked_count` | Blocked items |

### Binary Sensors

| Entity | Purpose |
|--------|---------|
| `binary_sensor.yahatl_pomodoro_active` | Timer running |
| `binary_sensor.yahatl_has_overdue` | Any overdue tasks |

### Todo Lists

| Entity | Purpose |
|--------|---------|
| `todo.yahatl_inbox` | Quick capture inbox |
| `todo.yahatl_tasks` | Tasks with due dates |
| `todo.yahatl_chores` | Recurring chores |
| `todo.yahatl_habits` | Habit tracking |

### Calendar

| Entity | Purpose |
|--------|---------|
| `calendar.yahatl` | Tasks/chores as events |

---

## API Endpoints Reference

### Notes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/yahatl/notes` | List all notes |
| POST | `/api/yahatl/notes` | Create note |
| GET | `/api/yahatl/notes/{id}` | Get note with behaviours |
| PUT | `/api/yahatl/notes/{id}` | Update note |
| DELETE | `/api/yahatl/notes/{id}` | Archive note |
| POST | `/api/yahatl/notes/capture` | Quick capture |

### Task Behaviour

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/yahatl/notes/{id}/behaviours/task` | Add task behaviour |
| PUT | `/api/yahatl/notes/{id}/behaviours/task` | Update task (dueDate, priority, status) |
| POST | `/api/yahatl/notes/{id}/behaviours/task/complete` | Complete task |

### Habit Behaviour

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/yahatl/notes/{id}/behaviours/habit` | Add habit behaviour |
| PUT | `/api/yahatl/notes/{id}/behaviours/habit` | Update habit (frequencyGoal) |
| POST | `/api/yahatl/notes/{id}/behaviours/habit/complete` | Log habit |

### Chore Behaviour

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/yahatl/notes/{id}/behaviours/chore` | Add chore behaviour |
| PUT | `/api/yahatl/notes/{id}/behaviours/chore` | Update chore (intervalDays) |
| POST | `/api/yahatl/notes/{id}/behaviours/chore/complete` | Complete chore |

### Dashboard & Pomodoro

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/yahatl/Dashboard/summary` | Get stats |
| POST | `/api/yahatl/Pomodoro/start` | Start timer |
| POST | `/api/yahatl/Pomodoro/stop` | Stop timer |
| GET | `/api/yahatl/Pomodoro/current` | Get current session |

---

## Troubleshooting

### Cards Not Loading
1. Ensure Mushroom Cards is installed via HACS
2. Clear browser cache
3. Restart Home Assistant

### Missing Entities
1. Check YAHATL integration is configured
2. Go to Developer Tools → States
3. Search for "yahatl"

### API Errors
1. Check long-lived access token is valid
2. Verify integration is running
3. Check Home Assistant logs

### Template Errors
Requires Home Assistant 2023.4+ for full template support.
