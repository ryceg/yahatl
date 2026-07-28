"""Constants for yahatl integration."""

DOMAIN = "yahatl"

# Config keys
CONF_LIST_NAME = "list_name"
CONF_STORAGE_KEY = "storage_key"

# Options keys
CONF_RETENTION_DAYS = "retention_days"

# Item traits (composable flags)
TRAIT_ACTIONABLE = "actionable"
TRAIT_RECURRING = "recurring"
TRAIT_HABIT = "habit"
TRAIT_CHORE = "chore"
TRAIT_REMINDER = "reminder"
TRAIT_NOTE = "note"
TRAIT_SOMEDAY = "someday"
TRAIT_SHOPPING = "shopping"
TRAIT_GIFT = "gift"

ALL_TRAITS = [
    TRAIT_ACTIONABLE,
    TRAIT_RECURRING,
    TRAIT_HABIT,
    TRAIT_CHORE,
    TRAIT_REMINDER,
    TRAIT_NOTE,
    TRAIT_SOMEDAY,
    TRAIT_SHOPPING,
    TRAIT_GIFT,
]

# Mutually exclusive trait pairs
EXCLUSIVE_TRAITS = {TRAIT_ACTIONABLE, TRAIT_SOMEDAY}

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
# Days a completed one-off is kept before the coordinator purges it (0 = never).
DEFAULT_RETENTION_DAYS = 30

# Dispatcher signal for intra-integration updates (faster than bus events)
SIGNAL_YAHATL_UPDATED = f"{DOMAIN}_updated_signal"
SIGNAL_YAHATL_SNAPSHOT = f"{DOMAIN}_snapshot_signal"
