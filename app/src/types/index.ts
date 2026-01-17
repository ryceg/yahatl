/**
 * Type definitions for yahatl mobile app
 */

export type Trait = 'actionable' | 'recurring' | 'habit' | 'chore' | 'reminder' | 'note';
export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type RecurrenceType = 'calendar' | 'elapsed' | 'frequency';
export type BlockerMode = 'ANY' | 'ALL';
export type ListVisibility = 'private' | 'shared';

export interface CompletionRecord {
  user_id: string;
  timestamp: string;
}

export interface RecurrenceThreshold {
  at_days_remaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Recurrence {
  type: RecurrenceType;
  // Calendar-based fields
  calendar_pattern?: string;
  // Elapsed-based fields
  elapsed_interval?: number;
  elapsed_unit?: 'days' | 'weeks' | 'months' | 'years';
  // Frequency-based fields
  frequency_count?: number;
  frequency_period?: number;
  frequency_unit?: 'days' | 'weeks' | 'months';
  thresholds?: RecurrenceThreshold[];
}

export interface Requirements {
  mode: BlockerMode;
  location?: string[];
  people?: string[];
  time_constraints?: string[];
  context?: string[];
  sensors?: string[];
}

export interface Blockers {
  mode: BlockerMode;
  items?: string[];
  sensors?: string[];
}

export interface YahtlItem {
  uid: string;
  title: string;
  description?: string;

  // Type & Organization
  traits: Trait[];
  tags: string[];
  list_id?: string;

  // Status
  status: ItemStatus;
  needs_detail: boolean;

  // Scheduling
  due?: string;
  time_estimate?: number;
  buffer_before?: number;
  buffer_after?: number;

  // Recurrence
  recurrence?: Recurrence;

  // Requirements & Blockers
  requirements?: Requirements;
  blockers?: Blockers;

  // Tracking
  completion_history: CompletionRecord[];
  current_streak: number;
  created_at: string;
  created_by: string;

  // Queue scoring (populated by get_queue)
  score?: number;
  score_breakdown?: {
    overdue?: number;
    due_today?: number;
    due_this_week?: number;
    frequency_threshold?: number;
    habit_at_risk?: number;
    explicit_priority?: number;
    recently_unblocked?: number;
    context_match?: number;
    total: number;
  };
}

export interface YahtlList {
  list_id: string;
  name: string;
  owner: string;
  visibility: ListVisibility;
  shared_with: string[];
  is_inbox: boolean;
  items: YahtlItem[];
}

export interface QueueItem extends YahtlItem {
  score: number;
  score_breakdown: {
    overdue?: number;
    due_today?: number;
    due_this_week?: number;
    frequency_threshold?: number;
    habit_at_risk?: number;
    explicit_priority?: number;
    recently_unblocked?: number;
    context_match?: number;
    total: number;
  };
}

export interface ContextState {
  location?: string;
  people?: string[];
  contexts?: string[];
  available_time?: number;
}

export interface PomodoroConfig {
  work_duration: number; // minutes
  short_break: number; // minutes
  long_break: number; // minutes
  sessions_before_long_break: number;
}

export interface PomodoroState {
  active: boolean;
  item_id?: string;
  item_title?: string;
  is_break: boolean;
  session_count: number;
  time_remaining: number; // seconds
  started_at?: string;
}

export interface AppConfig {
  ha_url: string;
  ha_token: string;
  default_list_id?: string;
  pomodoro: PomodoroConfig;
}
