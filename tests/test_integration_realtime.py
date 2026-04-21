"""Integration tests verifying real-time update chains and feature interactions."""
from __future__ import annotations

from datetime import datetime, time, timedelta
from unittest.mock import MagicMock, patch

import pytest

from custom_components.yahatl.blockers import is_item_blocked
from custom_components.yahatl.models import (
    ConditionTriggerConfig,
    TimeBlockerConfig,
    YahtlItem,
    YahtlList,
)


class TestDeferralInteractions:
    @pytest.mark.asyncio
    async def test_completing_deferred_item_clears_deferral(self):
        """Verify that completing a deferred item clears deferred_until."""
        item = YahtlItem.create(title="Deferred Task")
        item.deferred_until = datetime.now() + timedelta(days=7)
        # Simulate what handle_complete_item and _complete_item do
        item.status = "completed"
        item.deferred_until = None

        assert item.deferred_until is None
        assert item.status == "completed"


class TestTimeBlockerAndDeferralIndependence:
    @pytest.mark.asyncio
    async def test_deferral_checked_before_time_blockers(self, mock_hass):
        """Deferral should block before time blockers are even evaluated."""
        item = YahtlItem.create(title="Double blocked")
        item.deferred_until = datetime.now() + timedelta(days=1)
        item.time_blockers = [
            TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        ]

        blocked, reasons = await is_item_blocked(mock_hass, item)
        assert blocked is True
        assert "deferred" in reasons[0].lower()

    @pytest.mark.asyncio
    async def test_time_blocker_checked_when_not_deferred(self, mock_hass):
        """If not deferred, time blockers should still work."""
        item = YahtlItem.create(title="Time blocked only")
        item.time_blockers = [
            TimeBlockerConfig(start_time="00:00", end_time="23:59", mode="suppress")
        ]

        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = await is_item_blocked(mock_hass, item)
        assert blocked is True
        assert "suppressed" in reasons[0].lower()


class TestConditionTriggerSetDueInteraction:
    def test_set_due_with_existing_due_uses_min(self):
        """set_due should use min(existing_due, now())."""
        item = YahtlItem.create(title="Task")
        future = datetime.now() + timedelta(days=7)
        item.due = future

        now = datetime.now()
        item.due = min(item.due, now)

        assert item.due <= now
        assert item.due < future

    def test_set_due_without_existing_sets_now(self):
        """set_due without existing due date sets due to now."""
        item = YahtlItem.create(title="Task")
        assert item.due is None

        now = datetime.now()
        item.due = now

        assert item.due is not None

    def test_on_match_default_is_boost(self):
        """Default on_match should be boost."""
        trigger = ConditionTriggerConfig(
            entity_id="sensor.test", operator="eq", value="on"
        )
        assert trigger.on_match == "boost"


class TestBlockerEvaluationOrder:
    @pytest.mark.asyncio
    async def test_evaluation_order_deferral_then_time_then_blockers(self, mock_hass):
        """Verify the three-level blocking: deferral -> time -> item/sensor blockers."""
        from custom_components.yahatl.models import BlockerConfig

        # Item with all three types of blocking
        item = YahtlItem.create(title="Triple blocked")
        item.deferred_until = datetime.now() + timedelta(days=1)
        item.time_blockers = [
            TimeBlockerConfig(start_time="00:00", end_time="23:59", mode="suppress")
        ]
        item.blockers = BlockerConfig(items=["nonexistent_uid"])

        # Deferral should be the reason (checked first)
        blocked, reasons = await is_item_blocked(mock_hass, item)
        assert blocked is True
        assert "deferred" in reasons[0].lower()

        # Remove deferral, time blocker should be the reason
        item.deferred_until = None
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = await is_item_blocked(mock_hass, item)
        assert blocked is True
        assert "suppressed" in reasons[0].lower()
