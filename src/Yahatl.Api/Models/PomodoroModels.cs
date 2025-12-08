using System.ComponentModel.DataAnnotations;
using Yahatl.Domain.Entities;

namespace Yahatl.Api.Models;

// ==================== POMODORO REQUEST DTOs ====================

/// <summary>
/// Request to start a new Pomodoro session.
/// </summary>
public record StartPomodoroRequest(
    Guid? NoteId = null,
    int DurationMinutes = 25
);

// ==================== POMODORO RESPONSE DTOs ====================

/// <summary>
/// Response for a Pomodoro session.
/// </summary>
public record PomodoroSessionResponse(
    Guid Id,
    Guid UserId,
    Guid? NoteId,
    string? NoteTitle,
    DateTime StartedAt,
    int DurationMinutes,
    PomodoroStatus Status,
    DateTime? EndedAt,
    int ElapsedMinutes,
    int RemainingMinutes
);

/// <summary>
/// Response for Pomodoro history list item.
/// </summary>
public record PomodoroHistoryItemResponse(
    Guid Id,
    Guid? NoteId,
    string? NoteTitle,
    DateTime StartedAt,
    int DurationMinutes,
    PomodoroStatus Status,
    DateTime? EndedAt
);

/// <summary>
/// Response for Pomodoro stats on a note.
/// </summary>
public record PomodoroStatsResponse(
    Guid NoteId,
    string NoteTitle,
    int TotalSessions,
    int CompletedSessions,
    int TotalMinutesFocused,
    DateTime? LastSessionAt
);
