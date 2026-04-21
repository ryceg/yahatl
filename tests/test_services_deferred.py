"""Tests for deferred_until field in update_item service."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.yahatl.models import YahtlItem, YahtlList


class TestUpdateItemDeferred:
    """Test update_item service accepts deferred_until."""

    def test_update_item_schema_accepts_deferred_until(self):
        """Test that the update_item schema allows deferred_until field."""
        from custom_components.yahatl.services import SERVICE_UPDATE_ITEM_SCHEMA

        tomorrow = datetime.now() + timedelta(days=1)
        data = {
            "entity_id": "todo.yahatl_test",
            "item_id": "abc-123",
            "deferred_until": tomorrow,
        }
        # Should not raise
        result = SERVICE_UPDATE_ITEM_SCHEMA(data)
        assert result["deferred_until"] == tomorrow

    def test_update_item_schema_accepts_none_deferred(self):
        """Test that the update_item schema allows clearing deferred_until."""
        from custom_components.yahatl.services import SERVICE_UPDATE_ITEM_SCHEMA

        data = {
            "entity_id": "todo.yahatl_test",
            "item_id": "abc-123",
        }
        # deferred_until is optional — should not raise
        result = SERVICE_UPDATE_ITEM_SCHEMA(data)
        assert "deferred_until" not in result
