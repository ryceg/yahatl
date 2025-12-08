namespace Yahatl.Domain.Services;

/// <summary>
/// Service for calculating when notes become due based on their triggers.
/// </summary>
public interface IDueDateCalculatorService
{
    /// <summary>
    /// Calculates the next due date for a note based on its triggers.
    /// </summary>
    /// <param name="noteId">The note to calculate due date for.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The next due date, or null if no triggers/not due.</returns>
    Task<DateTime?> CalculateNextDueAsync(Guid noteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Evaluates all triggers for a note and updates its ChoreBehaviour.NextDue.
    /// </summary>
    /// <param name="noteId">The note to evaluate.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task EvaluateTriggersAsync(Guid noteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Evaluates all notes with triggers that may need recalculation.
    /// Called by the background service.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task EvaluateAllDueNotesAsync(CancellationToken cancellationToken = default);
}
