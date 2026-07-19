# Project Grouping

## Problem

GTD defines a "project" as any desired outcome requiring more than one action step. yahatl currently has no way to group related items into a project. Users cannot see all the tasks associated with "renovate the kitchen" or "set up the nursery" in one view, track overall progress, or ensure a project has a defined next action.

Without grouping, projects exist only in the user's head, making it easy to lose track of multi-step outcomes and harder for the weekly review to ensure every project has at least one active next action.

## Proposal

Use a tag convention: `project:slug` (e.g., `project:kitchen-reno`, `project:nursery-setup`).

This works with the existing tag system. Items already have a `tags: list[str]` field, and the tag management UI supports adding and removing tags. No schema changes are needed.

The capture and review skills would use project tags to group items in their output. For example, the weekly review could list all active projects (distinct `project:*` tags) and show how many items in each are pending vs completed, flagging any project with no actionable next action.

The queue itself does not change -- project-tagged items still appear based on their own priority, context, and traits. The grouping is purely an organizational and review concern.

### Future: project dashboard view

A dedicated view (in the app or HA dashboard) that:
- Lists all active projects (derived from `project:*` tags across all lists)
- Shows item counts per project (pending, in progress, completed)
- Highlights projects with no current next action
- Allows filtering the queue by project

This would be a read-only aggregation view, not a new entity type.

## Trade-offs

**Tag convention vs first-class field.** A dedicated `project: str | None` field on `YahtlItem` would be cleaner for queries and validation, but requires a schema change, storage migration, and new service parameters. The tag convention avoids all of that and is available immediately. The downside is that project tags are just strings -- no validation, no autocomplete beyond what the tag UI already provides, and typos create orphan projects.

**Tag convention vs lists-as-projects.** Using lists as projects (one list per project) provides strong grouping but conflicts with the current list model. Lists serve an organizational purpose (inbox, household, work) orthogonal to projects. A kitchen renovation task might belong on the "household" list AND the "kitchen-reno" project. Tags allow this cross-cutting concern; lists do not.

**No project metadata.** A tag cannot carry metadata. If a project needs a goal statement, desired outcome, status (active/on-hold/complete), or a deadline, the tag convention has no place to put it. Options for later:
- A "project note" item with trait `note` and tag `project:slug` that holds the description in its `description` field. Convention-based, no schema change.
- A first-class `Project` model if the need becomes clear. This would be a larger change.

## Open Questions

1. Should the tag prefix be `project:` or `p:` or something else? `project:` is readable but verbose for frequent use.
2. How should completed projects be handled? Removing the `project:*` tag from all items loses history. Leaving it clutters the project list. A `project-done:slug` tag rename is ugly but functional.
3. Should the weekly review enforce that every `project:*` group has at least one actionable item? This is a core GTD principle but may feel nagging if projects are intentionally paused.
4. Does a project need its own metadata (goal, desired outcome, status)? If so, at what point does the tag convention break down and warrant a first-class model? The "project note" convention may be enough for now, but it should be evaluated after real usage.
5. Should items be allowed to belong to multiple projects? The tag system allows it naturally (`project:kitchen-reno`, `project:home-improvement`), but this could create confusing overlap in dashboard views.
