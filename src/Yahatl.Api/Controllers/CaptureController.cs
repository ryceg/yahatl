using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

/// <summary>
/// Controller for quick capture and inbox processing.
/// </summary>
[ApiController]
[Route("api")]
[Authorize]
public class CaptureController(
    YahatlDbContext dbContext,
    ICurrentUserService currentUserService,
    ILogger<CaptureController> logger) : ControllerBase
{
    /// <summary>
    /// Quick capture - creates a note in inbox state.
    /// </summary>
    [HttpPost("capture")]
    public async Task<ActionResult<CaptureResponse>> Capture([FromBody] CaptureRequest request)
    {
        var userId = currentUserService.UserId;
        var householdId = currentUserService.HouseholdId;

        if (userId == null || householdId == null)
            return Unauthorized();

        var note = new Note
        {
            Title = request.Title,
            OwnerId = userId.Value,
            HouseholdId = householdId.Value,
            IsInbox = true,
            NeedsDetail = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (request.Tags != null && request.Tags.Count > 0)
        {
            foreach (var tagName in request.Tags)
            {
                var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName && t.HouseholdId == householdId)
                    ?? new Tag { Name = tagName, HouseholdId = householdId.Value };

                note.Tags.Add(tag);
            }
        }

        dbContext.Notes.Add(note);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Captured note {NoteId} to inbox", note.Id);

        return CreatedAtAction(nameof(GetInbox), null, new CaptureResponse(note.Id, note.Title));
    }

    /// <summary>
    /// Get all inbox items (notes awaiting triage).
    /// </summary>
    [HttpGet("inbox")]
    public async Task<ActionResult<List<InboxItemResponse>>> GetInbox()
    {
        var notes = await dbContext.Notes
            .Include(n => n.Tags)
            .Where(n => n.IsInbox)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new InboxItemResponse(
                n.Id,
                n.Title,
                n.CreatedAt,
                n.Tags.Select(t => t.Name).ToList()
            ))
            .ToListAsync();

        return Ok(notes);
    }

    /// <summary>
    /// Process an inbox item - mark as not inbox and optionally add details.
    /// </summary>
    [HttpPost("inbox/{id:guid}/process")]
    public async Task<ActionResult<NoteResponse>> ProcessInboxItem(Guid id, [FromBody] ProcessInboxRequest request)
    {
        var householdId = currentUserService.HouseholdId;
        if (householdId == null)
            return Unauthorized();

        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .Include(n => n.Behaviours)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound("Note not found");

        if (!note.IsInbox)
            return BadRequest("Note is not in inbox");

        // Update basic fields
        note.IsInbox = false;
        note.UpdatedAt = DateTime.UtcNow;

        if (request.Title != null)
            note.Title = request.Title;

        if (request.Body != null)
            note.Body = request.Body;

        if (request.TemplateType.HasValue)
            note.TemplateType = request.TemplateType.Value;

        if (request.NeedsDetail.HasValue)
            note.NeedsDetail = request.NeedsDetail.Value;

        // Update tags if provided
        if (request.Tags != null)
        {
            note.Tags.Clear();
            foreach (var tagName in request.Tags)
            {
                var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName && t.HouseholdId == householdId)
                    ?? new Tag { Name = tagName, HouseholdId = householdId.Value };
                note.Tags.Add(tag);
            }
        }

        // Add behaviours if requested
        if (request.AddTaskBehaviour == true)
        {
            var existingTask = note.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
            if (existingTask == null)
            {
                note.Behaviours.Add(new TaskBehaviour
                {
                    NoteId = note.Id,
                    Status = Domain.Entities.TaskStatus.Pending,
                    Priority = request.TaskPriority ?? Priority.Normal,
                    DueDate = request.TaskDueDate
                });
            }
        }

        if (request.AddHabitBehaviour == true)
        {
            var existingHabit = note.Behaviours.OfType<HabitBehaviour>().FirstOrDefault();
            if (existingHabit == null)
            {
                note.Behaviours.Add(new HabitBehaviour
                {
                    NoteId = note.Id,
                    FrequencyGoal = request.HabitFrequencyGoal ?? "daily"
                });
            }
        }

        if (request.AddChoreBehaviour == true)
        {
            var existingChore = note.Behaviours.OfType<ChoreBehaviour>().FirstOrDefault();
            if (existingChore == null)
            {
                note.Behaviours.Add(new ChoreBehaviour
                {
                    NoteId = note.Id,
                    NextDue = request.ChoreNextDue ?? DateTime.UtcNow
                });
            }
        }

        await dbContext.SaveChangesAsync();

        logger.LogInformation("Processed inbox item {NoteId}", note.Id);

        // Return updated note
        return Ok(await GetFullNoteResponseAsync(note.Id));
    }

    /// <summary>
    /// Get notes that need more detail (have been triaged but need enrichment).
    /// </summary>
    [HttpGet("needs-detail")]
    public async Task<ActionResult<List<NoteListItemResponse>>> GetNeedsDetail()
    {
        var notes = await dbContext.Notes
            .Include(n => n.Tags)
            .Where(n => n.NeedsDetail && !n.IsInbox)
            .OrderByDescending(n => n.UpdatedAt)
            .Select(n => new NoteListItemResponse(
                n.Id,
                n.Title,
                n.TemplateType,
                n.OwnerId,
                n.AssigneeId,
                n.IsInbox,
                n.NeedsDetail,
                n.CreatedAt,
                n.UpdatedAt,
                n.Tags.Select(t => t.Name).ToList()
            ))
            .ToListAsync();

        return Ok(notes);
    }

    private async Task<NoteResponse> GetFullNoteResponseAsync(Guid id)
    {
        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .Include(n => n.LinksFrom).ThenInclude(l => l.TargetNote)
            .Include(n => n.LinksTo).ThenInclude(l => l.SourceNote)
            .Include(n => n.Behaviours)
            .FirstAsync(n => n.Id == id);

        var behaviours = note.Behaviours.Select<Behaviour, BehaviourResponse>(b => b switch
        {
            TaskBehaviour tb => new TaskBehaviourResponse(tb.Id, tb.Status, tb.DueDate, tb.Priority, tb.CompletedAt),
            HabitBehaviour hb => new HabitBehaviourResponse(hb.Id, hb.FrequencyGoal, hb.CurrentStreak, hb.LongestStreak),
            ChoreBehaviour cb => new ChoreBehaviourResponse(cb.Id, cb.LastCompleted, cb.NextDue),
            ReminderBehaviour rb => new ReminderBehaviourResponse(rb.Id, rb.NotificationSettingsJson),
            _ => throw new InvalidOperationException($"Unknown behaviour type: {b.GetType().Name}")
        }).ToList();

        return new NoteResponse(
            note.Id,
            note.Title,
            note.Body,
            note.TemplateType,
            note.OwnerId,
            note.AssigneeId,
            note.HouseholdId,
            note.IsArchived,
            note.IsInbox,
            note.NeedsDetail,
            note.CreatedAt,
            note.UpdatedAt,
            note.Tags.Select(t => t.Name).ToList(),
            note.LinksFrom.Select(l => new NoteLinkResponse(l.Id, l.TargetNoteId, l.TargetNote?.Title ?? "")).ToList(),
            note.LinksTo.Select(l => new NoteLinkResponse(l.Id, l.SourceNoteId, l.SourceNote?.Title ?? "")).ToList(),
            behaviours
        );
    }
}

// ==================== CAPTURE DTOs ====================

/// <summary>
/// Request for quick capturing a note.
/// </summary>
public record CaptureRequest(
    string Title,
    List<string>? Tags = null
);

/// <summary>
/// Response after capturing a note.
/// </summary>
public record CaptureResponse(
    Guid Id,
    string Title
);

/// <summary>
/// Inbox item response.
/// </summary>
public record InboxItemResponse(
    Guid Id,
    string Title,
    DateTime CreatedAt,
    List<string> Tags
);

/// <summary>
/// Request to process an inbox item.
/// </summary>
public record ProcessInboxRequest(
    string? Title = null,
    string? Body = null,
    TemplateType? TemplateType = null,
    List<string>? Tags = null,
    bool? NeedsDetail = null,
    bool? AddTaskBehaviour = null,
    Priority? TaskPriority = null,
    DateTime? TaskDueDate = null,
    bool? AddHabitBehaviour = null,
    string? HabitFrequencyGoal = null,
    bool? AddChoreBehaviour = null,
    DateTime? ChoreNextDue = null
);
