using System.Net;
using System.Net.Http.Json;
using Xunit;
using Moq;
using Moq.Protected;
using Microsoft.Extensions.Logging;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Tests;

public class NotificationServiceTests
{
    // ==================== PUSH NOTIFICATION TESTS ====================

    [Fact]
    public async Task SendPushAsync_SuccessfulResponse_ReturnsTrue()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = JsonContent.Create(new { data = new[] { new { status = "ok" } } })
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        var result = await service.SendPushAsync("ExponentPushToken[xxx]", "Test", "Body");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task SendPushAsync_ErrorResponse_ReturnsFalse()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = JsonContent.Create(new
                {
                    data = new[] { new { status = "error", message = "DeviceNotRegistered" } }
                })
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        var result = await service.SendPushAsync("ExponentPushToken[xxx]", "Test", "Body");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SendPushAsync_HttpError_ReturnsFalse()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.InternalServerError
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        var result = await service.SendPushAsync("ExponentPushToken[xxx]", "Test", "Body");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SendPushAsync_EmptyToken_ReturnsFalse()
    {
        // Arrange
        var httpClient = new HttpClient();
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        var result = await service.SendPushAsync("", "Test", "Body");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SendPushAsync_NetworkException_ReturnsFalse()
    {
        // Arrange
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Network error"));

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        var result = await service.SendPushAsync("ExponentPushToken[xxx]", "Test", "Body");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SendPushAsync_CorrectPayloadSent()
    {
        // Arrange
        HttpRequestMessage? capturedRequest = null;
        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((req, ct) => capturedRequest = req)
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = JsonContent.Create(new { data = new[] { new { status = "ok" } } })
            });

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<TestableNotificationService>>();

        var service = new TestableNotificationService(httpClient, logger);

        // Act
        await service.SendPushAsync("ExponentPushToken[test]", "My Title", "My Body", new { noteId = Guid.NewGuid() });

        // Assert
        Assert.NotNull(capturedRequest);
        Assert.Equal("https://exp.host/--/api/v2/push/send", capturedRequest.RequestUri?.ToString());
        Assert.Equal(HttpMethod.Post, capturedRequest.Method);

        var content = await capturedRequest.Content!.ReadAsStringAsync();
        Assert.Contains("ExponentPushToken[test]", content);
        Assert.Contains("My Title", content);
        Assert.Contains("My Body", content);
    }
}

/// <summary>
/// Testable notification service that doesn't require DbContext
/// </summary>
public class TestableNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<TestableNotificationService> _logger;
    private const string ExpoPushApiUrl = "https://exp.host/--/api/v2/push/send";

    public TestableNotificationService(HttpClient httpClient, ILogger<TestableNotificationService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> SendPushAsync(string expoPushToken, string title, string body, object? data = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(expoPushToken))
        {
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
                var result = System.Text.Json.JsonSerializer.Deserialize<ExpoPushResponse>(responseContent);
                if (result?.Data?.FirstOrDefault()?.Status == "error")
                {
                    return false;
                }
                return true;
            }
            else
            {
                return false;
            }
        }
        catch (HttpRequestException)
        {
            return false;
        }
    }

    private class ExpoPushResponse
    {
        public List<ExpoPushTicket>? Data { get; set; }
    }

    private class ExpoPushTicket
    {
        public string? Status { get; set; }
        public string? Message { get; set; }
    }
}
