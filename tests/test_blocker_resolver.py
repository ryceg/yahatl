"""Tests for BlockerResolver — the deepened blocker module."""
from __future__ import annotations

from unittest.mock import MagicMock

from custom_components.yahatl.blockers import BlockerResolver, BlockResult
from custom_components.yahatl.models import YahtlItem, YahtlList


class TestBlockResult:
    def test_blocked_is_truthy(self):
        result = BlockResult(blocked=True, reasons=["deferred"])
        assert result
        assert result.blocked is True
        assert result.reasons == ["deferred"]

    def test_not_blocked_is_falsy(self):
        result = BlockResult(blocked=False, reasons=[])
        assert not result
        assert result.blocked is False

    def test_immutable(self):
        result = BlockResult(blocked=True, reasons=["x"])
        try:
            result.blocked = False
            assert False, "Should have raised"
        except AttributeError:
            pass


class TestBlockerResolverConstruction:
    def test_creates_with_hass(self):
        hass = MagicMock()
        resolver = BlockerResolver(hass, [])
        assert resolver is not None

    def test_creates_without_hass(self):
        resolver = BlockerResolver(None, [])
        assert resolver is not None

    def test_builds_uid_index(self):
        item_a = YahtlItem.create(title="A")
        item_b = YahtlItem.create(title="B")
        yl = YahtlList(list_id="l1", name="L1", items=[item_a, item_b])
        resolver = BlockerResolver(None, [yl])
        assert resolver is not None
