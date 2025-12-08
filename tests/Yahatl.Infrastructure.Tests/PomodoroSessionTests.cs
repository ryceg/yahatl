using Xunit;
using Yahatl.Domain.Entities;

namespace Yahatl.Infrastructure.Tests;

public class PomodoroSessionTests
{
    // ==================== SESSION CREATION TESTS ====================

    [Fact]
    public void NewSession_HasDefaultValues()
    {
        // Arrange & Act
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid()
        };

        // Assert
        Assert.NotEqual(Guid.Empty, session.Id);
        Assert.Equal(25, session.DurationMinutes);
        Assert.Equal(PomodoroStatus.Active, session.Status);
        Assert.Null(session.NoteId);
        Assert.Null(session.EndedAt);
    }

    [Fact]
    public void NewSession_WithCustomDuration_StoresDuration()
    {
        // Arrange & Act
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            DurationMinutes = 50
        };

        // Assert
        Assert.Equal(50, session.DurationMinutes);
    }

    [Fact]
    public void NewSession_WithNoteId_StoresNoteId()
    {
        // Arrange
        var noteId = Guid.NewGuid();

        // Act
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            NoteId = noteId
        };

        // Assert
        Assert.Equal(noteId, session.NoteId);
    }

    // ==================== STATUS TRANSITION TESTS ====================

    [Fact]
    public void Session_CanBeCompleted()
    {
        // Arrange
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            Status = PomodoroStatus.Active
        };

        // Act
        session.Status = PomodoroStatus.Completed;
        session.EndedAt = DateTime.UtcNow;

        // Assert
        Assert.Equal(PomodoroStatus.Completed, session.Status);
        Assert.NotNull(session.EndedAt);
    }

    [Fact]
    public void Session_CanBeCancelled()
    {
        // Arrange
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            Status = PomodoroStatus.Active
        };

        // Act
        session.Status = PomodoroStatus.Cancelled;
        session.EndedAt = DateTime.UtcNow;

        // Assert
        Assert.Equal(PomodoroStatus.Cancelled, session.Status);
        Assert.NotNull(session.EndedAt);
    }

    // ==================== ELAPSED/REMAINING CALCULATION TESTS ====================

    [Fact]
    public void CalculateElapsedMinutes_ForActiveSession()
    {
        // Arrange
        var startedAt = DateTime.UtcNow.AddMinutes(-10);
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            StartedAt = startedAt,
            DurationMinutes = 25
        };

        // Act
        var elapsed = (int)(DateTime.UtcNow - session.StartedAt).TotalMinutes;
        var remaining = Math.Max(0, session.DurationMinutes - elapsed);

        // Assert
        Assert.True(elapsed >= 9 && elapsed <= 11); // Allow some variance
        Assert.True(remaining >= 14 && remaining <= 16);
    }

    [Fact]
    public void CalculateRemainingMinutes_SessionOverdue()
    {
        // Arrange - Session started 30 minutes ago but was only 25 minutes
        var startedAt = DateTime.UtcNow.AddMinutes(-30);
        var session = new PomodoroSession
        {
            UserId = Guid.NewGuid(),
            StartedAt = startedAt,
            DurationMinutes = 25
        };

        // Act
        var elapsed = (int)(DateTime.UtcNow - session.StartedAt).TotalMinutes;
        var remaining = Math.Max(0, session.DurationMinutes - elapsed);

        // Assert
        Assert.True(elapsed >= 29); // At least 29 minutes elapsed
        Assert.Equal(0, remaining); // No time remaining (overdue)
    }

    // ==================== POMODORO STATUS ENUM TESTS ====================

    [Fact]
    public void PomodoroStatus_HasExpectedValues()
    {
        // Assert
        Assert.Equal(0, (int)PomodoroStatus.Active);
        Assert.Equal(1, (int)PomodoroStatus.Completed);
        Assert.Equal(2, (int)PomodoroStatus.Cancelled);
    }
}
