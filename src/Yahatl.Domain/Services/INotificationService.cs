namespace Yahatl.Domain.Services;

/// <summary>
/// Service for sending push notifications via Expo Push API.
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Sends a reminder firing notification.
    /// </summary>
    Task SendReminderFiringAsync(Guid userId, Guid noteId, string title, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a streak at risk notification (morning notification if habit not done yesterday).
    /// </summary>
    Task SendStreakAtRiskAsync(Guid userId, Guid noteId, string habitTitle, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an overdue items notification.
    /// </summary>
    Task SendOverdueNotificationAsync(Guid userId, int overdueCount, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a blocker resolved notification.
    /// </summary>
    Task SendBlockerResolvedAsync(Guid userId, Guid blockerId, string noteTitle, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a push notification directly using Expo Push API.
    /// </summary>
    /// <param name="expoPushToken">The Expo push token.</param>
    /// <param name="title">Notification title.</param>
    /// <param name="body">Notification body.</param>
    /// <param name="data">Optional data payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if sent successfully, false otherwise.</returns>
    Task<bool> SendPushAsync(string expoPushToken, string title, string body, object? data = null, CancellationToken cancellationToken = default);
}
