namespace Yahatl.Domain.Entities;

/// <summary>
/// Base class for all behaviours that can be attached to Notes.
/// Behaviours add functionality to notes (tasks, habits, chores, reminders).
/// Uses Table-Per-Hierarchy (TPH) inheritance in EF Core.
/// </summary>
public abstract class Behaviour
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The note this behaviour is attached to.
    /// </summary>
    public Guid NoteId { get; set; }

    // Navigation property
    public Note? Note { get; set; }
}

/// <summary>
/// Status values for TaskBehaviour.
/// </summary>
/// <summary>
/// Status values for TaskBehaviour.
/// </summary>
public enum TaskExecutionStatus
{
    Pending,
    Complete,
    Cancelled
}

/// <summary>
/// Priority levels for tasks.
/// </summary>
public enum Priority
{
    Low,
    Normal,
    High,
    Urgent
}

/// <summary>
/// Adds task functionality to a note - status, due date, priority.
/// </summary>
public class TaskBehaviour : Behaviour
{
    public TaskExecutionStatus Status { get; set; } = TaskExecutionStatus.Pending;

    /// <summary>
    /// Due date can be set manually or calculated from triggers.
    /// </summary>
    public DateTime? DueDate { get; set; }

    public Priority Priority { get; set; } = Priority.Normal;

    /// <summary>
    /// Timestamp when the task was completed.
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Adds habit tracking to a note - streaks, frequency goals, completion history.
/// </summary>
public class HabitBehaviour : Behaviour
{
    /// <summary>
    /// Frequency goal description (e.g., "daily", "3x per week").
    /// </summary>
    public string FrequencyGoal { get; set; } = "daily";

    /// <summary>
    /// Current consecutive completion streak.
    /// </summary>
    public int CurrentStreak { get; set; }

    /// <summary>
    /// Longest streak ever achieved.
    /// </summary>
    public int LongestStreak { get; set; }

    /// <summary>
    /// History of completion dates stored as JSON array.
    /// </summary>
    public string CompletionHistoryJson { get; set; } = "[]";
}

/// <summary>
/// Adds chore scheduling to a note - tracks last completion and calculates next due.
/// </summary>
public class ChoreBehaviour : Behaviour
{
    /// <summary>
    /// When this chore was last completed.
    /// </summary>
    public DateTime? LastCompleted { get; set; }

    /// <summary>
    /// Calculated next due date based on triggers.
    /// </summary>
    public DateTime NextDue { get; set; }
}

/// <summary>
/// Adds reminder functionality to a note with notification settings.
/// </summary>
public class ReminderBehaviour : Behaviour
{
    /// <summary>
    /// Notification settings stored as JSON.
    /// </summary>
    public string NotificationSettingsJson { get; set; } = "{}";
}
