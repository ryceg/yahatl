"""Todo platform for YAHATL (HA 2023.11+)."""

from datetime import datetime
from typing import Any

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .coordinator import YahatlCoordinator
from .entity import YahatlEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up YAHATL todo lists."""
    coordinator: YahatlCoordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]

    entities = [
        YahatlInboxTodoList(coordinator),
        YahatlTasksTodoList(coordinator),
        YahatlChoresTodoList(coordinator),
        YahatlHabitsTodoList(coordinator),
    ]

    async_add_entities(entities)


class YahatlInboxTodoList(YahatlEntity, TodoListEntity):
    """Todo list for inbox items."""

    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
    )

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the todo list."""
        super().__init__(coordinator, "inbox")
        self._attr_translation_key = "inbox"

    @property
    def todo_items(self) -> list[TodoItem]:
        """Return inbox items."""
        inbox = self.coordinator.data.get("inbox", [])
        return [
            TodoItem(
                uid=note.id,
                summary=note.title,
                status=TodoItemStatus.NEEDS_ACTION,
            )
            for note in inbox
        ]

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Create a new inbox item."""
        await self.coordinator.async_capture(item.summary or "Untitled")

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Archive inbox items."""
        for uid in uids:
            await self.hass.async_add_executor_job(
                self.coordinator.repository.archive_note, uid
            )
        await self.coordinator.async_request_refresh()


class YahatlTasksTodoList(YahatlEntity, TodoListEntity):
    """Todo list for tasks."""

    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.SET_DUE_DATE_ON_ITEM
    )

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the todo list."""
        super().__init__(coordinator, "tasks")
        self._attr_translation_key = "tasks"

    @property
    def todo_items(self) -> list[TodoItem]:
        """Return task items."""
        tasks = self.coordinator.data.get("tasks", [])
        items = []
        for note, task in tasks:
            status = (
                TodoItemStatus.COMPLETED
                if task.status == "Complete"
                else TodoItemStatus.NEEDS_ACTION
            )
            items.append(
                TodoItem(
                    uid=note.id,
                    summary=note.title,
                    status=status,
                    due=task.due_date.date() if task.due_date else None,
                )
            )
        return items

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Create a new task."""
        note = await self.hass.async_add_executor_job(
            self.coordinator.repository.create_note,
            item.summary or "Untitled",
            self.coordinator.user_id,
            self.coordinator.household_id,
            None,  # body
            "Task",
            False,  # is_inbox
            None,  # tags
        )
        due_date = (
            datetime.combine(item.due, datetime.min.time()) if item.due else None
        )
        await self.hass.async_add_executor_job(
            self.coordinator.repository.add_task_behaviour,
            note.id,
            due_date,
            "Normal",
        )
        await self.coordinator.async_request_refresh()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Update a task (complete/uncomplete)."""
        if item.status == TodoItemStatus.COMPLETED:
            await self.coordinator.async_complete_task(item.uid)
        await self.coordinator.async_request_refresh()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Archive tasks."""
        for uid in uids:
            await self.hass.async_add_executor_job(
                self.coordinator.repository.archive_note, uid
            )
        await self.coordinator.async_request_refresh()


class YahatlChoresTodoList(YahatlEntity, TodoListEntity):
    """Todo list for chores."""

    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
    )

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the todo list."""
        super().__init__(coordinator, "chores")
        self._attr_translation_key = "chores"

    @property
    def todo_items(self) -> list[TodoItem]:
        """Return chore items."""
        chores = self.coordinator.data.get("chores", [])
        items = []
        for note, chore in chores:
            is_due = chore.next_due and chore.next_due <= datetime.utcnow()
            status = TodoItemStatus.NEEDS_ACTION if is_due else TodoItemStatus.COMPLETED
            items.append(
                TodoItem(
                    uid=note.id,
                    summary=note.title,
                    status=status,
                    due=chore.next_due.date() if chore.next_due else None,
                )
            )
        return items

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Create a new chore."""
        note = await self.hass.async_add_executor_job(
            self.coordinator.repository.create_note,
            item.summary or "Untitled",
            self.coordinator.user_id,
            self.coordinator.household_id,
            None,
            "Chore",
            False,
            None,
        )
        await self.hass.async_add_executor_job(
            self.coordinator.repository.add_chore_behaviour,
            note.id,
            7,  # Default 7-day interval
        )
        await self.coordinator.async_request_refresh()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Complete a chore."""
        if item.status == TodoItemStatus.COMPLETED:
            await self.coordinator.async_complete_chore(item.uid)
        await self.coordinator.async_request_refresh()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Archive chores."""
        for uid in uids:
            await self.hass.async_add_executor_job(
                self.coordinator.repository.archive_note, uid
            )
        await self.coordinator.async_request_refresh()


class YahatlHabitsTodoList(YahatlEntity, TodoListEntity):
    """Todo list for habits."""

    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
    )

    def __init__(self, coordinator: YahatlCoordinator) -> None:
        """Initialize the todo list."""
        super().__init__(coordinator, "habits")
        self._attr_translation_key = "habits"

    @property
    def todo_items(self) -> list[TodoItem]:
        """Return habit items."""
        habits = self.coordinator.data.get("habits", [])
        items = []
        for note, habit in habits:
            # Show as needs action if not completed today
            today = datetime.utcnow().date()
            completed_today = (
                habit.last_completed
                and habit.last_completed.date() == today
            )
            status = (
                TodoItemStatus.COMPLETED
                if completed_today
                else TodoItemStatus.NEEDS_ACTION
            )
            items.append(
                TodoItem(
                    uid=note.id,
                    summary=f"{note.title} (🔥 {habit.current_streak})",
                    status=status,
                    description=f"Goal: {habit.frequency_goal}, Best: {habit.longest_streak}",
                )
            )
        return items

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Create a new habit."""
        note = await self.hass.async_add_executor_job(
            self.coordinator.repository.create_note,
            item.summary or "Untitled",
            self.coordinator.user_id,
            self.coordinator.household_id,
            None,
            "Habit",
            False,
            None,
        )
        await self.hass.async_add_executor_job(
            self.coordinator.repository.add_habit_behaviour,
            note.id,
            "daily",
        )
        await self.coordinator.async_request_refresh()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Log a habit completion."""
        if item.status == TodoItemStatus.COMPLETED:
            await self.coordinator.async_log_habit(item.uid)
        await self.coordinator.async_request_refresh()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Archive habits."""
        for uid in uids:
            await self.hass.async_add_executor_job(
                self.coordinator.repository.archive_note, uid
            )
        await self.coordinator.async_request_refresh()
