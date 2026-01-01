/**
 * YAHATL API Client
 *
 * Simple fetch wrapper for connecting to Home Assistant YAHATL integration.
 * Uses HA Long-Lived Access Tokens for authentication.
 */

// =============================================================================
// Configuration
// =============================================================================

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// =============================================================================
// Core Request Function
// =============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (_accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${_accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => undefined);
    throw new ApiError(response.status, response.statusText, body);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// =============================================================================
// Types
// =============================================================================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  householdId: string;
}

export interface NoteResponse {
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
  linkedNotes: string[];
  blockedByNotes: string[];
  behaviours?: BehaviourResponse[];
}

export interface NoteListResponse {
  items: NoteResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type BehaviourResponse = TaskResponse | HabitResponse | ChoreResponse;

export interface TaskResponse {
  type: 'Task';
  id: string;
  noteId: string;
  status: 'Pending' | 'InProgress' | 'Complete' | 'Cancelled';
  dueDate: string | null;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  completedAt: string | null;
}

export interface HabitResponse {
  type: 'Habit';
  id: string;
  noteId: string;
  frequencyGoal: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null;
}

export interface ChoreResponse {
  type: 'Chore';
  id: string;
  noteId: string;
  intervalDays: number;
  lastCompleted: string | null;
  nextDue: string | null;
}

export interface DashboardSummary {
  overdueCount: number;
  dueTodayCount: number;
  inboxCount: number;
  blockedCount: number;
  streaksAtRisk: number;
}

export interface PomodoroResponse {
  id: string;
  userId: string;
  noteId: string | null;
  startedAt: string;
  durationMinutes: number;
  status: string;
}

export interface CreateNoteRequest {
  title: string;
  body?: string;
  templateType?: string;
  isInbox?: boolean;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  isInbox?: boolean;
  needsDetail?: boolean;
}

export type TemplateType = 'Note' | 'Task' | 'Habit' | 'Chore' | 'Person' | 'Project' | 'Recipe' | 'GiftIdea' | 'ShoppingItem';
export type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TaskExecutionStatus = 'Pending' | 'InProgress' | 'Complete' | 'Cancelled';

// Enum-like objects for component compatibility (matching old NSwag enums)
export const TemplateType = {
  Note: 'Note' as const,
  Task: 'Task' as const,
  Habit: 'Habit' as const,
  Chore: 'Chore' as const,
  Person: 'Person' as const,
  Project: 'Project' as const,
  Recipe: 'Recipe' as const,
  GiftIdea: 'GiftIdea' as const,
  ShoppingItem: 'ShoppingItem' as const,
};

export const Priority = {
  Low: 'Low' as const,
  Normal: 'Normal' as const,
  High: 'High' as const,
  Urgent: 'Urgent' as const,
};

export const TaskExecutionStatus = {
  Pending: 'Pending' as const,
  InProgress: 'InProgress' as const,
  Complete: 'Complete' as const,
  Cancelled: 'Cancelled' as const,
};

export const CandidateReason = {
  Overdue: 'Overdue' as const,
  DueToday: 'DueToday' as const,
  WindowClosingSoon: 'WindowClosingSoon' as const,
  StreakAtRisk: 'StreakAtRisk' as const,
  IntervalElapsed: 'IntervalElapsed' as const,
  ConditionMet: 'ConditionMet' as const,
  Available: 'Available' as const,
};

export type CandidateReason = typeof CandidateReason[keyof typeof CandidateReason];

// Additional types for component compatibility
export interface CandidateItem {
  noteId: string;
  title: string;
  templateType: TemplateType;
  priority?: Priority;
  dueDate?: string;
  reason?: CandidateReason;
  overdueDays?: number;
  streakAtRisk?: boolean;
}

export interface PlanItem {
  id: string;
  noteId: string;
  title: string;
  order: number;
  isComplete: boolean;
}

export interface UpcomingItem {
  noteId: string;
  title: string;
  dueDate: string;
  templateType: TemplateType;
}

export interface WaitingItem {
  noteId: string;
  title: string;
  blockerType: string;
  description?: string;
}

export interface StreakItem {
  noteId: string;
  title: string;
  currentStreak: number;
  longestStreak?: number;
  frequencyGoal?: string;
  atRisk: boolean;
}

// Additional behaviour response types for components
export interface TaskBehaviourResponse {
  type: 'Task';
  id: string;
  noteId: string;
  status: TaskExecutionStatus;
  dueDate: string | null;
  priority: Priority;
  completedAt: string | null;
}

export interface HabitBehaviourResponse {
  type: 'Habit';
  id: string;
  noteId: string;
  frequencyGoal?: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null;
}

export interface ChoreBehaviourResponse {
  type: 'Chore';
  id: string;
  noteId: string;
  intervalDays: number;
  lastCompleted: string | null;
  nextDue: string | null;
}

export interface ReminderBehaviourResponse {
  type: 'Reminder';
  id: string;
  noteId: string;
}

// Blocker and Trigger types for components
export interface BlockerResponse {
  id: string;
  noteId: string;
  type: string;
  isActive: boolean;
}

export interface TriggerResponse {
  id: string;
  noteId: string;
  type: string;
}

// Note list item (subset of NoteResponse for lists)
export type NoteListItemResponse = NoteResponse;

// =============================================================================
// Auth API
// =============================================================================

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// =============================================================================
// Notes API
// =============================================================================

export interface NotesParams {
  templateType?: string | null;
  tag?: string | null;
  needsDetail?: boolean | null;
  isInbox?: boolean | null;
  assigneeId?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}

export async function getNotes(params: NotesParams = {}): Promise<NoteListResponse> {
  const searchParams = new URLSearchParams();
  if (params.templateType) searchParams.set('templateType', params.templateType);
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.needsDetail !== null && params.needsDetail !== undefined) {
    searchParams.set('needsDetail', String(params.needsDetail));
  }
  if (params.isInbox !== null && params.isInbox !== undefined) {
    searchParams.set('isInbox', String(params.isInbox));
  }
  if (params.assigneeId) searchParams.set('assigneeId', params.assigneeId);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return request<NoteListResponse>(`/notes${query ? `?${query}` : ''}`);
}

