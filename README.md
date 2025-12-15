# YAHATL
## Yet Another Home Assistant Todo List

Personal information hub combining tasks, habits, chores, reminders, and knowledge management with deep Home Assistant integration.

> **Status**: Initial setup complete. See [SETUP.md](SETUP.md) for build and run instructions.
>
> For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

# YAHATL Design Document

## Problem Statement

Most task/to-do apps fail at handling tasks that are repetitive but not strictly periodic. Cleaning gutters is time-based, bins go out every Tuesday, mowing happens every seven days but timing is flexible. Existing tools force you into rigid schedules or provide no scheduling at all.

Additionally, productivity information is fragmented: tasks in one app, recipes in another, notes elsewhere. Connections between them (gift idea → person → birthday reminder) are lost.

YAHATL solves this by treating everything as linkable notes with optional behaviours attached, and providing flexible scheduling that matches how chores and habits actually work.

---

## Core Domain Model

### Notes

Everything is a Note—the fundamental unit of the system.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| title | string | Display name |
| body | markdown | Content |
| template_type | string? | Null for plain notes, otherwise template name |
| owner_id | UUID | User who owns this note |
| assignee_id | UUID? | User assigned to action this (if applicable) |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last modification |

Notes link to other notes bidirectionally and have tags (simple strings) for flexible categorisation.

### Behaviours

Behaviours attach to Notes to add functionality. A Note can have zero or many behaviours.

**TaskBehaviour**
- status: pending | complete | cancelled
- due_date: date? (can be set manually or calculated from triggers)
- priority: low | normal | high | urgent
- completed_at: timestamp?

**HabitBehaviour**
- frequency_goal: string (e.g., "daily", "3x per week")
- current_streak: integer
- longest_streak: integer
- completion_history: date[]

**ChoreBehaviour**
- last_completed: timestamp?
- next_due: date (calculated from triggers)
- triggers: collection of Trigger entities
- blockers: collection of Blocker entities

**ReminderBehaviour**
- triggers: collection of Trigger entities (typically one, but supports multiple)
- notification_settings: JSON

Note: Triggers and Blockers are first-class entities that can attach to any Note with a behaviour. ChoreBehaviour and ReminderBehaviour reference them, but they exist independently.

### Templates

Templates define optional structure for Notes. Hardcoded in application code for v1.

Each template specifies:
- Fields: name, type (text, number, date, duration, URL, rich text, enum), required flag
- Display hints: rendering in list/card views
- Behaviour defaults: suggested behaviours for this template type

**Initial Templates**

**Person**
- birthday: date
- relationship: enum (family, friend, colleague, other)
- google_contact_id: string? (for optional sync)

**Recipe**
- ingredients: rich text
- method: rich text
- prep_time: duration
- cook_time: duration
- source_url: URL?
- servings: number

**Project**
- status: enum (active, on hold, complete, cancelled)
- deadline: date?
- Child notes represent steps/tasks; only unblocked children surface as actionable

**Gift Idea**
- recipient: link to Person
- price_range: enum or number
- purchase_url: URL?
- occasion: string

**Shopping Item**
- quantity: number
- unit: string
- category: enum (produce, dairy, meat, pantry, household, other)
- source_recipe: link to Recipe?

---

## Scheduling: Triggers & Blockers

Scheduling is built on two first-class concepts: **Triggers** (when something becomes due) and **Blockers** (when something is suppressed). Both are standalone entities that attach to Notes, and a Note can have multiple of each.

### Triggers

Triggers determine when an item becomes actionable. Multiple triggers = any one can fire.

**Fixed Trigger**
Anchored to calendar. "Every Tuesday", "1st of each month".
- pattern: cron-like expression or structured definition
- Fires on each occurrence of the pattern

**Interval Trigger**
Time since last completion. "7 days after I last did this".
- interval_days: integer
- Fires when: last_completed + interval_days <= now
- If never completed, fires immediately

**Window Trigger**
Multiple time windows, sorted by preference. More flexible than a single "preferred day".

```
windows: [
  { preference: 1, days: ["saturday"], time_range: "09:00-12:00" },
  { preference: 2, days: ["sunday"], time_range: "14:00-18:00" },
  { preference: 3, days: ["friday"], time_range: "18:00-21:00" }
]
recurrence: "weekly"
window_expiry: "end_of_last_window" | "days_after:2" | "never"
```

The planner shows which window you're currently in and highlights preference order. If all windows pass without completion, item becomes overdue (unless window_expiry is "never").

**Condition Trigger**
External state, typically from Home Assistant via MQTT.
- topic: string (MQTT topic to subscribe to)
- operator: eq | neq | gt | lt | gte | lte | bool
- value: any
- Example: `{ topic: "sensor/soil_moisture", operator: "lt", value: 30 }`

Fires when condition evaluates true. Can combine with other triggers.

