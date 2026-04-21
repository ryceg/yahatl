"""Tests for QueueEngine -- the deepened queue module."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from custom_components.yahatl.queue import QueueResult


class TestQueueResult:
    def test_construction(self):
        result = QueueResult(
            items=[],
            context={"location": "home"},
            overdue_count=0,
            due_today_count=0,
            blocked_count=0,
            next_task_title=None,
            total_actionable=0,
            generated_at=datetime.now(),
        )
        assert result.items == []
        assert result.overdue_count == 0

    def test_immutable(self):
        result = QueueResult(
            items=[], context={}, overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
            generated_at=datetime.now(),
        )
        try:
            result.overdue_count = 5
            assert False, "Should have raised"
        except AttributeError:
            pass
