using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Protocol;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Mqtt;

/// <summary>
/// Background service managing MQTT client lifecycle and message handling.
/// Subscribes to condition topics and updates trigger/blocker state in real-time.
/// </summary>
public class MqttClientService : BackgroundService, IMqttService
{
    private readonly ILogger<MqttClientService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private IMqttClient? _client;
    private readonly HashSet<string> _subscribedTopics = [];

    public bool IsConnected => _client?.IsConnected ?? false;

    public event EventHandler<MqttMessageReceivedEventArgs>? MessageReceived;

    public MqttClientService(
        ILogger<MqttClientService> logger,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var reconnectDelay = TimeSpan.FromSeconds(1);
        var maxReconnectDelay = TimeSpan.FromMinutes(5);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (_client == null || !_client.IsConnected)
                {
                    await ConnectAsync(stoppingToken);
                    await SubscribeToConditionTopicsAsync(stoppingToken);

                    // Reset backoff on successful connection
                    reconnectDelay = TimeSpan.FromSeconds(1);
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in MQTT client service loop, retrying in {Delay}s", reconnectDelay.TotalSeconds);

                await Task.Delay(reconnectDelay, stoppingToken);

                // Exponential backoff with max delay
                reconnectDelay = TimeSpan.FromSeconds(Math.Min(reconnectDelay.TotalSeconds * 2, maxReconnectDelay.TotalSeconds));
            }
        }

        await DisconnectAsync();
    }

    private async Task ConnectAsync(CancellationToken cancellationToken)
    {
        var host = _configuration["Mqtt:Host"] ?? "localhost";
        var port = int.Parse(_configuration["Mqtt:Port"] ?? "1883");
        var clientId = _configuration["Mqtt:ClientId"] ?? "yahatl-api";
        var username = _configuration["Mqtt:Username"];
        var password = _configuration["Mqtt:Password"];

        var factory = new MqttClientFactory();
        _client = factory.CreateMqttClient();

        var optionsBuilder = new MqttClientOptionsBuilder()
            .WithTcpServer(host, port)
            .WithClientId(clientId)
            .WithCleanSession(true);

        if (!string.IsNullOrEmpty(username))
        {
            optionsBuilder.WithCredentials(username, password);
        }

        var options = optionsBuilder.Build();

        _client.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;
        _client.DisconnectedAsync += OnDisconnectedAsync;

        _logger.LogInformation("Connecting to MQTT broker at {Host}:{Port}", host, port);

        try
        {
            await _client.ConnectAsync(options, cancellationToken);
            _logger.LogInformation("Connected to MQTT broker");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to MQTT broker at {Host}:{Port}", host, port);
            throw;
        }
    }

    private async Task DisconnectAsync()
    {
        if (_client?.IsConnected == true)
        {
            await _client.DisconnectAsync();
            _logger.LogInformation("Disconnected from MQTT broker");
        }
    }

    private Task OnDisconnectedAsync(MqttClientDisconnectedEventArgs args)
    {
        if (args.Exception != null)
        {
            _logger.LogWarning(args.Exception, "Disconnected from MQTT broker unexpectedly");
        }
        else
        {
            _logger.LogInformation("Disconnected from MQTT broker");
        }

        _subscribedTopics.Clear();
        return Task.CompletedTask;
    }

    private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs args)
    {
        var topic = args.ApplicationMessage.Topic;
        var payload = args.ApplicationMessage.ConvertPayloadToString();

        _logger.LogDebug("Received message on topic {Topic}: {Payload}", topic, payload);

        MessageReceived?.Invoke(this, new MqttMessageReceivedEventArgs
        {
            Topic = topic,
            Payload = payload ?? string.Empty
        });

        await UpdateConditionStatesAsync(topic, payload ?? string.Empty);
    }

    private async Task UpdateConditionStatesAsync(string topic, string payload)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<YahatlDbContext>();

        // Update ConditionTriggers
        var triggers = await dbContext.ConditionTriggers
            .Where(t => t.MqttTopic == topic)
            .ToListAsync();

        foreach (var trigger in triggers)
        {
            var wasActive = trigger.IsActive;
            trigger.IsActive = MqttConditionEvaluator.Evaluate(trigger.Operator, trigger.Value, payload);

            if (wasActive != trigger.IsActive)
            {
                _logger.LogInformation(
                    "ConditionTrigger {Id} for note {NoteId} changed from {WasActive} to {IsActive}",
                    trigger.Id, trigger.NoteId, wasActive, trigger.IsActive);
            }
        }

        // Update ConditionBlockers
        var blockers = await dbContext.ConditionBlockers
            .Where(b => b.MqttTopic == topic)
            .ToListAsync();

        foreach (var blocker in blockers)
        {
            var wasActive = blocker.IsActive;
            blocker.IsActive = MqttConditionEvaluator.Evaluate(blocker.Operator, blocker.Value, payload);

            if (wasActive != blocker.IsActive)
            {
                _logger.LogInformation(
                    "ConditionBlocker {Id} for note {NoteId} changed from {WasActive} to {IsActive}",
                    blocker.Id, blocker.NoteId, wasActive, blocker.IsActive);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task SubscribeToConditionTopicsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<YahatlDbContext>();

        // Get all unique topics from triggers and blockers
        var triggerTopics = await dbContext.ConditionTriggers
            .Select(t => t.MqttTopic)
            .Distinct()
            .ToListAsync(cancellationToken);

        var blockerTopics = await dbContext.ConditionBlockers
            .Select(b => b.MqttTopic)
            .Distinct()
            .ToListAsync(cancellationToken);

        var allTopics = triggerTopics.Union(blockerTopics).Distinct();

        foreach (var topic in allTopics)
        {
            await SubscribeAsync(topic, cancellationToken);
        }

        _logger.LogInformation("Subscribed to {Count} condition topics", _subscribedTopics.Count);
    }

    public async Task SubscribeAsync(string topic, CancellationToken cancellationToken = default)
    {
        if (_client?.IsConnected != true || _subscribedTopics.Contains(topic))
        {
            return;
        }

        var options = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(topic, MqttQualityOfServiceLevel.AtLeastOnce)
            .Build();

        await _client.SubscribeAsync(options, cancellationToken);
        _subscribedTopics.Add(topic);

        _logger.LogDebug("Subscribed to topic: {Topic}", topic);
    }

    public async Task UnsubscribeAsync(string topic, CancellationToken cancellationToken = default)
    {
        if (_client?.IsConnected != true || !_subscribedTopics.Contains(topic))
        {
            return;
        }

        var options = new MqttClientUnsubscribeOptionsBuilder()
            .WithTopicFilter(topic)
            .Build();

        await _client.UnsubscribeAsync(options, cancellationToken);
        _subscribedTopics.Remove(topic);

        _logger.LogDebug("Unsubscribed from topic: {Topic}", topic);
    }

    public async Task PublishAsync(string topic, string payload, bool retain = false, CancellationToken cancellationToken = default)
    {
        if (_client?.IsConnected != true)
        {
            _logger.LogWarning("Cannot publish to {Topic}: not connected", topic);
            return;
        }

        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(payload)
            .WithRetainFlag(retain)
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
            .Build();

        await _client.PublishAsync(message, cancellationToken);

        _logger.LogDebug("Published to {Topic}: {Payload}", topic, payload);
    }

    public override void Dispose()
    {
        _client?.Dispose();
        base.Dispose();
    }
}
