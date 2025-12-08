using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Background service for sending push notifications based on various triggers.
/// </summary>
public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly int _intervalSeconds;

    public NotificationBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<NotificationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _intervalSeconds = configuration.GetValue<int>("BackgroundServices:NotificationIntervalSeconds", 300);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Service starting, interval: {Interval}s", _intervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckNotificationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Notification Background Service");
            }

            await Task.Delay(TimeSpan.FromSeconds(_intervalSeconds), stoppingToken);
        }

        _logger.LogInformation("Notification Background Service stopping");
    }

    private async Task CheckNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<YahatlDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        await CheckReminderTriggers(dbContext, notificationService, cancellationToken);
        await CheckStreakAtRisk(dbContext, notificationService, cancellationToken);
        await CheckOverdueItems(dbContext, notificationService, cancellationToken);
    }

    /// <summary>
    /// Check for ReminderBehaviour triggers that are firing.
    /// </summary>
    private async Task CheckReminderTriggers(
        YahatlDbContext dbContext,
        INotificationService notificationService,
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;

        // Find notes with ReminderBehaviour that have active ConditionTriggers
        var reminders = await dbContext.Notes
            .Include(n => n.Behaviours)
            .Include(n => n.Triggers)
            .Include(n => n.Owner)
            .Where(n => !n.IsArchived)
            .Where(n => n.Behaviours.Any(b => b is ReminderBehaviour))
            .Where(n => n.Triggers.OfType<ConditionTrigger>().Any(t => t.IsActive))
            .ToListAsync(cancellationToken);

        foreach (var note in reminders)
        {
            var userId = note.OwnerId;
            await notificationService.SendReminderFiringAsync(userId, note.Id, note.Title, cancellationToken);
            _logger.LogDebug("Sent reminder notification for note {NoteId}", note.Id);
        }
    }

    /// <summary>
    /// Check for habits at risk of breaking their streak.
    /// Morning notification if habit not done yesterday.
    /// </summary>
    private async Task CheckStreakAtRisk(
        YahatlDbContext dbContext,
        INotificationService notificationService,
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;

        // Only send in the morning (6 AM - 10 AM local time)
        var habits = await dbContext.Notes
            .Include(n => n.Behaviours)
            .Include(n => n.Owner)
            .Where(n => !n.IsArchived)
            .Where(n => n.Behaviours.Any(b => b is HabitBehaviour))
            .ToListAsync(cancellationToken);

        foreach (var note in habits)
        {
            var user = note.Owner;
            if (user?.ExpoPushToken == null) continue;

            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(user.Timezone);
                var localNow = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);

                // Only send between 6 AM and 10 AM
                if (localNow.Hour < 6 || localNow.Hour >= 10) continue;

                var habit = note.Behaviours.OfType<HabitBehaviour>().First();

                // Check if habit was done yesterday
                var yesterday = localNow.Date.AddDays(-1);
                var completionHistory = ParseCompletionHistory(habit.CompletionHistoryJson);

                if (completionHistory.Count > 0 && !completionHistory.Contains(yesterday))
                {
                    // Habit wasn't done yesterday, streak at risk
                    if (habit.CurrentStreak > 0)
                    {
                        await notificationService.SendStreakAtRiskAsync(
                            user.Id, note.Id, note.Title, cancellationToken);
                        _logger.LogDebug("Sent streak at risk notification for note {NoteId}", note.Id);
                    }
                }
            }
            catch (TimeZoneNotFoundException)
            {
                // Skip if timezone is invalid
            }
        }
    }

    /// <summary>
    /// Check for overdue items and notify users.
    /// </summary>
    private async Task CheckOverdueItems(
        YahatlDbContext dbContext,
        INotificationService notificationService,
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;

        // Group overdue items by user
        var overdueByUser = await dbContext.Notes
            .Include(n => n.Behaviours)
            .Include(n => n.Owner)
            .Where(n => !n.IsArchived)
            .Where(n => n.Behaviours.Any(b =>
                (b is ChoreBehaviour chore && chore.NextDue < nowUtc) ||
                (b is TaskBehaviour task && task.DueDate < nowUtc && task.Status == TaskStatus.Pending)))
            .GroupBy(n => n.OwnerId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        foreach (var item in overdueByUser)
        {
            if (item.Count > 0)
            {
                await notificationService.SendOverdueNotificationAsync(
                    item.UserId, item.Count, cancellationToken);
                _logger.LogDebug("Sent overdue notification to user {UserId}: {Count} items",
                    item.UserId, item.Count);
            }
        }
    }

    private static List<DateTime> ParseCompletionHistory(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<List<DateTime>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
