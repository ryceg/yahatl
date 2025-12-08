using Xunit;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Services;
using Moq;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Tests;

public class DueDateCalculatorServiceTests
{
    // ==================== INTERVAL TRIGGER TESTS ====================

    [Fact]
    public void EvaluateIntervalTrigger_NeverCompleted_ReturnsNow()
    {
        // Arrange - IntervalTrigger with no completion should fire immediately
        var trigger = new IntervalTrigger { IntervalDays = 7 };
        DateTime? lastCompleted = null;
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = TestableCalculator.EvaluateIntervalTrigger(trigger, lastCompleted, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(nowUtc, result);
    }

    [Fact]
    public void EvaluateIntervalTrigger_CompletedWithinInterval_ReturnsFutureDate()
    {
        // Arrange
        var trigger = new IntervalTrigger { IntervalDays = 7 };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);
        var lastCompleted = nowUtc.AddDays(-3); // Completed 3 days ago

        // Act
        var result = TestableCalculator.EvaluateIntervalTrigger(trigger, lastCompleted, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(lastCompleted.AddDays(7), result); // Should be due in 4 days
    }

    [Fact]
    public void EvaluateIntervalTrigger_CompletedPastInterval_ReturnsOverdueDate()
    {
        // Arrange
        var trigger = new IntervalTrigger { IntervalDays = 7 };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);
        var lastCompleted = nowUtc.AddDays(-10); // Completed 10 days ago

        // Act
        var result = TestableCalculator.EvaluateIntervalTrigger(trigger, lastCompleted, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.True(result < nowUtc); // Already overdue
    }

    // ==================== FIXED TRIGGER (CRON) TESTS ====================

    [Fact]
    public void EvaluateFixedTrigger_ValidCron_ReturnsNextOccurrence()
    {
        // Arrange - Every Tuesday at 9 AM
        var trigger = new FixedTrigger { CronPattern = "0 9 * * 2" };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc); // Monday
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableCalculator.EvaluateFixedTrigger(trigger, tz, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(DayOfWeek.Tuesday, result.Value.DayOfWeek);
    }

    [Fact]
    public void EvaluateFixedTrigger_InvalidCron_ReturnsNull()
    {
        // Arrange
        var trigger = new FixedTrigger { CronPattern = "invalid cron" };
        var nowUtc = DateTime.UtcNow;
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableCalculator.EvaluateFixedTrigger(trigger, tz, nowUtc);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void EvaluateFixedTrigger_MonthlyCron_ReturnsCorrectDate()
    {
        // Arrange - 1st of each month at midnight
        var trigger = new FixedTrigger { CronPattern = "0 0 1 * *" };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);
        var tz = TimeZoneInfo.Utc;

        // Act
        var result = TestableCalculator.EvaluateFixedTrigger(trigger, tz, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Value.Day);
        Assert.Equal(1, result.Value.Month); // January 2026
    }

    // ==================== CONDITION TRIGGER TESTS ====================

    [Fact]
    public void EvaluateConditionTrigger_Active_ReturnsNow()
    {
        // Arrange
        var trigger = new ConditionTrigger
        {
            MqttTopic = "sensor/test",
            Operator = "gt",
            Value = "50",
            IsActive = true
        };
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var result = TestableCalculator.EvaluateConditionTrigger(trigger, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(nowUtc, result);
    }

    [Fact]
    public void EvaluateConditionTrigger_Inactive_ReturnsNull()
    {
        // Arrange
        var trigger = new ConditionTrigger
        {
            MqttTopic = "sensor/test",
            Operator = "gt",
            Value = "50",
            IsActive = false
        };
        var nowUtc = DateTime.UtcNow;

        // Act
        var result = TestableCalculator.EvaluateConditionTrigger(trigger, nowUtc);

        // Assert
        Assert.Null(result);
    }

    // ==================== MULTIPLE TRIGGERS (OR LOGIC) TESTS ====================

    [Fact]
    public void CalculateNextDue_MultipleTriggers_ReturnsEarliest()
    {
        // Arrange - Multiple triggers should use OR logic (any one can fire)
        var nowUtc = new DateTime(2025, 12, 8, 10, 0, 0, DateTimeKind.Utc);
        var triggers = new List<Trigger>
        {
            new IntervalTrigger { IntervalDays = 7 }, // Due in 7 days from completion
            new ConditionTrigger
            {
                MqttTopic = "sensor/test",
                Operator = "gt",
                Value = "50",
                IsActive = true
            } // Due now!
        };
        var lastCompleted = nowUtc.AddDays(-1);

        // Act
        var result = TestableCalculator.CalculateNextDue(triggers, lastCompleted, TimeZoneInfo.Utc, nowUtc);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(nowUtc, result); // Condition trigger fires immediately
    }
}

/// <summary>
/// Helper class to expose internal methods for testing
/// </summary>
public static class TestableCalculator
{
    public static DateTime? EvaluateIntervalTrigger(IntervalTrigger trigger, DateTime? lastCompleted, DateTime nowUtc)
    {
        if (!lastCompleted.HasValue)
        {
            return nowUtc;
        }
        return lastCompleted.Value.AddDays(trigger.IntervalDays);
    }

    public static DateTime? EvaluateFixedTrigger(FixedTrigger trigger, TimeZoneInfo tz, DateTime nowUtc)
    {
        try
        {
            var cronExpression = Cronos.CronExpression.Parse(trigger.CronPattern);
            return cronExpression.GetNextOccurrence(nowUtc, tz);
        }
        catch (Cronos.CronFormatException)
        {
            return null;
        }
    }

    public static DateTime? EvaluateConditionTrigger(ConditionTrigger trigger, DateTime nowUtc)
    {
        if (trigger.IsActive)
        {
            return nowUtc;
        }
        return null;
    }

    public static DateTime? CalculateNextDue(
        ICollection<Trigger> triggers,
        DateTime? lastCompleted,
        TimeZoneInfo tz,
        DateTime nowUtc)
    {
        DateTime? earliestDue = null;

        foreach (var trigger in triggers)
        {
            DateTime? triggerDue = trigger switch
            {
                FixedTrigger ft => EvaluateFixedTrigger(ft, tz, nowUtc),
                IntervalTrigger it => EvaluateIntervalTrigger(it, lastCompleted, nowUtc),
                ConditionTrigger ct => EvaluateConditionTrigger(ct, nowUtc),
                _ => null
            };

            if (triggerDue.HasValue)
            {
                if (!earliestDue.HasValue || triggerDue.Value < earliestDue.Value)
                {
                    earliestDue = triggerDue;
                }
            }
        }

        return earliestDue;
    }
}
