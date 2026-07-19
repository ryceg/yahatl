"""Tests for the project field on YahtlItem."""
from __future__ import annotations

import pytest

from custom_components.yahatl.models import YahtlItem, YahtlList


class TestProjectField:
    """Test the project field on YahtlItem."""

    def test_default_is_none(self):
        item = YahtlItem.create(title="Task")
        assert item.project is None

    def test_set_project(self):
        item = YahtlItem.create(title="Buy tiles")
        item.project = "kitchen-reno"
        assert item.project == "kitchen-reno"

    def test_to_dict_includes_project(self):
        item = YahtlItem.create(title="Task")
        item.project = "nursery"
        d = item.to_dict()
        assert d["project"] == "nursery"

    def test_to_dict_null_project(self):
        item = YahtlItem.create(title="Task")
        d = item.to_dict()
        assert d["project"] is None

    def test_from_dict_with_project(self):
        item = YahtlItem.create(title="Task")
        item.project = "kitchen-reno"
        restored = YahtlItem.from_dict(item.to_dict())
        assert restored.project == "kitchen-reno"

    def test_from_dict_without_project(self):
        """Existing stored data without project field should default to None."""
        d = YahtlItem.create(title="Task").to_dict()
        del d["project"]
        restored = YahtlItem.from_dict(d)
        assert restored.project is None

    def test_clear_project(self):
        item = YahtlItem.create(title="Task")
        item.project = "old-project"
        item.project = None
        assert item.project is None


class TestActiveProjects:
    """Test active project detection logic (mirrors sensor behaviour)."""

    def test_no_projects(self):
        lst = YahtlList(list_id="test", name="Test")
        lst.add_item(YahtlItem.create(title="Task 1"))
        lst.add_item(YahtlItem.create(title="Task 2"))

        projects = {i.project for i in lst.items if i.project and i.status in ("pending", "in_progress")}
        assert len(projects) == 0

    def test_one_active_project(self):
        lst = YahtlList(list_id="test", name="Test")
        item1 = YahtlItem.create(title="Buy tiles")
        item1.project = "kitchen-reno"
        item2 = YahtlItem.create(title="Find contractor")
        item2.project = "kitchen-reno"
        lst.add_item(item1)
        lst.add_item(item2)

        projects = {i.project for i in lst.items if i.project and i.status in ("pending", "in_progress")}
        assert projects == {"kitchen-reno"}

    def test_multiple_active_projects(self):
        lst = YahtlList(list_id="test", name="Test")
        item1 = YahtlItem.create(title="Buy tiles")
        item1.project = "kitchen-reno"
        item2 = YahtlItem.create(title="Buy crib")
        item2.project = "nursery"
        lst.add_item(item1)
        lst.add_item(item2)

        projects = {i.project for i in lst.items if i.project and i.status in ("pending", "in_progress")}
        assert projects == {"kitchen-reno", "nursery"}

    def test_completed_project_not_active(self):
        lst = YahtlList(list_id="test", name="Test")
        item1 = YahtlItem.create(title="Buy tiles")
        item1.project = "kitchen-reno"
        item1.status = "completed"
        item2 = YahtlItem.create(title="Find contractor")
        item2.project = "kitchen-reno"
        item2.status = "completed"
        lst.add_item(item1)
        lst.add_item(item2)

        projects = {i.project for i in lst.items if i.project and i.status in ("pending", "in_progress")}
        assert len(projects) == 0

    def test_mixed_statuses(self):
        lst = YahtlList(list_id="test", name="Test")
        item1 = YahtlItem.create(title="Buy tiles")
        item1.project = "kitchen-reno"
        item1.status = "completed"
        item2 = YahtlItem.create(title="Install tiles")
        item2.project = "kitchen-reno"
        item2.status = "pending"
        lst.add_item(item1)
        lst.add_item(item2)

        projects = {i.project for i in lst.items if i.project and i.status in ("pending", "in_progress")}
        assert projects == {"kitchen-reno"}
