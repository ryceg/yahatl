export interface CompletionRecord {
  user_id: string;
  timestamp: string;
}

export interface RecurrenceThreshold {
  at_days_remaining: number;
  priority: string;
}

export interface RecurrenceConfig {
  type: "calendar" | "elapsed" | "frequency";
  calendar_preset?: string | null;
  calendar_days?: number[] | null;
  calendar_days_of_month?: number[] | null;
  elapsed_interval?: number | null;
  elapsed_unit?: string | null;
  frequency_count?: number | null;
  frequency_period?: number | null;
  frequency_unit?: string | null;
  thresholds?: RecurrenceThreshold[];
}

export interface ConditionTriggerConfig {
  entity_id: string;
  operator: string;
  value: string;
  attribute?: string | null;
  on_match?: string;
}

export interface TimeBlockerConfig {
  start_time: string;
  end_time: string;
  mode?: string;
  days?: number[] | null;
}

export interface BlockerConfig {
  mode?: string;
  items?: string[];
  item_mode?: string;
  sensors?: string[];
  sensor_mode?: string;
}

export interface RequirementsConfig {
  mode?: string;
  location?: string[];
  people?: string[];
  time_constraints?: string[];
  context?: string[];
  sensors?: string[];
}

export interface YahtlItem {
  uid: string;
  title: string;
  description: string;
  traits: string[];
  tags: string[];
  status: string;
  needs_detail: boolean;
  due: string | null;
  time_estimate: number | null;
  buffer_before: number;
  buffer_after: number;
  recurrence: RecurrenceConfig | null;
  blockers: BlockerConfig | null;
  requirements: RequirementsConfig | null;
  condition_triggers: ConditionTriggerConfig[];
  time_blockers: TimeBlockerConfig[];
  deferred_until: string | null;
  priority: string | null;
  project: string | null;
  assigned_to: string[];
  completion_history: CompletionRecord[];
  current_streak: number;
  last_completed: string | null;
  created_at: string;
  created_by: string;
}

export interface YahtlItemSummary {
  uid: string;
  title: string;
  status: string;
  traits: string[];
  tags: string[];
  priority: string | null;
  due: string | null;
  needs_detail: boolean;
  assigned_to: string[];
  time_estimate: number | null;
  deferred_until: string | null;
  has_recurrence: boolean;
  has_blockers: boolean;
  current_streak: number;
  project: string | null;
}

export interface YahtlListInfo {
  entity_id: string;
  list_id: string;
  name: string;
  owner: string;
  visibility: string;
  shared_with: string[];
  is_inbox: boolean;
  item_count: number;
}

export interface QueueEntry {
  item: YahtlItem;
  list_id: string;
  list_name: string;
  score: number;
}

export interface QueueResult {
  items: QueueEntry[];
  context: Record<string, unknown>;
  overdue_count: number;
  due_today_count: number;
  blocked_count: number;
  next_task_title: string | null;
  total_actionable: number;
}

export interface ContextOverride {
  location: string | null;
  people: string[];
  contexts: string[];
  updated_at?: string;
}

export interface MetaEntry {
  id: string;
  name: string;
  icon: string;
}

export interface MetaConfig {
  contexts: MetaEntry[];
  locations: MetaEntry[];
}

export interface TagInfo {
  name: string;
  count: number;
}

// Home Assistant types (minimal subset)
export interface HomeAssistant {
  callWS: <T>(msg: Record<string, unknown>) => Promise<T>;
  user: { id: string; name: string; is_admin: boolean };
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
}
