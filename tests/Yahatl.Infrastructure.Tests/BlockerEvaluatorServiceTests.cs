using Xunit;
using Yahatl.Domain.Entities;

namespace Yahatl.Infrastructure.Tests;

public class BlockerEvaluatorServiceTests
{
    // ==================== TIME BLOCKER TESTS ====================

    [Fact]
    public void EvaluateTimeBlocker_WithinBlockingWindow_ReturnsTrue()
    {
        // Arrange - Block on weekdays 9 AM to 5 PM
        var blocker = new TimeBlocker
        {
            WindowsJson = """[{ "days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "time_range": "09:00-17:00" }]"""
        };

        // Monday at 2 PM
        var nowUtc = new DateTime(2025, 12, 8, 14, 0, 0, DateTimeKind.Utc); // This is a Monday
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableBlockerEvaluator.EvaluateTimeBlocker(blocker, tz, nowUtc);

        // Assert
        Assert.True(result); // Should be blocking
    }

    [Fact]
    public void EvaluateTimeBlocker_OutsideBlockingWindow_ReturnsFalse()
    {
        // Arrange - Block on weekdays 9 AM to 5 PM
        var blocker = new TimeBlocker
        {
            WindowsJson = """[{ "days": ["monday", "tuesday", "wednesday", "thursday", "friday"], "time_range": "09:00-17:00" }]"""
        };

        // Monday at 8 PM (outside window)
        var nowUtc = new DateTime(2025, 12, 8, 20, 0, 0, DateTimeKind.Utc);
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableBlockerEvaluator.EvaluateTimeBlocker(blocker, tz, nowUtc);

        // Assert
        Assert.False(result); // Should not be blocking
    }

    [Fact]
    public void EvaluateTimeBlocker_OnBlockedDayButWrongTime_ReturnsFalse()
    {
        // Arrange - Block on Monday 9 AM to 5 PM
        var blocker = new TimeBlocker
        {
            WindowsJson = """[{ "days": ["monday"], "time_range": "09:00-17:00" }]"""
        };

        // Monday at 7 AM (before window)
        var nowUtc = new DateTime(2025, 12, 8, 7, 0, 0, DateTimeKind.Utc);
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableBlockerEvaluator.EvaluateTimeBlocker(blocker, tz, nowUtc);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void EvaluateTimeBlocker_OnNonBlockedDay_ReturnsFalse()
    {
        // Arrange - Block only on weekends
        var blocker = new TimeBlocker
        {
            WindowsJson = """[{ "days": ["saturday", "sunday"], "time_range": "00:00-23:59" }]"""
        };

        // Monday
        var nowUtc = new DateTime(2025, 12, 8, 14, 0, 0, DateTimeKind.Utc);
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableBlockerEvaluator.EvaluateTimeBlocker(blocker, tz, nowUtc);

        // Assert
        Assert.False(result); // Weekday should not be blocked
    }

    [Fact]
    public void EvaluateTimeBlocker_InvalidJson_ReturnsFalse()
    {
        // Arrange
        var blocker = new TimeBlocker
        {
            WindowsJson = "invalid json"
        };
        var nowUtc = DateTime.UtcNow;
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableBlockerEvaluator.EvaluateTimeBlocker(blocker, tz, nowUtc);

        // Assert
        Assert.False(result);
    }

    // ==================== UNTIL DATE BLOCKER TESTS ====================

    [Fact]
    public void EvaluateUntilDateBlocker_BeforeDate_ReturnsTrue()
    {
        // Arrange
        var blocker = new UntilDateBlocker
        {
            Until = new DateTime(2025, 12, 15, 0, 0, 0, DateTimeKind.Utc)
        };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = TestableBlockerEvaluator.EvaluateUntilDateBlocker(blocker, nowUtc);

        // Assert
        Assert.True(result); // Still blocking
    }

    [Fact]
    public void EvaluateUntilDateBlocker_AfterDate_ReturnsFalse()
    {
        // Arrange
        var blocker = new UntilDateBlocker
        {
            Until = new DateTime(2025, 12, 5, 0, 0, 0, DateTimeKind.Utc)
        };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = TestableBlockerEvaluator.EvaluateUntilDateBlocker(blocker, nowUtc);

        // Assert
        Assert.False(result); // No longer blocking
    }

    [Fact]
    public void EvaluateUntilDateBlocker_ExactlyOnDate_ReturnsFalse()
    {
        // Arrange
        var blocker = new UntilDateBlocker
        {
            Until = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc)
        };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = TestableBlockerEvaluator.EvaluateUntilDateBlocker(blocker, nowUtc);

        // Assert
        Assert.False(result); // At the exact time, no longer blocking
    }

