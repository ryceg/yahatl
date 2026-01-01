# YAHATL Design Document
## Yet Another Home Assistant Todo List

Personal information hub combining tasks, habits, chores, reminders, and knowledge management—built as a native Home Assistant integration.

## Problem Statement

Most task/to-do apps fail at handling tasks that are repetitive but not strictly periodic. Cleaning gutters is time-based, bins go out every Tuesday, mowing happens every seven days but timing is flexible. Existing tools force you into rigid schedules or provide no scheduling at all.

Additionally, productivity information is fragmented: tasks in one app, recipes in another, notes elsewhere. Connections between them (gift idea → person → birthday reminder) are lost.

YAHATL solves this by treating everything as linkable notes with optional behaviours attached, and providing flexible scheduling that matches how chores and habits actually work.

---

## Architecture

YAHATL runs as a **Home Assistant custom integration**. All data is stored locally in SQLite. The mobile app connects directly to Home Assistant's API.

```
┌─────────────────┐         ┌──────────────────┐
│   Mobile App    │ ──────→ │  Home Assistant  │
│ (React Native)  │  HTTP   │  YAHATL Plugin   │
└─────────────────┘         └────────┬─────────┘
                                     │
                            ┌────────▼─────────┐
                            │  SQLite Database │
                            │  .storage/yahatl │
                            └──────────────────┘
```

---

## Core Domain Model

### Notes

Everything is a Note—the fundamental unit of the system.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| title | string | Display name |
| body | markdown | Content |
| template_type | string? | Note, Task, Habit, Chore, Person, etc. |
| owner_id | UUID | User who owns this note |
| assignee_id | UUID? | User assigned (if applicable) |
| is_inbox | boolean | Quick capture, needs processing |
| is_archived | boolean | Soft deleted |

Notes link to other notes bidirectionally and have tags for flexible categorisation.

### Behaviours

Behaviours attach to Notes to add functionality.

**TaskBehaviour**
- status: Pending | InProgress | Complete | Cancelled
- due_date: datetime?
- priority: Low | Normal | High | Urgent
- completed_at: datetime?

**HabitBehaviour**
- frequency_goal: string (e.g., "daily", "3x per week")
- current_streak: integer
- longest_streak: integer
- last_completed: datetime?
- completion_history: JSON array of dates

**ChoreBehaviour**
- interval_days: integer
- last_completed: datetime?
- next_due: datetime

### Blockers

Blockers prevent items from surfacing as actionable.

| Type | Description |
|------|-------------|
| NoteBlocker | Active until another Note is completed |
| PersonBlocker | Waiting on a person |
| TimeBlocker | Active during specified time periods |
| ConditionBlocker | Active when HA entity state matches |
| UntilDateBlocker | Suppressed until a specific date |
| FreetextBlocker | Manual blocker with description |

---

## Home Assistant Integration

### Entities

**Todo Lists** (HA native todo platform)
| Entity | Description |
|--------|-------------|
| `todo.yahatl_inbox` | Quick capture items |
| `todo.yahatl_tasks` | Tasks with due dates |
| `todo.yahatl_chores` | Recurring chores |
| `todo.yahatl_habits` | Habit tracking with streaks |

**Sensors**
| Entity | Description |
|--------|-------------|
| `sensor.yahatl_overdue_count` | Overdue tasks |
| `sensor.yahatl_due_today` | Due today count |
| `sensor.yahatl_inbox_count` | Inbox items |
| `sensor.yahatl_streaks_at_risk` | Habits needing attention |
| `sensor.yahatl_blocked_count` | Blocked items |

**Binary Sensors**
| Entity | Description |
|--------|-------------|
| `binary_sensor.yahatl_pomodoro_active` | Timer running |
| `binary_sensor.yahatl_has_overdue` | Any overdue tasks |

**Calendar**
| Entity | Description |
|--------|-------------|
| `calendar.yahatl` | Tasks/chores as events |

