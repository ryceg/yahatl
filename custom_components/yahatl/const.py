"""Constants for the YAHATL integration."""

DOMAIN = "yahatl"

# Configuration keys
CONF_HOUSEHOLD_NAME = "household_name"

# Default values
DEFAULT_HOUSEHOLD_NAME = "Home"

# Platforms
PLATFORMS = ["todo", "sensor", "binary_sensor", "calendar"]

# Services
SERVICE_CAPTURE = "capture"
SERVICE_COMPLETE_TASK = "complete_task"
SERVICE_ADD_BLOCKER = "add_blocker"
SERVICE_START_POMODORO = "start_pomodoro"
SERVICE_STOP_POMODORO = "stop_pomodoro"
SERVICE_LOG_HABIT = "log_habit"
SERVICE_COMPLETE_CHORE = "complete_chore"

# Attributes
ATTR_NOTE_ID = "note_id"
ATTR_TITLE = "title"
ATTR_TAGS = "tags"
ATTR_BLOCKER_TYPE = "blocker_type"
ATTR_UNTIL = "until"
ATTR_DURATION_MINUTES = "duration_minutes"
ATTR_PRIORITY = "priority"

# Entity types
ENTITY_INBOX = "inbox"
ENTITY_TASKS = "tasks"
ENTITY_CHORES = "chores"
ENTITY_HABITS = "habits"

# Priorities
PRIORITY_LOW = "Low"
PRIORITY_NORMAL = "Normal"
PRIORITY_HIGH = "High"
PRIORITY_URGENT = "Urgent"