### Blockers

Blockers are first-class entities that prevent items from surfacing as actionable. They support powerful conditional logic.

**Blocker Fields**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| note_id | UUID | Note this blocker applies to |
| type | enum | See types below |
| config | JSON | Type-specific configuration |
| active | boolean | Currently blocking (calculated or manual) |
| notify_on_resolve | boolean | Push notification when blocker clears |

**Blocker Types**

**Note Blocker**
Active until another Note is completed.
- `{ "target_note_id": "uuid" }`
- Auto-resolves when target note's TaskBehaviour status becomes "complete"

**Person Blocker**
Waiting on a person.
- `{ "person_note_id": "uuid", "reason": "waiting for reply" }`
- Manual resolution

**Time Blocker**
Active during specified time periods. Suppresses item visibility.
- `{ "windows": [{ "days": ["monday", "tuesday"], "time_range": "00:00-23:59" }] }`
- Example: "Don't show me work tasks on weekends"
- Auto-activates/deactivates based on current time

**Condition Blocker**
Active when an external condition is true. MQTT-driven.
- `{ "topic": "yahatl/weather/raining_tomorrow", "operator": "eq", "value": true }`
- Example: "Don't suggest mowing if it's raining tomorrow"
- User sets up HA automation to publish boolean to MQTT topic
- Blocker subscribes and activates/deactivates in real-time

**Until Date Blocker**
Suppressed until a specific date. Simple deferral.
- `{ "until": "2024-02-01" }`
- Auto-resolves when date passes

**Freetext Blocker**
Manual blocker with description. Requires manual resolution.
- `{ "description": "Waiting for parts to arrive" }`

### Conditional Templates

For complex recurring patterns, triggers and blockers can be templated and reused.

**Example: Lawn Mowing**
```
triggers:
  - type: interval
    config: { interval_days: 7 }
  - type: condition
    config: { topic: "sensor/grass_height", operator: "gt", value: 50 }

blockers:
  - type: condition
    config: { topic: "yahatl/weather/raining_tomorrow", operator: "eq", value: true }
  - type: time
    config: { windows: [{ days: ["sunday"], time_range: "00:00-10:00" }] }
```

This means: "Due every 7 days OR when grass is tall, BUT NOT if it's raining tomorrow, AND NOT on Sunday mornings."

The emphasis is on simple flexibility—each trigger and blocker is simple, but they compose powerfully.

---

## The Day Generator & Planner Mode

### Planner Mode UI

Split view:
- **Today's Plan**: Items committed for today, user-ordered. Starts empty or with pinned/hard-scheduled items.
- **Candidates**: Everything actionable, sectioned by urgency.

### Candidate Sections

1. **Urgent / Overdue**: Past due date, window closed, streak about to break
2. **Due Soon**: Due today or within scheduling window
3. **Available**: Unblocked tasks, habits ready for repetition, no hard deadline

Each candidate shows why it's surfacing: "overdue 3 days", "due today", "streak at risk", "window closes tomorrow".

### Interaction

User pulls candidates into Today's Plan incrementally. No time slots—just an ordered list to work through.

The app may warn: "You have 2 hours free and 12 items selected" but doesn't block.

### End of Day

Items in Today's Plan not completed either:
- Auto-roll to tomorrow's candidates, or
- Prompt: "These didn't happen—reschedule, defer, or drop?"

Configurable per user.

---

## Capture Mode

Optimised for speed. Get it out of your head, process later.

- Quick entry: title + optional tags, creates plain Note in "Inbox" state
- Voice input via device dictation
- No forced categorisation at capture time

### Inbox Review

Periodic triage of captured items:
- Assign template
- Add behaviours
- Link to projects/people
- Or leave as plain note

### Needs More Detail

Flag for notes requiring fleshing out. Separate from Inbox—these are known items needing enrichment, not uncategorised captures.

---

## Dashboard Mode

At-a-glance status and navigation.

### Status Overview
- Overdue count
- Streaks at risk
- Waiting-on items (may have resolved)
- Upcoming reminders

### Filters
- By person: "What's Claire got on?"
- By project
- By tag
- By template type

### Calendar View
Google Calendar events alongside scheduled tasks/reminders. Read-only overlay.

### Knowledge Base
- Browse by template: all recipes, all people, all projects
- Search across all notes
- Explore links between notes

---

## People & Contacts

People are first-class entities via the Person template.

### Google Contacts Integration
- Optional OAuth connection
- Import creates Person notes with google_contact_id reference
- One-way sync: Google → app (birthdays, names)
- Revoke anytime; Person notes remain, link removed
- No push to Google

### Multi-Tenancy

Baked into data model, minimal UI for v1.

- Users have accounts
- Each Note has an owner
- Notes can be shared: viewer | editor
- Assigning a task to another user surfaces it in their candidates
- Household sharing: notes with certain tags auto-visible to household members

