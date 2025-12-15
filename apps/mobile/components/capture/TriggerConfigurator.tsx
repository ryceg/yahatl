/**
 * TriggerConfigurator Component
 *
 * UI for configuring triggers (scheduling rules) when creating notes.
 * Supports Fixed (cron), Interval, Window, and Condition triggers.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  Calendar,
  Clock,
  Timer,
  Zap,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Button, Badge, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

// Trigger types available
export type TriggerType = 'fixed' | 'interval' | 'window' | 'condition';

interface TriggerOption {
  type: TriggerType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  description: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: 'fixed',
    label: 'Fixed Schedule',
    icon: Calendar,
    description: 'Specific days/times (e.g., every Tuesday)',
  },
  {
    type: 'interval',
    label: 'Interval',
    icon: Timer,
    description: 'Time since last completion',
  },
  {
    type: 'window',
    label: 'Time Window',
    icon: Clock,
    description: 'Preferred time slots',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: Zap,
    description: 'External state (MQTT)',
  },
];

// Common cron presets for easy selection
const CRON_PRESETS = [
  { label: 'Daily', value: '0 9 * * *', description: '9 AM every day' },
  { label: 'Weekly (Mon)', value: '0 9 * * 1', description: 'Monday at 9 AM' },
  { label: 'Weekly (Sat)', value: '0 10 * * 6', description: 'Saturday at 10 AM' },
  { label: 'Bi-weekly', value: '0 9 * * 1/2', description: 'Every other Monday' },
  { label: '1st of Month', value: '0 9 1 * *', description: '1st of month at 9 AM' },
];

// Common interval presets
const INTERVAL_PRESETS = [
  { label: 'Every 3 days', days: 3 },
  { label: 'Weekly', days: 7 },
  { label: 'Bi-weekly', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
];

// Day options for window triggers
const DAYS_OF_WEEK = [
  { label: 'Mon', value: 'monday' },
  { label: 'Tue', value: 'tuesday' },
  { label: 'Wed', value: 'wednesday' },
  { label: 'Thu', value: 'thursday' },
  { label: 'Fri', value: 'friday' },
  { label: 'Sat', value: 'saturday' },
  { label: 'Sun', value: 'sunday' },
];

// Comparison operators for conditions
const OPERATORS = [
  { label: '=', value: 'eq' },
  { label: '≠', value: 'neq' },
  { label: '>', value: 'gt' },
  { label: '<', value: 'lt' },
  { label: '≥', value: 'gte' },
  { label: '≤', value: 'lte' },
  { label: 'Boolean', value: 'bool' },
];

// Trigger configuration types
export interface FixedTriggerConfig {
  type: 'fixed';
  cronPattern: string;
}

export interface IntervalTriggerConfig {
  type: 'interval';
  intervalDays: number;
}

export interface WindowTriggerConfig {
  type: 'window';
  windowsJson: string;
  recurrence: string;
  windowExpiry: string;
}

export interface ConditionTriggerConfig {
  type: 'condition';
  mqttTopic: string;
  operator: string;
  value: string;
}

export type TriggerConfig =
  | FixedTriggerConfig
  | IntervalTriggerConfig
  | WindowTriggerConfig
  | ConditionTriggerConfig;

interface TriggerConfiguratorProps {
  triggers: TriggerConfig[];
  onChange: (triggers: TriggerConfig[]) => void;
  className?: string;
  /** Show only trigger types relevant for Chore/Reminder */
  showOnlyScheduling?: boolean;
}

