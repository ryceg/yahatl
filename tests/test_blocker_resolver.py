"""Tests for BlockerResolver — the deepened blocker module."""
from __future__ import annotations

from custom_components.yahatl.blockers import BlockResult


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
