using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Background service that periodically evaluates and updates blocker states.
/// </summary>
public class BlockerEvaluatorBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BlockerEvaluatorBackgroundService> _logger;
    private readonly int _intervalSeconds;

    public BlockerEvaluatorBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<BlockerEvaluatorBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _intervalSeconds = configuration.GetValue<int>("BackgroundServices:BlockerIntervalSeconds", 60);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Blocker Evaluator Background Service starting, interval: {Interval}s", _intervalSeconds);

        // Evaluate all blockers on startup (including ConditionBlockers for recheck)
        await EvaluateBlockersAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_intervalSeconds), stoppingToken);

            try
            {
                await EvaluateBlockersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Blocker Evaluator Background Service");
            }
        }

        _logger.LogInformation("Blocker Evaluator Background Service stopping");
    }

    private async Task EvaluateBlockersAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IBlockerEvaluatorService>();

        await service.EvaluateAllBlockersAsync(cancellationToken);
    }
}
