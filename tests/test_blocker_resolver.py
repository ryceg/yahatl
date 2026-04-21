"""Tests for BlockerResolver — the deepened blocker module."""
from __future__ import annotations

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from custom_components.yahatl.blockers import BlockerResolver, BlockResult
from custom_components.yahatl.models import BlockerConfig, TimeBlockerConfig, YahtlItem, YahtlList


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


class TestResolveSyncDeferral:
    def test_deferred_item_is_blocked(self):
        item = YahtlItem.create(title="Deferred")
        item.deferred_until = datetime.now() + timedelta(hours=1)
        resolver = BlockerResolver(None, [])
        result = resolver.resolve_sync(item)
        assert result.blocked is True
        assert "deferred" in result.reasons[0].lower()

    def test_expired_deferral_not_blocked(self):
        item = YahtlItem.create(title="Was Deferred")
        item.deferred_until = datetime.now() - timedelta(hours=1)
        resolver = BlockerResolver(None, [])
        result = resolver.resolve_sync(item)
        assert result.blocked is False

    def test_no_deferral_not_blocked(self):
        item = YahtlItem.create(title="Plain")
        resolver = BlockerResolver(None, [])
        result = resolver.resolve_sync(item)
        assert result.blocked is False


class TestResolveSyncTimeBlockers:
    def test_suppressed_during_window(self):
        from datetime import time as dt_time
        item = YahtlItem.create(title="Night Only")
        item.time_blockers = [
            TimeBlockerConfig(start_time="09:00", end_time="17:00", mode="suppress")
        ]
        resolver = BlockerResolver(None, [])
        with patch("custom_components.yahatl.blockers._now_time", return_value=(dt_time(12, 0), 0)):
            result = resolver.resolve_sync(item)
        assert result.blocked is True

    def test_allowed_outside_window(self):
        from datetime import time as dt_time
        item = YahtlItem.create(title="Morning Only")
        item.time_blockers = [
            TimeBlockerConfig(start_time="06:00", end_time="09:00", mode="allow")
        ]
        resolver = BlockerResolver(None, [])
        with patch("custom_components.yahatl.blockers._now_time", return_value=(dt_time(14, 0), 0)):
            result = resolver.resolve_sync(item)
        assert result.blocked is True

    def test_no_time_blockers_not_blocked(self):
        item = YahtlItem.create(title="No TB")
        resolver = BlockerResolver(None, [])
        result = resolver.resolve_sync(item)
        assert result.blocked is False


class TestResolveSyncItemDeps:
    def test_item_dep_incomplete_blocks(self):
        dep = YahtlItem.create(title="Dep")
        dep.status = "pending"
        item = YahtlItem.create(title="Target")
        item.blockers = BlockerConfig(mode="ANY", items=[dep.uid], item_mode="ANY")
        yl = YahtlList(list_id="l", name="L", items=[dep, item])
        resolver = BlockerResolver(None, [yl])
        result = resolver.resolve_sync(item)
        assert result.blocked is True

    def test_item_dep_complete_unblocks(self):
        dep = YahtlItem.create(title="Dep")
        dep.status = "completed"
        item = YahtlItem.create(title="Target")
        item.blockers = BlockerConfig(mode="ANY", items=[dep.uid], item_mode="ANY")
        yl = YahtlList(list_id="l", name="L", items=[dep, item])
        resolver = BlockerResolver(None, [yl])
        result = resolver.resolve_sync(item)
        assert result.blocked is False


class TestResolveFullSensors:
    def test_sensor_on_blocks(self, mock_hass, mock_sensor_state):
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.rain", "on")
        )
        item = YahtlItem.create(title="Outdoor")
        item.blockers = BlockerConfig(mode="ANY", sensors=["binary_sensor.rain"], sensor_mode="ANY")
        resolver = BlockerResolver(mock_hass, [])
        result = resolver.resolve(item)
        assert result.blocked is True

    def test_sensor_off_does_not_block(self, mock_hass, mock_sensor_state):
        mock_hass.states.get = MagicMock(
            return_value=mock_sensor_state("binary_sensor.rain", "off")
        )
        item = YahtlItem.create(title="Outdoor")
        item.blockers = BlockerConfig(mode="ANY", sensors=["binary_sensor.rain"], sensor_mode="ANY")
        resolver = BlockerResolver(mock_hass, [])
        result = resolver.resolve(item)
        assert result.blocked is False

    def test_no_hass_skips_sensors(self):
        item = YahtlItem.create(title="Outdoor")
        item.blockers = BlockerConfig(mode="ANY", sensors=["binary_sensor.rain"], sensor_mode="ANY")
        resolver = BlockerResolver(None, [])
        result = resolver.resolve(item)
        assert result.blocked is False


class TestResolveModeCombinations:
    def test_all_mode_both_block(self, mock_hass, mock_sensor_state):
        blocker_item = YahtlItem.create(title="Dep")
        blocker_item.status = "pending"
        mock_hass.states.get = MagicMock(return_value=mock_sensor_state("binary_sensor.x", "on"))
        item = YahtlItem.create(title="Target")
        item.blockers = BlockerConfig(
            mode="ALL", items=[blocker_item.uid], item_mode="ANY",
            sensors=["binary_sensor.x"], sensor_mode="ANY",
        )
        yl = YahtlList(list_id="l", name="L", items=[blocker_item, item])
        resolver = BlockerResolver(mock_hass, [yl])
        result = resolver.resolve(item)
        assert result.blocked is True

    def test_all_mode_only_items_block(self, mock_hass, mock_sensor_state):
        blocker_item = YahtlItem.create(title="Dep")
        blocker_item.status = "pending"
        mock_hass.states.get = MagicMock(return_value=mock_sensor_state("binary_sensor.x", "off"))
        item = YahtlItem.create(title="Target")
        item.blockers = BlockerConfig(
            mode="ALL", items=[blocker_item.uid], item_mode="ANY",
            sensors=["binary_sensor.x"], sensor_mode="ANY",
        )
        yl = YahtlList(list_id="l", name="L", items=[blocker_item, item])
        resolver = BlockerResolver(mock_hass, [yl])
        result = resolver.resolve(item)
        assert result.blocked is False

    def test_any_mode_items_alone_block(self, mock_hass, mock_sensor_state):
        blocker_item = YahtlItem.create(title="Dep")
        blocker_item.status = "pending"
        mock_hass.states.get = MagicMock(return_value=mock_sensor_state("binary_sensor.x", "off"))
        item = YahtlItem.create(title="Target")
        item.blockers = BlockerConfig(
            mode="ANY", items=[blocker_item.uid], item_mode="ANY",
            sensors=["binary_sensor.x"], sensor_mode="ANY",
        )
        yl = YahtlList(list_id="l", name="L", items=[blocker_item, item])
        resolver = BlockerResolver(mock_hass, [yl])
        result = resolver.resolve(item)
        assert result.blocked is True
