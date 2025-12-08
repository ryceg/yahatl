using System.Text.Json;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Mqtt;

/// <summary>
/// Publishes state updates to MQTT with idempotency support.
/// </summary>
public class StatePublisher : IStatePublisher
{
    private readonly IMqttService _mqttService;
    private readonly IHaDiscoveryService _discoveryService;
    private readonly ILogger<StatePublisher> _logger;

    private const string StatePrefix = "yahatl";

    // Cache for idempotent publishing
    private readonly Dictionary<string, string> _lastPublishedStates = new();
    private readonly object _lockObject = new();

    public StatePublisher(
        IMqttService mqttService,
        IHaDiscoveryService discoveryService,
        ILogger<StatePublisher> logger)
    {
        _mqttService = mqttService;
        _discoveryService = discoveryService;
        _logger = logger;
    }

    public async Task PublishTaskCompletedAsync(Guid noteId, string title, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/events/task_completed";
        var payload = JsonSerializer.Serialize(new
        {
            note_id = noteId,
            title,
            completed_at = DateTime.UtcNow
        });

        await PublishEventAsync(topic, payload, cancellationToken);

        // Also trigger state refresh
        await _discoveryService.UpdateStatesAsync(cancellationToken);
    }

    public async Task PublishChoreCompletedAsync(Guid noteId, string title, DateTime nextDue, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/events/chore_completed";
        var payload = JsonSerializer.Serialize(new
        {
            note_id = noteId,
            title,
            completed_at = DateTime.UtcNow,
            next_due = nextDue
        });

        await PublishEventAsync(topic, payload, cancellationToken);

        // Also trigger state refresh
        await _discoveryService.UpdateStatesAsync(cancellationToken);
    }

    public async Task PublishTaskCreatedAsync(Guid noteId, string title, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/events/task_created";
        var payload = JsonSerializer.Serialize(new
        {
            note_id = noteId,
            title,
            created_at = DateTime.UtcNow
        });

        await PublishEventAsync(topic, payload, cancellationToken);

        // Also trigger state refresh
        await _discoveryService.UpdateStatesAsync(cancellationToken);
    }

    public async Task PublishTaskDeletedAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/events/task_deleted";
        var payload = JsonSerializer.Serialize(new
        {
            note_id = noteId,
            deleted_at = DateTime.UtcNow
        });

        await PublishEventAsync(topic, payload, cancellationToken);

        // Also trigger state refresh
        await _discoveryService.UpdateStatesAsync(cancellationToken);
    }

    public async Task PublishOverdueCountAsync(int count, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/sensor/overdue_count/state";
        var payload = count.ToString();

        await PublishIdempotentAsync(topic, payload, cancellationToken);
    }

    public async Task PublishNextTaskAsync(string? taskTitle, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/sensor/next_task/state";
        var payload = taskTitle ?? "None";

        await PublishIdempotentAsync(topic, payload, cancellationToken);
    }

    public async Task RefreshAllStatesAsync(CancellationToken cancellationToken = default)
    {
        await _discoveryService.UpdateStatesAsync(cancellationToken);
    }

    private async Task PublishEventAsync(string topic, string payload, CancellationToken cancellationToken)
    {
        await _mqttService.PublishAsync(topic, payload, retain: false, cancellationToken);
        _logger.LogDebug("Published event to {Topic}", topic);
    }

    private async Task PublishIdempotentAsync(string topic, string payload, CancellationToken cancellationToken)
    {
        lock (_lockObject)
        {
            if (_lastPublishedStates.TryGetValue(topic, out var lastPayload) && lastPayload == payload)
            {
                _logger.LogDebug("Skipping idempotent publish to {Topic} - same value", topic);
                return;
            }

            _lastPublishedStates[topic] = payload;
        }

        await _mqttService.PublishAsync(topic, payload, retain: true, cancellationToken);
        _logger.LogDebug("Published state to {Topic}: {Payload}", topic, payload);
    }

    public async Task PublishPomodoroActiveAsync(bool isActive, string? noteTitle = null, CancellationToken cancellationToken = default)
    {
        var topic = $"{StatePrefix}/pomodoro/active";
        var payload = JsonSerializer.Serialize(new
        {
            active = isActive,
            note_title = noteTitle,
            updated_at = DateTime.UtcNow
        });

        await PublishIdempotentAsync(topic, payload, cancellationToken);
        _logger.LogDebug("Published Pomodoro state: active={Active}", isActive);
    }
}
