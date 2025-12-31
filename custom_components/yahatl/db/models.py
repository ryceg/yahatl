"""SQLAlchemy models for YAHATL Home Assistant integration."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""
    pass


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


# Enums
class TemplateType(str, Enum):
    NOTE = "Note"
    TASK = "Task"
    HABIT = "Habit"
    CHORE = "Chore"
    PERSON = "Person"
    PROJECT = "Project"


class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETE = "Complete"
    CANCELLED = "Cancelled"


class Priority(str, Enum):
    LOW = "Low"
    NORMAL = "Normal"
    HIGH = "High"
    URGENT = "Urgent"


# Models
class Household(Base):
    """Household entity for multi-user support."""
    __tablename__ = "households"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    users: Mapped[list["User"]] = relationship("User", back_populates="household")
    notes: Mapped[list["Note"]] = relationship("Note", back_populates="household")
    tags: Mapped[list["Tag"]] = relationship("Tag", back_populates="household")


class User(Base):
    """User entity."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    household: Mapped["Household"] = relationship("Household", back_populates="users")


class Tag(Base):
    """Tag entity."""
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id"), nullable=False)

    household: Mapped["Household"] = relationship("Household", back_populates="tags")


class Note(Base):
    """Note entity - core unit of the system."""
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    template_type: Mapped[str] = mapped_column(String(50), default=TemplateType.NOTE.value)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    assignee_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    household_id: Mapped[str] = mapped_column(String(36), ForeignKey("households.id"), nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    is_inbox: Mapped[bool] = mapped_column(Boolean, default=False)
    needs_detail: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    household: Mapped["Household"] = relationship("Household", back_populates="notes")
    task: Mapped[Optional["TaskBehaviour"]] = relationship("TaskBehaviour", back_populates="note", uselist=False)
    habit: Mapped[Optional["HabitBehaviour"]] = relationship("HabitBehaviour", back_populates="note", uselist=False)
    chore: Mapped[Optional["ChoreBehaviour"]] = relationship("ChoreBehaviour", back_populates="note", uselist=False)
    blockers: Mapped[list["Blocker"]] = relationship("Blocker", back_populates="note")


class TaskBehaviour(Base):
    """Task behaviour for notes."""
    __tablename__ = "task_behaviours"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING.value)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default=Priority.NORMAL.value)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    note: Mapped["Note"] = relationship("Note", back_populates="task")


class HabitBehaviour(Base):
    """Habit behaviour for notes."""
    __tablename__ = "habit_behaviours"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id"), nullable=False, unique=True)
    frequency_goal: Mapped[str] = mapped_column(String(100), default="daily")
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_completed: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completion_history: Mapped[Optional[str]] = mapped_column(Text, default="[]")

    note: Mapped["Note"] = relationship("Note", back_populates="habit")


class ChoreBehaviour(Base):
    """Chore behaviour for notes."""
    __tablename__ = "chore_behaviours"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id"), nullable=False, unique=True)
    interval_days: Mapped[int] = mapped_column(Integer, default=7)
    last_completed: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    next_due: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    note: Mapped["Note"] = relationship("Note", back_populates="chore")


class Blocker(Base):
    """Blocker entity for notes."""
    __tablename__ = "blockers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    note_id: Mapped[str] = mapped_column(String(36), ForeignKey("notes.id"), nullable=False)
    blocker_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    until_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    target_note_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    condition_entity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    condition_state: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    note: Mapped["Note"] = relationship("Note", back_populates="blockers")


class PomodoroSession(Base):
    """Pomodoro session entity."""
    __tablename__ = "pomodoro_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    note_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("notes.id"), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=25)
    status: Mapped[str] = mapped_column(String(20), default="Active")
