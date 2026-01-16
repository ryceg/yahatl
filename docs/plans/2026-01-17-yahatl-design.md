# yahatl Design Document

**Yet Another Home Assistant Todo List**

*Design finalized: 2026-01-17*

---

## 1. Overview & Goals

### What it is

A comprehensive task/habit/chore/reminder/notes system that deeply integrates with Home Assistant, replacing HA's barebones todo lists with a flexible, context-aware system.

### Core problems it solves

- Recurring tasks that are time-elapsed ("every 3 months since last done") not just calendar-based
- Context-aware task surfacing (location, people present, time of day)
- Composable item types (a task can be a chore AND a habit)
- Quick capture with later triage
- Integration with HA sensors for dynamic blocking and triggering

### Components

1. **yahatl HA Integration** (`custom_components/yahatl`) - Extends HA's todo platform with rich schema, custom services
2. **yahatl React Native App** - Expo-based Android app (iOS later), connects via long-lived token
3. **yahatl HA Dashboard** - Mushroom-based Lovelace cards, single dashboard with tabs

### Users

Home Assistant users, multi-user via HA's user system, with shared and private lists.

---

## 2. Data Model

### Item (Task/Note) Schema

```yaml
Item:
  id: string                    # Unique identifier
  title: string
  description: string           # Optional

  # Type & Organization
  traits:                       # [actionable, recurring, habit, chore, reminder, note]
  tags: string[]                # User-defined, e.g., "work", "outdoor"
  list_id: string               # Which list it belongs to

  # Status
  status: pending | in_progress | completed | missed
  needs_detail: boolean         # Flagged for fleshing out

  # Scheduling
  due: datetime                 # Optional, for one-offs or calendar-based
  time_estimate: minutes        # Optional, falls back to defaults
  buffers:
    before: minutes
    after: minutes

  # Recurrence (one of)
  recurrence:
    type: calendar | elapsed | frequency
    # calendar: cron-style ("every Tuesday", "March 15 yearly")
    # elapsed: { interval: 3, unit: months } (since last completion)
    # frequency: { count: 1, period: 30, unit: days } (X times per period)
    thresholds:                 # For frequency goals
      - at_days_remaining: 20
        priority: medium
      - at_days_remaining: 5
        priority: high

  # Requirements (for day planner queue)
  requirements:
    mode: ANY | ALL
    location: string[]          # home, office, out, etc.
    people: string[]            # HA user IDs or names
    time_constraints: string[]  # business_hours, weekend, evening
    context: string[]           # computer, phone, car
    sensors: entity_id[]        # Binary sensors that must be "on"

  # Blocking
  blockers:
    mode: ANY | ALL
    items: item_id[]            # Blocked by other tasks
    sensors: entity_id[]        # Blocked while sensor is "on"

  # Tracking
  completion_history:           # Capped at 365 entries
    - user_id: string
      timestamp: datetime
  current_streak: number        # For habits
  created_at: datetime
  created_by: user_id
```

### List Schema

```yaml
List:
  id: string
  name: string
  owner: user_id
  visibility: private | shared
  shared_with: user_id[]        # If shared, empty = all users
  is_inbox: boolean             # System inbox, one per user
```

### Global Defaults (configurable)

- Default time estimate: 30 minutes
- Default buffers: 0 before, 0 after
- Completion history cap: 365 entries

---

## 3. Home Assistant Integration

### Domain

`yahatl` (extends built-in `todo` platform)

### Storage

Extends HA's todo storage (`.storage/todo.{entity_id}`) with yahatl's additional fields. All data in one place per list.

### Entities

- Each list is a `todo` entity: `todo.yahatl_{list_name}`
- System inbox per user: `todo.yahatl_inbox_{username}`

### Services

