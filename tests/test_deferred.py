"""Tests for deferred_until functionality."""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from custom_components.yahatl.blockers import is_item_blocked
from custom_components.yahatl.models import YahtlItem


class TestDeferredUntil:
    @pytest.mark.asyncio
    async def test_deferred_item_is_blocked(self, mock_hass):
        item = YahtlItem.create(title="Deferred Task")
        item.deferred_until = datetime.now() + timedelta(days=7)

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
        assert any("deferred" in r.lower() for r in reasons)

    @pytest.mark.asyncio
    async def test_past_deferral_is_not_blocked(self, mock_hass):
        item = YahtlItem.create(title="Was Deferred")
        item.deferred_until = datetime.now() - timedelta(hours=1)

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_no_deferral_is_not_blocked(self, mock_hass):
        item = YahtlItem.create(title="Normal Task")

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is False

    @pytest.mark.asyncio
    async def test_deferral_checked_before_other_blockers(self, mock_hass):
        """Deferred item should be blocked even without BlockerConfig."""
        item = YahtlItem.create(title="Deferred, no blockers")
        item.deferred_until = datetime.now() + timedelta(days=1)
        item.blockers = None

        is_blocked, reasons = await is_item_blocked(mock_hass, item)

        assert is_blocked is True
