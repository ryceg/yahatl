"""HTTP API views for YAHATL mobile app integration."""

import json
import logging
from datetime import datetime
from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .db.models import Priority, TaskStatus

_LOGGER = logging.getLogger(__name__)


def setup_views(hass: HomeAssistant) -> None:
    """Register all HTTP views."""
    hass.http.register_view(AuthLoginView)
    hass.http.register_view(NotesListView)
    hass.http.register_view(NoteDetailView)
    hass.http.register_view(NoteCaptureView)
    hass.http.register_view(TaskBehaviourView)
    hass.http.register_view(TaskCompleteView)
    hass.http.register_view(HabitBehaviourView)
    hass.http.register_view(HabitCompleteView)
    hass.http.register_view(ChoreBehaviourView)
    hass.http.register_view(ChoreCompleteView)
    hass.http.register_view(DashboardSummaryView)
    hass.http.register_view(PomodoroStartView)
    hass.http.register_view(PomodoroStopView)
    hass.http.register_view(PomodoroCurrentView)
    _LOGGER.info("YAHATL HTTP API views registered")


def _get_data(hass: HomeAssistant) -> dict:
    """Get YAHATL data from hass.data."""
    for entry_id, data in hass.data.get(DOMAIN, {}).items():
        if "repository" in data:
            return data
    raise web.HTTPServiceUnavailable(text="YAHATL not configured")


def _note_to_dict(note, include_behaviours: bool = False) -> dict:
    """Convert Note model to API response dict."""
    result = {
        "id": note.id,
        "title": note.title,
        "body": note.body,
        "templateType": note.template_type,
        "ownerId": note.owner_id,
        "assigneeId": note.assignee_id,
        "isArchived": note.is_archived,
        "isInbox": note.is_inbox,
        "needsDetail": note.needs_detail,
        "createdAt": note.created_at.isoformat() if note.created_at else None,
        "updatedAt": note.updated_at.isoformat() if note.updated_at else None,
        "tags": [],
        "linkedNotes": [],
        "blockedByNotes": [],
    }

    if include_behaviours:
        behaviours = []
        if note.task:
            behaviours.append(_task_to_dict(note.task))
        if note.habit:
            behaviours.append(_habit_to_dict(note.habit))
        if note.chore:
            behaviours.append(_chore_to_dict(note.chore))
        result["behaviours"] = behaviours

    return result


def _task_to_dict(task) -> dict:
    """Convert TaskBehaviour to API response dict."""
    return {
        "type": "Task",
        "id": task.id,
        "noteId": task.note_id,
        "status": task.status,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "priority": task.priority,
        "completedAt": task.completed_at.isoformat() if task.completed_at else None,
    }


def _habit_to_dict(habit) -> dict:
    """Convert HabitBehaviour to API response dict."""
    return {
        "type": "Habit",
        "id": habit.id,
        "noteId": habit.note_id,
        "frequencyGoal": habit.frequency_goal,
        "currentStreak": habit.current_streak,
        "longestStreak": habit.longest_streak,
        "lastCompleted": habit.last_completed.isoformat() if habit.last_completed else None,
    }


def _chore_to_dict(chore) -> dict:
    """Convert ChoreBehaviour to API response dict."""
    return {
        "type": "Chore",
        "id": chore.id,
        "noteId": chore.note_id,
        "intervalDays": chore.interval_days,
        "lastCompleted": chore.last_completed.isoformat() if chore.last_completed else None,
        "nextDue": chore.next_due.isoformat() if chore.next_due else None,
    }


# Auth endpoints
class AuthLoginView(HomeAssistantView):
    """Handle /api/yahatl/Auth/login."""

    url = "/api/yahatl/Auth/login"
    name = "api:yahatl:auth:login"
    requires_auth = False

    async def post(self, request: web.Request) -> web.Response:
        """Login - validates HA token passed in request."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        # For HA integration, accept any login and return the household info
        # Real auth is done via HA's token system
        email = body.get("email", "")
        password = body.get("password", "")

        # Get or create user
        repo = data["repository"]
        household_id = data["household_id"]
        user_id = data["user_id"]

        return web.json_response({
            "accessToken": f"ha_token_{user_id}",
            "refreshToken": f"ha_refresh_{user_id}",
            "userId": user_id,
            "email": email,
            "householdId": household_id,
        })


# Notes endpoints
class NotesListView(HomeAssistantView):
    """Handle /api/yahatl/notes."""

    url = "/api/yahatl/notes"
    name = "api:yahatl:notes"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get all notes."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        notes = await hass.async_add_executor_job(
            repo.get_notes, data["household_id"]
        )

        return web.json_response({
            "items": [_note_to_dict(n) for n in notes],
            "totalCount": len(notes),
            "page": 1,
            "pageSize": len(notes),
        })

    async def post(self, request: web.Request) -> web.Response:
        """Create a note."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        note = await hass.async_add_executor_job(
            repo.create_note,
            body.get("title", "Untitled"),
            data["user_id"],
            data["household_id"],
            body.get("body"),
            body.get("templateType", "Note"),
            body.get("isInbox", False),
            body.get("tags"),
        )

        return web.json_response(_note_to_dict(note), status=201)


