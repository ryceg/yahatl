using Yahatl.Domain.Entities;

namespace Yahatl.Domain.Services;

/// <summary>
/// Service for calculating actionable items based on triggers and blockers.
/// The core of the Planner Mode experience.
/// </summary>
public interface IDayGeneratorService
{
    /// <summary>
    /// Get all candidate items for the current user, grouped by urgency.
    /// </summary>
    Task<CandidatesResult> GetCandidatesAsync();

    /// <summary>
    /// Get today's committed plan for the current user.
    /// </summary>
    Task<List<PlanItem>> GetTodaysPlanAsync();

    /// <summary>
    /// Add an item to today's plan.
    /// </summary>
    Task AddToPlanAsync(Guid noteId);

    /// <summary>
    /// Remove an item from today's plan.
    /// </summary>
    Task RemoveFromPlanAsync(Guid noteId);

    /// <summary>
    /// Reorder items in today's plan.
    /// </summary>
    Task ReorderPlanAsync(List<Guid> noteIds);

    /// <summary>
    /// Evaluate if a note is currently actionable (triggers fired, no active blockers).
    /// </summary>
    Task<bool> IsActionableAsync(Note note);

    /// <summary>
    /// Roll incomplete items from today to tomorrow.
    /// </summary>
    Task<RolloverResult> RolloverIncompleteAsync();
}

/// <summary>
/// Candidates grouped by urgency section.
/// </summary>
public record CandidatesResult(
    List<CandidateItem> Urgent,
    List<CandidateItem> DueSoon,
    List<CandidateItem> Available
);

/// <summary>
/// A candidate item for the planner.
/// </summary>
public record CandidateItem(
    Guid NoteId,
    string Title,
    TemplateType TemplateType,
    CandidateReason Reason,
    DateTime? DueDate,
    int? OverdueDays,
    bool StreakAtRisk,
    Priority? Priority
);

/// <summary>
/// Why an item is surfacing as a candidate.
/// </summary>
public enum CandidateReason
{
    Overdue,
    DueToday,
    WindowClosingSoon,
    StreakAtRisk,
    IntervalElapsed,
    ConditionMet,
    Available
}

/// <summary>
/// An item in today's plan.
/// </summary>
public record PlanItem(
    Guid NoteId,
    string Title,
    TemplateType TemplateType,
    int Order,
    bool IsComplete,
    DateTime? CompletedAt
);

/// <summary>
/// Result of rolling over incomplete items.
/// </summary>
public record RolloverResult(
    int ItemsRolledOver,
    List<Guid> RolledOverNoteIds
);