export async function getNote(id: string): Promise<NoteResponse> {
  return request<NoteResponse>(`/notes/${id}`);
}

export async function createNote(data: CreateNoteRequest): Promise<NoteResponse> {
  return request<NoteResponse>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(id: string, data: UpdateNoteRequest): Promise<NoteResponse> {
  return request<NoteResponse>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string): Promise<void> {
  return request<void>(`/notes/${id}`, { method: 'DELETE' });
}

export async function captureNote(title: string, tags?: string[]): Promise<NoteResponse> {
  return request<NoteResponse>('/notes/capture', {
    method: 'POST',
    body: JSON.stringify({ title, tags }),
  });
}

// =============================================================================
// Behaviours API
// =============================================================================

export async function addTaskBehaviour(
  noteId: string,
  dueDate?: string,
  priority?: Priority
): Promise<TaskResponse> {
  return request<TaskResponse>(`/notes/${noteId}/behaviours/task`, {
    method: 'POST',
    body: JSON.stringify({ dueDate, priority }),
  });
}

export async function completeTask(noteId: string): Promise<TaskResponse> {
  return request<TaskResponse>(`/notes/${noteId}/behaviours/task/complete`, {
    method: 'POST',
  });
}

export async function addHabitBehaviour(
  noteId: string,
  frequencyGoal?: string
): Promise<HabitResponse> {
  return request<HabitResponse>(`/notes/${noteId}/behaviours/habit`, {
    method: 'POST',
    body: JSON.stringify({ frequencyGoal }),
  });
}

export async function logHabit(noteId: string): Promise<HabitResponse> {
  return request<HabitResponse>(`/notes/${noteId}/behaviours/habit/complete`, {
    method: 'POST',
  });
}

export async function addChoreBehaviour(
  noteId: string,
  intervalDays?: number
): Promise<ChoreResponse> {
  return request<ChoreResponse>(`/notes/${noteId}/behaviours/chore`, {
    method: 'POST',
    body: JSON.stringify({ intervalDays }),
  });
}

export async function completeChore(noteId: string): Promise<ChoreResponse> {
  return request<ChoreResponse>(`/notes/${noteId}/behaviours/chore/complete`, {
    method: 'POST',
  });
}

// =============================================================================
// Dashboard API
// =============================================================================

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/Dashboard/summary');
}

// =============================================================================
// Pomodoro API
// =============================================================================

export async function startPomodoro(
  noteId?: string,
  durationMinutes?: number
): Promise<PomodoroResponse> {
  return request<PomodoroResponse>('/Pomodoro/start', {
    method: 'POST',
    body: JSON.stringify({ noteId, durationMinutes }),
  });
}

export async function stopPomodoro(): Promise<{ stopped: boolean }> {
  return request<{ stopped: boolean }>('/Pomodoro/stop', { method: 'POST' });
}

export async function getCurrentPomodoro(): Promise<PomodoroResponse | null> {
  return request<PomodoroResponse | null>('/Pomodoro/current');
}
