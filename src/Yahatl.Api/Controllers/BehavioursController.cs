using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("notes/{noteId:guid}/behaviours")]
[Authorize]
public class BehavioursController(YahatlDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Add a task behaviour to a note.
    /// </summary>
    [HttpPost("task")]
    public async Task<ActionResult<TaskBehaviourResponse>> AddTaskBehaviour(
        Guid noteId,
        CreateTaskBehaviourRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        // Check if already has a task behaviour
        var existing = await dbContext.TaskBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (existing != null)
            return Conflict("Note already has a task behaviour");

        var behaviour = new TaskBehaviour
        {
            NoteId = noteId,
            DueDate = request.DueDate,
            Priority = request.Priority,
            Status = Domain.Entities.TaskExecutionStatus.Pending
        };

        dbContext.TaskBehaviours.Add(behaviour);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBehaviours), new { noteId },
            new TaskBehaviourResponse(behaviour.Id, behaviour.Status, behaviour.DueDate, behaviour.Priority, behaviour.CompletedAt));
    }

    /// <summary>
    /// Add a habit behaviour to a note.
    /// </summary>
    [HttpPost("habit")]
    public async Task<ActionResult<HabitBehaviourResponse>> AddHabitBehaviour(
        Guid noteId,
        CreateHabitBehaviourRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var existing = await dbContext.HabitBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (existing != null)
            return Conflict("Note already has a habit behaviour");

        var behaviour = new HabitBehaviour
        {
            NoteId = noteId,
            FrequencyGoal = request.FrequencyGoal
        };

        dbContext.HabitBehaviours.Add(behaviour);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBehaviours), new { noteId },
            new HabitBehaviourResponse(behaviour.Id, behaviour.FrequencyGoal, behaviour.CurrentStreak, behaviour.LongestStreak));
    }

    /// <summary>
    /// Add a chore behaviour to a note.
    /// </summary>
    [HttpPost("chore")]
    public async Task<ActionResult<ChoreBehaviourResponse>> AddChoreBehaviour(
        Guid noteId,
        CreateChoreBehaviourRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var existing = await dbContext.ChoreBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (existing != null)
            return Conflict("Note already has a chore behaviour");

        var behaviour = new ChoreBehaviour
        {
            NoteId = noteId,
            NextDue = request.NextDue ?? DateTime.UtcNow
        };

        dbContext.ChoreBehaviours.Add(behaviour);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBehaviours), new { noteId },
            new ChoreBehaviourResponse(behaviour.Id, behaviour.LastCompleted, behaviour.NextDue));
    }

    /// <summary>
    /// Add a reminder behaviour to a note.
    /// </summary>
    [HttpPost("reminder")]
    public async Task<ActionResult<ReminderBehaviourResponse>> AddReminderBehaviour(
        Guid noteId,
        CreateReminderBehaviourRequest request)
    {
        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var existing = await dbContext.ReminderBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (existing != null)
            return Conflict("Note already has a reminder behaviour");

        var behaviour = new ReminderBehaviour
        {
            NoteId = noteId,
            NotificationSettingsJson = request.NotificationSettingsJson
        };

        dbContext.ReminderBehaviours.Add(behaviour);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBehaviours), new { noteId },
            new ReminderBehaviourResponse(behaviour.Id, behaviour.NotificationSettingsJson));
    }

    /// <summary>
    /// Get all behaviours for a note.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<BehaviourResponse>>> GetBehaviours(Guid noteId)
    {
        var note = await dbContext.Notes
            .Include(n => n.Behaviours)
            .FirstOrDefaultAsync(n => n.Id == noteId);

        if (note == null)
            return NotFound("Note not found");

        var behaviours = note.Behaviours.Select<Behaviour, BehaviourResponse>(b => b switch
        {
            TaskBehaviour tb => new TaskBehaviourResponse(tb.Id, tb.Status, tb.DueDate, tb.Priority, tb.CompletedAt),
            HabitBehaviour hb => new HabitBehaviourResponse(hb.Id, hb.FrequencyGoal, hb.CurrentStreak, hb.LongestStreak),
            ChoreBehaviour cb => new ChoreBehaviourResponse(cb.Id, cb.LastCompleted, cb.NextDue),
            ReminderBehaviour rb => new ReminderBehaviourResponse(rb.Id, rb.NotificationSettingsJson),
            _ => throw new InvalidOperationException($"Unknown behaviour type: {b.GetType().Name}")
        }).ToList();

        return Ok(behaviours);
    }

    /// <summary>
    /// Update a task behaviour.
    /// </summary>
    [HttpPut("task")]
    public async Task<ActionResult<TaskBehaviourResponse>> UpdateTaskBehaviour(
        Guid noteId,
        CreateTaskBehaviourRequest request)
    {
        var behaviour = await dbContext.TaskBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (behaviour == null)
            return NotFound("Task behaviour not found");

        behaviour.DueDate = request.DueDate;
        behaviour.Priority = request.Priority;

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new TaskBehaviourResponse(behaviour.Id, behaviour.Status, behaviour.DueDate, behaviour.Priority, behaviour.CompletedAt));
    }

    /// <summary>
    /// Mark a task as complete.
    /// </summary>
    [HttpPost("task/complete")]
    public async Task<ActionResult<TaskBehaviourResponse>> CompleteTask(Guid noteId)
    {
        var behaviour = await dbContext.TaskBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (behaviour == null)
            return NotFound("Task behaviour not found");

        behaviour.Status = Domain.Entities.TaskExecutionStatus.Complete;
        behaviour.CompletedAt = DateTime.UtcNow;

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        // Resolve any NoteBlockers that depend on this note
        var dependentBlockers = await dbContext.NoteBlockers
            .Where(b => b.TargetNoteId == noteId && b.IsActive)
            .ToListAsync();

        foreach (var blocker in dependentBlockers)
        {
            blocker.IsActive = false;
        }

        await dbContext.SaveChangesAsync();

        return Ok(new TaskBehaviourResponse(behaviour.Id, behaviour.Status, behaviour.DueDate, behaviour.Priority, behaviour.CompletedAt));
    }

    /// <summary>
    /// Reopen a completed task.
    /// </summary>
    [HttpPost("task/reopen")]
    public async Task<ActionResult<TaskBehaviourResponse>> ReopenTask(Guid noteId)
    {
        var behaviour = await dbContext.TaskBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (behaviour == null)
            return NotFound("Task behaviour not found");

        behaviour.Status = Domain.Entities.TaskExecutionStatus.Pending;
        behaviour.CompletedAt = null;

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new TaskBehaviourResponse(behaviour.Id, behaviour.Status, behaviour.DueDate, behaviour.Priority, behaviour.CompletedAt));
    }

    /// <summary>
    /// Log a habit completion.
    /// </summary>
    [HttpPost("habit/complete")]
    public async Task<ActionResult<HabitBehaviourResponse>> CompleteHabit(Guid noteId)
    {
        var behaviour = await dbContext.HabitBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (behaviour == null)
            return NotFound("Habit behaviour not found");

        // Parse completion history and add today
        var today = DateTime.UtcNow.Date;
        var history = System.Text.Json.JsonSerializer.Deserialize<List<DateTime>>(behaviour.CompletionHistoryJson) ?? [];

        // Check if already completed today
        if (!history.Any(d => d.Date == today))
        {
            history.Add(today);
            behaviour.CompletionHistoryJson = System.Text.Json.JsonSerializer.Serialize(history);

            // Update streak
            var yesterday = today.AddDays(-1);
            if (history.Any(d => d.Date == yesterday))
            {
                behaviour.CurrentStreak++;
            }
            else
            {
                behaviour.CurrentStreak = 1;
            }

            if (behaviour.CurrentStreak > behaviour.LongestStreak)
            {
                behaviour.LongestStreak = behaviour.CurrentStreak;
            }
        }

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new HabitBehaviourResponse(behaviour.Id, behaviour.FrequencyGoal, behaviour.CurrentStreak, behaviour.LongestStreak));
    }

    /// <summary>
    /// Mark a chore as complete and recalculate next due date.
    /// </summary>
    [HttpPost("chore/complete")]
    public async Task<ActionResult<ChoreBehaviourResponse>> CompleteChore(Guid noteId)
    {
        var behaviour = await dbContext.ChoreBehaviours
            .FirstOrDefaultAsync(b => b.NoteId == noteId);

        if (behaviour == null)
            return NotFound("Chore behaviour not found");

        behaviour.LastCompleted = DateTime.UtcNow;

        // Recalculate next due based on interval triggers
        var intervalTrigger = await dbContext.IntervalTriggers
            .FirstOrDefaultAsync(t => t.NoteId == noteId);

        if (intervalTrigger != null)
        {
            behaviour.NextDue = DateTime.UtcNow.AddDays(intervalTrigger.IntervalDays);
        }
        else
        {
            // Default to 7 days if no interval trigger
            behaviour.NextDue = DateTime.UtcNow.AddDays(7);
        }

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new ChoreBehaviourResponse(behaviour.Id, behaviour.LastCompleted, behaviour.NextDue));
    }

    /// <summary>
    /// Delete a behaviour by type.
    /// </summary>
    [HttpDelete("{behaviourType}")]
    public async Task<IActionResult> DeleteBehaviour(Guid noteId, string behaviourType)
    {
        Behaviour? behaviour = behaviourType.ToLowerInvariant() switch
        {
            "task" => await dbContext.TaskBehaviours.FirstOrDefaultAsync(b => b.NoteId == noteId),
            "habit" => await dbContext.HabitBehaviours.FirstOrDefaultAsync(b => b.NoteId == noteId),
            "chore" => await dbContext.ChoreBehaviours.FirstOrDefaultAsync(b => b.NoteId == noteId),
            "reminder" => await dbContext.ReminderBehaviours.FirstOrDefaultAsync(b => b.NoteId == noteId),
            _ => null
        };

        if (behaviour == null)
            return NotFound($"{behaviourType} behaviour not found");

        dbContext.Behaviours.Remove(behaviour);

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note != null) note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }
}
