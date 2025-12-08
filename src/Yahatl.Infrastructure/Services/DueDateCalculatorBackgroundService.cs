using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Background service that periodically recalculates due dates for notes with triggers.
/// </summary>
public class DueDateCalculatorBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DueDateCalculatorBackgroundService> _logger;
    private readonly int _intervalSeconds;

    public DueDateCalculatorBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<DueDateCalculatorBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _intervalSeconds = configuration.GetValue<int>("BackgroundServices:DueDateIntervalSeconds", 60);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Due Date Calculator Background Service starting, interval: {Interval}s", _intervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await EvaluateDueDatesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Due Date Calculator Background Service");
            }

            await Task.Delay(TimeSpan.FromSeconds(_intervalSeconds), stoppingToken);
        }

        _logger.LogInformation("Due Date Calculator Background Service stopping");
    }

    private async Task EvaluateDueDatesAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IDueDateCalculatorService>();

        await service.EvaluateAllDueNotesAsync(cancellationToken);
    }
}
