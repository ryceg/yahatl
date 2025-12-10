using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Mqtt;

/// <summary>
/// Publishes MQTT Discovery payloads for Home Assistant auto-discovery.
/// Also publishes entity state updates to MQTT topics.
/// </summary>
public class HomeAssistantDiscoveryService : IHaDiscoveryService
{
    private readonly IMqttService _mqttService;
    private readonly YahatlDbContext _dbContext;
    private readonly ILogger<HomeAssistantDiscoveryService> _logger;

    private const string DiscoveryPrefix = "homeassistant";
    private const string StatePrefix = "yahatl";

    public HomeAssistantDiscoveryService(
        IMqttService mqttService,
        YahatlDbContext dbContext,
        ILogger<HomeAssistantDiscoveryService> logger)
    {
        _mqttService = mqttService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Publish all discovery configs and initial state to Home Assistant.
    /// </summary>
    public async Task PublishDiscoveryAsync(CancellationToken cancellationToken = default)
    {
        await PublishOverdueCountSensorAsync(cancellationToken);
        await PublishTasksDueTodaySensorAsync(cancellationToken);
        await PublishNextTaskSensorAsync(cancellationToken);
        await PublishChoresOverdueBinarySensorAsync(cancellationToken);

        _logger.LogInformation("Published Home Assistant discovery configs");
    }

    /// <summary>
    /// Update all entity states in MQTT.
    /// </summary>
    public async Task UpdateStatesAsync(CancellationToken cancellationToken = default)
    {
        var overdueCount = await GetOverdueCountAsync(cancellationToken);
        await PublishStateAsync("sensor/overdue_count", overdueCount.ToString(), cancellationToken);

        var dueToday = await GetDueTodayCountAsync(cancellationToken);
        await PublishStateAsync("sensor/tasks_due_today", dueToday.ToString(), cancellationToken);

        var nextTask = await GetNextTaskAsync(cancellationToken);
        await PublishStateAsync("sensor/next_task", nextTask ?? "None", cancellationToken);

        var hasOverdueChores = await HasOverdueChoresAsync(cancellationToken);
        await PublishStateAsync("binary_sensor/chores_overdue", hasOverdueChores ? "ON" : "OFF", cancellationToken);
    }

    private async Task PublishOverdueCountSensorAsync(CancellationToken cancellationToken)
    {
        var discoveryPayload = new
        {
            name = "YAHATL Overdue Count",
            unique_id = "yahatl_overdue_count",
            state_topic = $"{StatePrefix}/sensor/overdue_count/state",
            icon = "mdi:alert-circle",
            unit_of_measurement = "tasks",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("sensor", "overdue_count", discoveryPayload, cancellationToken);

        var count = await GetOverdueCountAsync(cancellationToken);
        await PublishStateAsync("sensor/overdue_count", count.ToString(), cancellationToken);
    }

    private async Task PublishTasksDueTodaySensorAsync(CancellationToken cancellationToken)
    {
        var discoveryPayload = new
        {
            name = "YAHATL Tasks Due Today",
            unique_id = "yahatl_tasks_due_today",
            state_topic = $"{StatePrefix}/sensor/tasks_due_today/state",
            icon = "mdi:calendar-check",
            unit_of_measurement = "tasks",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("sensor", "tasks_due_today", discoveryPayload, cancellationToken);

        var count = await GetDueTodayCountAsync(cancellationToken);
        await PublishStateAsync("sensor/tasks_due_today", count.ToString(), cancellationToken);
    }

    private async Task PublishNextTaskSensorAsync(CancellationToken cancellationToken)
    {
        var discoveryPayload = new
        {
            name = "YAHATL Next Task",
            unique_id = "yahatl_next_task",
            state_topic = $"{StatePrefix}/sensor/next_task/state",
            icon = "mdi:checkbox-marked-circle-outline",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("sensor", "next_task", discoveryPayload, cancellationToken);

        var nextTask = await GetNextTaskAsync(cancellationToken);
        await PublishStateAsync("sensor/next_task", nextTask ?? "None", cancellationToken);
    }

    private async Task PublishChoresOverdueBinarySensorAsync(CancellationToken cancellationToken)
    {
        var discoveryPayload = new
        {
            name = "YAHATL Chores Overdue",
            unique_id = "yahatl_chores_overdue",
            state_topic = $"{StatePrefix}/binary_sensor/chores_overdue/state",
            device_class = "problem",
            payload_on = "ON",
            payload_off = "OFF",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("binary_sensor", "chores_overdue", discoveryPayload, cancellationToken);

        var hasOverdue = await HasOverdueChoresAsync(cancellationToken);
        await PublishStateAsync("binary_sensor/chores_overdue", hasOverdue ? "ON" : "OFF", cancellationToken);
    }

    private async Task PublishDiscoveryConfigAsync(string component, string objectId, object payload, CancellationToken cancellationToken)
    {
        var topic = $"{DiscoveryPrefix}/{component}/yahatl/{objectId}/config";
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        });

        await _mqttService.PublishAsync(topic, json, retain: true, cancellationToken);
    }

    private async Task PublishStateAsync(string entityPath, string state, CancellationToken cancellationToken)
    {
        var topic = $"{StatePrefix}/{entityPath}/state";
        await _mqttService.PublishAsync(topic, state, retain: true, cancellationToken);
    }

    private static object GetDeviceInfo() => new
    {
        identifiers = new[] { "yahatl" },
        name = "YAHATL",
        manufacturer = "YAHATL",
        model = "Task Manager",
        sw_version = "1.0.0"
    };

    private async Task<int> GetOverdueCountAsync(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        return await _dbContext.TaskBehaviours
            .Where(t => t.Status == TaskExecutionStatus.Pending && t.DueDate.HasValue && t.DueDate.Value < today)
            .CountAsync(cancellationToken);
    }

    private async Task<int> GetDueTodayCountAsync(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        return await _dbContext.TaskBehaviours
            .Where(t => t.Status == TaskExecutionStatus.Pending && t.DueDate.HasValue && t.DueDate.Value >= today && t.DueDate.Value < tomorrow)
            .CountAsync(cancellationToken);
    }

    private async Task<string?> GetNextTaskAsync(CancellationToken cancellationToken)
    {
        var nextTask = await _dbContext.TaskBehaviours
            .Where(t => t.Status == TaskExecutionStatus.Pending)
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenBy(t => t.Priority)
            .Include(t => t.Note)
            .FirstOrDefaultAsync(cancellationToken);

        return nextTask?.Note?.Title;
    }

    private async Task<bool> HasOverdueChoresAsync(CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow;

        return await _dbContext.ChoreBehaviours
            .Where(c => c.NextDue < today)
            .AnyAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task PublishChoreDiscoveryAsync(Guid noteId, string choreName, CancellationToken cancellationToken = default)
    {
        var objectId = $"chore_{noteId:N}";
        var sanitizedName = SanitizeName(choreName);

        // Publish binary sensor for chore overdue status
        var binarySensorPayload = new
        {
            name = $"YAHATL {sanitizedName} Overdue",
            unique_id = $"yahatl_{objectId}_overdue",
            state_topic = $"{StatePrefix}/binary_sensor/{objectId}/state",
            device_class = "problem",
            payload_on = "ON",
            payload_off = "OFF",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("binary_sensor", objectId, binarySensorPayload, cancellationToken);

        // Publish sensor for next due date
        var sensorPayload = new
        {
            name = $"YAHATL {sanitizedName} Next Due",
            unique_id = $"yahatl_{objectId}_next_due",
            state_topic = $"{StatePrefix}/sensor/{objectId}_next_due/state",
            icon = "mdi:calendar-clock",
            device = GetDeviceInfo()
        };

        await PublishDiscoveryConfigAsync("sensor", $"{objectId}_next_due", sensorPayload, cancellationToken);

        // Publish initial state
        var chore = await _dbContext.ChoreBehaviours
            .FirstOrDefaultAsync(c => c.NoteId == noteId, cancellationToken);

        if (chore != null)
        {
            var isOverdue = chore.NextDue < DateTime.UtcNow;
            await PublishStateAsync($"binary_sensor/{objectId}", isOverdue ? "ON" : "OFF", cancellationToken);
            await PublishStateAsync($"sensor/{objectId}_next_due", chore.NextDue.ToString("yyyy-MM-dd HH:mm"), cancellationToken);
        }

        _logger.LogInformation("Published HA discovery for chore {ChoreId}: {ChoreName}", noteId, choreName);
    }

    /// <inheritdoc />
    public async Task RemoveChoreDiscoveryAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var objectId = $"chore_{noteId:N}";

        // Remove by publishing empty payloads
        var binaryTopic = $"{DiscoveryPrefix}/binary_sensor/yahatl/{objectId}/config";
        var sensorTopic = $"{DiscoveryPrefix}/sensor/yahatl/{objectId}_next_due/config";

        await _mqttService.PublishAsync(binaryTopic, "", retain: true, cancellationToken);
        await _mqttService.PublishAsync(sensorTopic, "", retain: true, cancellationToken);

        _logger.LogInformation("Removed HA discovery for chore {ChoreId}", noteId);
    }

    private static string SanitizeName(string name)
    {
        // Sanitize name for HA entity naming
        return name.Length > 50 ? name[..50] : name;
    }
}