export function TriggerConfigurator({
  triggers,
  onChange,
  className,
  showOnlyScheduling = false,
}: TriggerConfiguratorProps) {
  const [showAddTrigger, setShowAddTrigger] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addTrigger = (type: TriggerType) => {
    let newTrigger: TriggerConfig;

    switch (type) {
      case 'fixed':
        newTrigger = { type: 'fixed', cronPattern: '0 9 * * *' };
        break;
      case 'interval':
        newTrigger = { type: 'interval', intervalDays: 7 };
        break;
      case 'window':
        newTrigger = {
          type: 'window',
          windowsJson: JSON.stringify([
            { preference: 1, days: ['saturday'], time_range: '09:00-12:00' },
          ]),
          recurrence: 'weekly',
          windowExpiry: 'end_of_last_window',
        };
        break;
      case 'condition':
        newTrigger = {
          type: 'condition',
          mqttTopic: '',
          operator: 'eq',
          value: '',
        };
        break;
    }

    onChange([...triggers, newTrigger]);
    setShowAddTrigger(false);
    setExpandedIndex(triggers.length);
  };

  const updateTrigger = (index: number, updates: Partial<TriggerConfig>) => {
    const updated = [...triggers];
    updated[index] = { ...updated[index], ...updates } as TriggerConfig;
    onChange(updated);
  };

  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const getTriggerLabel = (trigger: TriggerConfig): string => {
    switch (trigger.type) {
      case 'fixed':
        return `Fixed: ${trigger.cronPattern}`;
      case 'interval':
        return `Every ${trigger.intervalDays} days`;
      case 'window':
        return 'Time Window';
      case 'condition':
        return trigger.mqttTopic || 'Condition (not configured)';
    }
  };

  const getTriggerIcon = (type: TriggerType) => {
    const option = TRIGGER_OPTIONS.find((o) => o.type === type);
    return option?.icon ?? Calendar;
  };

  const visibleOptions = showOnlyScheduling
    ? TRIGGER_OPTIONS.filter((o) => o.type !== 'condition')
    : TRIGGER_OPTIONS;

  return (
    <View className={cn('w-full', className)}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-foreground">
          Triggers (Scheduling)
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowAddTrigger(!showAddTrigger)}
        >
          <Plus size={16} color="#7c3aed" />
          <Text className="text-primary text-sm ml-1">Add</Text>
        </Button>
      </View>

      {/* Add Trigger Selector */}
      {showAddTrigger && (
        <View className="mb-3 p-3 bg-card rounded-lg border border-border">
          <Text className="text-xs text-muted-foreground mb-2">
            Select trigger type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {visibleOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => addTrigger(option.type)}
                  className="flex-row items-center gap-2 px-3 py-2 rounded-md border border-border bg-background"
                >
                  <Icon size={16} color="#71717a" />
                  <Text className="text-sm text-foreground">{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Configured Triggers */}
      {triggers.length === 0 && !showAddTrigger && (
        <Text className="text-sm text-muted-foreground italic">
          No triggers configured
        </Text>
      )}

      {triggers.map((trigger, index) => {
        const Icon = getTriggerIcon(trigger.type);
        const isExpanded = expandedIndex === index;

        return (
          <View
            key={index}
            className="mb-2 bg-card rounded-lg border border-border overflow-hidden"
          >
            <Pressable
              onPress={() => setExpandedIndex(isExpanded ? null : index)}
              className="flex-row items-center justify-between p-3"
            >
              <View className="flex-row items-center gap-2 flex-1">
                <Icon size={16} color="#7c3aed" />
                <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                  {getTriggerLabel(trigger)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable onPress={() => removeTrigger(index)}>
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
                {isExpanded ? (
                  <ChevronUp size={16} color="#71717a" />
                ) : (
                  <ChevronDown size={16} color="#71717a" />
                )}
              </View>
            </Pressable>

            {isExpanded && (
              <View className="px-3 pb-3 border-t border-border">
                {trigger.type === 'fixed' && (
                  <FixedTriggerForm
                    trigger={trigger}
                    onChange={(updates) => updateTrigger(index, updates)}
                  />
                )}
                {trigger.type === 'interval' && (
                  <IntervalTriggerForm
                    trigger={trigger}
                    onChange={(updates) => updateTrigger(index, updates)}
                  />
                )}
                {trigger.type === 'window' && (
                  <WindowTriggerForm
                    trigger={trigger}
                    onChange={(updates) => updateTrigger(index, updates)}
                  />
                )}
                {trigger.type === 'condition' && (
                  <ConditionTriggerForm
                    trigger={trigger}
                    onChange={(updates) => updateTrigger(index, updates)}
                  />
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================================================
// Trigger Type Forms
// ============================================================================

interface FixedTriggerFormProps {
  trigger: FixedTriggerConfig;
  onChange: (updates: Partial<FixedTriggerConfig>) => void;
}

function FixedTriggerForm({ trigger, onChange }: FixedTriggerFormProps) {
  return (
    <View className="mt-2">
      <Text className="text-xs text-muted-foreground mb-2">Quick Presets</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {CRON_PRESETS.map((preset) => (
          <Pressable
            key={preset.value}
            onPress={() => onChange({ cronPattern: preset.value })}
          >
            <Badge
              variant={trigger.cronPattern === preset.value ? 'default' : 'outline'}
            >
              <Text
                className={cn(
                  'text-xs',
                  trigger.cronPattern === preset.value
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                )}
              >
                {preset.label}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>
      <Input
        label="Cron Pattern"
        placeholder="0 9 * * *"
        value={trigger.cronPattern}
        onChangeText={(text) => onChange({ cronPattern: text })}
      />
    </View>
  );
}

interface IntervalTriggerFormProps {
  trigger: IntervalTriggerConfig;
  onChange: (updates: Partial<IntervalTriggerConfig>) => void;
}

function IntervalTriggerForm({ trigger, onChange }: IntervalTriggerFormProps) {
  return (
    <View className="mt-2">
      <Text className="text-xs text-muted-foreground mb-2">Quick Presets</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {INTERVAL_PRESETS.map((preset) => (
          <Pressable
            key={preset.days}
            onPress={() => onChange({ intervalDays: preset.days })}
          >
            <Badge
              variant={trigger.intervalDays === preset.days ? 'default' : 'outline'}
            >
              <Text
                className={cn(
                  'text-xs',
                  trigger.intervalDays === preset.days
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                )}
              >
                {preset.label}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>
      <Input
        label="Interval (days)"
        placeholder="7"
        value={trigger.intervalDays.toString()}
        onChangeText={(text) => {
          const num = parseInt(text, 10);
          if (!isNaN(num) && num > 0) {
            onChange({ intervalDays: num });
          }
        }}
        keyboardType="numeric"
      />
    </View>
  );
}

interface WindowTriggerFormProps {
  trigger: WindowTriggerConfig;
  onChange: (updates: Partial<WindowTriggerConfig>) => void;
}

function WindowTriggerForm({ trigger, onChange }: WindowTriggerFormProps) {
  const windows = JSON.parse(trigger.windowsJson || '[]');
  const firstWindow = windows[0] || { days: [], time_range: '09:00-12:00' };

  const updateWindow = (updates: Partial<typeof firstWindow>) => {
    const updated = { ...firstWindow, ...updates };
    onChange({ windowsJson: JSON.stringify([updated]) });
  };

  return (
    <View className="mt-2">
      <Text className="text-xs text-muted-foreground mb-2">Preferred Days</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = firstWindow.days?.includes(day.value);
          return (
            <Pressable
              key={day.value}
              onPress={() => {
                const newDays = isSelected
                  ? firstWindow.days.filter((d: string) => d !== day.value)
                  : [...(firstWindow.days || []), day.value];
                updateWindow({ days: newDays });
              }}
            >
              <Badge variant={isSelected ? 'default' : 'outline'}>
                <Text
                  className={cn(
                    'text-xs',
                    isSelected ? 'text-primary-foreground' : 'text-foreground'
                  )}
                >
                  {day.label}
                </Text>
              </Badge>
            </Pressable>
          );
        })}
      </View>
      <Input
        label="Time Range"
        placeholder="09:00-12:00"
        value={firstWindow.time_range || '09:00-12:00'}
        onChangeText={(text) => updateWindow({ time_range: text })}
      />
    </View>
  );
}

interface ConditionTriggerFormProps {
  trigger: ConditionTriggerConfig;
  onChange: (updates: Partial<ConditionTriggerConfig>) => void;
}

function ConditionTriggerForm({ trigger, onChange }: ConditionTriggerFormProps) {
  return (
    <View className="mt-2">
      <Input
        label="MQTT Topic"
        placeholder="sensor/soil_moisture"
        value={trigger.mqttTopic}
        onChangeText={(text) => onChange({ mqttTopic: text })}
        className="mb-3"
      />
      <Text className="text-xs text-muted-foreground mb-2">Operator</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {OPERATORS.map((op) => (
          <Pressable key={op.value} onPress={() => onChange({ operator: op.value })}>
            <Badge variant={trigger.operator === op.value ? 'default' : 'outline'}>
              <Text
                className={cn(
                  'text-xs',
                  trigger.operator === op.value
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                )}
              >
                {op.label}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>
      <Input
        label="Value"
        placeholder="true"
        value={trigger.value}
        onChangeText={(text) => onChange({ value: text })}
      />
    </View>
  );
}

export { TRIGGER_OPTIONS };

