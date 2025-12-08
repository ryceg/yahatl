namespace Yahatl.Domain.Services;

/// <summary>
/// Service interface for publishing state updates to MQTT.
/// Handles event-driven state publishing with idempotency.
/// </summary>
public interface IStatePublisher
{
    /// <summary>
    /// Publish that a task was completed.
    /// </summary>
    Task PublishTaskCompletedAsync(Guid noteId, string title, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish that a chore was completed.
    /// </summary>
    Task PublishChoreCompletedAsync(Guid noteId, string title, DateTime nextDue, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish that a task was created.
    /// </summary>
    Task PublishTaskCreatedAsync(Guid noteId, string title, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish that a task was deleted.
    /// </summary>
    Task PublishTaskDeletedAsync(Guid noteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish updated overdue count.
    /// </summary>
    Task PublishOverdueCountAsync(int count, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish updated next task.
    /// </summary>
    Task PublishNextTaskAsync(string? taskTitle, CancellationToken cancellationToken = default);

    /// <summary>
    /// Trigger a full state refresh of all sensors.
    /// </summary>
    Task RefreshAllStatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish Pomodoro focus state to MQTT.
    /// </summary>
    /// <param name="isActive">Whether a Pomodoro session is active.</param>
    /// <param name="noteTitle">Optional title of the note being worked on.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task PublishPomodoroActiveAsync(bool isActive, string? noteTitle = null, CancellationToken cancellationToken = default);
}