v1: Hardcoded users (Rhys, Claire). Full user management UI later.

---

## Home Assistant Integration

The app is authoritative. HA consumes its API.

### REST API

Used by mobile app and available to HA rest integrations.

- CRUD: notes, behaviours, templates
- Queries: today's plan, candidates, overdue, by person/tag/project
- Actions: complete, snooze, reschedule

### Webhook Receiver

HA posts events to trigger app behaviour:
- Sensor threshold crossed → condition-based chore becomes due
- NFC tag scanned → mark task complete
- Generic event hook for custom automations

### Outbound Webhooks

App notifies external systems:
- Task completed
- Task overdue
- Reminder firing
- Streak at risk

HA automations subscribe and react.

### MQTT Entity Exposure

Real-time state via MQTT with Home Assistant Discovery.

**Published entities:**
- `sensor.yahatl_overdue_count`
- `sensor.yahatl_tasks_due_today`
- `sensor.yahatl_next_task`
- `binary_sensor.yahatl_chores_overdue`
- Per-chore entities with state (due date, overdue flag, last completed)

**Topic structure:**
```
homeassistant/sensor/yahatl/{entity}/config  → discovery payload
yahatl/sensor/{entity}/state                 → current value
```

**Subscribed topics (for condition triggers/blockers):**
```
yahatl/conditions/{condition_name}           → boolean or numeric values
```

Users configure HA automations to publish to these topics. YAHATL subscribes and updates trigger/blocker state in real-time.

New chores auto-create entities via discovery. Deleted chores remove them.

---

## Additional Features

### Meal Planning

Simple recipe-to-day assignment for v1.

- Weekly view showing each day
- Assign Recipe notes (or freeform text) to lunch/dinner slots
- No automatic shopping list derivation initially

### Pomodoro Timer

Built-in focus timer.

- Start against a task: 25-minute focus, 5-minute break
- Track focus time per task over time
- Expose "focus active" state to HA for automations (lights, DND)

### Notifications

Via Expo push notifications.

- Reminder fires → push
- Streak at risk → morning notification
- Task overdue → configurable (opt-in nagging)
- Blocker resolved → if opted in

---

## Tech Stack

### Backend

- **.NET 10** with ASP.NET Core Web API
- **Entity Framework Core** with PostgreSQL
- **MQTT client** (MQTTnet or similar) for HA integration
- **Background services**: scheduled jobs for due date recalculation, notification dispatch
- **Google OAuth**: Calendar (read), Contacts (import)

### Frontend

- **React Native Expo**
- Three modes: Planner, Capture, Dashboard
- Push notifications via Expo
- Online-first for v1; offline sync can come later

### Infrastructure

- Self-hosted alongside Home Assistant
- PostgreSQL database
- MQTT broker (existing HA broker)
- Reverse proxy is user's responsibility

---

## Data Model Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                            NOTE                                 │
│  id, title, body, template_type, owner_id, assignee_id, tags   │
└─────────────────────────────────────────────────────────────────┘
        │              │              │              │
        │ has many     │ has many     │ links to     │ has many
        ▼              ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│ BEHAVIOUR  │  │   TAG      │  │   NOTE     │  │  TRIGGER   │
│            │  │            │  │  (other)   │  │            │
│ Task       │  │  string    │  │            │  │ Fixed      │
│ Habit      │  └────────────┘  └────────────┘  │ Interval   │
│ Chore      │                                  │ Window     │
│ Reminder   │                                  │ Condition  │
└────────────┘                                  └────────────┘
                                                       │
        ┌──────────────────────────────────────────────┘
        │ Note also has many
        ▼
┌────────────────┐
│    BLOCKER     │
│                │
│ Note           │
│ Person         │
│ Time           │
│ Condition      │
│ UntilDate      │
│ Freetext       │
└────────────────┘

┌──────────────┐
│    USER      │
│ id, email,   │
│ household_id │
└──────────────┘
```

---

## Out of Scope for v1

- User management UI (hardcoded users)
- Offline sync
- Shopping list derivation from recipes
- Google Assistant integration
- iOS-specific features requiring native code
- Recipe scaling / nutrition
- Time estimates on tasks

---

## Open Questions for Implementation

1. **Note versioning**: Do we need edit history, or is current state sufficient?
2. **Deletion**: Soft delete (archived) or hard delete?
3. **Search**: Full-text search in Postgres, or external search (Meilisearch)?
4. **API auth**: JWT tokens? API keys for HA?
5. **MQTT topic naming**: Finalise convention before implementation

---

## Next Steps

1. Set up .NET 10 solution structure
2. Define EF Core entities and migrations
3. Implement core CRUD API
4. Basic React Native app with auth
5. Planner mode MVP
6. MQTT integration
7. Iterate based on actual usage
