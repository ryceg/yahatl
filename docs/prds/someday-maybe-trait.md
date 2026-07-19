# Someday/Maybe Trait

## Problem

GTD distinguishes between actionable items and "someday/maybe" items -- things you might want to do eventually but are not committed to doing now. Currently, yahatl has no way to represent this. Items are either actionable (appear in the queue) or notes (no action expected). There is no middle ground for "I want to do this, but not yet, and I don't know when."

Users end up either cluttering their queue with aspirational items they keep deferring, or losing track of ideas by dumping them into notes where they are never reviewed.

## Proposal

Add a `TRAIT_SOMEDAY` constant (`"someday"`) to `const.py` and include it in `VALID_TRAITS`.

The queue engine in `queue.py` would treat someday the same way it treats note items: filter them out during candidate selection (line 239's `"actionable" not in item.traits` check already handles this, since someday items would not have the actionable trait). An item has either `actionable` or `someday` -- not both.

The weekly review skill would query for all items with the someday trait and present them for re-evaluation: keep as someday, promote to actionable, or delete.

Promoting a someday item to actionable is a trait swap: remove `someday`, add `actionable`. This uses the existing `yahatl.set_traits` service with no new API surface.

Someday items should not have due dates. If an item has a due date, it is by definition committed and should be actionable. The `set_traits` service could clear the `due` field when someday is applied, or at minimum the weekly review skill should flag someday items that somehow have due dates as needing attention.

## Trade-offs

**Minimal schema change.** One new constant, one entry in `VALID_TRAITS`. No new fields on `YahtlItem`, no storage migration. The filtering already works by virtue of someday items lacking the actionable trait.

**Trait mutual exclusivity.** Introducing someday creates an implicit rule: an item should not be both actionable and someday. This is the first case of mutually exclusive traits. We could enforce this in `set_traits` validation or leave it as a convention. Enforcement is safer but adds logic; convention is simpler but risks user confusion.

**No separate list.** An alternative would be a dedicated someday/maybe list rather than a trait. This avoids the mutual exclusivity question but means items must be moved between lists to be promoted, losing their list context (e.g., an item on the "household" list that becomes someday would have to leave that list). The trait approach keeps items in their original list.

## Open Questions

1. Should `set_traits` enforce that `someday` and `actionable` are mutually exclusive, or leave it to convention?
2. Should applying the someday trait automatically clear `due`, `recurrence`, and `priority` fields, or just ignore them during queue generation?
3. Should someday items appear in any dashboard view by default, or only during weekly review? A "someday" tab or filter in the notes browser might be useful for browsing.
4. Is there a meaningful difference between someday and deferred (`deferred_until`)? Deferred has a concrete return date; someday does not. But a user might conflate them. Worth documenting the distinction clearly.
