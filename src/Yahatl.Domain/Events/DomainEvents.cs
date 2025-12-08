using MediatR;

namespace Yahatl.Domain.Events;

/// <summary>
/// Base interface for all domain events.
/// </summary>
public interface IDomainEvent : INotification
{
    DateTime OccurredAt { get; }
}

/// <summary>
/// Event raised when a task is completed.
/// </summary>
public record TaskCompletedEvent(Guid NoteId, string Title) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a chore is completed.
/// </summary>
public record ChoreCompletedEvent(Guid NoteId, string Title, DateTime NextDue) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a task is created.
/// </summary>
public record TaskCreatedEvent(Guid NoteId, string Title, DateTime? DueDate) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a task is deleted.
/// </summary>
public record TaskDeletedEvent(Guid NoteId) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a chore is created.
/// </summary>
public record ChoreCreatedEvent(Guid NoteId, string Title) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a chore is deleted.
/// </summary>
public record ChoreDeletedEvent(Guid NoteId) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a condition trigger is created.
/// </summary>
public record ConditionTriggerCreatedEvent(Guid TriggerId, string MqttTopic) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a condition trigger is deleted.
/// </summary>
public record ConditionTriggerDeletedEvent(Guid TriggerId, string MqttTopic) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a condition blocker is created.
/// </summary>
public record ConditionBlockerCreatedEvent(Guid BlockerId, string MqttTopic) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a condition blocker is deleted.
/// </summary>
public record ConditionBlockerDeletedEvent(Guid BlockerId, string MqttTopic) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a condition trigger's state changes.
/// </summary>
public record ConditionTriggerStateChangedEvent(Guid TriggerId, Guid NoteId, bool IsActive) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
