using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Service for sending push notifications via Expo Push API.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly YahatlDbContext _dbContext;
    private readonly HttpClient _httpClient;
    private readonly ILogger<NotificationService> _logger;

    private const string ExpoPushApiUrl = "https://exp.host/--/api/v2/push/send";

    public NotificationService(
        YahatlDbContext dbContext,
        HttpClient httpClient,
        ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task SendReminderFiringAsync(Guid userId, Guid noteId, string title, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user?.ExpoPushToken == null)
        {
            _logger.LogDebug("User {UserId} has no push token, skipping reminder notification", userId);
            return;
        }

        await SendPushAsync(
            user.ExpoPushToken,
            "⏰ Reminder",
            title,
            new { type = "reminder", noteId },
            cancellationToken);
    }

    public async Task SendStreakAtRiskAsync(Guid userId, Guid noteId, string habitTitle, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user?.ExpoPushToken == null)
        {
            _logger.LogDebug("User {UserId} has no push token, skipping streak notification", userId);
            return;
        }

        await SendPushAsync(
            user.ExpoPushToken,
            "🔥 Streak at Risk!",
            $"Don't break your streak on '{habitTitle}'",
            new { type = "streak_at_risk", noteId },
            cancellationToken);
    }

    public async Task SendOverdueNotificationAsync(Guid userId, int overdueCount, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user?.ExpoPushToken == null)
        {
            _logger.LogDebug("User {UserId} has no push token, skipping overdue notification", userId);
            return;
        }

        var body = overdueCount == 1
            ? "You have 1 overdue item"
            : $"You have {overdueCount} overdue items";

        await SendPushAsync(
            user.ExpoPushToken,
            "📋 Overdue Items",
            body,
            new { type = "overdue", overdueCount },
            cancellationToken);
    }

    public async Task SendBlockerResolvedAsync(Guid userId, Guid blockerId, string noteTitle, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FindAsync([userId], cancellationToken);
        if (user?.ExpoPushToken == null)
        {
            _logger.LogDebug("User {UserId} has no push token, skipping blocker resolved notification", userId);
            return;
        }

        await SendPushAsync(
            user.ExpoPushToken,
            "✅ Blocker Resolved",
            $"'{noteTitle}' is now unblocked",
            new { type = "blocker_resolved", blockerId },
            cancellationToken);
    }

    public async Task<bool> SendPushAsync(string expoPushToken, string title, string body, object? data = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(expoPushToken))
        {
            _logger.LogDebug("Empty push token, skipping notification");
            return false;
        }

        try
        {
            var payload = new
            {
                to = expoPushToken,
                title,
                body,
                data,
                sound = "default"
            };

            var response = await _httpClient.PostAsJsonAsync(ExpoPushApiUrl, payload, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogDebug("Push notification sent: {Response}", responseContent);

                // Parse response to check for errors
                var result = JsonSerializer.Deserialize<ExpoPushResponse>(responseContent);
                if (result?.Data?.FirstOrDefault()?.Status == "error")
                {
                    _logger.LogWarning("Expo push error: {Error}", result.Data[0].Message);
                    return false;
                }

                return true;
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to send push notification: {StatusCode} - {Error}",
                    response.StatusCode, error);
                return false;
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to send push notification to Expo API");
            return false;
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogWarning(ex, "Push notification request timed out");
            return false;
        }
    }

    /// <summary>
    /// Response model for Expo Push API.
    /// </summary>
    private class ExpoPushResponse
    {
        public List<ExpoPushTicket>? Data { get; set; }
    }

    private class ExpoPushTicket
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
        public string? Id { get; set; }
    }
}
