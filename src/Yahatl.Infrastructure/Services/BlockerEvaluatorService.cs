using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Service for evaluating and updating blocker states.
/// </summary>
public class BlockerEvaluatorService : IBlockerEvaluatorService
{
    private readonly YahatlDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<BlockerEvaluatorService> _logger;

    public BlockerEvaluatorService(
        YahatlDbContext dbContext,
        INotificationService notificationService,
        ILogger<BlockerEvaluatorService> logger)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    public bool EvaluateBlocker(Blocker blocker, string userTimezone)
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
            return EvaluateBlockerInternal(blocker, tz, DateTime.UtcNow);
        }
        catch (TimeZoneNotFoundException)
        {
            _logger.LogWarning("Unknown timezone {Timezone}, falling back to UTC", userTimezone);
            return EvaluateBlockerInternal(blocker, TimeZoneInfo.Utc, DateTime.UtcNow);
        }
    }

    public async Task EvaluateBlockersForNoteAsync(Guid noteId, CancellationToken cancellationToken = default)
    {
        var note = await _dbContext.Notes
            .Include(n => n.Blockers)
            .Include(n => n.Owner)
            .FirstOrDefaultAsync(n => n.Id == noteId, cancellationToken);

        if (note == null)
        {
            _logger.LogWarning("Note {NoteId} not found", noteId);
            return;
        }

        var userTimezone = note.Owner?.Timezone ?? "UTC";

        foreach (var blocker in note.Blockers)
        {
            await EvaluateAndUpdateBlockerAsync(blocker, userTimezone, note.Title, cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task EvaluateAllBlockersAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;

        // Query blockers that need evaluation:
        // - NoteBlockers (target note might have been completed)
        // - TimeBlockers (time might have changed)
        // - UntilDateBlockers (date might have passed)
        // ConditionBlockers are handled by MQTT subscriber but we recheck on startup
        var blockers = await _dbContext.Set<Blocker>()
            .Include(b => b.Note)
                .ThenInclude(n => n!.Owner)
            .Where(b => b.Note != null && !b.Note.IsArchived)
            .ToListAsync(cancellationToken);

        _logger.LogDebug("Evaluating {Count} blockers", blockers.Count);

        var updatedCount = 0;
        var notificationsToSend = new List<(Guid UserId, Guid BlockerId, string NoteTitle)>();

        foreach (var blocker in blockers)
        {
            var userTimezone = blocker.Note?.Owner?.Timezone ?? "UTC";
            var noteTitle = blocker.Note?.Title ?? "Unknown";
            var wasActive = blocker.IsActive;

            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
                var isNowActive = EvaluateBlockerInternal(blocker, tz, nowUtc);

                if (isNowActive != wasActive)
                {
                    blocker.IsActive = isNowActive;
                    updatedCount++;
                    _logger.LogDebug("Blocker {BlockerId} for note {NoteTitle}: {Old} -> {New}",
                        blocker.Id, noteTitle, wasActive, isNowActive);

                    // Check if we need to send a notification
                    if (!isNowActive && wasActive && blocker.NotifyOnResolve)
                    {
                        var userId = blocker.Note?.OwnerId ?? Guid.Empty;
                        if (userId != Guid.Empty)
                        {
                            notificationsToSend.Add((userId, blocker.Id, noteTitle));
                        }
                    }
                }
            }
            catch (TimeZoneNotFoundException)
            {
                _logger.LogWarning("Unknown timezone {Timezone} for blocker {BlockerId}", userTimezone, blocker.Id);
            }
        }

        if (updatedCount > 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Updated {Count} blocker states", updatedCount);
        }

        // Send notifications for resolved blockers
        foreach (var notification in notificationsToSend)
        {
            await _notificationService.SendBlockerResolvedAsync(
                notification.UserId, notification.BlockerId, notification.NoteTitle, cancellationToken);
        }
    }

    private async Task EvaluateAndUpdateBlockerAsync(
        Blocker blocker, string userTimezone, string noteTitle, CancellationToken cancellationToken)
    {
        var wasActive = blocker.IsActive;

        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(userTimezone);
            blocker.IsActive = EvaluateBlockerInternal(blocker, tz, DateTime.UtcNow);

            // Send notification if blocker was resolved and NotifyOnResolve is true
            if (wasActive && !blocker.IsActive && blocker.NotifyOnResolve)
            {
                var userId = blocker.Note?.OwnerId ?? Guid.Empty;
                if (userId != Guid.Empty)
                {
                    await _notificationService.SendBlockerResolvedAsync(
                        userId, blocker.Id, noteTitle, cancellationToken);
                }
            }
        }
        catch (TimeZoneNotFoundException)
        {
            _logger.LogWarning("Unknown timezone {Timezone} for blocker {BlockerId}", userTimezone, blocker.Id);
        }
    }

    /// <summary>
    /// Evaluates whether a blocker is currently active (blocking).
    /// </summary>
    private bool EvaluateBlockerInternal(Blocker blocker, TimeZoneInfo tz, DateTime nowUtc)
    {
        return blocker switch
        {
            NoteBlocker noteBlocker => EvaluateNoteBlocker(noteBlocker),
            TimeBlocker timeBlocker => EvaluateTimeBlocker(timeBlocker, tz, nowUtc),
            UntilDateBlocker untilDateBlocker => EvaluateUntilDateBlocker(untilDateBlocker, nowUtc),
            ConditionBlocker conditionBlocker => conditionBlocker.IsActive, // Handled by MQTT
            PersonBlocker => blocker.IsActive, // Manual resolution only
            FreetextBlocker => blocker.IsActive, // Manual resolution only
            _ => blocker.IsActive
        };
    }

    /// <summary>
    /// NoteBlocker: Check if target note's TaskBehaviour is complete.
    /// </summary>
    private bool EvaluateNoteBlocker(NoteBlocker blocker)
    {
        // Load target note if not already loaded
        var targetNote = blocker.TargetNote ?? _dbContext.Notes
            .Include(n => n.Behaviours)
            .FirstOrDefault(n => n.Id == blocker.TargetNoteId);

        if (targetNote == null)
        {
            // Target note doesn't exist, consider blocker inactive
            return false;
        }

        var taskBehaviour = targetNote.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
        if (taskBehaviour == null)
        {
            // No task behaviour, consider blocker inactive
            return false;
        }

        // Blocker is active if target note is NOT complete
        return taskBehaviour.Status != TaskStatus.Complete;
    }

    /// <summary>
    /// TimeBlocker: Check if current time is within any blocking window.
    /// </summary>
    private bool EvaluateTimeBlocker(TimeBlocker blocker, TimeZoneInfo tz, DateTime nowUtc)
    {
        try
        {
            var windows = JsonSerializer.Deserialize<List<TimeBlockerWindow>>(blocker.WindowsJson);
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
                        return true; // Currently within blocking window
                    }
                }
            }

            return false;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Invalid TimeBlocker window JSON: {Json}", blocker.WindowsJson);
            return false;
        }
    }

    /// <summary>
    /// UntilDateBlocker: Check if the until date has passed.
    /// </summary>
    private bool EvaluateUntilDateBlocker(UntilDateBlocker blocker, DateTime nowUtc)
    {
        // Blocker is active until the date passes
        return nowUtc < blocker.Until;
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
    /// Helper class for deserializing TimeBlocker window JSON.
    /// </summary>
    private class TimeBlockerWindow
    {
        public List<string>? Days { get; set; }
        public string? TimeRange { get; set; }
    }
}
