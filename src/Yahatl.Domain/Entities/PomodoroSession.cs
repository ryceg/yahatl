namespace Yahatl.Domain.Entities;

/// <summary>
/// Represents a Pomodoro focus session.
/// Users can start sessions optionally linked to a note to track focus time.
/// </summary>
public class PomodoroSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// User who started this session.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Optional note being worked on during this session.
    /// </summary>
    public Guid? NoteId { get; set; }

    /// <summary>
    /// When the session was started.
    /// </summary>
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Duration of the session in minutes.
    /// </summary>
    public int DurationMinutes { get; set; } = 25;

    /// <summary>
    /// Current status of the session.
    /// </summary>
    public PomodoroStatus Status { get; set; } = PomodoroStatus.Active;

    /// <summary>
    /// When the session ended (completed or cancelled).
    /// </summary>
    public DateTime? EndedAt { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Note? Note { get; set; }
}

/// <summary>
/// Status of a Pomodoro session.
/// </summary>
public enum PomodoroStatus
{
    Active,
    Completed,
    Cancelled
}
