using MediatR;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Events;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Mqtt.EventHandlers;

/// <summary>
/// Handles chore creation by publishing HA discovery.
/// </summary>
public class ChoreCreatedEventHandler(
    IHaDiscoveryService discoveryService,
    ILogger<ChoreCreatedEventHandler> logger) : INotificationHandler<ChoreCreatedEvent>
{
    public async Task Handle(ChoreCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Handling ChoreCreatedEvent for note {NoteId}", notification.NoteId);
        await discoveryService.PublishChoreDiscoveryAsync(notification.NoteId, notification.Title, cancellationToken);
    }
}

/// <summary>
/// Handles chore deletion by removing HA discovery.
/// </summary>
public class ChoreDeletedEventHandler(
    IHaDiscoveryService discoveryService,
    ILogger<ChoreDeletedEventHandler> logger) : INotificationHandler<ChoreDeletedEvent>
{
    public async Task Handle(ChoreDeletedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Handling ChoreDeletedEvent for note {NoteId}", notification.NoteId);
        await discoveryService.RemoveChoreDiscoveryAsync(notification.NoteId, cancellationToken);
    }
}

/// <summary>
/// Handles task completion by publishing state.
/// </summary>
public class TaskCompletedEventHandler(
    IStatePublisher statePublisher,
    ILogger<TaskCompletedEventHandler> logger) : INotificationHandler<TaskCompletedEvent>
{
    public async Task Handle(TaskCompletedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Handling TaskCompletedEvent for note {NoteId}", notification.NoteId);
        await statePublisher.PublishTaskCompletedAsync(notification.NoteId, notification.Title, cancellationToken);
    }
}

/// <summary>
/// Handles chore completion by publishing state.
/// </summary>
public class ChoreCompletedEventHandler(
    IStatePublisher statePublisher,
    ILogger<ChoreCompletedEventHandler> logger) : INotificationHandler<ChoreCompletedEvent>
{
    public async Task Handle(ChoreCompletedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Handling ChoreCompletedEvent for note {NoteId}", notification.NoteId);
        await statePublisher.PublishChoreCompletedAsync(notification.NoteId, notification.Title, notification.NextDue, cancellationToken);
    }
}

/// <summary>
/// Handles condition trigger creation by subscribing to MQTT topic.
/// </summary>
public class ConditionTriggerCreatedEventHandler(
    IMqttService mqttService,
    ILogger<ConditionTriggerCreatedEventHandler> logger) : INotificationHandler<ConditionTriggerCreatedEvent>
{
    public async Task Handle(ConditionTriggerCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Subscribing to topic {Topic} for new trigger {TriggerId}", notification.MqttTopic, notification.TriggerId);
        await mqttService.SubscribeAsync(notification.MqttTopic, cancellationToken);
    }
}

/// <summary>
/// Handles condition blocker creation by subscribing to MQTT topic.
/// </summary>
public class ConditionBlockerCreatedEventHandler(
    IMqttService mqttService,
    ILogger<ConditionBlockerCreatedEventHandler> logger) : INotificationHandler<ConditionBlockerCreatedEvent>
{
    public async Task Handle(ConditionBlockerCreatedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogDebug("Subscribing to topic {Topic} for new blocker {BlockerId}", notification.MqttTopic, notification.BlockerId);
        await mqttService.SubscribeAsync(notification.MqttTopic, cancellationToken);
    }
}
