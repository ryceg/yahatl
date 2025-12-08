namespace Yahatl.Domain.Entities;

/// <summary>
/// Base class for all blockers that prevent items from surfacing as actionable.
/// Multiple blockers on a note = all must be inactive for item to surface (AND logic).
/// Uses Table-Per-Hierarchy (TPH) inheritance in EF Core.
/// </summary>
public abstract class Blocker
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The note this blocker is attached to.
    /// </summary>
    public Guid NoteId { get; set; }

    /// <summary>
    /// Whether this blocker is currently blocking.
    /// Can be calculated (auto-resolving) or manual.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether this blocker hides the note.
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// If true, send push notification when blocker clears.
    /// </summary>
    public bool NotifyOnResolve { get; set; }

    // Navigation property
    public Note? Note { get; set; }
}

/// <summary>
/// Active until another Note is completed.
/// Auto-resolves when target note's TaskBehaviour status becomes "Complete".
/// </summary>
public class NoteBlocker : Blocker
{
    /// <summary>
    /// The note that must be completed to unblock.
    /// </summary>
    public Guid TargetNoteId { get; set; }

    // Navigation property
    public Note? TargetNote { get; set; }
}

/// <summary>
/// Waiting on a person. Requires manual resolution.
/// </summary>
public class PersonBlocker : Blocker
{
    /// <summary>
    /// Reference to a Person template note.
    /// </summary>
    public Guid PersonNoteId { get; set; }

    /// <summary>
    /// Reason for waiting (e.g., "waiting for reply").
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>
/// Active during specified time periods. Suppresses item visibility.
/// Example: "Don't show me work tasks on weekends"
/// Auto-activates/deactivates based on current time.
/// </summary>
public class TimeBlocker : Blocker
{
    /// <summary>
    /// JSON array of time windows.
    /// Example: [{ "days": ["monday", "tuesday"], "time_range": "00:00-23:59" }]
    /// </summary>
    public string WindowsJson { get; set; } = "[]";
}

/// <summary>
/// Active when an external condition is true. MQTT-driven.
/// Example: "Don't suggest mowing if it's raining tomorrow"
/// </summary>
public class ConditionBlocker : Blocker
{
    /// <summary>
    /// MQTT topic to subscribe to.
    /// </summary>
    public required string MqttTopic { get; set; }

    /// <summary>
    /// Comparison operator: eq, neq, gt, lt, gte, lte, bool
    /// </summary>
    public required string Operator { get; set; }

    /// <summary>
    /// Value to compare against.
    /// </summary>
    public required string Value { get; set; }
}

/// <summary>
/// Suppressed until a specific date. Simple deferral.
/// Auto-resolves when date passes.
/// </summary>
public class UntilDateBlocker : Blocker
{
    /// <summary>
    /// Date after which this blocker becomes inactive.
    /// </summary>
    public DateTime Until { get; set; }
}

/// <summary>
/// Manual blocker with a description. Requires manual resolution.
/// Example: "Waiting for parts to arrive"
/// </summary>
public class FreetextBlocker : Blocker
{
    /// <summary>
    /// Description of what is blocking this item.
    /// </summary>
    public required string Description { get; set; }
}
