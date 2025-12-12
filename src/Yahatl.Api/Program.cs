using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Aspire service defaults (OpenTelemetry, health checks, service discovery)
builder.AddServiceDefaults();

// Register DbContext without pooling since ICurrentUserService is scoped
// Aspire's AddNpgsqlDbContext uses pooling which is incompatible with scoped services
builder.Services.AddDbContext<Yahatl.Infrastructure.Data.YahatlDbContext>((sp, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("yahatl");
    options.UseNpgsql(connectionString);
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<Yahatl.Domain.Services.ICurrentUserService, Yahatl.Api.Services.CurrentUserService>();
builder.Services.AddScoped<Yahatl.Infrastructure.Identity.IPasswordHasher, Yahatl.Infrastructure.Identity.PasswordHasher>();
builder.Services.AddScoped<Yahatl.Domain.Services.IDayGeneratorService, Yahatl.Infrastructure.Services.DayGeneratorService>();

// MediatR for domain events
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Yahatl.Infrastructure.Mqtt.EventHandlers.ChoreCreatedEventHandler).Assembly));

// MQTT services for Home Assistant integration
builder.Services.AddSingleton<Yahatl.Infrastructure.Mqtt.MqttClientService>();
builder.Services.AddSingleton<Yahatl.Domain.Services.IMqttService>(sp => sp.GetRequiredService<Yahatl.Infrastructure.Mqtt.MqttClientService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<Yahatl.Infrastructure.Mqtt.MqttClientService>());
builder.Services.AddScoped<Yahatl.Infrastructure.Mqtt.HomeAssistantDiscoveryService>();
builder.Services.AddScoped<Yahatl.Domain.Services.IHaDiscoveryService>(sp => sp.GetRequiredService<Yahatl.Infrastructure.Mqtt.HomeAssistantDiscoveryService>());
builder.Services.AddScoped<Yahatl.Infrastructure.Mqtt.StatePublisher>();
builder.Services.AddScoped<Yahatl.Domain.Services.IStatePublisher>(sp => sp.GetRequiredService<Yahatl.Infrastructure.Mqtt.StatePublisher>());

// Due Date Calculator Service (Issue #21)
builder.Services.AddScoped<Yahatl.Domain.Services.IDueDateCalculatorService, Yahatl.Infrastructure.Services.DueDateCalculatorService>();
builder.Services.AddHostedService<Yahatl.Infrastructure.Services.DueDateCalculatorBackgroundService>();

// Blocker Evaluator Service (Issue #22)
builder.Services.AddScoped<Yahatl.Domain.Services.IBlockerEvaluatorService, Yahatl.Infrastructure.Services.BlockerEvaluatorService>();
builder.Services.AddHostedService<Yahatl.Infrastructure.Services.BlockerEvaluatorBackgroundService>();

// Notification Service (Issue #23)
builder.Services.AddHttpClient<Yahatl.Infrastructure.Services.NotificationService>();
builder.Services.AddScoped<Yahatl.Domain.Services.INotificationService, Yahatl.Infrastructure.Services.NotificationService>();
builder.Services.AddHostedService<Yahatl.Infrastructure.Services.NotificationBackgroundService>();

// MQTT health check
builder.Services.AddHealthChecks()
    .AddCheck<Yahatl.Infrastructure.Mqtt.MqttHealthCheck>("mqtt");

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApiDocument(options =>
{
    options.Title = "Yahatl API";
    options.Version = "v1";
    options.DocumentName = "v1";
    options.AddSecurity("Bearer", Enumerable.Empty<string>(), new NSwag.OpenApiSecurityScheme
    {
        Type = NSwag.OpenApiSecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Description = "Type into the textbox: {your JWT token}."
    });
});

var app = builder.Build();

// Apply migrations automatically in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<Yahatl.Infrastructure.Data.YahatlDbContext>();
    try
    {
        // Use EnsureCreated for dev to create schema without migrations
        // For production, use: dbContext.Database.Migrate();
        dbContext.Database.EnsureCreated();
        Console.WriteLine("[Database] Schema created/verified successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database] Warning: Could not create schema: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseOpenApi(options =>
    {
        options.Path = "/swagger/{documentName}/swagger.json";
        options.DocumentName = "v1";
    });
    app.UseSwaggerUi(options =>
    {
        options.Path = "/swagger";
        options.DocumentTitle = "Yahatl API";
    });

    // Generate TypeScript client on startup
    _ = Task.Run(async () =>
    {
        // Wait for the server to fully start
        await Task.Delay(2000);

        var clientDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Yahatl.Api.Client"));
        if (Directory.Exists(clientDir))
        {
            var process = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "npm",
                    Arguments = "run generate",
                    WorkingDirectory = clientDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            Console.WriteLine($"[NSwag] Generating TypeScript client from {clientDir}...");
            process.Start();
            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode == 0)
            {
                Console.WriteLine("[NSwag] TypeScript client generated successfully.");
            }
            else
            {
                Console.WriteLine($"[NSwag] Client generation failed: {error}");
            }
        }
        else
        {
            Console.WriteLine($"[NSwag] Client directory not found: {clientDir}");
        }
    });
}

// Map default endpoints (health checks)
app.MapDefaultEndpoints();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Simple health endpoint for verification
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("Health");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
