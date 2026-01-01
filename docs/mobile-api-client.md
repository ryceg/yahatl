# Mobile App API Client

The YAHATL mobile app connects directly to Home Assistant. No code generation is needed—the API client is manually maintained.

## Configuration

Set your Home Assistant URL in the environment:

```bash
# .env or app.config.js
EXPO_PUBLIC_API_URL=http://homeassistant.local:8123/api/yahatl
```

## Authentication

The app uses Home Assistant Long-Lived Access Tokens:

1. In Home Assistant: Profile → Security → Long-Lived Access Tokens
2. Create a new token
3. Store the token in the app's auth store

## API Client (`lib/api/client.ts`)

The client is a simple fetch wrapper:

```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Auth/login` | POST | Login (returns user info) |
| `/notes` | GET | List notes |
| `/notes` | POST | Create note |
| `/notes/{id}` | GET | Get note |
| `/notes/{id}` | PUT | Update note |
| `/notes/{id}` | DELETE | Archive note |
| `/notes/capture` | POST | Quick capture to inbox |
| `/notes/{id}/behaviours/task` | POST | Add task behaviour |
| `/notes/{id}/behaviours/task/complete` | POST | Complete task |
| `/notes/{id}/behaviours/habit` | POST | Add habit |
| `/notes/{id}/behaviours/habit/complete` | POST | Log habit |
| `/notes/{id}/behaviours/chore` | POST | Add chore |
| `/notes/{id}/behaviours/chore/complete` | POST | Complete chore |
| `/Dashboard/summary` | GET | Dashboard stats |
| `/Pomodoro/start` | POST | Start timer |
| `/Pomodoro/stop` | POST | Stop timer |
| `/Pomodoro/current` | GET | Current session |

## Response Types

All responses use camelCase field names.

### NoteResponse
```typescript
interface NoteResponse {
  id: string;
  title: string;
  body: string | null;
  templateType: string;
  ownerId: string;
  assigneeId: string | null;
  isArchived: boolean;
  isInbox: boolean;
  needsDetail: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  behaviours?: BehaviourResponse[];
}
```

### TaskBehaviourResponse
```typescript
interface TaskBehaviourResponse {
  type: 'Task';
  id: string;
  noteId: string;
  status: 'Pending' | 'InProgress' | 'Complete' | 'Cancelled';
  dueDate: string | null;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  completedAt: string | null;
}
```

### DashboardSummary
```typescript
interface DashboardSummary {
  overdueCount: number;
  dueTodayCount: number;
  inboxCount: number;
  blockedCount: number;
  streaksAtRisk: number;
}
```

## TanStack Query Hooks

Example usage with TanStack Query:

```typescript
// lib/hooks/useNotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: () => apiRequest<{ items: NoteResponse[] }>('/notes'),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteRequest) =>
      apiRequest<NoteResponse>('/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
```

## Legacy NSwag Client

The previous NSwag-generated client (`lib/api/client.ts`) can be replaced with the simpler manual client above. The generated types can still be used as reference for the API contract.
