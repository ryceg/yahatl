"""Constants for yahatl integration."""

DOMAIN = "yahatl"

# Config keys
CONF_LIST_NAME = "list_name"
CONF_STORAGE_KEY = "storage_key"

# Item traits (composable flags)
TRAIT_ACTIONABLE = "actionable"
TRAIT_RECURRING = "recurring"
TRAIT_HABIT = "habit"
TRAIT_CHORE = "chore"
TRAIT_REMINDER = "reminder"
TRAIT_NOTE = "note"

ALL_TRAITS = [
    TRAIT_ACTIONABLE,
    TRAIT_RECURRING,
    TRAIT_HABIT,
    TRAIT_CHORE,
    TRAIT_REMINDER,
    TRAIT_NOTE,
]

# Item status
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_MISSED = "missed"

ALL_STATUSES = [STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_COMPLETED, STATUS_MISSED]

# Storage
STORAGE_VERSION = 1
COMPLETION_HISTORY_CAP = 365

# Defaults
DEFAULT_TIME_ESTIMATE = 30  # minutes
DEFAULT_BUFFER_BEFORE = 0
DEFAULT_BUFFER_AFTER = 0
