# YAHATL Home Assistant Integration

Native Home Assistant integration for YAHATL task and chore management.

## Features

### Native Todo Lists
- **Inbox** - Quick capture items
- **Tasks** - With due dates and priorities
- **Chores** - Recurring items with auto-reschedule
- **Habits** - Streak tracking

### Sensors
- Overdue task count
- Tasks due today
- Inbox count
- Streaks at risk
- Blocked items

### Binary Sensors
- Pomodoro active
- Has overdue tasks

### Calendar
- Tasks and chores as calendar events
- Automations triggered by due dates

### Services
- `yahatl.capture` - Quick add to inbox
- `yahatl.complete_task` - Mark task complete
- `yahatl.complete_chore` - Complete and reschedule chore
- `yahatl.log_habit` - Log habit completion
- `yahatl.start_pomodoro` / `yahatl.stop_pomodoro`

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

The integration is configured via the UI. You'll set up:
- Household name
- Admin email
- Password

Data is stored locally in `config/.storage/yahatl.db` (SQLite).

## Automation Examples

### Notify when tasks are overdue
```yaml
automation:
  - alias: "YAHATL Overdue Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.yahatl_has_overdue
        to: "on"
    action:
      - service: notify.mobile_app
        data:
          message: "You have overdue tasks!"
```

### Quick capture via voice
```yaml
automation:
  - alias: "Voice Capture"
    trigger:
      - platform: conversation
        command: "Add {item} to my inbox"
    action:
      - service: yahatl.capture
        data:
          title: "{{ trigger.slots.item }}"
```

### Complete task at button press
```yaml
automation:
  - alias: "Complete Task Button"
    trigger:
      - platform: device
        domain: button
        type: press
    action:
      - service: yahatl.complete_task
        data:
          note_id: "your-note-id"
```
