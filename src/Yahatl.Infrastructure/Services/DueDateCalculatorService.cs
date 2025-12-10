using System.Text.Json;
using Cronos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Service for calculating when notes become due based on their triggers.
/// </summary>
public class DueDateCalculatorService : IDueDateCalculatorService
{
    private readonly YahatlDbContext _dbContext;
    private readonly IStatePublisher _statePublisher;
    private readonly ILogger<DueDateCalculatorService> _logger;

    public DueDateCalculatorService(
        YahatlDbContext dbContext,
        IStatePublisher statePublisher,
        ILogger<DueDateCalculatorService> logger)
    {
        _dbContext = dbContext;
        _statePublisher = statePublisher;
        _logger = logger;
    }

    public async Task<DateTime?> CalculateNextDueAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await _dbContext.Notes
            .Include(n => n.Triggers)
            .Include(n => n.Behaviours)
            .Include(n => n.Owner)
            .FirstOrDefaultAsync(n => n.Id == noteId, cancellationToken);

        if (note == null)
        {
            _logger.LogWarning("Note {NoteId} not found", noteId);
            return null;
        }

        var choreBehaviour = note.Behaviours.OfType<ChoreBehaviour>().FirstOrDefault();
        var userTimezone = note.Owner?.Timezone ?? "UTC";

