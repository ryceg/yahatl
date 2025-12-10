using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("notes/{noteId:guid}/blockers")]
[Authorize]
public class BlockersController(YahatlDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Get all blockers for a note.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<BlockerResponse>>> GetBlockers(Guid noteId)
    {
        var note = await dbContext.Notes
            .Include(n => n.Blockers)
            .FirstOrDefaultAsync(n => n.Id == noteId);

        if (note == null)
            return NotFound("Note not found");

        var blockers = note.Blockers.Select(b => MapToResponse(b)).ToList();
        return Ok(blockers);
    }

    /// <summary>
    /// Add a note blocker (blocked until another note is complete).
    /// </summary>
    [HttpPost("note")]
    public async Task<ActionResult<BlockerResponse>> AddNoteBlocker(
        Guid noteId,
        CreateNoteBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var targetNote = await dbContext.Notes.FindAsync(request.TargetNoteId);
        if (targetNote == null)
            return BadRequest("Target note not found");

        var blocker = new NoteBlocker
        {
            NoteId = noteId,
            TargetNoteId = request.TargetNoteId,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.NoteBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Add a person blocker (waiting on a person).
    /// </summary>
    [HttpPost("person")]
    public async Task<ActionResult<BlockerResponse>> AddPersonBlocker(
        Guid noteId,
        CreatePersonBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var blocker = new PersonBlocker
        {
            NoteId = noteId,
            PersonNoteId = request.PersonNoteId,
            Reason = request.Reason,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.PersonBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Add a time blocker (suppressed during time periods).
    /// </summary>
    [HttpPost("time")]
    public async Task<ActionResult<BlockerResponse>> AddTimeBlocker(
        Guid noteId,
        CreateTimeBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var blocker = new TimeBlocker
        {
            NoteId = noteId,
            WindowsJson = request.WindowsJson,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.TimeBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Add a condition blocker (MQTT-driven).
    /// </summary>
    [HttpPost("condition")]
    public async Task<ActionResult<BlockerResponse>> AddConditionBlocker(
        Guid noteId,
        CreateConditionBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var blocker = new ConditionBlocker
        {
            NoteId = noteId,
            MqttTopic = request.MqttTopic,
            Operator = request.Operator,
            Value = request.Value,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.ConditionBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Add an until-date blocker (simple deferral).
    /// </summary>
    [HttpPost("until")]
    public async Task<ActionResult<BlockerResponse>> AddUntilDateBlocker(
        Guid noteId,
        CreateUntilDateBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var blocker = new UntilDateBlocker
        {
            NoteId = noteId,
            Until = request.Until,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.UntilDateBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Add a freetext blocker (manual with description).
    /// </summary>
    [HttpPost("freetext")]
    public async Task<ActionResult<BlockerResponse>> AddFreetextBlocker(
        Guid noteId,
        CreateFreetextBlockerRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var blocker = new FreetextBlocker
        {
            NoteId = noteId,
            Description = request.Description,
            NotifyOnResolve = request.NotifyOnResolve,
            IsActive = true
        };

        dbContext.FreetextBlockers.Add(blocker);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBlockers), new { noteId }, MapToResponse(blocker));
    }

    /// <summary>
    /// Manually resolve a blocker.
    /// </summary>
    [HttpPost("{blockerId:guid}/resolve")]
    public async Task<IActionResult> ResolveBlocker(Guid noteId, Guid blockerId)
    {
        var blocker = await dbContext.Blockers
            .FirstOrDefaultAsync(b => b.Id == blockerId && b.NoteId == noteId);

        if (blocker == null)
            return NotFound("Blocker not found");

        blocker.IsActive = false;

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        // TODO: If NotifyOnResolve, trigger notification

        return Ok();
    }

    /// <summary>
    /// Update a blocker.
    /// </summary>
    [HttpPut("{blockerId:guid}")]
    public async Task<ActionResult<BlockerResponse>> UpdateBlocker(
        Guid noteId,
        Guid blockerId,
        [FromBody] UpdateBlockerRequest request)
    {
        var blocker = await dbContext.Blockers
            .FirstOrDefaultAsync(b => b.Id == blockerId && b.NoteId == noteId);

        if (blocker == null)
            return NotFound("Blocker not found");

        if (request.IsActive.HasValue)
            blocker.IsActive = request.IsActive.Value;

        if (request.NotifyOnResolve.HasValue)
            blocker.NotifyOnResolve = request.NotifyOnResolve.Value;

        switch (blocker)
        {
            case NoteBlocker nb:
                if (request.TargetNoteId.HasValue) nb.TargetNoteId = request.TargetNoteId.Value;
                break;
            case PersonBlocker pb:
                if (request.PersonNoteId.HasValue) pb.PersonNoteId = request.PersonNoteId.Value;
                if (request.Reason != null) pb.Reason = request.Reason;
                break;
            case TimeBlocker tb:
                if (request.WindowsJson != null) tb.WindowsJson = request.WindowsJson;
                break;
            case ConditionBlocker cb:
                if (request.MqttTopic != null) cb.MqttTopic = request.MqttTopic;
                if (request.Operator != null) cb.Operator = request.Operator;
                if (request.Value != null) cb.Value = request.Value;
                break;
            case UntilDateBlocker udb:
                if (request.Until.HasValue) udb.Until = request.Until.Value;
                break;
            case FreetextBlocker fb:
                if (request.Description != null) fb.Description = request.Description;
                break;
        }

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(MapToResponse(blocker));
    }

    /// <summary>
    /// Evaluate a blocker to check if it is currently active.
    /// </summary>
    [HttpGet("{blockerId:guid}/evaluate")]
    public async Task<ActionResult<BlockerEvaluationResponse>> EvaluateBlocker(Guid noteId, Guid blockerId)
    {
        var blocker = await dbContext.Blockers
            .FirstOrDefaultAsync(b => b.Id == blockerId && b.NoteId == noteId);

        if (blocker == null)
            return NotFound("Blocker not found");

        var (isActive, reason) = await EvaluateBlockerStateAsync(blocker);

        return Ok(new BlockerEvaluationResponse(blocker.Id, blocker.GetType().Name.Replace("Blocker", ""), isActive, reason));
    }

    private async Task<(bool IsActive, string Reason)> EvaluateBlockerStateAsync(Blocker blocker)
    {
        return blocker switch
        {
            NoteBlocker nb => await EvaluateNoteBlockerAsync(nb),
            UntilDateBlocker udb => EvaluateUntilDateBlocker(udb),
            TimeBlocker tb => EvaluateTimeBlocker(tb),
            ConditionBlocker cb => (cb.IsActive, cb.IsActive ? "Condition is met" : "Condition is not met"),
            PersonBlocker pb => (pb.IsActive, pb.IsActive ? $"Waiting on person: {pb.Reason}" : "Resolved"),
            FreetextBlocker fb => (fb.IsActive, fb.IsActive ? fb.Description : "Resolved"),
            _ => (blocker.IsActive, "Unknown")
        };
    }

    private async Task<(bool IsActive, string Reason)> EvaluateNoteBlockerAsync(NoteBlocker blocker)
    {
        var targetTask = await dbContext.TaskBehaviours
            .FirstOrDefaultAsync(t => t.NoteId == blocker.TargetNoteId);

        if (targetTask == null)
            return (true, "Target note has no task behaviour");

        if (targetTask.Status == Domain.Entities.TaskExecutionStatus.Complete)
            return (false, "Target note completed");

        return (true, "Waiting for target note to complete");
    }

    private static (bool IsActive, string Reason) EvaluateUntilDateBlocker(UntilDateBlocker blocker)
    {
        if (DateTime.UtcNow >= blocker.Until)
            return (false, "Date has passed");

        return (true, $"Deferred until {blocker.Until:yyyy-MM-dd}");
    }

    private static (bool IsActive, string Reason) EvaluateTimeBlocker(TimeBlocker blocker)
    {
        // Simple implementation - check if we're in a blocked time window
        // Full implementation would parse WindowsJson
        return (blocker.IsActive, blocker.IsActive ? "Currently in blocked time window" : "Outside blocked time windows");
    }

    /// <summary>
    /// Delete a blocker.
    /// </summary>
    [HttpDelete("{blockerId:guid}")]
    public async Task<IActionResult> DeleteBlocker(Guid noteId, Guid blockerId)
    {
        var blocker = await dbContext.Blockers
            .FirstOrDefaultAsync(b => b.Id == blockerId && b.NoteId == noteId);

        if (blocker == null)
            return NotFound("Blocker not found");

        dbContext.Blockers.Remove(blocker);

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private static BlockerResponse MapToResponse(Blocker blocker)
    {
        return blocker switch
        {
            NoteBlocker nb => new BlockerResponse(nb.Id, "Note", nb.IsActive, nb.NotifyOnResolve, new { nb.TargetNoteId }),
            PersonBlocker pb => new BlockerResponse(pb.Id, "Person", pb.IsActive, pb.NotifyOnResolve, new { pb.PersonNoteId, pb.Reason }),
            TimeBlocker tb => new BlockerResponse(tb.Id, "Time", tb.IsActive, tb.NotifyOnResolve, new { tb.WindowsJson }),
            ConditionBlocker cb => new BlockerResponse(cb.Id, "Condition", cb.IsActive, cb.NotifyOnResolve, new { cb.MqttTopic, cb.Operator, cb.Value }),
            UntilDateBlocker udb => new BlockerResponse(udb.Id, "UntilDate", udb.IsActive, udb.NotifyOnResolve, new { udb.Until }),
            FreetextBlocker fb => new BlockerResponse(fb.Id, "Freetext", fb.IsActive, fb.NotifyOnResolve, new { fb.Description }),
            _ => throw new InvalidOperationException($"Unknown blocker type: {blocker.GetType().Name}")
        };
    }
}