class NoteDetailView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}."""

    url = "/api/yahatl/notes/{note_id}"
    name = "api:yahatl:notes:detail"
    requires_auth = True

    async def get(self, request: web.Request, note_id: str) -> web.Response:
        """Get a specific note."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        note = await hass.async_add_executor_job(repo.get_note, note_id)
        if note is None:
            return web.json_response({"error": "Not found"}, status=404)

        return web.json_response(_note_to_dict(note, include_behaviours=True))

    async def put(self, request: web.Request, note_id: str) -> web.Response:
        """Update a note."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        note = await hass.async_add_executor_job(
            repo.update_note,
            note_id,
            **{k: v for k, v in body.items() if k in ["title", "body", "is_inbox", "needs_detail"]}
        )

        if note is None:
            return web.json_response({"error": "Not found"}, status=404)

        return web.json_response(_note_to_dict(note))

    async def delete(self, request: web.Request, note_id: str) -> web.Response:
        """Archive a note."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        success = await hass.async_add_executor_job(repo.archive_note, note_id)
        if not success:
            return web.json_response({"error": "Not found"}, status=404)

        return web.Response(status=204)


class NoteCaptureView(HomeAssistantView):
    """Handle /api/yahatl/notes/capture."""

    url = "/api/yahatl/notes/capture"
    name = "api:yahatl:notes:capture"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Quick capture to inbox."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        note = await hass.async_add_executor_job(
            repo.create_note,
            body.get("title", "Untitled"),
            data["user_id"],
            data["household_id"],
            body.get("body"),
            "Note",
            True,  # is_inbox
            body.get("tags"),
        )

        # Refresh coordinator
        coord = data["coordinator"]
        await coord.async_request_refresh()

        return web.json_response(_note_to_dict(note), status=201)


# Task behaviour endpoints
class TaskBehaviourView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/task."""

    url = "/api/yahatl/notes/{note_id}/behaviours/task"
    name = "api:yahatl:behaviours:task"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Add task behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            body = {}

        due_date = None
        if body.get("dueDate"):
            due_date = datetime.fromisoformat(body["dueDate"].replace("Z", "+00:00"))

        task = await hass.async_add_executor_job(
            repo.add_task_behaviour,
            note_id,
            due_date,
            body.get("priority", "Normal"),
        )

        # Update note template type
        await hass.async_add_executor_job(
            repo.update_note, note_id, template_type="Task"
        )

        await data["coordinator"].async_request_refresh()
        return web.json_response(_task_to_dict(task))

    async def put(self, request: web.Request, note_id: str) -> web.Response:
        """Update task behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        kwargs = {}
        if "dueDate" in body:
            if body["dueDate"]:
                kwargs["due_date"] = datetime.fromisoformat(
                    body["dueDate"].replace("Z", "+00:00")
                )
            else:
                kwargs["due_date"] = None
        if "priority" in body:
            kwargs["priority"] = body["priority"]
        if "status" in body:
            kwargs["status"] = body["status"]

        task = await hass.async_add_executor_job(
            repo.update_task, note_id, **kwargs
        )

        if task is None:
            return web.json_response({"error": "Task not found"}, status=404)

        await data["coordinator"].async_request_refresh()
        return web.json_response(_task_to_dict(task))


class TaskCompleteView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/task/complete."""

    url = "/api/yahatl/notes/{note_id}/behaviours/task/complete"
    name = "api:yahatl:behaviours:task:complete"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Complete a task."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        success = await hass.async_add_executor_job(repo.complete_task, note_id)
        if not success:
            return web.json_response({"error": "Task not found"}, status=404)

        await data["coordinator"].async_request_refresh()

        # Get updated task
        note = await hass.async_add_executor_job(repo.get_note, note_id)
        return web.json_response(_task_to_dict(note.task))


# Habit behaviour endpoints
class HabitBehaviourView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/habit."""

    url = "/api/yahatl/notes/{note_id}/behaviours/habit"
    name = "api:yahatl:behaviours:habit"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Add habit behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            body = {}

        habit = await hass.async_add_executor_job(
            repo.add_habit_behaviour,
            note_id,
            body.get("frequencyGoal", "daily"),
        )

        await hass.async_add_executor_job(
            repo.update_note, note_id, template_type="Habit"
        )

        await data["coordinator"].async_request_refresh()
        return web.json_response(_habit_to_dict(habit))

    async def put(self, request: web.Request, note_id: str) -> web.Response:
        """Update habit behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        kwargs = {}
        if "frequencyGoal" in body:
            kwargs["frequency_goal"] = body["frequencyGoal"]

        habit = await hass.async_add_executor_job(
            repo.update_habit, note_id, **kwargs
        )

        if habit is None:
            return web.json_response({"error": "Habit not found"}, status=404)

        await data["coordinator"].async_request_refresh()
        return web.json_response(_habit_to_dict(habit))


class HabitCompleteView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/habit/complete."""

    url = "/api/yahatl/notes/{note_id}/behaviours/habit/complete"
    name = "api:yahatl:behaviours:habit:complete"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Log habit completion."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        success = await hass.async_add_executor_job(repo.log_habit, note_id)
        if not success:
            return web.json_response({"error": "Habit not found"}, status=404)

        await data["coordinator"].async_request_refresh()

        note = await hass.async_add_executor_job(repo.get_note, note_id)
        return web.json_response(_habit_to_dict(note.habit))