| Service | Description |
|---------|-------------|
| `yahatl.add_item` | Create item (extends `todo.add_item` with full schema) |
| `yahatl.update_item` | Update item fields |
| `yahatl.complete_item` | Mark complete, log history, handle recurrence |
| `yahatl.set_traits` | Update traits on an item |
| `yahatl.set_requirements` | Set location/people/time/context/sensor requirements |
| `yahatl.set_recurrence` | Configure recurrence rules and thresholds |
| `yahatl.set_blockers` | Set blocking dependencies (items and/or sensors, ANY/ALL) |
| `yahatl.flag_needs_detail` | Mark item for fleshing out |
| `yahatl.get_queue` | Get prioritized task list for current context |
| `yahatl.update_context` | Manually override current location/people/time |
| `yahatl.start_pomodoro` | Start timer for a task |
| `yahatl.stop_pomodoro` | End timer early |
| `yahatl.pomodoro_status` | Get current timer state |
| `yahatl.set_list_visibility` | Configure private/shared settings |

### Events Fired

- `yahatl_item_completed` - When item is marked complete (includes user, timestamp, item details)
- `yahatl_pomodoro_complete` - When work/break timer finishes

### Context Sources for Queue Generation

1. HA calendar entities (scheduled blocks)
2. Presence/device tracker sensors (who's home, location)
3. Manual override via `yahatl.update_context`

---

## 4. Queue Algorithm (Day Planner)

### Purpose

Given current context, return a prioritized list of tasks to do next. Not a rigid schedule - a dynamic "what should I do now?" queue.

### Inputs

- Current location (from sensors or manual)
- People present (from presence sensors or manual)
- Current time / day of week
- Available time (optional - filters by time estimate)
- All non-blocked, non-completed actionable items

### Filtering

1. Exclude items where `status` is `completed` or `missed`
2. Exclude items blocked by incomplete tasks (respecting ANY/ALL)
3. Exclude items blocked by sensors currently "on"
4. Exclude items whose requirements aren't met:
   - If `mode: ALL` - all requirements must match
   - If `mode: ANY` - at least one requirement set must match
5. Exclude items with time estimates exceeding available time (if specified)

### Scoring (fixed weights)

| Factor | Weight | Logic |
|--------|--------|-------|
| Overdue | +100 | Past due date |
| Due today | +50 | Due within 24 hours |
| Due this week | +20 | Due within 7 days |
| Frequency threshold hit | +30/60/90 | Based on configured threshold priority (medium/high/critical) |
| Habit streak at risk | +40 | Will break streak if not done today |
| Explicit priority | +10/25/50 | Low/medium/high manual override |
| Recently unblocked | +15 | Unblocked in last 24 hours |
| Context match quality | +10 | Matches ALL requirements vs minimum ANY match |

### Output

Items sorted by score descending. Ties broken by due date (sooner first), then creation date (older first).

---

## 5. React Native App

### Stack

- Expo (managed workflow to start)
- React Query for data fetching/caching
- Long-lived access token authentication

### Platform

Android first, sideloaded APKs. iOS later.

### Offline Behavior

Read-only cache. View last-known state when disconnected, sync changes when reconnected.

### Navigation

Bottom navigation with three modes:

1. **Planning** - Auto-generated priority queue based on current context
2. **Capture** - Quick capture (FAB) + inbox triage (card stack)
3. **Notes** - Two tabs: "Notes" (list + search + tags) and "Needs Detail" (fleshing out)

### Key Screens

| Screen | Purpose |
|--------|---------|
| Queue | Shows prioritized task list, tap to view/complete, pull to refresh context |
| Item Detail | Full item view/edit - all fields, freeform editing |
| Triage | Card stack of inbox items, buttons for: assign list, add traits, set due, flag for detail, delete, mark done |
| Notes Browser | List of notes, search bar, tag filters, shows linked task count |
| Flesh Out | List of items flagged `needs_detail`, tap to open Item Detail |
| Pomodoro | Timer view when active, shows current task, work/break status |
| Settings | HA connection (URL + token), pomodoro timings, default time estimates |

### Quick Capture

- FAB visible on all screens
- Tap opens modal with single text input
- Submit creates item in user's inbox with `needs_detail: true`
- Keyboard auto-focused, submit on enter

### Pomodoro

- Global config: work duration, short break, long break, sessions before long break
- Start from any task in queue or detail view
- Timer runs as foreground service (Android) for reliability
- Notification on complete, auto-starts break timer

---

## 6. Home Assistant Dashboard

### Approach

Single Lovelace dashboard using Mushroom cards, with horizontal tabs for modes.

### Dashboard Structure

```
yahatl Dashboard
├── Tab: Planning
│   ├── Context status card (location, who's home, time)
│   ├── Queue list (prioritized tasks, tap to expand/complete)
│   └── Pomodoro card (current timer if active)
│
├── Tab: Capture
│   ├── Quick capture card (text input + submit button)
│   ├── Inbox count badge
│   └── Inbox list (items pending triage, tap to edit)
│
└── Tab: Notes
    ├── Search input
    ├── Tag filter chips
    ├── Notes list (with linked task counts)
    └── Needs Detail section (flagged items)
```

### Card Types Needed

| Card | Implementation |
|------|----------------|
| Context status | Mushroom template card showing sensor states |
| Queue list | Mushroom entity card or custom card with item actions |
| Pomodoro timer | Mushroom template card with timer display, start/stop buttons |
| Quick capture | Mushroom input card or custom card with text field |
| Item lists | Mushroom cards or native HA todo card (extended) |
| Tag filters | Mushroom chips card |

### Interactions Requiring Popups/Modals

- Creating item with full details
- Editing item (opens more-info dialog or custom popup)
- Triage actions (assign list, traits, etc.)

**Note:** Full feature parity with mobile means some interactions may need custom Lovelace cards beyond Mushroom's capabilities. We'll use Mushroom where possible, custom cards where necessary.

---

## 7. Example HA Automations

### Block mowing if rained recently

```yaml
alias: "Block mowing after rain"
trigger:
  - platform: state
    entity_id: binary_sensor.rained_last_8h
    to: "on"
action:
  - service: yahatl.set_blockers
    data:
      item_id: "mow_lawn"
      sensors:
        - binary_sensor.rained_last_8h
```

### Block oven cleaning when hot

```yaml
alias: "Block oven clean when hot"
trigger:
  - platform: numeric_state
    entity_id: sensor.outside_temp
    above: 30
action:
  - service: yahatl.set_blockers
    data:
      item_id: "clean_oven"
      sensors:
        - binary_sensor.too_hot_for_oven_cleaning
```

### Create todo when Roborock errors

```yaml
alias: "Roborock error todo"
trigger:
  - platform: state
    entity_id: vacuum.roborock
    attribute: error
action:
  - service: yahatl.add_item
    data:
      title: "Fix Roborock: {{ trigger.to_state.attributes.error }}"
      list_id: "household_chores"
      traits:
        - actionable
        - chore
```

### Bins every Tuesday morning

```yaml
# No automation needed - configured in yahatl:
# recurrence:
#   type: calendar
#   cron: "0 7 * * TUE"
```

### Chickens to bed at sunset

```yaml
alias: "Chickens to bed"
trigger:
  - platform: sun
    event: sunset
action:
  - service: yahatl.add_item
    data:
      title: "Put chickens to bed"
      list_id: "daily_chores"
      traits:
        - actionable
        - chore
      due: "{{ now() + timedelta(hours=1) }}"
```

### Alternative: Condition-based visibility for chickens

```yaml
# Item exists with requirement:
# requirements:
#   sensors:
#     - binary_sensor.after_sunset
# Item only appears in queue when sun is below horizon
```

---

## 8. Project Structure

### Repositories

```
yahatl-core/                    # This repo - HA integration
├── custom_components/
│   └── yahatl/
│       ├── __init__.py         # Integration setup
│       ├── manifest.json       # HA integration manifest
│       ├── const.py            # Constants
│       ├── todo.py             # Extended todo platform
│       ├── services.py         # Service handlers
│       ├── storage.py          # Extended storage schema
│       ├── queue.py            # Queue algorithm
│       ├── pomodoro.py         # Pomodoro timer logic
│       └── strings.json        # Translations
├── hacs.json                   # HACS metadata (for easy install)
└── README.md

yahatl-app/                     # Separate repo - React Native app
├── src/
│   ├── api/                    # HA API client
│   ├── components/             # Reusable UI components
│   ├── screens/                # Screen components
│   │   ├── Queue/
│   │   ├── Capture/
│   │   ├── Triage/
│   │   ├── Notes/
│   │   ├── ItemDetail/
│   │   └── Settings/
│   ├── hooks/                  # React Query hooks
│   ├── context/                # Auth, Pomodoro state
│   └── utils/
├── app.json                    # Expo config
└── package.json

yahatl-cards/                   # Separate repo - Custom Lovelace cards (if needed)
├── src/
│   ├── yahatl-queue-card.js
│   ├── yahatl-capture-card.js
│   └── yahatl-pomodoro-card.js
├── hacs.json
└── README.md
```

### Installation Methods

- **HA Integration:** HACS custom repository or manual copy to `custom_components/`
- **React Native App:** Sideload APK
- **Lovelace Cards:** HACS custom repository or manual

---

## 9. Implementation Phases

### Phase 1: Core Integration (MVP)

- Basic yahatl integration with extended todo storage
- Item schema: title, description, traits, tags, status, due date
- Lists: create, private/shared, system inbox
- Services: add_item, update_item, complete_item, set_traits
- Completion history tracking
- HACS-compatible structure

### Phase 2: Recurrence & Blocking

- Calendar-based recurrence (cron-style)
- Elapsed-based recurrence (X since last completion)
- Frequency goals with configurable thresholds
- Task blockers (items, ANY/ALL)
- Sensor blockers (binary sensor references)
- Streak tracking for habits

### Phase 3: Queue & Context

- Queue algorithm implementation
- Requirements: location, people, time, context, sensors
- Context sources: manual, calendar, presence sensors
- `get_queue` service
- `update_context` service

### Phase 4: React Native App (Basic)

- Expo project setup
- HA authentication (long-lived token)
- Queue screen (view prioritized tasks)
- Item detail screen (view/edit/complete)
- Quick capture (FAB → inbox)
- Offline read-only cache

### Phase 5: React Native App (Full)

- Triage card stack
- Notes browser with search and tags
- Flesh out mode
- Pomodoro timer (foreground service)

### Phase 6: HA Dashboard

- Mushroom-based dashboard with tabs
- Queue display card
- Quick capture card
- Custom cards as needed for full parity

---

## 10. Open Questions & Future Considerations

### Deferred to Later Versions

- iOS support (after Android is stable)
- OAuth authentication (currently long-lived token)
- Global search across items and notes
- Archive vs delete (currently just delete)
- Undo functionality
- Bulk operations outside triage
- Home screen widgets
- Theming / dark mode customization
- Rich notes (structured fields, wiki-linking, knowledge graph)
- Learned time estimates from completion data

### Technical Decisions to Validate During Implementation

- Exact storage schema extension approach - may need to subclass HA's todo storage
- Pomodoro timer persistence across HA restarts
- React Query cache invalidation strategy for real-time updates
- Custom card complexity - may need to reassess Mushroom vs custom

### Potential Challenges

- HA's todo platform limitations - may hit walls extending it
- Foreground service reliability on Android for Pomodoro
- Complex requirement matching performance with many items
- Multi-user sync edge cases (simultaneous edits)

---

## Summary

yahatl is a context-aware task management system built as a Home Assistant integration with a React Native companion app. It supports composable item types (traits), flexible recurrence patterns, sensor-based blocking, and a priority queue that adapts to your current situation.
