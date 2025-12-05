# YAHATL Setup Guide

This document provides instructions for setting up and running the YAHATL application locally.

## Prerequisites

- .NET 10 SDK (version 10.0.100 or later)
- Docker Desktop (for running PostgreSQL, Redis, and the Aspire dashboard)
- An IDE (Visual Studio 2022, Visual Studio Code, or JetBrains Rider)

## Project Structure

```
Yahatl/
├── src/
│   ├── Yahatl.AppHost/           # Aspire orchestration project
│   ├── Yahatl.ServiceDefaults/   # Shared service configuration (OpenTelemetry, health checks)
│   ├── Yahatl.Api/               # ASP.NET Core Web API
│   ├── Yahatl.Api.Client/        # Generated TypeScript client (to be configured)
│   ├── Yahatl.Domain/            # Domain entities and interfaces
│   └── Yahatl.Infrastructure/    # EF Core, MQTT, external services
├── tests/
│   ├── Yahatl.Domain.Tests/
│   ├── Yahatl.Api.Tests/
│   └── Yahatl.Infrastructure.Tests/
└── Yahatl.sln
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ryceg/yahatl.git
cd yahatl
```

### 2. Restore Dependencies

```bash
dotnet restore
```

### 3. Build the Solution

```bash
dotnet build
```

### 4. Run Tests

```bash
dotnet test
```

## Running with .NET Aspire

### Starting the Application

The easiest way to run the entire application stack (API + PostgreSQL + Redis) is through the Aspire AppHost:

```bash
cd src/Yahatl.AppHost
dotnet run
```

This will:
- Start the Aspire dashboard (typically at http://localhost:15000 or http://localhost:18888)
- Spin up PostgreSQL and Redis containers via Docker
- Start the YAHATL API
- Configure service discovery and OpenTelemetry

### Accessing the Services

Once running, you can access:

- **Aspire Dashboard**: Check the console output for the dashboard URL (usually http://localhost:15000)
- **API**: The API will be available at the URL shown in the Aspire dashboard (typically http://localhost:5000 or similar)
- **OpenAPI/Swagger**: Navigate to `/openapi/v1.json` on the API to see the OpenAPI specification
- **Health Check**: Visit `/health` on the API to verify it's running

### Viewing Logs and Metrics

The Aspire dashboard provides:
- Real-time logs from all services
- Metrics and traces via OpenTelemetry
- Resource status (containers, projects)
- Environment variables and configuration

## Running the API Standalone

If you prefer to run just the API without Aspire:

```bash
cd src/Yahatl.Api
dotnet run
```

Note: You'll need to manually set up PostgreSQL and Redis connections in appsettings.json.

## Configuration

### appsettings.json

The API project uses standard ASP.NET Core configuration. Key settings include:

- Connection strings for PostgreSQL
- Redis configuration
- MQTT broker settings (for Home Assistant integration)
- Authentication/JWT settings

### Aspire Service Discovery

When running via the AppHost, connection strings are automatically configured via Aspire service discovery. You don't need to manually configure database or Redis connections.

## Development Workflow

1. Make changes to code
2. Run tests: `dotnet test`
3. Start the AppHost to verify everything works together
4. Use the Aspire dashboard to monitor logs and metrics

## Next Steps

- Configure NSwag for TypeScript client generation (Issue #2)
- Set up Entity Framework Core with PostgreSQL (Issue #3)
- Implement authentication and multi-tenancy (Issue #4)

## Troubleshooting

### Aspire Dashboard Won't Start

Ensure Docker Desktop is running. Aspire requires Docker to run containers for databases and other services.

### Port Conflicts

If you see port conflict errors, check what's running on ports:
- 15000-18888: Aspire dashboard
- 5000-5001: API (default ports)
- 5432: PostgreSQL
- 6379: Redis

You can modify ports in the AppHost configuration or launchSettings.json files.

### Build Errors

Ensure you have .NET 10 SDK installed:
```bash
dotnet --version
```

Should show version 10.0.100 or later.

## Additional Resources

- [.NET Aspire Documentation](https://learn.microsoft.com/en-us/dotnet/aspire/)
- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core Documentation](https://learn.microsoft.com/en-us/ef/core/)
