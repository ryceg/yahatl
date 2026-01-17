"""Data models for yahatl."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
import uuid


@dataclass
class CompletionRecord:
    """Record of a task completion."""

    user_id: str
    timestamp: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CompletionRecord:
        """Create from dictionary."""
        return cls(
            user_id=data["user_id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
        )


@dataclass
class RecurrenceThreshold:
    """Threshold configuration for frequency-based recurrence."""

    at_days_remaining: int
    priority: str  # low, medium, high, critical

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "at_days_remaining": self.at_days_remaining,
            "priority": self.priority,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RecurrenceThreshold:
        """Create from dictionary."""
        return cls(
            at_days_remaining=data["at_days_remaining"],
            priority=data["priority"],
        )


@dataclass
class RecurrenceConfig:
    """Recurrence configuration for an item."""

    type: str  # calendar, elapsed, frequency
    # For calendar: cron-style pattern
    calendar_pattern: str | None = None
    # For elapsed: interval and unit
    elapsed_interval: int | None = None
    elapsed_unit: str | None = None  # days, weeks, months, years
    # For frequency: count per period
    frequency_count: int | None = None
    frequency_period: int | None = None
    frequency_unit: str | None = None  # days, weeks, months
    # Thresholds for frequency goals
    thresholds: list[RecurrenceThreshold] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "type": self.type,
            "calendar_pattern": self.calendar_pattern,
            "elapsed_interval": self.elapsed_interval,
            "elapsed_unit": self.elapsed_unit,
            "frequency_count": self.frequency_count,
            "frequency_period": self.frequency_period,
            "frequency_unit": self.frequency_unit,
            "thresholds": [t.to_dict() for t in self.thresholds],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RecurrenceConfig:
        """Create from dictionary."""
        return cls(
            type=data["type"],
            calendar_pattern=data.get("calendar_pattern"),
            elapsed_interval=data.get("elapsed_interval"),
            elapsed_unit=data.get("elapsed_unit"),
            frequency_count=data.get("frequency_count"),
            frequency_period=data.get("frequency_period"),
            frequency_unit=data.get("frequency_unit"),
            thresholds=[
                RecurrenceThreshold.from_dict(t)
                for t in data.get("thresholds", [])
            ],
        )


@dataclass
class BlockerConfig:
    """Blocker configuration for an item.

    mode: How to combine items and sensors categories (ANY or ALL)
    items: List of item UIDs that block this item
    item_mode: How items relate to each other (ANY or ALL)
    sensors: List of sensor entity IDs that block this item
    sensor_mode: How sensors relate to each other (ANY or ALL)

    Examples:
        # Blocked if ANY item incomplete AND ANY sensor on
        BlockerConfig(mode="ALL", items=["a", "b"], item_mode="ANY",
                     sensors=["s1", "s2"], sensor_mode="ANY")

        # Blocked if ALL items incomplete OR ALL sensors on
        BlockerConfig(mode="ANY", items=["a", "b"], item_mode="ALL",
                     sensors=["s1", "s2"], sensor_mode="ALL")
    """

    mode: str = "ALL"  # ANY or ALL - how to combine items and sensors
    items: list[str] = field(default_factory=list)  # Item UIDs
    item_mode: str = "ANY"  # ANY or ALL - how items relate to each other
    sensors: list[str] = field(default_factory=list)  # Entity IDs
    sensor_mode: str = "ANY"  # ANY or ALL - how sensors relate to each other

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "mode": self.mode,
            "items": self.items,
            "item_mode": self.item_mode,
            "sensors": self.sensors,
            "sensor_mode": self.sensor_mode,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> BlockerConfig:
        """Create from dictionary."""
        return cls(
            mode=data.get("mode", "ALL"),
            items=data.get("items", []),
            item_mode=data.get("item_mode", "ANY"),
            sensors=data.get("sensors", []),
            sensor_mode=data.get("sensor_mode", "ANY"),
        )


@dataclass
class RequirementsConfig:
    """Requirements configuration for an item."""

    mode: str = "ANY"  # ANY or ALL
    location: list[str] = field(default_factory=list)
    people: list[str] = field(default_factory=list)
    time_constraints: list[str] = field(default_factory=list)
    context: list[str] = field(default_factory=list)
    sensors: list[str] = field(default_factory=list)  # Entity IDs

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "mode": self.mode,
            "location": self.location,
            "people": self.people,
            "time_constraints": self.time_constraints,
            "context": self.context,
            "sensors": self.sensors,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RequirementsConfig:
        """Create from dictionary."""
        return cls(
            mode=data.get("mode", "ANY"),
            location=data.get("location", []),
            people=data.get("people", []),
            time_constraints=data.get("time_constraints", []),
            context=data.get("context", []),
            sensors=data.get("sensors", []),
        )


@dataclass
class YahtlItem:
    """A yahatl todo item with extended schema."""

    uid: str
    title: str
    description: str = ""

    # Type & Organization
    traits: list[str] = field(default_factory=lambda: ["actionable"])
    tags: list[str] = field(default_factory=list)

    # Status
    status: str = "pending"
    needs_detail: bool = False

    # Scheduling
    due: datetime | None = None
    time_estimate: int | None = None  # minutes
    buffer_before: int = 0
    buffer_after: int = 0

    # Recurrence
    recurrence: RecurrenceConfig | None = None

    # Blockers
    blockers: BlockerConfig | None = None

    # Requirements
    requirements: RequirementsConfig | None = None

    # Priority
    priority: str | None = None  # low, medium, high

    # Tracking
    completion_history: list[CompletionRecord] = field(default_factory=list)
    current_streak: int = 0
    last_completed: datetime | None = None  # For streak and elapsed tracking
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = ""

    @classmethod
    def create(cls, title: str, created_by: str = "") -> YahtlItem:
        """Create a new item with generated UID."""
        return cls(
            uid=str(uuid.uuid4()),
            title=title,
            created_by=created_by,
            created_at=datetime.now(),
        )

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "uid": self.uid,
            "title": self.title,
            "description": self.description,
            "traits": self.traits,
            "tags": self.tags,
            "status": self.status,
            "needs_detail": self.needs_detail,
            "due": self.due.isoformat() if self.due else None,
            "time_estimate": self.time_estimate,
            "buffer_before": self.buffer_before,
            "buffer_after": self.buffer_after,
            "recurrence": self.recurrence.to_dict() if self.recurrence else None,
            "blockers": self.blockers.to_dict() if self.blockers else None,
            "requirements": self.requirements.to_dict() if self.requirements else None,
            "priority": self.priority,
            "completion_history": [r.to_dict() for r in self.completion_history],
            "current_streak": self.current_streak,
            "last_completed": self.last_completed.isoformat() if self.last_completed else None,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> YahtlItem:
        """Create from dictionary."""
        return cls(
            uid=data["uid"],
            title=data["title"],
            description=data.get("description", ""),
            traits=data.get("traits", ["actionable"]),
            tags=data.get("tags", []),
            status=data.get("status", "pending"),
            needs_detail=data.get("needs_detail", False),
            due=datetime.fromisoformat(data["due"]) if data.get("due") else None,
            time_estimate=data.get("time_estimate"),
            buffer_before=data.get("buffer_before", 0),
            buffer_after=data.get("buffer_after", 0),
            recurrence=RecurrenceConfig.from_dict(data["recurrence"]) if data.get("recurrence") else None,
            blockers=BlockerConfig.from_dict(data["blockers"]) if data.get("blockers") else None,
            requirements=RequirementsConfig.from_dict(data["requirements"]) if data.get("requirements") else None,
            priority=data.get("priority"),
            completion_history=[
                CompletionRecord.from_dict(r)
                for r in data.get("completion_history", [])
            ],
            current_streak=data.get("current_streak", 0),
            last_completed=datetime.fromisoformat(data["last_completed"]) if data.get("last_completed") else None,
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
            created_by=data.get("created_by", ""),
        )


@dataclass
class YahtlList:
    """A yahatl todo list."""

    list_id: str
    name: str
    owner: str = ""
    visibility: str = "private"  # private or shared
    shared_with: list[str] = field(default_factory=list)
    is_inbox: bool = False
    items: list[YahtlItem] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "list_id": self.list_id,
            "name": self.name,
            "owner": self.owner,
            "visibility": self.visibility,
            "shared_with": self.shared_with,
            "is_inbox": self.is_inbox,
            "items": [item.to_dict() for item in self.items],
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> YahtlList:
        """Create from dictionary."""
        return cls(
            list_id=data["list_id"],
            name=data["name"],
            owner=data.get("owner", ""),
            visibility=data.get("visibility", "private"),
            shared_with=data.get("shared_with", []),
            is_inbox=data.get("is_inbox", False),
            items=[YahtlItem.from_dict(i) for i in data.get("items", [])],
        )

    def get_item(self, uid: str) -> YahtlItem | None:
        """Get an item by UID."""
        for item in self.items:
            if item.uid == uid:
                return item
        return None

    def add_item(self, item: YahtlItem) -> None:
        """Add an item to the list."""
        self.items.append(item)

    def remove_item(self, uid: str) -> bool:
        """Remove an item by UID. Returns True if found and removed."""
        for i, item in enumerate(self.items):
            if item.uid == uid:
                self.items.pop(i)
                return True
        return False


@dataclass
class ContextOverride:
    """Manual context override for queue generation."""

    location: str | None = None
    people: list[str] = field(default_factory=list)
    contexts: list[str] = field(default_factory=list)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "location": self.location,
            "people": self.people,
            "contexts": self.contexts,
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ContextOverride:
        """Create from dictionary."""
        return cls(
            location=data.get("location"),
            people=data.get("people", []),
            contexts=data.get("contexts", []),
            updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else datetime.now(),
        )
