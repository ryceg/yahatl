using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("notes/{noteId:guid}/triggers")]
[Authorize]
public class TriggersController(YahatlDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Get all triggers for a note.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TriggerResponse>>> GetTriggers(Guid noteId)
    {
        var note = await dbContext.Notes
            .Include(n => n.Triggers)
            .FirstOrDefaultAsync(n => n.Id == noteId);

        if (note == null)
            return NotFound("Note not found");

        var triggers = note.Triggers.Select(t => MapToResponse(t)).ToList();
        return Ok(triggers);
    }

    /// <summary>
    /// Add a fixed (cron-based) trigger.
    /// </summary>
    [HttpPost("fixed")]
    public async Task<ActionResult<TriggerResponse>> AddFixedTrigger(
        Guid noteId,
        CreateFixedTriggerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var trigger = new FixedTrigger
        {
            NoteId = noteId,
            CronPattern = request.CronPattern
        };

        dbContext.FixedTriggers.Add(trigger);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTriggers), new { noteId }, MapToResponse(trigger));
    }

    /// <summary>
    /// Add an interval trigger (days since last completion).
    /// </summary>
    [HttpPost("interval")]
    public async Task<ActionResult<TriggerResponse>> AddIntervalTrigger(
        Guid noteId,
        CreateIntervalTriggerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var trigger = new IntervalTrigger
        {
            NoteId = noteId,
            IntervalDays = request.IntervalDays
        };

        dbContext.IntervalTriggers.Add(trigger);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTriggers), new { noteId }, MapToResponse(trigger));
    }

    /// <summary>
    /// Add a window trigger (multiple time windows with preferences).
    /// </summary>
    [HttpPost("window")]
    public async Task<ActionResult<TriggerResponse>> AddWindowTrigger(
        Guid noteId,
        CreateWindowTriggerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var trigger = new WindowTrigger
        {
            NoteId = noteId,
            WindowsJson = request.WindowsJson,
            Recurrence = request.Recurrence,
            WindowExpiry = request.WindowExpiry
        };

        dbContext.WindowTriggers.Add(trigger);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTriggers), new { noteId }, MapToResponse(trigger));
    }

    /// <summary>
    /// Add a condition trigger (MQTT-based external state).
    /// </summary>
    [HttpPost("condition")]
    public async Task<ActionResult<TriggerResponse>> AddConditionTrigger(
        Guid noteId,
        CreateConditionTriggerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var trigger = new ConditionTrigger
        {
            NoteId = noteId,
            MqttTopic = request.MqttTopic,
            Operator = request.Operator,
            Value = request.Value
        };

        dbContext.ConditionTriggers.Add(trigger);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTriggers), new { noteId }, MapToResponse(trigger));
    }

    /// <summary>
    /// Update a trigger.
    /// </summary>
    [HttpPut("{triggerId:guid}")]
    public async Task<ActionResult<TriggerResponse>> UpdateTrigger(
        Guid noteId,
        Guid triggerId,
        [FromBody] UpdateTriggerRequest request)
    {
        var trigger = await dbContext.Triggers
            .FirstOrDefaultAsync(t => t.Id == triggerId && t.NoteId == noteId);

        if (trigger == null)
            return NotFound("Trigger not found");

        switch (trigger)
        {
            case FixedTrigger ft:
                if (request.CronPattern != null) ft.CronPattern = request.CronPattern;
                break;
            case IntervalTrigger it:
                if (request.IntervalDays.HasValue) it.IntervalDays = request.IntervalDays.Value;
                break;
            case WindowTrigger wt:
                if (request.WindowsJson != null) wt.WindowsJson = request.WindowsJson;
                if (request.Recurrence != null) wt.Recurrence = request.Recurrence;
                if (request.WindowExpiry != null) wt.WindowExpiry = request.WindowExpiry;
                break;
            case ConditionTrigger ct:
                if (request.MqttTopic != null) ct.MqttTopic = request.MqttTopic;
                if (request.Operator != null) ct.Operator = request.Operator;
                if (request.Value != null) ct.Value = request.Value;
                break;
        }

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(MapToResponse(trigger));
    }

    /// <summary>
    /// Evaluate a trigger to check if it would fire.
    /// </summary>
    [HttpGet("{triggerId:guid}/evaluate")]
    public async Task<ActionResult<TriggerEvaluationResponse>> EvaluateTrigger(Guid noteId, Guid triggerId)
    {
        var trigger = await dbContext.Triggers
            .FirstOrDefaultAsync(t => t.Id == triggerId && t.NoteId == noteId);

        if (trigger == null)
            return NotFound("Trigger not found");

        var isActive = trigger switch
        {
            ConditionTrigger ct => ct.IsActive,
            IntervalTrigger it => await EvaluateIntervalTriggerAsync(it),
            FixedTrigger ft => EvaluateFixedTrigger(ft),
            WindowTrigger wt => EvaluateWindowTrigger(wt),
            _ => false
        };

        return Ok(new TriggerEvaluationResponse(trigger.Id, trigger.GetType().Name.Replace("Trigger", ""), isActive));
    }

    private async Task<bool> EvaluateIntervalTriggerAsync(IntervalTrigger trigger)
    {
        var choreBehaviour = await dbContext.ChoreBehaviours
            .FirstOrDefaultAsync(c => c.NoteId == trigger.NoteId);

        if (choreBehaviour?.LastCompleted == null)
            return true; // Never completed, so it's due

        return DateTime.UtcNow >= choreBehaviour.LastCompleted.Value.AddDays(trigger.IntervalDays);
    }

    private static bool EvaluateFixedTrigger(FixedTrigger trigger)
    {
        // Simple cron evaluation - for now just check if pattern is valid
        // Full cron evaluation would require a library like NCrontab
        return !string.IsNullOrEmpty(trigger.CronPattern);
    }

    private static bool EvaluateWindowTrigger(WindowTrigger trigger)
    {
        // For now, return true if we have any windows configured
        return trigger.WindowsJson != "[]";
    }

    /// <summary>
    /// Delete a trigger.
    /// </summary>
    [HttpDelete("{triggerId:guid}")]
    public async Task<IActionResult> DeleteTrigger(Guid noteId, Guid triggerId)
    {
        var trigger = await dbContext.Triggers
            .FirstOrDefaultAsync(t => t.Id == triggerId && t.NoteId == noteId);

        if (trigger == null)
            return NotFound("Trigger not found");

        dbContext.Triggers.Remove(trigger);

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private static TriggerResponse MapToResponse(Trigger trigger)
    {
        return trigger switch
        {
            FixedTrigger ft => new TriggerResponse(ft.Id, "Fixed", new { ft.CronPattern }),
            IntervalTrigger it => new TriggerResponse(it.Id, "Interval", new { it.IntervalDays }),
            WindowTrigger wt => new TriggerResponse(wt.Id, "Window", new { wt.WindowsJson, wt.Recurrence, wt.WindowExpiry }),
            ConditionTrigger ct => new TriggerResponse(ct.Id, "Condition", new { ct.MqttTopic, ct.Operator, ct.Value, ct.IsActive }),
            _ => throw new InvalidOperationException($"Unknown trigger type: {trigger.GetType().Name}")
        };
    }
}
