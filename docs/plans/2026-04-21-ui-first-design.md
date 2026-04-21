# UI-First: Bake All Features Into Home Assistant

**Date:** 2026-04-21
**Status:** Approved

## Problem

yahatl's distinguishing features (traits, recurrence, blockers, requirements, condition triggers, time blockers, deferral) are only accessible through Developer Tools > Services. Users who install the integration get a basic todo list. The dashboard setup requires manually creating 7 helper entities, importing template sensors (half of which are broken), and copying scripts. This is unacceptable for a custom component that should work out of the box.

## Solution

Build a card-native item editor, upgrade the existing cards, add a WebSocket API for rich data retrieval, add missing built-in sensors, auto-register frontend resources, and delete all workaround infrastructure.

## Architecture

### WebSocket API

Three new WebSocket commands registered in `__init__.py` via `hass.components.websocket_api.async_register_command()`:

**`yahatl/item_details`**
- Input: `entity_id`, `item_id`
- Returns: Full `YahtlItem.to_dict()` — all extended fields (traits, tags, recurrence, blockers, requirements, condition_triggers, time_blockers, completion_history, streaks, etc.)

**`yahatl/items_list`**
- Input: `entity_id`
- Returns: Array of `{ uid, title, status, traits }` — lightweight summaries for selection UIs (e.g. blocker item picker)

**`yahatl/item_save`**
- Input: `entity_id`, `item_id`, plus any subset of item fields: `title`, `description`, `traits`, `tags`, `due`, `time_estimate`, `buffer_before`, `buffer_after`, `priority`, `needs_detail`, `recurrence`, `blockers`, `requirements`, `condition_triggers`, `time_blockers`, `deferred_until`
- Returns: Updated full item dict
- Single round-trip for the editor save — replaces calling 5+ separate services
- Existing services (`set_traits`, `set_recurrence`, etc.) remain available for automations

### Item Editor Dialog

New file: `custom_components/yahatl/www/yahatl-item-editor.js`

A web component that renders as a modal overlay. Opened via custom event `yahatl-open-editor` dispatched by item card and queue card.

**Data flow:**
1. Editor opens -> calls `hass.callWS({ type: 'yahatl/items_list' })` for item/blocker pickers
2. Calls `hass.callWS({ type: 'yahatl/item_details' })` to load full item
3. Populates form
4. User edits -> Save -> calls `hass.callWS({ type: 'yahatl/item_save' })` with changed fields
5. On success -> closes dialog, cards re-render from state update

**Tab structure:**

| Tab | Controls |
|-----|----------|
| Basics | Title (text), Description (textarea), Priority (select: low/medium/high), Due (date/datetime picker), Time estimate (number), Needs detail (toggle) |
| Traits & Tags | Trait checkboxes (actionable, recurring, habit, chore, reminder, note), Tag chips with add/remove text input |
| Recurrence | Type selector (none/calendar/elapsed/frequency) -> conditional fields. Calendar: pattern. Elapsed: interval + unit. Frequency: count + period + unit + threshold list |
| Blockers | Item blockers (multi-select from items_list, with mode), Sensor blockers (entity picker, with mode), Overall mode (ANY/ALL) |
| Requirements | Location (multi-text), People (multi-text), Time constraints (multi-select), Context (multi-text), Sensors (entity picker), Mode (ANY/ALL) |
| Schedule | Time blockers list (add/remove: start_time, end_time, mode, days), Condition triggers list (add/remove: entity_id, operator, value, attribute, on_match), Defer until (date picker) |

**Styling:** Uses HA CSS custom properties for theme compatibility. Modal backdrop, centered dialog max-width ~500px, tabs as horizontal row, save/cancel fixed at bottom.

### Card Upgrades

**yahatl-item-card.js:**
- "Edit" button fires `yahatl-open-editor` event instead of `showMoreInfo()`
- Add "Defer" quick-action button
- No other changes (already displays traits, tags, streaks, blockers)

**yahatl-queue-card.js:**
- Each queue item tappable -> fires `yahatl-open-editor`
- "Complete" quick-action button per queue item
- Context filter controls in card header (location, context dropdowns calling `yahatl.update_context`)
- Quick capture text input in card header

### Auto-Registration

- Add `"dependencies": ["frontend", "http"]` to `manifest.json`
- Register all 3 JS files as static paths in `async_setup()` (currently only queue-card is registered)
- Auto-register as Lovelace resources so cards work without manual resource configuration
- Version query parameter (`?v={VERSION}`) on URLs for cache busting

### New Built-in Sensors

Add to `sensor.py` (3 new sensors per list):
- `sensor.<list>_inbox_count` — count of items with `needs_detail=True`
- `sensor.<list>_notes_count` — count of items with `note` trait
- `sensor.<list>_streak_risk_count` — count of habits with at-risk streaks

### Service Update

Add `deferred_until` field to `update_item` service in `services.yaml` — currently unreachable from any service despite being on the data model.

## Deletions

| File | Reason |
|------|--------|
| `dashboards/helpers.yaml` | All 7 helpers replaced by card UI |
| `dashboards/scripts.yaml` | All 10 scripts are thin wrappers, unfinished, or replaced by editor |
| `dashboards/sensors.yaml` | Half duplicated by built-in sensors, half broken (hardcoded to 0) |
| `dashboards/example_configuration.yaml` | References deleted helpers/sensors/scripts |

## Rewrites

| File | Change |
|------|--------|
| `dashboards/automations.yaml` | Rename to `example_automations.yaml`. Keep 6 standalone automations (morning briefing, overdue reminder, inbox reminder, streak at risk, completion celebration, weekly review). Delete 3 that depend on deleted helpers (auto refresh queue, clear quick capture, suggest context, location queue refresh). |
| `dashboards/yahatl_dashboard.yaml` | Lean example (~30 lines) using new cards |
| `dashboards/SETUP_GUIDE.md` | Rewrite for new zero-config experience |
| `dashboards/README.md` | Rewrite to match |

## Not In Scope

- Pomodoro feature (separate concern, can be added later)
- Custom HA panel (cards are the UI)
- Auto-creating helper entities (no longer needed)
- Auto-importing dashboards (users build their own)
