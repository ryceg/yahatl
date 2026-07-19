"""Tests for the someday trait — mutual exclusivity and field clearing."""
from __future__ import annotations

from datetime import datetime

import pytest

from custom_components.yahatl.models import YahtlItem, apply_trait_rules


class TestApplyTraitRules:
    """Test the apply_trait_rules helper."""

    def test_actionable_only(self):
        item = YahtlItem.create(title="Task")
        result = apply_trait_rules(item, ["actionable"])
        assert "actionable" in result
        assert "someday" not in result

    def test_someday_only(self):
        item = YahtlItem.create(title="Task")
        result = apply_trait_rules(item, ["someday"])
        assert "someday" in result
        assert "actionable" not in result

    def test_both_on_actionable_item_keeps_someday(self):
        """When an actionable item gets both traits, someday wins (it's the new one)."""
        item = YahtlItem.create(title="Task")
        item.traits = ["actionable"]
        result = apply_trait_rules(item, ["actionable", "someday"])
        assert "someday" in result
        assert "actionable" not in result

    def test_both_on_someday_item_keeps_actionable(self):
        """When a someday item gets both traits, actionable wins (it's the new one)."""
        item = YahtlItem.create(title="Task")
        item.traits = ["someday"]
        result = apply_trait_rules(item, ["actionable", "someday"])
        assert "actionable" in result
        assert "someday" not in result

    def test_both_on_fresh_item_keeps_someday(self):
        """On a fresh item with default traits, adding both keeps someday."""
        item = YahtlItem.create(title="Task")
        # Default traits are ["actionable"], so item had actionable
        result = apply_trait_rules(item, ["actionable", "someday"])
        assert "someday" in result
        assert "actionable" not in result

    def test_someday_clears_due(self):
        item = YahtlItem.create(title="Task")
        item.traits = ["actionable"]
        item.due = datetime(2026, 6, 1)
        apply_trait_rules(item, ["someday"])
        assert item.due is None

    def test_someday_clears_priority(self):
        item = YahtlItem.create(title="Task")
        item.traits = ["actionable"]
        item.priority = "high"
        apply_trait_rules(item, ["someday"])
        assert item.priority is None

    def test_someday_preserves_recurrence(self):
        from custom_components.yahatl.models import RecurrenceConfig
        item = YahtlItem.create(title="Task")
        item.traits = ["actionable", "habit"]
        item.recurrence = RecurrenceConfig(type="calendar", calendar_preset="daily")
        apply_trait_rules(item, ["someday", "habit"])
        assert item.recurrence is not None
        assert item.recurrence.type == "calendar"

    def test_no_clear_when_already_someday(self):
        """Re-setting someday on an already-someday item shouldn't re-clear."""
        item = YahtlItem.create(title="Task")
        item.traits = ["someday"]
        item.due = datetime(2026, 6, 1)  # Manually set after initial someday
        apply_trait_rules(item, ["someday"])
        # due should NOT be cleared because we're not transitioning to someday
        assert item.due == datetime(2026, 6, 1)

    def test_other_traits_preserved(self):
        item = YahtlItem.create(title="Task")
        item.traits = ["actionable", "chore"]
        result = apply_trait_rules(item, ["someday", "chore"])
        assert "someday" in result
        assert "chore" in result
        assert "actionable" not in result

    def test_promoting_back_to_actionable(self):
        item = YahtlItem.create(title="Task")
        item.traits = ["someday", "chore"]
        result = apply_trait_rules(item, ["actionable", "chore"])
        assert "actionable" in result
        assert "chore" in result
        assert "someday" not in result

    def test_none_item(self):
        """apply_trait_rules should work with None item for new items."""
        result = apply_trait_rules(None, ["someday"])
        assert "someday" in result
        assert "actionable" not in result
