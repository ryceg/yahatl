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

---

## Mobile App Setup

The mobile app is built with Expo and React Native, using NativeWind v4 for Tailwind-style styling.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (included with Node.js)
- Expo Go app on your mobile device, or iOS Simulator / Android Emulator

### Installation

```bash
cd apps/mobile
npm install
```

### Running the App

Start the development server:

```bash
cd apps/mobile
npx expo start
```

This opens the Expo Developer Tools. You can:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on your device

### Project Structure

```
apps/mobile/
├── app/                    # Expo Router file-based routes
├── components/ui/          # UI components (Button, Card, etc.)
├── constants/theme.ts      # Design tokens
├── lib/
│   ├── api/                # API client (TODO: NSwag integration)
│   └── utils.ts            # Utility functions
├── global.css              # CSS variables for theming
└── tailwind.config.js      # NativeWind/Tailwind configuration
```

### Dark Mode

The app automatically follows the system color scheme. Colors are defined as CSS variables in `global.css` with light and dark variants. The root layout (`app/_layout.tsx`) detects the color scheme and applies it app-wide.

### UI Components

The following components are available in `components/ui/`:

- **Button** - Primary, secondary, outline, destructive, ghost, link variants
- **Input** - Text input with label and error state
- **Card** - Container with Header, Title, Description, Content, Footer
- **Badge** - Status indicators with multiple variants
- **Sheet** - Bottom sheet for detail views
- **Dialog** - Modal dialogs for confirmations

### API Client (TODO)

The API client integration is pending NSwag client generation. See `lib/api/client.ts` for implementation details and next steps.

