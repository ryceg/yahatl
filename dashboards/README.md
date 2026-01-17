# YAHATL Dashboards

This directory contains dashboard configurations and resources for the YAHATL Home Assistant integration.

## Contents

- **`yahatl_dashboard.yaml`** - Main dashboard with Planning, Capture, and Notes tabs
- **`helpers.yaml`** - Input helpers (text, select, number, boolean) needed by the dashboard
- **`sensors.yaml`** - Template sensors for statistics and state tracking
- **`automations.yaml`** - Example automations for common YAHATL workflows
- **`SETUP_GUIDE.md`** - Comprehensive installation and configuration guide
- **`scripts.yaml`** - Useful scripts for YAHATL operations

## Quick Start

1. **Read the Setup Guide**: Start with `SETUP_GUIDE.md` for detailed instructions
2. **Install Prerequisites**: Mushroom cards, card-mod (optional)
3. **Add Helpers**: Include `helpers.yaml` in your configuration
4. **Add Sensors**: Include `sensors.yaml` in your template configuration
5. **Create Dashboard**: Copy `yahatl_dashboard.yaml` and customize entity IDs
6. **Add Custom Card**: Copy the custom card from `../custom_components/yahatl/www/`
7. **Optional**: Add automations from `automations.yaml`

## Dashboard Features

### Planning Tab
- **Context Status** - Current location, people present, time of day
- **Quick Stats** - Queue count, overdue items, habits at risk
- **Priority Queue** - Tasks sorted by priority and context
- **Pomodoro Timer** - Active timer display (when running)
- **Refresh Queue** - Manual queue update button

### Capture Tab
- **Quick Capture** - Single-line input for fast task entry
- **Inbox Count** - Badge showing items awaiting triage
- **Inbox List** - Items flagged with `needs_detail`
- **Triage Actions** - Quick reference for organizing inbox

### Notes Tab
- **Search** - Full-text search across all items
- **Tag Filters** - Quick filter chips for common tags
- **Notes List** - All items with 'note' trait
- **Needs Detail** - Items flagged for more information
- **Statistics** - Total notes and items needing detail

## Customization

### Entity IDs
Replace these placeholders with your actual entities:
- `todo.yahatl_my_list` → Your YAHATL list entity
- `person.user` → Your person entity
- Zone entities (`zone.work`, `zone.gym`)
- Light and media player entities

### Locations
Edit `input_select.yahatl_location` options to match your locations:
```yaml
options:
  - home
  - work
  - gym
  - your_custom_location
```

### Contexts
Edit `input_select.yahatl_context` options to match your contexts:
```yaml
options:
  - focused_work
  - meetings
  - your_custom_context
```

### Colors and Icons
Customize in the dashboard YAML:
```yaml
icon_color: blue  # Change to your preference
```

### Mobile Layout
The dashboard uses responsive design. Cards automatically adjust for mobile screens.

## Scripts

Common operations available as scripts (in `scripts.yaml`):

- **Quick Add** - Add item with minimal input
- **Triage Item** - Full triage workflow
- **Generate Queue** - Refresh queue with current context
- **Update Context** - Manually update location and contexts
- **Snooze Item** - Delay item by X days
- **Complete and Archive** - Mark complete and move to archive list

## Automations

Example automations provided:

- Auto-refresh queue on context changes
- Clear quick capture after adding items
- Morning briefing notifications
- Overdue reminders
- Inbox triage reminders
- Habit streak alerts
- Location-based queue refresh
- Completion celebrations
- Weekly review reminders
- Context suggestions based on time

## Template Sensors

Provided sensors for dashboard stats:

- `sensor.yahatl_time_period` - Current time period
- `sensor.yahatl_queue_count` - Items in queue
- `sensor.yahatl_overdue_count` - Overdue items
- `sensor.yahatl_inbox_count` - Items in inbox
- `sensor.yahatl_notes_count` - Total notes
- `sensor.yahatl_needs_detail_count` - Items needing detail
- `sensor.yahatl_streak_risk_count` - Habits at risk
- `sensor.yahatl_pomodoro_*` - Pomodoro timer state
- `binary_sensor.yahatl_queue_stale` - Queue needs refresh
- `binary_sensor.yahatl_has_overdue` - Has overdue items
- `binary_sensor.yahatl_has_inbox` - Has inbox items

## Custom Card

The `yahatl-item-card` custom Lovelace card provides:

- Rich item display with traits and tags
- Priority indicators
- Due date highlighting (overdue, today)
- Time estimates
- Recurrence information
- Streak tracking for habits
- Blocker status
- Quick actions (complete, snooze, edit)

### Usage

```yaml
type: custom:yahatl-item-card
entity: todo.yahatl_my_list
item:
  uid: item-123
  title: My Task
  traits: [actionable, habit]
  tags: [work, important]
  priority: high
  due: 2026-01-18T10:00:00Z
  time_estimate: 30
show_actions: true
```

## Screenshots

*(Add screenshots of your dashboard here)*

## Tips

1. **Start with basics** - Enable core features first, add complexity later
2. **Use packages** - Organize all YAHATL config in one package file
3. **Backup regularly** - Export dashboard YAML before major changes
4. **Test templates** - Use Developer Tools → Template to test sensors
5. **Mobile first** - Test on mobile to ensure good UX
6. **Customize colors** - Match your Home Assistant theme
7. **Add notifications** - Mobile alerts for important events

## Troubleshooting

Common issues and solutions:

**Dashboard shows "Entity not found"**
- Check entity IDs in dashboard YAML
- Verify YAHATL integration is loaded
- Use Developer Tools → States to find correct IDs

**Sensors show "Unknown"**
- Restart Home Assistant after adding sensors
- Check template syntax in Developer Tools
- Verify entity IDs in sensor templates

**Custom card not loading**
- Add card to Lovelace resources
- Clear browser cache
- Check browser console for errors

**Automations not triggering**
- Verify trigger entity IDs
- Check conditions are met
- Review automation traces

See `SETUP_GUIDE.md` for more detailed troubleshooting.

## Contributing

Improvements welcome! Please:
1. Test changes thoroughly
2. Update documentation
3. Submit pull requests to main repository

## License

Same as YAHATL project - see main repository.
