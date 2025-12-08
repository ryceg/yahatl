using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;
using Yahatl.Infrastructure.Mqtt;

namespace Yahatl.Api.Controllers;

/// <summary>
/// Webhook endpoints for Home Assistant automation integration.
/// </summary>
[ApiController]
[Route("[controller]")]
public class WebhookController : ControllerBase
{
    private readonly YahatlDbContext _dbContext;
    private readonly HomeAssistantDiscoveryService _discoveryService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        YahatlDbContext dbContext,
        HomeAssistantDiscoveryService discoveryService,
        ILogger<WebhookController> logger)
    {
        _dbContext = dbContext;
        _discoveryService = discoveryService;
        _logger = logger;
    }

    /// <summary>
    /// Generic event handler for Home Assistant automations.
    /// </summary>
    [HttpPost("event")]
    [AllowAnonymous] // HA webhooks don't use JWT auth
    public async Task<IActionResult> HandleEvent([FromBody] WebhookEventRequest request)
    {
        _logger.LogInformation("Received webhook event: {EventType}", request.EventType);

        return request.EventType switch
        {
            "sensor_threshold" => await HandleSensorThreshold(request),
            "nfc_tag" => await HandleNfcTag(request),
            _ => Ok(new { status = "ignored", message = $"Unknown event type: {request.EventType}" })
        };
    }

    /// <summary>
    /// Mark a task as complete via NFC tag scan or other automation.
    /// </summary>
    [HttpPost("complete/{noteId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> CompleteTask(Guid noteId)
    {
        var taskBehaviour = await _dbContext.TaskBehaviours
            .Where(t => t.NoteId == noteId && t.Status == TaskStatus.Pending)
            .FirstOrDefaultAsync();

        if (taskBehaviour == null)
        {
            return NotFound(new { error = "Task not found or already completed" });
        }

        taskBehaviour.Status = TaskStatus.Complete;
        taskBehaviour.CompletedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Update MQTT states
        await _discoveryService.UpdateStatesAsync();

        _logger.LogInformation("Task {NoteId} marked complete via webhook", noteId);

        return Ok(new { status = "completed", noteId });
    }

    /// <summary>
    /// Handle sensor threshold events (e.g., soil moisture low).
    /// </summary>
    [HttpPost("sensor")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleSensorEvent([FromBody] SensorEventRequest request)
    {
        _logger.LogInformation(
            "Sensor event: {Topic} = {Value}",
            request.Topic,
            request.Value);

        // Update any condition triggers that match this topic
        var triggers = await _dbContext.ConditionTriggers
            .Where(t => t.MqttTopic == request.Topic)
            .ToListAsync();

        foreach (var trigger in triggers)
        {
            trigger.IsActive = MqttConditionEvaluator.Evaluate(
                trigger.Operator,
                trigger.Value,
                request.Value);
        }

        // Update any condition blockers that match this topic
        var blockers = await _dbContext.ConditionBlockers
            .Where(b => b.MqttTopic == request.Topic)
            .ToListAsync();

        foreach (var blocker in blockers)
        {
            blocker.IsActive = MqttConditionEvaluator.Evaluate(
                blocker.Operator,
                blocker.Value,
                request.Value);
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            status = "processed",
            triggersUpdated = triggers.Count,
            blockersUpdated = blockers.Count
        });
    }

    /// <summary>
    /// Republish Home Assistant discovery configs.
    /// Useful after broker restart or to manually refresh.
    /// </summary>
    [HttpPost("discovery/refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshDiscovery()
    {
        await _discoveryService.PublishDiscoveryAsync();
        return Ok(new { status = "refreshed" });
    }

    private async Task<IActionResult> HandleSensorThreshold(WebhookEventRequest request)
    {
        if (request.Data == null)
        {
            return BadRequest(new { error = "Missing data for sensor_threshold event" });
        }

        var topic = request.Data.GetValueOrDefault("topic")?.ToString();
        var value = request.Data.GetValueOrDefault("value")?.ToString();

        if (string.IsNullOrEmpty(topic) || string.IsNullOrEmpty(value))
        {
            return BadRequest(new { error = "topic and value are required" });
        }

        return await HandleSensorEvent(new SensorEventRequest { Topic = topic, Value = value });
    }

    private async Task<IActionResult> HandleNfcTag(WebhookEventRequest request)
    {
        if (request.Data == null)
        {
            return BadRequest(new { error = "Missing data for nfc_tag event" });
        }

        var noteIdStr = request.Data.GetValueOrDefault("note_id")?.ToString();

        if (!Guid.TryParse(noteIdStr, out var noteId))
        {
            return BadRequest(new { error = "Invalid note_id" });
        }

        return await CompleteTask(noteId);
    }
}

public class WebhookEventRequest
{
    public required string EventType { get; set; }
    public Dictionary<string, object>? Data { get; set; }
}

public class SensorEventRequest
{
    public required string Topic { get; set; }
    public required string Value { get; set; }
}
