using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

/// <summary>
/// Controller for Pomodoro timer functionality.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PomodoroController(
    YahatlDbContext dbContext,
    ICurrentUserService currentUserService,
    IStatePublisher statePublisher,
    ILogger<PomodoroController> logger) : ControllerBase
{
    /// <summary>
    /// Start a new Pomodoro session.
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<PomodoroSessionResponse>> StartSession([FromBody] StartPomodoroRequest request)
    {
        var userId = currentUserService.UserId;
        if (userId == null)
            return Unauthorized();

        // Check if there's already an active session
        var activeSession = await dbContext.PomodoroSessions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Status == PomodoroStatus.Active);

        if (activeSession != null)
            return Conflict(new { message = "A Pomodoro session is already active", sessionId = activeSession.Id });

        // Validate note if provided
        Note? note = null;
        if (request.NoteId.HasValue)
        {
            note = await dbContext.Notes.FindAsync(request.NoteId.Value);
            if (note == null)
                return NotFound($"Note {request.NoteId} not found");
        }

        var session = new PomodoroSession
        {
            UserId = userId.Value,
            NoteId = request.NoteId,
            DurationMinutes = request.DurationMinutes > 0 ? request.DurationMinutes : 25,
            StartedAt = DateTime.UtcNow,
            Status = PomodoroStatus.Active
        };

        dbContext.PomodoroSessions.Add(session);
        await dbContext.SaveChangesAsync();

        // Publish to MQTT
        await statePublisher.PublishPomodoroActiveAsync(true, note?.Title);

        logger.LogInformation("Started Pomodoro session {SessionId} for user {UserId}", session.Id, userId);

        return CreatedAtAction(nameof(GetCurrentSession), null, MapToResponse(session, note?.Title));
    }

    /// <summary>
    /// Stop the current active Pomodoro session.
    /// </summary>
    [HttpPost("stop")]
    public async Task<ActionResult<PomodoroSessionResponse>> StopSession([FromQuery] bool complete = true)
    {
        var userId = currentUserService.UserId;
        if (userId == null)
            return Unauthorized();

        var session = await dbContext.PomodoroSessions
            .Include(p => p.Note)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Status == PomodoroStatus.Active);

        if (session == null)
            return NotFound("No active Pomodoro session");

        session.Status = complete ? PomodoroStatus.Completed : PomodoroStatus.Cancelled;
        session.EndedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        // Publish to MQTT
        await statePublisher.PublishPomodoroActiveAsync(false);

        logger.LogInformation("Stopped Pomodoro session {SessionId} with status {Status}", session.Id, session.Status);

        return Ok(MapToResponse(session, session.Note?.Title));
    }

    /// <summary>
    /// Get the current active Pomodoro session.
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<PomodoroSessionResponse>> GetCurrentSession()
    {
        var userId = currentUserService.UserId;
        if (userId == null)
            return Unauthorized();

        var session = await dbContext.PomodoroSessions
            .Include(p => p.Note)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Status == PomodoroStatus.Active);

        if (session == null)
            return NotFound("No active Pomodoro session");

        return Ok(MapToResponse(session, session.Note?.Title));
    }

    /// <summary>
    /// Get Pomodoro session history for the current user.
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<List<PomodoroHistoryItemResponse>>> GetHistory(
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        [FromQuery] Guid? noteId = null)
    {
        var userId = currentUserService.UserId;
        if (userId == null)
            return Unauthorized();

        var query = dbContext.PomodoroSessions
            .Include(p => p.Note)
            .Where(p => p.UserId == userId)
            .Where(p => p.Status != PomodoroStatus.Active);

        if (noteId.HasValue)
            query = query.Where(p => p.NoteId == noteId);

        var sessions = await query
            .OrderByDescending(p => p.StartedAt)
            .Skip(offset)
            .Take(limit)
            .Select(p => new PomodoroHistoryItemResponse(
                p.Id,
                p.NoteId,
                p.Note != null ? p.Note.Title : null,
                p.StartedAt,
                p.DurationMinutes,
                p.Status,
                p.EndedAt
            ))
            .ToListAsync();

        return Ok(sessions);
    }

    /// <summary>
    /// Get Pomodoro stats for a specific note.
    /// </summary>
    [HttpGet("/api/notes/{noteId:guid}/pomodoro-stats")]
    public async Task<ActionResult<PomodoroStatsResponse>> GetNoteStats(Guid noteId)
    {
        var userId = currentUserService.UserId;
        if (userId == null)
            return Unauthorized();

        var note = await dbContext.Notes.FindAsync(noteId);
        if (note == null)
            return NotFound("Note not found");

        var sessions = await dbContext.PomodoroSessions
            .Where(p => p.UserId == userId && p.NoteId == noteId)
            .ToListAsync();

        var completedSessions = sessions.Where(s => s.Status == PomodoroStatus.Completed).ToList();
        var totalMinutes = completedSessions.Sum(s => s.DurationMinutes);
        var lastSession = sessions.OrderByDescending(s => s.StartedAt).FirstOrDefault();

        return Ok(new PomodoroStatsResponse(
            noteId,
            note.Title,
            sessions.Count,
            completedSessions.Count,
            totalMinutes,
            lastSession?.StartedAt
        ));
    }

    private static PomodoroSessionResponse MapToResponse(PomodoroSession session, string? noteTitle)
    {
        var now = DateTime.UtcNow;
        var elapsed = (int)(now - session.StartedAt).TotalMinutes;
        var remaining = Math.Max(0, session.DurationMinutes - elapsed);

        return new PomodoroSessionResponse(
            session.Id,
            session.UserId,
            session.NoteId,
            noteTitle,
            session.StartedAt,
            session.DurationMinutes,
            session.Status,
            session.EndedAt,
            elapsed,
            remaining
        );
    }
}
