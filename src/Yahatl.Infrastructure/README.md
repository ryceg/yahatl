# Yahatl.Infrastructure

This project contains infrastructure concerns including data access, external service integrations, and persistence.

## Purpose

The Infrastructure layer implements interfaces defined in the Domain layer and provides concrete implementations for external concerns.

## Contents (to be implemented)

- **Data Access**: Entity Framework Core DbContext, repositories
- **MQTT Integration**: MQTT client for Home Assistant integration
- **External Services**: Google OAuth, Calendar, Contacts integration
- **Background Services**: Scheduled jobs, notification dispatch

## Dependencies

- References Yahatl.Domain
- Entity Framework Core
- MQTT client libraries
- External service SDKs