### Services

```yaml
yahatl.capture:
  title: string (required)
  tags: list (optional)

yahatl.complete_task:
  note_id: string (required)

yahatl.complete_chore:
  note_id: string (required)

yahatl.log_habit:
  note_id: string (required)

yahatl.start_pomodoro:
  note_id: string (optional)
  duration_minutes: int (default: 25)

yahatl.stop_pomodoro:
```

---

## REST API (Mobile App)

The HA integration exposes a REST API at `/api/yahatl/*` for the mobile app.

### Authentication
Uses Home Assistant Long-Lived Access Tokens.

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/yahatl/Auth/login` | POST | Auth (returns user info) |
| `/api/yahatl/notes` | GET | List all notes |
| `/api/yahatl/notes` | POST | Create note |
| `/api/yahatl/notes/{id}` | GET/PUT/DELETE | Note CRUD |
| `/api/yahatl/notes/capture` | POST | Quick inbox capture |
| `/api/yahatl/notes/{id}/behaviours/task` | POST | Add task behaviour |
| `/api/yahatl/notes/{id}/behaviours/task/complete` | POST | Complete task |
| `/api/yahatl/notes/{id}/behaviours/habit` | POST | Add habit |
| `/api/yahatl/notes/{id}/behaviours/habit/complete` | POST | Log habit |
| `/api/yahatl/notes/{id}/behaviours/chore` | POST | Add chore |
| `/api/yahatl/notes/{id}/behaviours/chore/complete` | POST | Complete chore |
| `/api/yahatl/Dashboard/summary` | GET | Dashboard stats |
| `/api/yahatl/Pomodoro/start` | POST | Start timer |
| `/api/yahatl/Pomodoro/stop` | POST | Stop timer |
| `/api/yahatl/Pomodoro/current` | GET | Current session |

---

## Mobile App

### Stack
- **Expo** (managed workflow, SDK 52+)
- **Expo Router** (file-based navigation)
- **NativeWind v4** (Tailwind CSS for RN)
- **TanStack Query** (server state)
- **Zustand** (local UI state)

### Connection
```
EXPO_PUBLIC_API_URL=http://homeassistant.local:8123/api/yahatl
```

The app stores a Home Assistant Long-Lived Access Token for authentication.

### Key Screens
- **Planner**: Today's plan + candidates
- **Capture**: Quick inbox entry
- **Dashboard**: Stats + upcoming items
- **Settings**: Account, notifications

---

## Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                            NOTE                                 │
│  id, title, body, template_type, owner_id, is_inbox, is_archived│
└─────────────────────────────────────────────────────────────────┘
        │                              │
        │ has one (optional)           │ has many
        ▼                              ▼
┌────────────────┐              ┌────────────────┐
│  BEHAVIOUR     │              │    BLOCKER     │
│                │              │                │
│ TaskBehaviour  │              │ NoteBlocker    │
│ HabitBehaviour │              │ PersonBlocker  │
│ ChoreBehaviour │              │ TimeBlocker    │
└────────────────┘              │ ConditionBlocker│
                                │ UntilDateBlocker│
                                │ FreetextBlocker │
                                └────────────────┘

┌──────────────┐     ┌──────────────┐
│  HOUSEHOLD   │────▶│    USER      │
│ id, name     │     │ id, email,   │
└──────────────┘     │ password_hash│
                     └──────────────┘
```

---

## Out of Scope for v1

- User management UI (single household, users created at setup)
- Offline sync
- Google Calendar/Contacts integration
- Recipe meal planning
- Triggers (conditions for scheduling)

---

## Future Enhancements

1. **Condition Triggers**: HA entity states triggering due dates
2. **Condition Blockers**: Block based on HA entity state
3. **Push Notifications**: Via Expo push service
4. **Multi-User**: Household sharing, task assignment
5. **Knowledge Base**: Browse by template, search, link exploration