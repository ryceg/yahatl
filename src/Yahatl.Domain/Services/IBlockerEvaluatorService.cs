using Yahatl.Domain.Entities;

namespace Yahatl.Domain.Services;

/// <summary>
/// Service for evaluating and updating blocker states.
/// </summary>
public interface IBlockerEvaluatorService
{
    /// <summary>
    /// Evaluates a single blocker and updates its IsActive state.
    /// </summary>
    /// <param name="blocker">The blocker to evaluate.</param>
    /// <param name="userTimezone">User's IANA timezone (e.g., "Australia/Sydney").</param>
    /// <returns>True if blocker is active (blocking), false otherwise.</returns>
    bool EvaluateBlocker(Blocker blocker, string userTimezone);

    /// <summary>
    /// Evaluates all blockers for a note and updates their IsActive state.
    /// </summary>
    /// <param name="noteId">The note to evaluate blockers for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task EvaluateBlockersForNoteAsync(Guid noteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Evaluates all blockers that may have changed state (time-based, note-based, until-date).
    /// Called by the background service.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task EvaluateAllBlockersAsync(CancellationToken cancellationToken = default);
}
