using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class NotesController(
    YahatlDbContext dbContext,
    ICurrentUserService currentUserService) : ControllerBase
{
    /// <summary>
    /// Get all notes with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<NoteListItemResponse>>> GetNotes(
        [FromQuery] TemplateType? templateType = null,
        [FromQuery] string? tag = null,
        [FromQuery] bool? needsDetail = null,
        [FromQuery] bool? isInbox = null,
        [FromQuery] Guid? assigneeId = null,
        [FromQuery] string? search = null,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        var query = dbContext.Notes
            .Include(n => n.Tags)
            .AsQueryable();

        if (templateType.HasValue)
            query = query.Where(n => n.TemplateType == templateType.Value);

        if (!string.IsNullOrEmpty(tag))
            query = query.Where(n => n.Tags.Any(t => t.Name == tag));

        if (needsDetail.HasValue)
            query = query.Where(n => n.NeedsDetail == needsDetail.Value);

        // isInbox is equivalent to needsDetail == true
        if (isInbox == true)
            query = query.Where(n => n.NeedsDetail);

        if (assigneeId.HasValue)
            query = query.Where(n => n.AssigneeId == assigneeId.Value);

        // Simple search on title and body
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(n =>
                n.Title.ToLower().Contains(searchLower) ||
                (n.Body != null && n.Body.ToLower().Contains(searchLower)) ||
                n.Tags.Any(t => t.Name.ToLower().Contains(searchLower)));
        }

        var totalCount = await query.CountAsync();

        var notes = await query
            .OrderByDescending(n => n.UpdatedAt)
            .Skip(offset)
            .Take(limit)
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

        return Ok(new PaginatedResponse<NoteListItemResponse>(notes, totalCount, limit, offset));
    }

    /// <summary>
    /// Get a single note with all details including behaviours, triggers, and blockers.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NoteResponse>> GetNote(Guid id)
    {
        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .Include(n => n.LinksFrom).ThenInclude(l => l.TargetNote)
            .Include(n => n.LinksTo).ThenInclude(l => l.SourceNote)
            .Include(n => n.Behaviours)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound();

        var behaviours = note.Behaviours.Select<Behaviour, BehaviourResponse>(b => b switch
        {
            TaskBehaviour tb => new TaskBehaviourResponse(tb.Id, tb.Status, tb.DueDate, tb.Priority, tb.CompletedAt),
            HabitBehaviour hb => new HabitBehaviourResponse(hb.Id, hb.FrequencyGoal, hb.CurrentStreak, hb.LongestStreak),
            ChoreBehaviour cb => new ChoreBehaviourResponse(cb.Id, cb.LastCompleted, cb.NextDue),
            ReminderBehaviour rb => new ReminderBehaviourResponse(rb.Id, rb.NotificationSettingsJson),
            _ => throw new InvalidOperationException($"Unknown behaviour type: {b.GetType().Name}")
        }).ToList();

        var response = new NoteResponse(
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

        return Ok(response);
    }

    /// <summary>
    /// Create a new note.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<NoteResponse>> CreateNote(CreateNoteRequest request)
    {
        var userId = currentUserService.UserId;
        var householdId = currentUserService.HouseholdId;

        if (userId == null || householdId == null)
            return Unauthorized();

        var note = new Note
        {
            Title = request.Title,
            Body = request.Body,
            TemplateType = request.TemplateType,
            OwnerId = userId.Value,
            AssigneeId = request.AssigneeId,
            HouseholdId = householdId.Value,
            NeedsDetail = request.NeedsDetail,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Handle tags
        if (request.Tags != null && request.Tags.Count > 0)
        {
            foreach (var tagName in request.Tags)
            {
                var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                    ?? new Tag { Name = tagName, HouseholdId = householdId.Value };

                note.Tags.Add(tag);
            }
        }

        dbContext.Notes.Add(note);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNote), new { id = note.Id }, await GetNoteResponseAsync(note.Id));
    }

    /// <summary>
    /// Update an existing note.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NoteResponse>> UpdateNote(Guid id, UpdateNoteRequest request)
    {
        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound();

        note.Title = request.Title;
        note.Body = request.Body;
        note.TemplateType = request.TemplateType;
        note.AssigneeId = request.AssigneeId;
        note.NeedsDetail = request.NeedsDetail;
        note.UpdatedAt = DateTime.UtcNow;

        // Update tags
        if (request.Tags != null)
        {
            note.Tags.Clear();
            foreach (var tagName in request.Tags)
            {
                var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                    ?? new Tag { Name = tagName, HouseholdId = note.HouseholdId };

                note.Tags.Add(tag);
            }
        }

        await dbContext.SaveChangesAsync();

        return Ok(await GetNoteResponseAsync(note.Id));
    }

    /// <summary>
    /// Archive (soft delete) a note.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNote(Guid id)
    {
        var note = await dbContext.Notes.FindAsync(id);

        if (note == null)
            return NotFound();

        note.IsArchived = true;
        note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Link two notes together.
    /// </summary>
    [HttpPost("{id:guid}/link/{targetId:guid}")]
    public async Task<IActionResult> LinkNotes(Guid id, Guid targetId)
    {
        var sourceNote = await dbContext.Notes.FindAsync(id);
        var targetNote = await dbContext.Notes.FindAsync(targetId);

        if (sourceNote == null || targetNote == null)
            return NotFound();

        // Check if link already exists
        var existingLink = await dbContext.NoteLinks
            .FirstOrDefaultAsync(l => l.SourceNoteId == id && l.TargetNoteId == targetId);

        if (existingLink != null)
            return Conflict("Link already exists");

        var link = new NoteLink
        {
            SourceNoteId = id,
            TargetNoteId = targetId
        };

        dbContext.NoteLinks.Add(link);
        await dbContext.SaveChangesAsync();

        return Created($"/notes/{id}/link/{targetId}", null);
    }

    /// <summary>
    /// Remove a link between two notes.
    /// </summary>
    [HttpDelete("{id:guid}/link/{targetId:guid}")]
    public async Task<IActionResult> UnlinkNotes(Guid id, Guid targetId)
    {
        var link = await dbContext.NoteLinks
            .FirstOrDefaultAsync(l => l.SourceNoteId == id && l.TargetNoteId == targetId);

        if (link == null)
            return NotFound();

        dbContext.NoteLinks.Remove(link);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Mark a task as complete.
    /// </summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteTask(Guid id)
    {
        var note = await dbContext.Notes
            .Include(n => n.Behaviours)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound();

        var taskBehaviour = note.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
        if (taskBehaviour == null)
            return BadRequest("Note does not have a task behaviour");

        taskBehaviour.Status = Domain.Entities.TaskStatus.Complete;
        taskBehaviour.CompletedAt = DateTime.UtcNow;
        note.UpdatedAt = DateTime.UtcNow;

        // Also check for any NoteBlockers that target this note and resolve them
        var dependentBlockers = await dbContext.NoteBlockers
            .Where(b => b.TargetNoteId == id && b.IsActive)
            .ToListAsync();

        foreach (var blocker in dependentBlockers)
        {
            blocker.IsActive = false;
        }

        await dbContext.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Quick capture - creates a note in inbox state.
    /// </summary>
    [HttpPost("capture")]
    public async Task<ActionResult<NoteListItemResponse>> QuickCapture(QuickCaptureRequest request)
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
                var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                    ?? new Tag { Name = tagName, HouseholdId = householdId.Value };

                note.Tags.Add(tag);
            }
        }

        dbContext.Notes.Add(note);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNote), new { id = note.Id },
            new NoteListItemResponse(
                note.Id,
                note.Title,
                note.TemplateType,
                note.OwnerId,
                note.AssigneeId,
                note.IsInbox,
                note.NeedsDetail,
                note.CreatedAt,
                note.UpdatedAt,
                note.Tags.Select(t => t.Name).ToList()
            ));
    }

    /// <summary>
    /// Get inbox items (notes needing triage).
    /// </summary>
    [HttpGet("inbox")]
    public async Task<ActionResult<List<NoteListItemResponse>>> GetInbox()
    {
        var notes = await dbContext.Notes
            .Include(n => n.Tags)
            .Where(n => n.IsInbox)
            .OrderByDescending(n => n.CreatedAt)
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

    /// <summary>
    /// Add tags to a note.
    /// </summary>
    [HttpPost("{id:guid}/tags")]
    public async Task<ActionResult<List<string>>> AddTags(Guid id, [FromBody] AddTagsRequest request)
    {
        var householdId = currentUserService.HouseholdId;
        if (householdId == null)
            return Unauthorized();

        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound();

        foreach (var tagName in request.Tags)
        {
            if (note.Tags.Any(t => t.Name == tagName))
                continue; // Already has this tag

            var tag = await dbContext.Tags.FirstOrDefaultAsync(t => t.Name == tagName && t.HouseholdId == householdId)
                ?? new Tag { Name = tagName, HouseholdId = householdId.Value };

            note.Tags.Add(tag);
        }

        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(note.Tags.Select(t => t.Name).ToList());
    }

    /// <summary>
    /// Remove a tag from a note.
    /// </summary>
    [HttpDelete("{id:guid}/tags/{tagName}")]
    public async Task<IActionResult> RemoveTag(Guid id, string tagName)
    {
        var note = await dbContext.Notes
            .Include(n => n.Tags)
            .FirstOrDefaultAsync(n => n.Id == id);

        if (note == null)
            return NotFound();

        var tag = note.Tags.FirstOrDefault(t => t.Name == tagName);
        if (tag == null)
            return NotFound("Tag not found on note");

        note.Tags.Remove(tag);
        note.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Toggle the NeedsDetail flag on a note.
    /// </summary>
    [HttpPost("{id:guid}/needs-detail")]
    public async Task<ActionResult<NeedsDetailResponse>> ToggleNeedsDetail(Guid id, [FromBody] ToggleNeedsDetailRequest? request = null)
    {
        var note = await dbContext.Notes.FindAsync(id);

        if (note == null)
            return NotFound();

        // If a value is provided, set it; otherwise toggle
        note.NeedsDetail = request?.NeedsDetail ?? !note.NeedsDetail;
        note.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(new NeedsDetailResponse(note.Id, note.NeedsDetail));
    }

    private async Task<NoteResponse> GetNoteResponseAsync(Guid id)
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
