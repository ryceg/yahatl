# YAHATL Setup Guide

## Installation

1. **Install via HACS** — Add this repository as a custom integration, then install "yahatl".
2. **Restart Home Assistant.**
3. **Add the integration** — Go to Settings > Integrations > Add Integration > search "yahatl". Enter a list name (e.g. "My List").

That's it. The integration auto-registers its custom cards and creates all sensor entities.

## Adding Cards to Your Dashboard

Add the queue card to any dashboard:

```yaml
type: custom:yahatl-queue-card
entity: sensor.yahatl_my_list_queue
todo_entity: todo.yahatl_my_list
title: Up Next
max_items: 8
```

Add the native todo list card for full item browsing:

```yaml
type: todo-list
entity: todo.yahatl_my_list
```

See `yahatl_dashboard.yaml` for a complete example layout with sensor summary cards.

## Using the Item Editor

Click **Edit** on any item (in the item card or queue card) to open the editor dialog. From there you can configure:

- **Basics** — title, description, priority, due date, time estimate
- **Traits & Tags** — mark items as habits, chores, reminders, notes; add tags
- **Recurrence** — calendar patterns, elapsed intervals, frequency goals
- **Blockers** — block items until other items are done or sensors change state
- **Requirements** — location, people, time, and context constraints
- **Schedule** — time windows, condition triggers, deferral

## Optional: Example Automations

See `example_automations.yaml` for useful automations you can adapt:

- Morning briefing notification
- Overdue item reminders
- Inbox triage reminders
- Habit streak alerts
- Completion celebrations
- Weekly review reminders
