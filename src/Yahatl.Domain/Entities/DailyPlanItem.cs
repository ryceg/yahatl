namespace Yahatl.Domain.Entities;

/// <summary>
/// Represents an item committed to a user's daily plan.
/// Items are ordered and tracked for completion.
/// </summary>
public class DailyPlanItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The user this plan item belongs to.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// The note being planned.
    /// </summary>
    public Guid NoteId { get; set; }

    /// <summary>
    /// The date this plan item is for (date portion only).
    /// </summary>
    public DateOnly PlanDate { get; set; }

    /// <summary>
    /// Order in the day's plan (1-indexed).
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// When this item was added to the plan.
    /// </summary>
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public Note? Note { get; set; }
}