# Chore behaviour endpoints
class ChoreBehaviourView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/chore."""

    url = "/api/yahatl/notes/{note_id}/behaviours/chore"
    name = "api:yahatl:behaviours:chore"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Add chore behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            body = {}

        chore = await hass.async_add_executor_job(
            repo.add_chore_behaviour,
            note_id,
            body.get("intervalDays", 7),
        )

        await hass.async_add_executor_job(
            repo.update_note, note_id, template_type="Chore"
        )

        await data["coordinator"].async_request_refresh()
        return web.json_response(_chore_to_dict(chore))

    async def put(self, request: web.Request, note_id: str) -> web.Response:
        """Update chore behaviour."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)

        kwargs = {}
        if "intervalDays" in body:
            kwargs["interval_days"] = int(body["intervalDays"])

        chore = await hass.async_add_executor_job(
            repo.update_chore, note_id, **kwargs
        )

        if chore is None:
            return web.json_response({"error": "Chore not found"}, status=404)

        await data["coordinator"].async_request_refresh()
        return web.json_response(_chore_to_dict(chore))


class ChoreCompleteView(HomeAssistantView):
    """Handle /api/yahatl/notes/{noteId}/behaviours/chore/complete."""

    url = "/api/yahatl/notes/{note_id}/behaviours/chore/complete"
    name = "api:yahatl:behaviours:chore:complete"
    requires_auth = True

    async def post(self, request: web.Request, note_id: str) -> web.Response:
        """Complete a chore."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        success = await hass.async_add_executor_job(repo.complete_chore, note_id)
        if not success:
            return web.json_response({"error": "Chore not found"}, status=404)

        await data["coordinator"].async_request_refresh()

        note = await hass.async_add_executor_job(repo.get_note, note_id)
        return web.json_response(_chore_to_dict(note.chore))


# Dashboard endpoints
class DashboardSummaryView(HomeAssistantView):
    """Handle /api/yahatl/Dashboard/summary."""

    url = "/api/yahatl/Dashboard/summary"
    name = "api:yahatl:dashboard:summary"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get dashboard summary."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        stats = await hass.async_add_executor_job(
            repo.get_stats, data["household_id"]
        )

        return web.json_response({
            "overdueCount": stats["overdue_count"],
            "dueTodayCount": stats["due_today"],
            "inboxCount": stats["inbox_count"],
            "blockedCount": stats["blocked_count"],
            "streaksAtRisk": stats["streaks_at_risk"],
        })


# Pomodoro endpoints
class PomodoroStartView(HomeAssistantView):
    """Handle /api/yahatl/Pomodoro/start."""

    url = "/api/yahatl/Pomodoro/start"
    name = "api:yahatl:pomodoro:start"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Start a Pomodoro session."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        try:
            body = await request.json()
        except json.JSONDecodeError:
            body = {}

        pomo = await hass.async_add_executor_job(
            repo.start_pomodoro,
            data["user_id"],
            body.get("noteId"),
            body.get("durationMinutes", 25),
        )

        await data["coordinator"].async_request_refresh()

        return web.json_response({
            "id": pomo.id,
            "userId": pomo.user_id,
            "noteId": pomo.note_id,
            "startedAt": pomo.started_at.isoformat(),
            "durationMinutes": pomo.duration_minutes,
            "status": pomo.status,
        })


class PomodoroStopView(HomeAssistantView):
    """Handle /api/yahatl/Pomodoro/stop."""

    url = "/api/yahatl/Pomodoro/stop"
    name = "api:yahatl:pomodoro:stop"
    requires_auth = True

    async def post(self, request: web.Request) -> web.Response:
        """Stop the current Pomodoro session."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        success = await hass.async_add_executor_job(
            repo.stop_pomodoro, data["user_id"]
        )

        await data["coordinator"].async_request_refresh()

        return web.json_response({"stopped": success})


class PomodoroCurrentView(HomeAssistantView):
    """Handle /api/yahatl/Pomodoro/current."""

    url = "/api/yahatl/Pomodoro/current"
    name = "api:yahatl:pomodoro:current"
    requires_auth = True

    async def get(self, request: web.Request) -> web.Response:
        """Get current Pomodoro session."""
        hass: HomeAssistant = request.app["hass"]
        data = _get_data(hass)
        repo = data["repository"]

        pomo = await hass.async_add_executor_job(
            repo.get_active_pomodoro, data["user_id"]
        )

        if pomo is None:
            return web.json_response(None)

        return web.json_response({
            "id": pomo.id,
            "userId": pomo.user_id,
            "noteId": pomo.note_id,
            "startedAt": pomo.started_at.isoformat(),
            "durationMinutes": pomo.duration_minutes,
            "status": pomo.status,
        })
