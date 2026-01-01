"""Database repository for YAHATL Home Assistant integration."""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from .models import (
    Base,
    Blocker,
    ChoreBehaviour,
    HabitBehaviour,
    Household,
    Note,
    PomodoroSession,
    Tag,
    TaskBehaviour,
    User,
)

_LOGGER = logging.getLogger(__name__)


class YahatlRepository:
    """Data access layer for YAHATL SQLite database."""

    def __init__(self, db_path: Path) -> None:
        """Initialize the repository."""
        self._db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)

        self._engine = create_engine(f"sqlite:///{db_path}", echo=False)
        self._session_maker = sessionmaker(bind=self._engine)

        # Create tables
        Base.metadata.create_all(self._engine)
        _LOGGER.info(f"YAHATL database initialized at {db_path}")

    def _get_session(self) -> Session:
        """Get a database session."""
        return self._session_maker()

    # Household operations
    def get_or_create_household(self, name: str) -> Household:
        """Get or create a household."""
        with self._get_session() as session:
            household = session.execute(
                select(Household).where(Household.name == name)
            ).scalar_one_or_none()

            if household is None:
                household = Household(name=name)
                session.add(household)
                session.commit()
                session.refresh(household)

            return household

    def get_household(self, household_id: str) -> Optional[Household]:
        """Get a household by ID."""
        with self._get_session() as session:
            return session.get(Household, household_id)

    # User operations
    def get_or_create_user(
        self, email: str, password_hash: str, household_id: str
    ) -> User:
        """Get or create a user."""
        with self._get_session() as session:
            user = session.execute(
                select(User).where(User.email == email)
            ).scalar_one_or_none()

            if user is None:
                user = User(
                    email=email,
                    password_hash=password_hash,
                    household_id=household_id,
                )
                session.add(user)
                session.commit()
                session.refresh(user)

            return user

    def get_first_user(self, household_id: str) -> Optional[User]:
        """Get the first user in a household."""
        with self._get_session() as session:
            return session.execute(
                select(User).where(User.household_id == household_id)
            ).scalar_one_or_none()

    # Note operations
    def get_notes(
        self,
        household_id: str,
        is_inbox: Optional[bool] = None,
        template_type: Optional[str] = None,
        is_archived: bool = False,
    ) -> list[Note]:
        """Get notes with optional filtering."""
        with self._get_session() as session:
            query = select(Note).where(
                Note.household_id == household_id,
                Note.is_archived == is_archived,
            )

            if is_inbox is not None:
                query = query.where(Note.is_inbox == is_inbox)

            if template_type:
                query = query.where(Note.template_type == template_type)

            return list(session.execute(query).scalars().all())

    def get_note(self, note_id: str) -> Optional[Note]:
        """Get a note by ID."""
        with self._get_session() as session:
            return session.get(Note, note_id)

    def create_note(
        self,
        title: str,
        owner_id: str,
        household_id: str,
        body: Optional[str] = None,
        template_type: str = "Note",
        is_inbox: bool = False,
        tags: Optional[list[str]] = None,
    ) -> Note:
        """Create a new note."""
        with self._get_session() as session:
            note = Note(
                title=title,
                body=body,
                template_type=template_type,
                owner_id=owner_id,
                household_id=household_id,
                is_inbox=is_inbox,
            )
            session.add(note)
            session.commit()
            session.refresh(note)
            return note

    def update_note(self, note_id: str, **kwargs) -> Optional[Note]:
        """Update a note."""
        with self._get_session() as session:
            note = session.get(Note, note_id)
            if note is None:
                return None

            for key, value in kwargs.items():
                if hasattr(note, key):
                    setattr(note, key, value)

            note.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(note)
            return note

    def archive_note(self, note_id: str) -> bool:
        """Archive a note."""
        with self._get_session() as session:
            note = session.get(Note, note_id)
            if note is None:
                return False

            note.is_archived = True
            note.updated_at = datetime.utcnow()
            session.commit()
            return True

    # Task operations
    def get_tasks(self, household_id: str) -> list[tuple[Note, TaskBehaviour]]:
        """Get all tasks with their behaviours."""
        with self._get_session() as session:
            query = (
                select(Note, TaskBehaviour)
                .join(TaskBehaviour)
                .where(Note.household_id == household_id, Note.is_archived == False)
            )
            return list(session.execute(query).all())

    def add_task_behaviour(
        self,
        note_id: str,
        due_date: Optional[datetime] = None,
        priority: str = "Normal",
    ) -> TaskBehaviour:
        """Add a task behaviour to a note."""
        with self._get_session() as session:
            task = TaskBehaviour(
                note_id=note_id,
                due_date=due_date,
                priority=priority,
            )
            session.add(task)
            session.commit()
            session.refresh(task)
            return task

    def complete_task(self, note_id: str) -> bool:
        """Complete a task."""
        with self._get_session() as session:
            task = session.execute(
                select(TaskBehaviour).where(TaskBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if task is None:
                return False

            task.status = "Complete"
            task.completed_at = datetime.utcnow()
            session.commit()
            return True

    def update_task(self, note_id: str, **kwargs) -> Optional[TaskBehaviour]:
        """Update a task behaviour."""
        with self._get_session() as session:
            task = session.execute(
                select(TaskBehaviour).where(TaskBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if task is None:
                return None

            for key, value in kwargs.items():
                if key == "due_date" and value is not None:
                    task.due_date = value
                elif key == "due_date" and value is None:
                    task.due_date = None
                elif key == "priority" and value in ["Low", "Normal", "High", "Urgent"]:
                    task.priority = value
                elif key == "status" and value in ["Pending", "InProgress", "Complete", "Cancelled"]:
                    task.status = value
                    if value == "Complete":
                        task.completed_at = datetime.utcnow()

            session.commit()
            session.refresh(task)
            return task

    def get_overdue_tasks(self, household_id: str) -> list[tuple[Note, TaskBehaviour]]:
        """Get overdue tasks."""
        with self._get_session() as session:
            now = datetime.utcnow()
            query = (
                select(Note, TaskBehaviour)
                .join(TaskBehaviour)
                .where(
                    Note.household_id == household_id,
                    Note.is_archived == False,
                    TaskBehaviour.status == "Pending",
                    TaskBehaviour.due_date < now,
                )
            )
            return list(session.execute(query).all())

    def get_tasks_due_today(self, household_id: str) -> list[tuple[Note, TaskBehaviour]]:
        """Get tasks due today."""
        with self._get_session() as session:
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow_start = today_start + timedelta(days=1)
            query = (
                select(Note, TaskBehaviour)
                .join(TaskBehaviour)
                .where(
                    Note.household_id == household_id,
                    Note.is_archived == False,
                    TaskBehaviour.status == "Pending",
                    TaskBehaviour.due_date >= today_start,
                    TaskBehaviour.due_date < tomorrow_start,
                )
            )
            return list(session.execute(query).all())

    # Habit operations
    def get_habits(self, household_id: str) -> list[tuple[Note, HabitBehaviour]]:
        """Get all habits with their behaviours."""
        with self._get_session() as session:
            query = (
                select(Note, HabitBehaviour)
                .join(HabitBehaviour)
                .where(Note.household_id == household_id, Note.is_archived == False)
            )
            return list(session.execute(query).all())

    def add_habit_behaviour(
        self,
        note_id: str,
        frequency_goal: str = "daily",
    ) -> HabitBehaviour:
        """Add a habit behaviour to a note."""
        with self._get_session() as session:
            habit = HabitBehaviour(
                note_id=note_id,
                frequency_goal=frequency_goal,
            )
            session.add(habit)
            session.commit()
            session.refresh(habit)
            return habit

    def log_habit(self, note_id: str) -> bool:
        """Log a habit completion."""
        with self._get_session() as session:
            habit = session.execute(
                select(HabitBehaviour).where(HabitBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if habit is None:
                return False

            today = datetime.utcnow().date().isoformat()
            history = json.loads(habit.completion_history or "[]")

            if today not in history:
                history.append(today)
                habit.completion_history = json.dumps(history)
                habit.last_completed = datetime.utcnow()

                # Update streak
                yesterday = (datetime.utcnow() - timedelta(days=1)).date().isoformat()
                if yesterday in history:
                    habit.current_streak += 1
                else:
                    habit.current_streak = 1

                if habit.current_streak > habit.longest_streak:
                    habit.longest_streak = habit.current_streak

            session.commit()
            return True

    def update_habit(self, note_id: str, **kwargs) -> Optional[HabitBehaviour]:
        """Update a habit behaviour."""
        with self._get_session() as session:
            habit = session.execute(
                select(HabitBehaviour).where(HabitBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if habit is None:
                return None

            for key, value in kwargs.items():
                if key == "frequency_goal" and value:
                    habit.frequency_goal = value

            session.commit()
            session.refresh(habit)
            return habit

    def get_habits_at_risk(self, household_id: str) -> list[tuple[Note, HabitBehaviour]]:
        """Get habits with current streaks (at risk of breaking)."""
        with self._get_session() as session:
            query = (
                select(Note, HabitBehaviour)
                .join(HabitBehaviour)
                .where(
                    Note.household_id == household_id,
                    Note.is_archived == False,
                    HabitBehaviour.current_streak > 0,
                )
            )
            return list(session.execute(query).all())

    # Chore operations
    def get_chores(self, household_id: str) -> list[tuple[Note, ChoreBehaviour]]:
        """Get all chores with their behaviours."""
        with self._get_session() as session:
            query = (
                select(Note, ChoreBehaviour)
                .join(ChoreBehaviour)
                .where(Note.household_id == household_id, Note.is_archived == False)
            )
            return list(session.execute(query).all())

    def add_chore_behaviour(
        self,
        note_id: str,
        interval_days: int = 7,
    ) -> ChoreBehaviour:
        """Add a chore behaviour to a note."""
        with self._get_session() as session:
            chore = ChoreBehaviour(
                note_id=note_id,
                interval_days=interval_days,
                next_due=datetime.utcnow(),
            )
            session.add(chore)
            session.commit()
            session.refresh(chore)
            return chore

    def complete_chore(self, note_id: str) -> bool:
        """Complete a chore and reschedule."""
        with self._get_session() as session:
            chore = session.execute(
                select(ChoreBehaviour).where(ChoreBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if chore is None:
                return False

            chore.last_completed = datetime.utcnow()
            chore.next_due = datetime.utcnow() + timedelta(days=chore.interval_days)
            session.commit()
            return True

    def update_chore(self, note_id: str, **kwargs) -> Optional[ChoreBehaviour]:
        """Update a chore behaviour."""
        with self._get_session() as session:
            chore = session.execute(
                select(ChoreBehaviour).where(ChoreBehaviour.note_id == note_id)
            ).scalar_one_or_none()

            if chore is None:
                return None

            for key, value in kwargs.items():
                if key == "interval_days" and isinstance(value, int) and value > 0:
                    chore.interval_days = value
                elif key == "next_due" and value is not None:
                    chore.next_due = value

            session.commit()
            session.refresh(chore)
            return chore

    # Blocker operations
    def get_active_blockers(self, household_id: str) -> list[Blocker]:
        """Get all active blockers."""
        with self._get_session() as session:
            query = (
                select(Blocker)
                .join(Note)
                .where(
                    Note.household_id == household_id,
                    Blocker.is_active == True,
                )
            )
            return list(session.execute(query).scalars().all())

    # Pomodoro operations
    def get_active_pomodoro(self, user_id: str) -> Optional[PomodoroSession]:
        """Get the active Pomodoro session."""
        with self._get_session() as session:
            return session.execute(
                select(PomodoroSession).where(
                    PomodoroSession.user_id == user_id,
                    PomodoroSession.status == "Active",
                )
            ).scalar_one_or_none()

    def start_pomodoro(
        self,
        user_id: str,
        note_id: Optional[str] = None,
        duration_minutes: int = 25,
    ) -> PomodoroSession:
        """Start a Pomodoro session."""
        with self._get_session() as session:
            # Stop any existing session
            active = session.execute(
                select(PomodoroSession).where(
                    PomodoroSession.user_id == user_id,
                    PomodoroSession.status == "Active",
                )
            ).scalar_one_or_none()

            if active:
                active.status = "Cancelled"
                active.ended_at = datetime.utcnow()

            pomo = PomodoroSession(
                user_id=user_id,
                note_id=note_id,
                duration_minutes=duration_minutes,
            )
            session.add(pomo)
            session.commit()
            session.refresh(pomo)
            return pomo

    def stop_pomodoro(self, user_id: str, completed: bool = True) -> bool:
        """Stop the active Pomodoro session."""
        with self._get_session() as session:
            pomo = session.execute(
                select(PomodoroSession).where(
                    PomodoroSession.user_id == user_id,
                    PomodoroSession.status == "Active",
                )
            ).scalar_one_or_none()

            if pomo is None:
                return False

            pomo.status = "Completed" if completed else "Cancelled"
            pomo.ended_at = datetime.utcnow()
            session.commit()
            return True

    # Stats
    def get_stats(self, household_id: str) -> dict:
        """Get dashboard statistics."""
        overdue = len(self.get_overdue_tasks(household_id))
        due_today = len(self.get_tasks_due_today(household_id))
        inbox_count = len(self.get_notes(household_id, is_inbox=True))
        streaks_at_risk = len(self.get_habits_at_risk(household_id))
        blocked_count = len(self.get_active_blockers(household_id))

        return {
            "overdue_count": overdue,
            "due_today": due_today,
            "inbox_count": inbox_count,
            "streaks_at_risk": streaks_at_risk,
            "blocked_count": blocked_count,
        }
