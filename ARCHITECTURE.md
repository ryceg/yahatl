# YAHATL Architecture Overview

## Overview

YAHATL is a native Home Assistant custom integration for task, habit, and chore management. All data is stored locally in SQLite, and the mobile app connects directly to Home Assistant's API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Home Assistant                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              custom_components/yahatl/               │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌────────────┐  ┌───────────────┐   │   │
│  │  │ __init__ │  │ coordinator│  │  http.py      │   │   │
│  │  │  setup   │  │  data sync │  │  REST API     │   │   │
│  │  └──────────┘  └────────────┘  └───────────────┘   │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐    │   │
│  │  │ todo.py  │  │sensor.py │  │ binary_sensor  │    │   │
│  │  │ 4 lists  │  │ 5 stats  │  │ 2 states       │    │   │
│  │  └──────────┘  └──────────┘  └────────────────┘    │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              db/                             │   │   │
│  │  │  models.py        repository.py              │   │   │
│  │  │  SQLAlchemy       Data Access Layer          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│              ┌─────────────────────────┐                   │
│              │  .storage/yahatl.db     │                   │
│              │  (SQLite)               │                   │
│              └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTP
                           │ /api/yahatl/*
                           ▼
                 ┌─────────────────┐
                 │   Mobile App    │
                 │ (React Native)  │
                 └─────────────────┘
```

## Components

### custom_components/yahatl/

| File | Purpose |
|------|---------|
| `__init__.py` | Integration setup, service registration |
| `config_flow.py` | UI configuration wizard |
| `coordinator.py` | DataUpdateCoordinator for data sync |
| `const.py` | Constants, domain name, service names |
| `entity.py` | Base entity class |
| `http.py` | REST API for mobile app |
| `todo.py` | Native todo list entities |
| `sensor.py` | Dashboard stat sensors |
| `binary_sensor.py` | Pomodoro and overdue sensors |
| `calendar.py` | Tasks/chores as calendar events |
| `services.yaml` | Service definitions |

### db/

| File | Purpose |
|------|---------|
| `models.py` | SQLAlchemy ORM models |
| `repository.py` | Data access layer with CRUD methods |

### Mobile App (apps/mobile/)

React Native app using Expo SDK 52+.

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router file-based routes |
| `components/` | UI components |
| `lib/api/` | API client (manual, no codegen) |
| `lib/stores/` | Zustand state stores |
| `lib/hooks/` | TanStack Query hooks |

## Data Flow

### Entity Updates
1. User or mobile app triggers action
2. Repository updates SQLite database
3. Coordinator refreshes data
4. Entities reflect new state

### Mobile App Requests
1. Mobile app calls `/api/yahatl/*`
2. HA authenticates via Long-Lived Access Token
3. `http.py` views handle request
4. Repository performs database operation
5. Coordinator refreshes for entity updates
6. Response returned to mobile app

## Technology Stack

| Layer | Technology |
|-------|------------|
| Platform | Home Assistant |
| Language | Python 3.11+ |
| Database | SQLite (SQLAlchemy ORM) |
| HTTP | aiohttp (via HA HTTP component) |
| Mobile App | React Native + Expo |
| State | TanStack Query + Zustand |
| Styling | NativeWind (Tailwind) |

## Key Design Principles

1. **HA-Native**: Built as a proper HA custom component
2. **Self-Contained**: SQLite database, no external dependencies
3. **Mobile-First**: REST API designed for mobile app consumption
4. **Entity-Centric**: Full HA entity integration (todo, sensors, calendar)
5. **Automatable**: Services exposed for HA automations
