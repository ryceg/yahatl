# YAHATL Home Assistant Dashboard

This directory contains the official Home Assistant dashboard configuration for YAHATL, designed to serve as the primary frontend through Home Assistant.

## Prerequisites

Before using this dashboard, you must install **Mushroom Cards** via HACS:

1. Open HACS in your Home Assistant instance
2. Navigate to **Frontend** section
3. Click the **+** button
4. Search for "Mushroom"
5. Select and install **Mushroom Cards**
6. Restart Home Assistant

Optional but recommended: Also install **Mushroom Themes** for optimal visual experience.

## Installation

### Method 1: Dashboard UI (Recommended)

1. In Home Assistant, go to **Settings** → **Dashboards**
2. Click **Add Dashboard**
3. Choose **Manual Configuration**
4. Copy the contents of `yahatl-dashboard.yaml` into the dashboard editor

### Method 2: Configuration File

Add to your `configuration.yaml`:

```yaml
lovelace:
  mode: storage
  dashboards:
    yahatl:
      mode: yaml
      title: YAHATL
      icon: mdi:checkbox-marked-outline
      show_in_sidebar: true
      filename: custom_dashboards/yahatl-dashboard.yaml
```

Then copy `yahatl-dashboard.yaml` to your Home Assistant config directory under `custom_dashboards/`.

## Dashboard Overview

### Main Dashboard View

The main dashboard provides a comprehensive overview:

| Section | Description |
|---------|-------------|
| **Header** | Title with date, quick stat chips for overdue, due today, inbox, streaks at risk, and pomodoro status |
| **Summary Cards** | Color-coded Mushroom template cards for each sensor |
| **Pomodoro Timer** | Quick start buttons for 15/25/45/60 minute focus sessions |
| **Todo Lists** | Native HA todo-list cards for Tasks, Inbox, Chores, and Habits |
| **Calendar** | Week view of upcoming scheduled items |
| **Quick Actions** | Capture button and mobile app link |

### Additional Views

Each todo list type has its own dedicated view accessible from the sidebar:

- `/yahatl/tasks` - All tasks
- `/yahatl/inbox` - Inbox items
- `/yahatl/chores` - Recurring chores
- `/yahatl/habits` - Habit tracking

## Entity Reference

### Sensors Used

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

## Services

The dashboard integrates with YAHATL services:

- `yahatl.capture` - Quick capture to inbox
- `yahatl.start_pomodoro` - Start focus timer
- `yahatl.stop_pomodoro` - Stop timer
- `yahatl.complete_task` - Mark task complete
- `yahatl.complete_chore` - Mark chore complete
- `yahatl.log_habit` - Log habit completion

## Customization

### Color Scheme

The dashboard uses dynamic templating for colors:
- **Green**: Good status (no overdue, streaks maintained)
- **Red**: Attention needed (overdue tasks, active timer)
- **Orange**: Due today, streaks at risk
- **Blue**: Inbox items
- **Grey**: Inactive/empty states

### Layout

The dashboard uses the `sections` layout type with a 3-column grid. Adjust `max_columns` and `column_span` values to customize for your screen size.

## Troubleshooting

### Cards not loading

Ensure Mushroom Cards is installed and you've cleared your browser cache after installation.

### Missing entities

Make sure the YAHATL integration is properly configured and running. Check **Developer Tools** → **States** for entity availability.

### Templates not rendering

Verify your Home Assistant version supports the templating features used (requires HA 2023.4+).
