/**
 * BlockerConfigurator Component
 *
 * UI for configuring blockers (dependencies/conditions) when creating notes.
 * Supports Note, Person, Time, Condition, UntilDate, and Freetext blockers.
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Link2,
  User,
  Clock,
  Zap,
  Calendar,
  MessageSquare,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react-native";
import { Button, Badge, Input } from "@/components/ui";
import { useSearchBlockerNotes, useSearchPeople } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

// Blocker types available
export type BlockerType =
  | "note"
  | "person"
  | "time"
  | "condition"
  | "until"
  | "freetext";

interface BlockerOption {
  type: BlockerType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  description: string;
}

const BLOCKER_OPTIONS: BlockerOption[] = [
  {
    type: "note",
    label: "Blocked by Note",
    icon: Link2,
    description: "Wait for another note/task",
  },
  {
    type: "person",
    label: "Waiting on Person",
    icon: User,
    description: "Waiting for someone",
  },
  {
    type: "until",
    label: "Until Date",
    icon: Calendar,
    description: "Defer until a date",
  },
  {
    type: "freetext",
    label: "Custom",
    icon: MessageSquare,
    description: "Custom blocking reason",
  },
  {
    type: "time",
    label: "Time Window",
    icon: Clock,
    description: "Block during time periods",
  },
  {
    type: "condition",
    label: "Condition",
    icon: Zap,
    description: "External state (MQTT)",
  },
];

// Day options for time blockers
const DAYS_OF_WEEK = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
];

// Comparison operators for conditions
const OPERATORS = [
  { label: "=", value: "eq" },
  { label: "≠", value: "neq" },
  { label: ">", value: "gt" },
  { label: "<", value: "lt" },
  { label: "≥", value: "gte" },
  { label: "≤", value: "lte" },
  { label: "Boolean", value: "bool" },
];

// Blocker configuration types
export interface NoteBlockerConfig {
  type: "note";
  targetNoteId: string;
  targetNoteTitle?: string;
  notifyOnResolve: boolean;
}

export interface PersonBlockerConfig {
  type: "person";
  personNoteId: string;
  personNoteTitle?: string;
  reason?: string;
  notifyOnResolve: boolean;
}

export interface TimeBlockerConfig {
  type: "time";
  windowsJson: string;
  notifyOnResolve: boolean;
}

export interface ConditionBlockerConfig {
  type: "condition";
  mqttTopic: string;
  operator: string;
  value: string;
  notifyOnResolve: boolean;
}

export interface UntilDateBlockerConfig {
  type: "until";
  until: Date;
  notifyOnResolve: boolean;
}

export interface FreetextBlockerConfig {
  type: "freetext";
  description: string;
  notifyOnResolve: boolean;
}

export type BlockerConfig =
  | NoteBlockerConfig
  | PersonBlockerConfig
  | TimeBlockerConfig
  | ConditionBlockerConfig
  | UntilDateBlockerConfig
  | FreetextBlockerConfig;

interface BlockerConfiguratorProps {
  blockers: BlockerConfig[];
  onChange: (blockers: BlockerConfig[]) => void;
  className?: string;
}

export function BlockerConfigurator({
  blockers,
  onChange,
  className,
}: BlockerConfiguratorProps) {
  const [showAddBlocker, setShowAddBlocker] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addBlocker = (type: BlockerType) => {
    let newBlocker: BlockerConfig;

    switch (type) {
      case "note":
        newBlocker = { type: "note", targetNoteId: "", notifyOnResolve: true };
        break;
      case "person":
        newBlocker = {
          type: "person",
          personNoteId: "",
          notifyOnResolve: true,
        };
        break;
      case "time":
        newBlocker = {
          type: "time",
          windowsJson: JSON.stringify([
            { days: ["saturday", "sunday"], time_range: "00:00-23:59" },
          ]),
          notifyOnResolve: false,
        };
        break;
      case "condition":
        newBlocker = {
          type: "condition",
          mqttTopic: "",
          operator: "eq",
          value: "",
          notifyOnResolve: true,
        };
        break;
      case "until":
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        newBlocker = { type: "until", until: nextWeek, notifyOnResolve: true };
        break;
      case "freetext":
        newBlocker = {
          type: "freetext",
          description: "",
          notifyOnResolve: true,
        };
        break;
    }

    onChange([...blockers, newBlocker]);
    setShowAddBlocker(false);
    setExpandedIndex(blockers.length);
  };

  const updateBlocker = (index: number, updates: Partial<BlockerConfig>) => {
    const updated = [...blockers];
    updated[index] = { ...updated[index], ...updates } as BlockerConfig;
    onChange(updated);
  };

  const removeBlocker = (index: number) => {
    onChange(blockers.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const getBlockerLabel = (blocker: BlockerConfig): string => {
    switch (blocker.type) {
      case "note":
        return blocker.targetNoteTitle || "Select a note...";
      case "person":
        return blocker.personNoteTitle || "Select a person...";
      case "time":
        return "Time Window";
      case "condition":
        return blocker.mqttTopic || "Condition (not configured)";
      case "until":
        return `Until ${new Date(blocker.until).toLocaleDateString()}`;
      case "freetext":
        return blocker.description || "Custom blocker";
    }
  };

  const getBlockerIcon = (type: BlockerType) => {
    const option = BLOCKER_OPTIONS.find((o) => o.type === type);
    return option?.icon ?? Link2;
  };

  return (
    <View className={cn("w-full", className)}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-foreground">
          Blockers (Dependencies)
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowAddBlocker(!showAddBlocker)}
        >
          <Plus size={16} color="#7c3aed" />
          <Text className="text-primary text-sm ml-1">Add</Text>
        </Button>
      </View>

      {/* Add Blocker Selector */}
      {showAddBlocker && (
        <View className="mb-3 p-3 bg-card rounded-lg border border-border">
          <Text className="text-xs text-muted-foreground mb-2">
            Select blocker type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BLOCKER_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.type}
                  onPress={() => addBlocker(option.type)}
                  className="flex-row items-center gap-2 px-3 py-2 rounded-md border border-border bg-background"
                >
                  <Icon size={16} color="#71717a" />
                  <Text className="text-sm text-foreground">
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Configured Blockers */}
      {blockers.length === 0 && !showAddBlocker && (
        <Text className="text-sm text-muted-foreground italic">
          No blockers configured
        </Text>
      )}

      {blockers.map((blocker, index) => {
        const Icon = getBlockerIcon(blocker.type);
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
                <Icon size={16} color="#f59e0b" />
                <Text
                  className="text-sm text-foreground flex-1"
                  numberOfLines={1}
                >
                  {getBlockerLabel(blocker)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable onPress={() => removeBlocker(index)}>
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
                {blocker.type === "note" && (
                  <NoteBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
                  />
                )}
                {blocker.type === "person" && (
                  <PersonBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
                  />
                )}
                {blocker.type === "time" && (
                  <TimeBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
                  />
                )}
                {blocker.type === "condition" && (
                  <ConditionBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
                  />
                )}
                {blocker.type === "until" && (
                  <UntilDateBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
                  />
                )}
                {blocker.type === "freetext" && (
                  <FreetextBlockerForm
                    blocker={blocker}
                    onChange={(updates) => updateBlocker(index, updates)}
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
// Blocker Type Forms
// ============================================================================

interface NoteBlockerFormProps {
  blocker: NoteBlockerConfig;
  onChange: (updates: Partial<NoteBlockerConfig>) => void;
}

function NoteBlockerForm({ blocker, onChange }: NoteBlockerFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(!blocker.targetNoteId);

  const { data: searchResults, isLoading } = useSearchBlockerNotes(
    searchQuery,
    {
      enabled: searchQuery.length >= 1 && showSearch,
    }
  );

  const selectNote = (noteId: string, title: string) => {
    onChange({ targetNoteId: noteId, targetNoteTitle: title });
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <View className="mt-2">
      {blocker.targetNoteId && !showSearch ? (
        <View className="flex-row items-center justify-between p-2 bg-secondary rounded-md mb-3">
          <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
            {blocker.targetNoteTitle}
          </Text>
          <Pressable onPress={() => setShowSearch(true)}>
            <X size={16} color="#71717a" />
          </Pressable>
        </View>
      ) : (
        <View className="mb-3">
          <View className="flex-row items-center border border-input rounded-md bg-background">
            <Search size={16} color="#71717a" className="ml-3" />
            <TextInput
              placeholder="Search notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 p-3 text-foreground"
              placeholderTextColor="#71717a"
              autoFocus
            />
            {isLoading && <ActivityIndicator size="small" className="mr-3" />}
          </View>
          {searchResults?.items && searchResults.items.length > 0 && (
            <View className="mt-2 border border-border rounded-md overflow-hidden">
              {searchResults.items.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => selectNote(item.id!, item.title!)}
                  className="p-3 border-b border-border last:border-b-0 active:bg-secondary"
                >
                  <Text className="text-sm text-foreground">{item.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

interface PersonBlockerFormProps {
  blocker: PersonBlockerConfig;
  onChange: (updates: Partial<PersonBlockerConfig>) => void;
}

function PersonBlockerForm({ blocker, onChange }: PersonBlockerFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(!blocker.personNoteId);

  const { data: searchResults, isLoading } = useSearchPeople(searchQuery, {
    enabled: searchQuery.length >= 1 && showSearch,
  });

  const selectPerson = (noteId: string, title: string) => {
    onChange({ personNoteId: noteId, personNoteTitle: title });
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <View className="mt-2">
      {blocker.personNoteId && !showSearch ? (
        <View className="flex-row items-center justify-between p-2 bg-secondary rounded-md mb-3">
          <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
            {blocker.personNoteTitle}
          </Text>
          <Pressable onPress={() => setShowSearch(true)}>
            <X size={16} color="#71717a" />
          </Pressable>
        </View>
      ) : (
        <View className="mb-3">
          <View className="flex-row items-center border border-input rounded-md bg-background">
            <Search size={16} color="#71717a" className="ml-3" />
            <TextInput
              placeholder="Search people..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 p-3 text-foreground"
              placeholderTextColor="#71717a"
              autoFocus
            />
            {isLoading && <ActivityIndicator size="small" className="mr-3" />}
          </View>
          {searchResults?.items && searchResults.items.length > 0 && (
            <View className="mt-2 border border-border rounded-md overflow-hidden">
              {searchResults.items.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => selectPerson(item.id!, item.title!)}
                  className="p-3 border-b border-border last:border-b-0 active:bg-secondary"
                >
                  <Text className="text-sm text-foreground">{item.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <Input
        label="Reason (optional)"
        placeholder="Waiting for reply..."
        value={blocker.reason || ""}
        onChangeText={(text) => onChange({ reason: text })}
        className="mb-3"
      />
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

interface TimeBlockerFormProps {
  blocker: TimeBlockerConfig;
  onChange: (updates: Partial<TimeBlockerConfig>) => void;
}

function TimeBlockerForm({ blocker, onChange }: TimeBlockerFormProps) {
  const windows = JSON.parse(blocker.windowsJson || "[]");
  const firstWindow = windows[0] || { days: [], time_range: "00:00-23:59" };

  const updateWindow = (updates: Partial<typeof firstWindow>) => {
    const updated = { ...firstWindow, ...updates };
    onChange({ windowsJson: JSON.stringify([updated]) });
  };

  return (
    <View className="mt-2">
      <Text className="text-xs text-muted-foreground mb-2">
        Block on these days
      </Text>
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
              <Badge variant={isSelected ? "default" : "outline"}>
                <Text
                  className={cn(
                    "text-xs",
                    isSelected ? "text-primary-foreground" : "text-foreground"
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
        placeholder="00:00-23:59"
        value={firstWindow.time_range || "00:00-23:59"}
        onChangeText={(text) => updateWindow({ time_range: text })}
        className="mb-3"
      />
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

interface ConditionBlockerFormProps {
  blocker: ConditionBlockerConfig;
  onChange: (updates: Partial<ConditionBlockerConfig>) => void;
}

function ConditionBlockerForm({
  blocker,
  onChange,
}: ConditionBlockerFormProps) {
  return (
    <View className="mt-2">
      <Input
        label="MQTT Topic"
        placeholder="weather/rain_forecast"
        value={blocker.mqttTopic}
        onChangeText={(text) => onChange({ mqttTopic: text })}
        className="mb-3"
      />
      <Text className="text-xs text-muted-foreground mb-2">Operator</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {OPERATORS.map((op) => (
          <Pressable
            key={op.value}
            onPress={() => onChange({ operator: op.value })}
          >
            <Badge
              variant={blocker.operator === op.value ? "default" : "outline"}
            >
              <Text
                className={cn(
                  "text-xs",
                  blocker.operator === op.value
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {op.label}
              </Text>
            </Badge>
          </Pressable>
        ))}
      </View>
      <Input
        label="Value (blocks when condition is true)"
        placeholder="true"
        value={blocker.value}
        onChangeText={(text) => onChange({ value: text })}
        className="mb-3"
      />
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

interface UntilDateBlockerFormProps {
  blocker: UntilDateBlockerConfig;
  onChange: (updates: Partial<UntilDateBlockerConfig>) => void;
}

function UntilDateBlockerForm({
  blocker,
  onChange,
}: UntilDateBlockerFormProps) {
  const dateValue = new Date(blocker.until);
  const dateString = dateValue.toISOString().split("T")[0];

  // Quick date presets
  const presets = [
    { label: "Tomorrow", days: 1 },
    { label: "Next Week", days: 7 },
    { label: "2 Weeks", days: 14 },
    { label: "Next Month", days: 30 },
  ];

  const setDateFromPreset = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange({ until: date });
  };

  return (
    <View className="mt-2">
      <Text className="text-xs text-muted-foreground mb-2">Quick Presets</Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {presets.map((preset) => (
          <Pressable
            key={preset.days}
            onPress={() => setDateFromPreset(preset.days)}
          >
            <Badge variant="outline">
              <Text className="text-xs text-foreground">{preset.label}</Text>
            </Badge>
          </Pressable>
        ))}
      </View>
      <Input
        label="Until Date"
        placeholder="YYYY-MM-DD"
        value={dateString}
        onChangeText={(text) => {
          const parsed = new Date(text);
          if (!isNaN(parsed.getTime())) {
            onChange({ until: parsed });
          }
        }}
        className="mb-3"
      />
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

interface FreetextBlockerFormProps {
  blocker: FreetextBlockerConfig;
  onChange: (updates: Partial<FreetextBlockerConfig>) => void;
}

function FreetextBlockerForm({ blocker, onChange }: FreetextBlockerFormProps) {
  return (
    <View className="mt-2">
      <Input
        label="Blocking Reason"
        placeholder="Waiting for parts to arrive..."
        value={blocker.description}
        onChangeText={(text) => onChange({ description: text })}
        multiline
        numberOfLines={3}
        className="mb-3"
      />
      <NotifyToggle
        value={blocker.notifyOnResolve}
        onChange={(notifyOnResolve) => onChange({ notifyOnResolve })}
      />
    </View>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

interface NotifyToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

function NotifyToggle({ value, onChange }: NotifyToggleProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className="flex-row items-center gap-2"
    >
      <View
        className={cn(
          "w-5 h-5 rounded border items-center justify-center",
          value ? "bg-primary border-primary" : "border-border"
        )}
      >
        {value && <Text className="text-xs text-white">✓</Text>}
      </View>
      <Text className="text-sm text-foreground">Notify when resolved</Text>
    </Pressable>
  );
}

export { BLOCKER_OPTIONS };