        return CalculateNextDue(note.Triggers, choreBehaviour?.LastCompleted, userTimezone);
    }

    public async Task EvaluateTriggersAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await _dbContext.Notes
            .Include(n => n.Triggers)
            .Include(n => n.Behaviours)
            .Include(n => n.Owner)
            .FirstOrDefaultAsync(n => n.Id == noteId, cancellationToken);

        if (note == null)
        {
            _logger.LogWarning("Note {NoteId} not found", noteId);
            return;
        }

        var choreBehaviour = note.Behaviours.OfType<ChoreBehaviour>().FirstOrDefault();
        if (choreBehaviour == null)
        {
            // Note doesn't have a ChoreBehaviour, nothing to update
            return;
        }

        var userTimezone = note.Owner?.Timezone ?? "UTC";
        var nextDue = CalculateNextDue(note.Triggers, choreBehaviour.LastCompleted, userTimezone);

        if (nextDue.HasValue && nextDue.Value != choreBehaviour.NextDue)
        {
            var oldNextDue = choreBehaviour.NextDue;
            choreBehaviour.NextDue = nextDue.Value;
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogDebug("Updated NextDue for note {NoteId}: {Old} -> {New}", noteId, oldNextDue, nextDue.Value);

            // Publish state change via MQTT
            await _statePublisher.RefreshAllStatesAsync(cancellationToken);
        }
    }

    public async Task EvaluateAllDueNotesAsync(CancellationToken cancellationToken = default)
    {
        // Query notes with ChoreBehaviour that have time-based triggers
        // We need to evaluate: FixedTrigger, IntervalTrigger, WindowTrigger
        // ConditionTrigger is handled by MQTT subscriber, but we check IsActive here too

        var notesWithTriggers = await _dbContext.Notes
            .Include(n => n.Triggers)
            .Include(n => n.Behaviours)
            .Include(n => n.Owner)
            .Where(n => n.Triggers.Any() && n.Behaviours.Any(b => b is ChoreBehaviour))
            .Where(n => !n.IsArchived)
            .ToListAsync(cancellationToken);

        _logger.LogDebug("Evaluating {Count} notes with chore behaviours and triggers", notesWithTriggers.Count);

        var updatedCount = 0;

        foreach (var note in notesWithTriggers)
        {
            var choreBehaviour = note.Behaviours.OfType<ChoreBehaviour>().First();
            var userTimezone = note.Owner?.Timezone ?? "UTC";
            var nextDue = CalculateNextDue(note.Triggers, choreBehaviour.LastCompleted, userTimezone);

            if (nextDue.HasValue && nextDue.Value != choreBehaviour.NextDue)
            {
                choreBehaviour.NextDue = nextDue.Value;
                updatedCount++;
                _logger.LogDebug("Updating NextDue for note {NoteId} ({Title}): {NextDue}",
                    note.Id, note.Title, nextDue.Value);
            }
        }

        if (updatedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            await _statePublisher.RefreshAllStatesAsync(cancellationToken);
            _logger.LogInformation("Updated {Count} note due dates", updatedCount);
        }
    }

    /// <summary>
    /// Calculates the next due date based on all triggers.
    /// Multiple triggers use OR logic - any one can fire.
    /// </summary>
    private DateTime? CalculateNextDue(ICollection<Trigger> triggers, DateTime? lastCompleted, string userTimezone)
    {
        DateTime? earliestDue = null;

        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
            var nowUtc = DateTime.UtcNow;
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);

            foreach (var trigger in triggers)
            {
                var triggerDue = EvaluateTrigger(trigger, lastCompleted, tz, nowUtc);

                if (triggerDue.HasValue)
                {
                    if (!earliestDue.HasValue || triggerDue.Value < earliestDue.Value)
                    {
                        earliestDue = triggerDue;
                    }
                }
            }
        }
        catch (TimeZoneNotFoundException ex)
        {
            _logger.LogWarning(ex, "Unknown timezone {Timezone}, falling back to UTC", userTimezone);
            // Fall back to UTC
            var nowUtc = DateTime.UtcNow;
            foreach (var trigger in triggers)
            {
                var triggerDue = EvaluateTrigger(trigger, lastCompleted, TimeZoneInfo.Utc, nowUtc);
                if (triggerDue.HasValue && (!earliestDue.HasValue || triggerDue.Value < earliestDue.Value))
                {
                    earliestDue = triggerDue;
                }
            }
        }

        return earliestDue;
    }

    /// <summary>
    /// Evaluates a single trigger and returns when it fires.
    /// </summary>
    private DateTime? EvaluateTrigger(Trigger trigger, DateTime? lastCompleted, TimeZoneInfo tz, DateTime nowUtc)
    {
        return trigger switch
        {
            FixedTrigger fixedTrigger => EvaluateFixedTrigger(fixedTrigger, tz, nowUtc),
            IntervalTrigger interval => EvaluateIntervalTrigger(interval, lastCompleted, nowUtc),
            WindowTrigger window => EvaluateWindowTrigger(window, lastCompleted, tz, nowUtc),
            ConditionTrigger condition => EvaluateConditionTrigger(condition, nowUtc),
            _ => null
        };
    }

    /// <summary>
    /// FixedTrigger: Uses cron pattern to find next occurrence.
    /// </summary>
    private DateTime? EvaluateFixedTrigger(FixedTrigger trigger, TimeZoneInfo tz, DateTime nowUtc)
    {
        try
        {
            var cronExpression = CronExpression.Parse(trigger.CronPattern);
            var nextOccurrence = cronExpression.GetNextOccurrence(nowUtc, tz);
            return nextOccurrence;
        }
        catch (CronFormatException ex)
        {
            _logger.LogWarning(ex, "Invalid cron pattern: {Pattern}", trigger.CronPattern);
            return null;
        }
    }

    /// <summary>
    /// IntervalTrigger: Due = lastCompleted + intervalDays.
    /// If never completed, fires immediately.
    /// </summary>
    private DateTime? EvaluateIntervalTrigger(IntervalTrigger trigger, DateTime? lastCompleted, DateTime nowUtc)
    {
        if (!lastCompleted.HasValue)
        {
            // Never completed, due now
            return nowUtc;
        }

        return lastCompleted.Value.AddDays(trigger.IntervalDays);
    }

    /// <summary>
    /// WindowTrigger: Finds the next available time window.
    /// </summary>
    private DateTime? EvaluateWindowTrigger(WindowTrigger trigger, DateTime? lastCompleted, TimeZoneInfo tz, DateTime nowUtc)
    {
        try
        {
            var windows = JsonSerializer.Deserialize<List<TriggerWindow>>(trigger.WindowsJson);
            if (windows == null || windows.Count == 0)
            {
                return null;
            }

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);

            // Sort by preference
            var sortedWindows = windows.OrderBy(w => w.Preference).ToList();

            // Find next window based on recurrence
            DateTime? nextWindow = null;

            foreach (var window in sortedWindows)
            {
                var windowStart = FindNextWindowStart(window, nowLocal, trigger.Recurrence);
                if (windowStart.HasValue)
                {
                    // Convert back to UTC
                    var windowUtc = TimeZoneInfo.ConvertTimeToUtc(windowStart.Value, tz);

                    // Skip if before last completed (for the same recurrence period)
                    if (lastCompleted.HasValue && windowUtc <= lastCompleted.Value)
                    {
                        continue;
                    }

                    if (!nextWindow.HasValue || windowUtc < nextWindow.Value)
                    {
                        nextWindow = windowUtc;
                        break; // Take the highest preference window that's available
                    }
                }
            }

            return nextWindow;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid window JSON: {Json}", trigger.WindowsJson);
            return null;
        }
    }

    /// <summary>
    /// ConditionTrigger: If IsActive is true, it fires now.
    /// </summary>
    private DateTime? EvaluateConditionTrigger(ConditionTrigger trigger, DateTime nowUtc)
    {
        if (trigger.IsActive)
        {
            return nowUtc;
        }
        return null;
    }

    /// <summary>
    /// Find the next occurrence of a time window.
    /// </summary>
    private DateTime? FindNextWindowStart(TriggerWindow window, DateTime nowLocal, string recurrence)
    {
        if (window.Days == null || window.Days.Count == 0)
        {
            return null;
        }

        // Parse time range
        if (!TryParseTimeRange(window.TimeRange, out var startTime, out var _))
        {
            return null;
        }

        // Convert day names to DayOfWeek
        var targetDays = window.Days
            .Select(d => Enum.TryParse<DayOfWeek>(d, true, out var dow) ? dow : (DayOfWeek?)null)
            .Where(d => d.HasValue)
            .Select(d => d!.Value)
            .ToList();

        if (targetDays.Count == 0)
        {
            return null;
        }

        // Find next occurrence within the next 7 days (for weekly recurrence)
        var lookAhead = recurrence.ToLowerInvariant() == "monthly" ? 31 : 7;

        for (var i = 0; i <= lookAhead; i++)
        {
            var candidateDate = nowLocal.Date.AddDays(i);
            if (targetDays.Contains(candidateDate.DayOfWeek))
            {
                var candidateStart = candidateDate.Add(startTime);
                if (candidateStart > nowLocal || i > 0)
                {
                    return candidateStart;
                }
            }
        }

        return null;
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

    /// <summary>
    /// Helper class for deserializing window JSON.
    /// </summary>
    private class TriggerWindow
    {
        public int Preference { get; set; }
        public List<string>? Days { get; set; }
        public string? TimeRange { get; set; }
    }
}
