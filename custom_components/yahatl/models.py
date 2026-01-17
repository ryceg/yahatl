"""Data models for yahatl."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
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

    # Tracking
    completion_history: list[CompletionRecord] = field(default_factory=list)
    current_streak: int = 0
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
            "completion_history": [r.to_dict() for r in self.completion_history],
            "current_streak": self.current_streak,
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
            completion_history=[
                CompletionRecord.from_dict(r)
                for r in data.get("completion_history", [])
            ],
            current_streak=data.get("current_streak", 0),
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
