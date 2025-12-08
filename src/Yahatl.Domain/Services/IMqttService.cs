namespace Yahatl.Domain.Services;

/// <summary>
/// Service interface for MQTT operations enabling Home Assistant integration.
/// </summary>
public interface IMqttService
{
    /// <summary>
    /// Whether the client is currently connected to the MQTT broker.
    /// </summary>
    bool IsConnected { get; }

    /// <summary>
    /// Subscribe to an MQTT topic.
    /// </summary>
    Task SubscribeAsync(string topic, CancellationToken cancellationToken = default);

    /// <summary>
    /// Unsubscribe from an MQTT topic.
    /// </summary>
    Task UnsubscribeAsync(string topic, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish a message to an MQTT topic.
    /// </summary>
    /// <param name="topic">The topic to publish to.</param>
    /// <param name="payload">The message payload.</param>
    /// <param name="retain">Whether the message should be retained by the broker.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task PublishAsync(string topic, string payload, bool retain = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// Event raised when a message is received.
    /// </summary>
    event EventHandler<MqttMessageReceivedEventArgs>? MessageReceived;
}

/// <summary>
/// Event arguments for MQTT message received events.
/// </summary>
public class MqttMessageReceivedEventArgs : EventArgs
{
    public required string Topic { get; init; }
    public required string Payload { get; init; }
    public DateTime ReceivedAt { get; init; } = DateTime.UtcNow;
}
