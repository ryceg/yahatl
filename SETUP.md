# YAHATL Setup Guide

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (or generic Docker) for running dependencies via Aspire.

## Architecture

The project uses [.NET Aspire](https://learn.microsoft.com/en-us/dotnet/aspire/) to orchestrate the application and its dependencies (PostgreSQL, Redis, etc.).

- **Yahatl.AppHost**: The entry point that provisions containers and configures service discovery.
- **Yahatl.Api**: The backend API.
- **Yahatl.Infrastructure**: Data access layer (EF Core).

## Running the Application

1. Open the solution in VS Code or Visual Studio.
2. Run the **Yahatl.AppHost** project.
   - Command line: `dotnet run --project src/Yahatl.AppHost`
3. Aspire will spin up:
   - PostgreSQL container (port randomized, connection string managed by Aspire)
   - Redis container
   - API service

## Database Setup

The PostgreSQL database is automatically provisioned by Aspire.

### Migrations

Entity Framework Core migrations manage the database schema.

To create a new migration (requires `dotnet-ef` tool):

```bash
dotnet ef migrations add <MigrationName> -p src/Yahatl.Infrastructure -s src/Yahatl.Api
```

To update the database manually (locally):

```bash
dotnet ef database update -p src/Yahatl.Infrastructure -s src/Yahatl.Api
```

**Note**: When running via Aspire, the application can be configured to apply migrations on startup (currently not enabled by default, requires manual run or dev-time tools).

### Accessing the Database

You can use the **PgAdmin** instance provided by Aspire (if configured) or connect using the connection string found in the Aspire Dashboard console logs.
