using Microsoft.Extensions.Diagnostics.HealthChecks;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Mqtt;

/// <summary>
/// Health check for MQTT broker connectivity.
/// </summary>
public class MqttHealthCheck(IMqttService mqttService) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (mqttService.IsConnected)
        {
            return Task.FromResult(HealthCheckResult.Healthy("MQTT broker is connected"));
        }

        return Task.FromResult(HealthCheckResult.Unhealthy("MQTT broker is not connected"));
    }
}
