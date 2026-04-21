"""Tests for ReactivePipeline — the deepened reactivity module."""
from __future__ import annotations

from custom_components.yahatl.reactivity import PipelineSnapshot


class TestPipelineSnapshot:
    def test_construction(self):
        snap = PipelineSnapshot(
            queue=[],
            overdue_count=0,
            due_today_count=0,
            blocked_count=0,
            next_task_title=None,
            total_actionable=0,
            data_version=1,
        )
        assert snap.data_version == 1
        assert snap.queue == []

    def test_immutable(self):
        snap = PipelineSnapshot(
            queue=[], overdue_count=0, due_today_count=0,
            blocked_count=0, next_task_title=None, total_actionable=0,
            data_version=1,
        )
        try:
            snap.data_version = 2
            assert False, "Should have raised"
        except AttributeError:
            pass
