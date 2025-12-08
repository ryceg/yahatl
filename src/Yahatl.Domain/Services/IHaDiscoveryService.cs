namespace Yahatl.Domain.Services;

/// <summary>
/// Service interface for Home Assistant MQTT Discovery.
/// Publishes discovery configurations so HA auto-discovers YAHATL entities.
/// </summary>
public interface IHaDiscoveryService
{
    /// <summary>
    /// Publish all discovery configs and initial states to Home Assistant.
    /// </summary>
    Task PublishDiscoveryAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Update all entity states in MQTT.
    /// </summary>
    Task UpdateStatesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish discovery for a specific chore entity.
    /// </summary>
    Task PublishChoreDiscoveryAsync(Guid noteId, string choreName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove discovery for a specific chore entity (publishes empty payload).
    /// </summary>
    Task RemoveChoreDiscoveryAsync(Guid noteId, CancellationToken cancellationToken = default);
}