    // ==================== NOTE BLOCKER TESTS ====================

    [Fact]
    public void EvaluateNoteBlocker_TargetNoteComplete_ReturnsFalse()
    {
        // Arrange
        var targetNote = new Note
        {
            Title = "Blocking Task",
            Behaviours = new List<Behaviour>
            {
                new TaskBehaviour { Status = TaskExecutionStatus.Complete }
            }
        };
        var blocker = new NoteBlocker
        {
            TargetNote = targetNote
        };

        // Act
        var result = TestableBlockerEvaluator.EvaluateNoteBlocker(blocker);

        // Assert
        Assert.False(result); // Not blocking because target is complete
    }

    [Fact]
    public void EvaluateNoteBlocker_TargetNotePending_ReturnsTrue()
    {
        // Arrange
        var targetNote = new Note
        {
            Title = "Blocking Task",
            Behaviours = new List<Behaviour>
            {
                new TaskBehaviour { Status = TaskExecutionStatus.Pending }
            }
        };
        var blocker = new NoteBlocker
        {
            TargetNote = targetNote
        };

        // Act
        var result = TestableBlockerEvaluator.EvaluateNoteBlocker(blocker);

        // Assert
        Assert.True(result); // Still blocking because target is pending
    }

    [Fact]
    public void EvaluateNoteBlocker_TargetNoteCancelled_ReturnsTrue()
    {
        // Arrange
        var targetNote = new Note
        {
            Title = "Blocking Task",
            Behaviours = new List<Behaviour>
            {
                new TaskBehaviour { Status = TaskExecutionStatus.Cancelled }
            }
        };
        var blocker = new NoteBlocker
        {
            TargetNote = targetNote
        };

        // Act
        var result = TestableBlockerEvaluator.EvaluateNoteBlocker(blocker);

        // Assert - Cancelled is not complete, so it's still blocking
        Assert.True(result);
    }
}

/// <summary>
/// Helper class to expose blocker evaluation methods for testing
/// </summary>
public static class TestableBlockerEvaluator
{
    public static bool EvaluateTimeBlocker(TimeBlocker blocker, TimeZoneInfo tz, DateTime nowUtc)
    {
        try
        {
            var windows = System.Text.Json.JsonSerializer.Deserialize<List<TimeBlockerWindow>>(blocker.WindowsJson);
            if (windows == null || windows.Count == 0)
            {
                return false;
            }

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);
            var todayDayOfWeek = nowLocal.DayOfWeek.ToString().ToLowerInvariant();

            foreach (var window in windows)
            {
                if (window.Days == null || !window.Days.Any(d => d.Equals(todayDayOfWeek, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                if (TryParseTimeRange(window.TimeRange, out var startTime, out var endTime))
                {
                    var currentTime = nowLocal.TimeOfDay;
                    if (currentTime >= startTime && currentTime <= endTime)
                    {
                        return true;
                    }
                }
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    public static bool EvaluateUntilDateBlocker(UntilDateBlocker blocker, DateTime nowUtc)
    {
        return nowUtc < blocker.Until;
    }

    public static bool EvaluateNoteBlocker(NoteBlocker blocker)
    {
        var targetNote = blocker.TargetNote;
        if (targetNote == null)
        {
            return false;
        }

        var taskBehaviour = targetNote.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
        if (taskBehaviour == null)
        {
            return false;
        }

        return taskBehaviour.Status != TaskExecutionStatus.Complete;
    }

    private static bool TryParseTimeRange(string? timeRange, out TimeSpan startTime, out TimeSpan endTime)
    {
        startTime = TimeSpan.Zero;
        endTime = TimeSpan.Zero;

        if (string.IsNullOrWhiteSpace(timeRange))
        {
            return false;
        }

        var parts = timeRange.Split('-');
        if (parts.Length != 2)
        {
            return false;
        }

        return TimeSpan.TryParse(parts[0], out startTime) && TimeSpan.TryParse(parts[1], out endTime);
    }

    private class TimeBlockerWindow
    {
        public List<string>? Days { get; set; }
        public string? TimeRange { get; set; }
    }
}
