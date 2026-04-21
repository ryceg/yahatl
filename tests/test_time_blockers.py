"""Tests for time blocker evaluation."""
from __future__ import annotations

from datetime import time
from unittest.mock import patch

import pytest

from custom_components.yahatl.blockers import is_time_blocked
from custom_components.yahatl.models import TimeBlockerConfig, YahtlItem


def _make_item(*time_blockers: TimeBlockerConfig) -> YahtlItem:
    item = YahtlItem.create(title="Test")
    item.time_blockers = list(time_blockers)
    return item


class TestSuppressMode:
    def test_blocked_inside_window(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 23:00 is inside 22:00-06:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_unblocked_outside_window(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 12:00 is outside 22:00-06:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False

    def test_overnight_wrap_early_morning(self):
        tb = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        # 03:00 is inside 22:00-06:00 (after midnight)
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(3, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_same_day_window(self):
        tb = TimeBlockerConfig(start_time="09:00", end_time="17:00", mode="suppress")
        # 12:00 is inside 09:00-17:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_same_day_window_outside(self):
        tb = TimeBlockerConfig(start_time="09:00", end_time="17:00", mode="suppress")
        # 20:00 is outside 09:00-17:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(20, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False


class TestAllowMode:
    def test_blocked_outside_window(self):
        tb = TimeBlockerConfig(start_time="06:00", end_time="09:00", mode="allow")
        # 12:00 is outside 06:00-09:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_unblocked_inside_window(self):
        tb = TimeBlockerConfig(start_time="06:00", end_time="09:00", mode="allow")
        # 07:30 is inside 06:00-09:00
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(7, 30), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False


class TestDayFiltering:
    def test_wrong_day_skips(self):
        tb = TimeBlockerConfig(
            start_time="06:00", end_time="09:00", mode="allow",
            days=[0, 1, 2, 3, 4],  # weekdays only
        )
        # Saturday (day 5), 12:00 — day doesn't match, blocker doesn't apply
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 5)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is False

    def test_matching_day_applies(self):
        tb = TimeBlockerConfig(
            start_time="06:00", end_time="09:00", mode="allow",
            days=[0, 1, 2, 3, 4],  # weekdays only
        )
        # Monday (day 0), 12:00 — day matches, outside allow window → blocked
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(12, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True

    def test_none_days_means_all(self):
        tb = TimeBlockerConfig(
            start_time="22:00", end_time="06:00", mode="suppress",
            days=None,
        )
        # Any day, 23:00 → blocked
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 3)):
            blocked, reasons = is_time_blocked(_make_item(tb))
        assert blocked is True


class TestNoTimeBlockers:
    def test_empty_list(self):
        item = YahtlItem.create(title="Test")
        blocked, reasons = is_time_blocked(item)
        assert blocked is False
        assert reasons == []


class TestMultipleTimeBlockers:
    def test_any_blocker_triggers(self):
        tb1 = TimeBlockerConfig(start_time="22:00", end_time="06:00", mode="suppress")
        tb2 = TimeBlockerConfig(start_time="12:00", end_time="13:00", mode="suppress")
        # 23:00 — tb1 blocks
        with patch("custom_components.yahatl.blockers._now_time", return_value=(time(23, 0), 0)):
            blocked, reasons = is_time_blocked(_make_item(tb1, tb2))
        assert blocked is True
