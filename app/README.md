# yahatl Mobile App

React Native mobile app for yahatl - Yet Another Home Assistant Todo List.

## Features

### Phase 5 Implementation - Complete ✅

#### Planning Tab
- **Priority Queue**: View tasks sorted by dynamic priority score
- **Context Management**: Filter tasks by location, available time, and context
- **Pomodoro Integration**: Start focused work sessions directly from queue
- **Real-time Updates**: Pull to refresh with offline caching

#### Capture Tab
- **Quick Capture**: FAB button for instant idea capture
- **Inbox Management**: View all items flagged for later processing
- **Triage Workflow**: Card-by-card processing with:
  - Trait selection (actionable, habit, chore, reminder, note, recurring)
  - Tag management
  - Quick delete option
  - Auto-unflag when triaged

#### Notes Tab
- **Notes Browser**: View all items with 'note' trait
- **Search**: Full-text search across titles and descriptions
- **Tag Filtering**: Filter notes by tags with multi-select
- **Flesh Out Mode**: Dedicated view for items needing detail
  - Quick access to all incomplete items
  - Inline editing with title and description
  - Auto-unflag when saved

#### Core Features
- **Authentication**: Secure long-lived token storage with Expo SecureStore
- **Offline Support**: React Query caching with stale-while-revalidate
- **Pomodoro Timer**:
  - Configurable work/break durations
  - Session tracking
  - Background timer support
  - Push notifications
- **Type-safe API**: Full TypeScript support with yahatl types

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Home Assistant instance with yahatl integration installed
- Long-lived access token from Home Assistant

## Installation

```bash
# Install dependencies
cd app
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## Configuration

### Home Assistant Setup

1. Install yahatl integration in Home Assistant (see main README)
2. Create a long-lived access token:
   - Go to Profile → Security → Long-Lived Access Tokens
   - Create a new token
   - Copy the token (you won't see it again!)

### App Setup

1. Launch the app
2. Enter your Home Assistant URL (e.g., `http://192.168.1.100:8123`)
3. Paste your long-lived access token
4. Tap "Connect"

The app will test the connection and save your credentials securely.

## Architecture

```
app/
├── src/
│   ├── api/
│   │   └── client.ts          # HA API client
│   ├── components/
│   │   ├── ItemCard.tsx       # Reusable item display
│   │   └── FloatingActionButton.tsx
│   ├── context/
│   │   ├── AuthContext.tsx    # Auth state & API client
│   │   └── PomodoroContext.tsx # Pomodoro timer state
│   ├── hooks/
│   │   └── useYahatl.ts       # React Query hooks
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Bottom tab navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── PlanningScreen.tsx
│   │   ├── CaptureScreen.tsx
│   │   └── NotesScreen.tsx
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── utils/
├── App.tsx                    # Root component
├── app.json                   # Expo config
└── package.json
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: React Query for server state
- **Storage**: Expo SecureStore (credentials) + AsyncStorage (config)
- **Notifications**: Expo Notifications
- **Gestures**: React Native Gesture Handler
- **Type Safety**: TypeScript

## Building for Production

### Android APK

```bash
# Build APK
eas build --platform android --profile preview

# Or local build
npx expo prebuild
npx react-native run-android --variant=release
```

### iOS (macOS required)

```bash
# Build for iOS
eas build --platform ios --profile preview
```

## Troubleshooting

### Connection Issues

- Verify your HA URL is accessible from your device
- Check that yahatl integration is installed and configured
- Ensure your token is valid and not expired
- Try using your HA's local IP instead of domain name

### Offline Mode

- The app caches data for offline viewing
- Writes (add, update, complete) require connection
- Pull to refresh when connection is restored

### Notifications Not Working

- Grant notification permissions in device settings
- Check that Expo Notifications are configured in app.json
- Verify foreground service permissions on Android

## Development

### Adding New Features

1. Types: Add to `src/types/index.ts`
2. API Methods: Extend `src/api/client.ts`
3. React Query Hooks: Add to `src/hooks/useYahatl.ts`
4. UI: Create components in `src/components/` or screens in `src/screens/`

### Testing

```bash
# Type check
npm run type-check

# Lint
npm run lint
```

## Future Enhancements

- [ ] iOS support (currently Android-focused)
- [ ] OAuth authentication
- [ ] Home screen widgets
- [ ] Wear OS companion app
- [ ] Offline write queue
- [ ] Rich text notes with markdown
- [ ] Voice input for quick capture
- [ ] Location-based reminders

## License

See main repository LICENSE file.
