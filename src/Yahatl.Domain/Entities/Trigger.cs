namespace Yahatl.Domain.Entities;

/// <summary>
/// Base class for all triggers that determine when an item becomes due/actionable.
/// Multiple triggers on a note = any one can fire (OR logic).
/// Uses Table-Per-Hierarchy (TPH) inheritance in EF Core.
/// </summary>
public abstract class Trigger
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The note this trigger is attached to.
    /// </summary>
    public Guid NoteId { get; set; }

    // Navigation property
    public Note? Note { get; set; }
}

/// <summary>
/// Anchored to calendar. Fires on each occurrence of the pattern.
/// Examples: "Every Tuesday", "1st of each month".
/// </summary>
public class FixedTrigger : Trigger
{
    /// <summary>
    /// Cron-like expression or structured definition.
    /// Standard cron format: minute hour day-of-month month day-of-week
    /// Examples:
    /// - "0 9 * * 2" = Every Tuesday at 9 AM
    /// - "0 0 1 * *" = 1st of each month at midnight
    /// </summary>
    public required string CronPattern { get; set; }
}

/// <summary>
/// Time since last completion. Fires when: last_completed + interval_days <= now.
/// If never completed, fires immediately.
/// </summary>
public class IntervalTrigger : Trigger
{
    /// <summary>
    /// Number of days after last completion before becoming due again.
    /// </summary>
    public int IntervalDays { get; set; }
}

/// <summary>
/// Multiple time windows sorted by preference.
/// More flexible than a single "preferred day".
/// </summary>
public class WindowTrigger : Trigger
{
    /// <summary>
    /// JSON array of windows with preference, days, and time_range.
    /// Example:
    /// [
    ///   { "preference": 1, "days": ["saturday"], "time_range": "09:00-12:00" },
    ///   { "preference": 2, "days": ["sunday"], "time_range": "14:00-18:00" }
    /// ]
    /// </summary>
    public string WindowsJson { get; set; } = "[]";

    /// <summary>
    /// Recurrence pattern: "weekly", "monthly", etc.
    /// </summary>
    public string Recurrence { get; set; } = "weekly";

    /// <summary>
    /// What happens if all windows pass without completion.
    /// Values: "end_of_last_window", "days_after:N", "never"
    /// </summary>
    public string WindowExpiry { get; set; } = "end_of_last_window";
}

/// <summary>
/// External state trigger, typically from Home Assistant via MQTT.
/// Fires when the condition evaluates to true.
/// </summary>
public class ConditionTrigger : Trigger
{
    /// <summary>
    /// MQTT topic to subscribe to (e.g., "sensor/soil_moisture").
    /// </summary>
    public required string MqttTopic { get; set; }

    /// <summary>
    /// Comparison operator: eq, neq, gt, lt, gte, lte, bool
    /// </summary>
    public required string Operator { get; set; }

    /// <summary>
    /// Value to compare against. Stored as string, parsed based on operator.
    /// </summary>
    public required string Value { get; set; }

    /// <summary>
    /// Whether this trigger is currently active (condition is met).
    /// Updated in real-time by MQTT subscription.
    /// </summary>
    public bool IsActive { get; set; }
}
