# YAHATL Architecture Overview

## Solution Structure

The YAHATL solution follows Clean Architecture principles with .NET Aspire for cloud-native orchestration.

## Projects

### Core Application Projects

#### Yahatl.Domain
- **Purpose**: Domain entities, value objects, and interfaces
- **Dependencies**: None (pure C# with no external dependencies)
- **Contents**:
  - Entities: `Note`, `User`, `Household`, `Tag`, `Trigger`, `Blocker`, `Behaviour`
  - Value Objects: Domain-specific types
  - Interfaces: Repository contracts, service interfaces
  - Domain Events

#### Yahatl.Infrastructure
- **Purpose**: Infrastructure implementations
- **Dependencies**: Yahatl.Domain
- **Contents**:
  - Entity Framework Core DbContext
  - Repository implementations
  - MQTT client for Home Assistant integration
  - External service integrations (Google OAuth, Calendar, Contacts)
  - Background services for scheduled jobs

#### Yahatl.Api
- **Purpose**: ASP.NET Core Web API
- **Dependencies**: Yahatl.ServiceDefaults, Yahatl.Domain, Yahatl.Infrastructure
- **Contents**:
  - REST API endpoints
  - Controllers/Minimal APIs
  - DTOs and request/response models
  - API authentication and authorization

#### Yahatl.Api.Client
- **Purpose**: Generated TypeScript client
- **Dependencies**: None (output only)
- **Contents**:
  - NSwag-generated TypeScript client
  - Type definitions
  - npm package configuration for React Native consumption

### Aspire Projects

#### Yahatl.AppHost
- **Purpose**: Aspire orchestration and service composition
- **Dependencies**: Yahatl.Api (as project reference)
- **Contents**:
  - Service orchestration configuration
  - PostgreSQL database provisioning
  - Redis cache configuration
  - Service discovery setup

#### Yahatl.ServiceDefaults
- **Purpose**: Shared cross-cutting concerns
- **Dependencies**: None (standalone library)
- **Contents**:
  - OpenTelemetry configuration (metrics, traces, logs)
  - Health check configuration
  - Service discovery configuration
  - Resilience patterns (retry, circuit breaker)

### Test Projects

- **Yahatl.Domain.Tests**: Unit tests for domain logic
- **Yahatl.Api.Tests**: Integration tests for API endpoints
- **Yahatl.Infrastructure.Tests**: Tests for data access and external integrations

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Yahatl.AppHost                         │
│                   (Aspire Orchestration)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┬─────────────┬──────────────┐
         │                       │             │              │
    ┌────▼────┐            ┌────▼────┐   ┌───▼───┐    ┌────▼────┐
    │   API   │            │PostgreSQL│   │ Redis │    │ PgAdmin │
    └────┬────┘            └──────────┘   └───────┘    └─────────┘
         │
         ├──── Uses ────┐
         │              │
    ┌────▼──────────┐   │
    │ServiceDefaults│   │
    │  - Telemetry  │   │
    │  - Health     │   │
    │  - Discovery  │   │
    └───────────────┘   │
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ┌────▼────────────┐      ┌────────▼────────┐
    │ Infrastructure  │      │     Domain      │
    │  - DbContext    │◄─────┤  - Entities     │
    │  - Repositories │      │  - Interfaces   │
    │  - MQTT Client  │      │  - Events       │
    └─────────────────┘      └─────────────────┘
```

## Data Flow

1. **Request Flow**:
   - Client → API Endpoint
   - API → Application Service (to be added)
   - Application Service → Domain Logic
   - Domain → Repository Interface
   - Infrastructure → EF Core → PostgreSQL

2. **MQTT Integration**:
   - Home Assistant → MQTT Broker → Infrastructure MQTT Client
   - Infrastructure → Domain Events → Application Services
   - Application Services → API → Client notifications

3. **Aspire Orchestration**:
   - AppHost starts all services
   - Service Discovery provides connection strings
   - OpenTelemetry collects metrics and traces
   - Dashboard displays service health and logs

## Technology Stack

- **Framework**: .NET 10
- **API**: ASP.NET Core Web API with Minimal APIs
- **ORM**: Entity Framework Core
- **Database**: PostgreSQL
- **Cache**: Redis
- **MQTT**: MQTTnet (for Home Assistant integration)
- **Orchestration**: .NET Aspire
- **Observability**: OpenTelemetry
- **Testing**: xUnit
- **Client Generation**: NSwag (TypeScript/Fetch API)

## Key Design Principles

1. **Clean Architecture**: Domain at the center, dependencies point inward
2. **Cloud-Native**: Designed for containerized deployment with Aspire
3. **Observable**: Built-in OpenTelemetry support for metrics, traces, and logs
4. **Resilient**: Service defaults include retry policies and circuit breakers
5. **Testable**: Clear separation of concerns enables unit and integration testing
6. **Multi-tenant**: Household-based data isolation built into the domain model

## Deployment

The application is designed to be deployed as:
- Docker containers (via Aspire)
- Self-hosted alongside Home Assistant
- Uses existing Home Assistant MQTT broker

## Next Steps

1. Implement domain entities and EF Core migrations
2. Add authentication and authorization
3. Create API endpoints for core functionality
4. Generate TypeScript client for React Native app
5. Implement MQTT integration for Home Assistant
