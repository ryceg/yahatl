# YAHATL Home Assistant Integration

YAHATL is a native Home Assistant custom component for task, habit, and chore management.

## Installation

### HACS (Recommended)
1. Add this repository to HACS as a custom repository
2. Search for "YAHATL" and install
3. Restart Home Assistant
4. Go to Settings → Devices & Services → Add Integration → YAHATL

### Manual
1. Copy `custom_components/yahatl` to your `config/custom_components/` directory
2. Restart Home Assistant
3. Add the integration via UI

## Configuration

The integration is configured entirely through the UI:

1. **Household Name** - Your household identifier
2. **Email** - Admin email (for mobile app login)
3. **Password** - Admin password

Data is stored locally in `config/.storage/yahatl.db` (SQLite).

---

## Entities

### Todo Lists
| Entity | Description |
|--------|-------------|
| `todo.yahatl_inbox` | Quick capture items |
| `todo.yahatl_tasks` | Tasks with due dates |
| `todo.yahatl_chores` | Recurring chores |
| `todo.yahatl_habits` | Habit tracking with streaks |

### Sensors
| Entity | Description |
|--------|-------------|
| `sensor.yahatl_overdue_count` | Number of overdue tasks |
| `sensor.yahatl_due_today` | Tasks due today |
| `sensor.yahatl_inbox_count` | Inbox item count |
| `sensor.yahatl_streaks_at_risk` | Habits needing attention |
| `sensor.yahatl_blocked_count` | Blocked items |

### Binary Sensors
| Entity | Description |
|--------|-------------|
| `binary_sensor.yahatl_pomodoro_active` | Timer running |
| `binary_sensor.yahatl_has_overdue` | Any overdue tasks |

### Calendar
| Entity | Description |
|--------|-------------|
| `calendar.yahatl` | Tasks and chores as calendar events |

---

## Services

### yahatl.capture
Quick capture a note to inbox.
```yaml
service: yahatl.capture
data:
  title: "Buy milk"
  tags:
    - shopping
```

### yahatl.complete_task
Mark a task as complete.
```yaml
service: yahatl.complete_task
data:
  note_id: "uuid-here"
```

### yahatl.complete_chore
Complete a chore and reschedule.
```yaml
service: yahatl.complete_chore
data:
  note_id: "uuid-here"
```

### yahatl.log_habit
Log a habit completion for today.
```yaml
service: yahatl.log_habit
data:
  note_id: "uuid-here"
```

### yahatl.start_pomodoro
Start a Pomodoro timer.
```yaml
service: yahatl.start_pomodoro
data:
  note_id: "uuid-here"  # optional
  duration_minutes: 25
```

### yahatl.stop_pomodoro
Stop the current Pomodoro session.
```yaml
service: yahatl.stop_pomodoro
```

---

## Mobile App

The React Native mobile app connects directly to Home Assistant.

### Setup
Set the API URL in your app:
```
EXPO_PUBLIC_API_URL=http://homeassistant.local:8123/api/yahatl
```

The app uses Home Assistant's authentication system.

---

## Automation Examples

### Voice Capture
```yaml
automation:
  - alias: "Voice Capture to Inbox"
    trigger:
      - platform: conversation
        command: "Add {item} to my inbox"
    action:
      - service: yahatl.capture
        data:
          title: "{{ trigger.slots.item }}"
```

### Notify on Overdue
```yaml
automation:
  - alias: "Overdue Task Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.yahatl_has_overdue
        to: "on"
    action:
      - service: notify.mobile_app
        data:
          message: "You have overdue tasks!"
```

### Complete Task with Button
```yaml
automation:
  - alias: "Button Complete Task"
    trigger:
      - platform: state
        entity_id: input_button.complete_task
    action:
      - service: yahatl.complete_task
        data:
          note_id: "your-note-id"
```

### Habit Reminder
```yaml
automation:
  - alias: "Evening Habit Reminder"
    trigger:
      - platform: time
        at: "20:00:00"
    condition:
      - condition: numeric_state
        entity_id: sensor.yahatl_streaks_at_risk
        above: 0
    action:
      - service: notify.mobile_app
        data:
          message: "Don't forget your habits!"
```

### Pomodoro with Lights
```yaml
automation:
  - alias: "Pomodoro Focus Mode"
    trigger:
      - platform: state
        entity_id: binary_sensor.yahatl_pomodoro_active
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.office
        data:
          color_name: red
          brightness: 50
```

---

## Troubleshooting

### Integration Not Loading
1. Check `config/custom_components/yahatl/` exists
2. Verify all files are present
3. Check Home Assistant logs for errors

### Entities Not Appearing
1. Ensure the integration is configured
2. Restart Home Assistant
3. Check Settings → Devices & Services → YAHATL

### Mobile App Connection Issues
1. Verify HA is accessible from mobile device
2. Check the API URL is correct
3. Ensure authentication is working
