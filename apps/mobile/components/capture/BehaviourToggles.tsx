import React, { useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import {
  CheckSquare,
  Repeat,
  Home,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

// Maps to backend Priority enum
export enum Priority {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3,
}

const PRIORITY_OPTIONS = [
  { value: Priority.Low, label: "Low", color: "#71717a" },
  { value: Priority.Normal, label: "Normal", color: "#3b82f6" },
  { value: Priority.High, label: "High", color: "#f59e0b" },
  { value: Priority.Urgent, label: "Urgent", color: "#ef4444" },
];

const FREQUENCY_OPTIONS = ["daily", "3x per week", "weekly", "monthly"];

export interface BehaviourConfig {
  addTask: boolean;
  taskPriority: Priority;
  taskDueDate?: Date;
  addHabit: boolean;
  habitFrequencyGoal: string;
  addChore: boolean;
  choreNextDue?: Date;
  addReminder: boolean;
  reminderNotificationSettings?: string;
}

interface BehaviourTogglesProps {
  config: BehaviourConfig;
  onChange: (config: BehaviourConfig) => void;
  className?: string;
}

export function BehaviourToggles({
  config,
  onChange,
  className,
}: BehaviourTogglesProps) {
  const [expandedBehaviour, setExpandedBehaviour] = useState<string | null>(
    null
  );

  const toggleExpanded = (behaviour: string) => {
    setExpandedBehaviour(expandedBehaviour === behaviour ? null : behaviour);
  };

  const updateConfig = (updates: Partial<BehaviourConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <View className={cn("w-full", className)}>
      <Text className="text-sm font-medium text-foreground mb-3">
        Add Behaviours
      </Text>

      {/* Task Behaviour */}
      <View className="mb-3 bg-card rounded-lg border border-border overflow-hidden">
        <Pressable
          onPress={() => toggleExpanded("task")}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center gap-3">
            <CheckSquare
              size={20}
              color={config.addTask ? "#7c3aed" : "#71717a"}
            />
            <Text className="text-foreground font-medium">Task</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Switch
              value={config.addTask}
              onValueChange={(value) => updateConfig({ addTask: value })}
              trackColor={{ false: "#71717a", true: "#a78bfa" }}
              thumbColor={config.addTask ? "#7c3aed" : "#f4f4f5"}
            />
            {config.addTask &&
              (expandedBehaviour === "task" ? (
                <ChevronUp size={16} color="#71717a" />
              ) : (
                <ChevronDown size={16} color="#71717a" />
              ))}
          </View>
        </Pressable>

        {config.addTask && expandedBehaviour === "task" && (
          <View className="px-3 pb-3 border-t border-border">
            <Text className="text-xs text-muted-foreground mt-2 mb-2">
              Priority
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => updateConfig({ taskPriority: option.value })}
                >
                  <Badge
                    variant={
                      config.taskPriority === option.value
                        ? "default"
                        : "outline"
                    }
                    style={{
                      backgroundColor:
                        config.taskPriority === option.value
                          ? option.color
                          : "transparent",
                    }}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        config.taskPriority === option.value
                          ? "text-white"
                          : "text-foreground"
                      )}
                    >
                      {option.label}
                    </Text>
                  </Badge>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Habit Behaviour */}
      <View className="mb-3 bg-card rounded-lg border border-border overflow-hidden">
        <Pressable
          onPress={() => toggleExpanded("habit")}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center gap-3">
            <Repeat size={20} color={config.addHabit ? "#7c3aed" : "#71717a"} />
            <Text className="text-foreground font-medium">Habit</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Switch
              value={config.addHabit}
              onValueChange={(value) => updateConfig({ addHabit: value })}
              trackColor={{ false: "#71717a", true: "#a78bfa" }}
              thumbColor={config.addHabit ? "#7c3aed" : "#f4f4f5"}
            />
            {config.addHabit &&
              (expandedBehaviour === "habit" ? (
                <ChevronUp size={16} color="#71717a" />
              ) : (
                <ChevronDown size={16} color="#71717a" />
              ))}
          </View>
        </Pressable>

        {config.addHabit && expandedBehaviour === "habit" && (
          <View className="px-3 pb-3 border-t border-border">
            <Text className="text-xs text-muted-foreground mt-2 mb-2">
              Frequency Goal
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => updateConfig({ habitFrequencyGoal: option })}
                >
                  <Badge
                    variant={
                      config.habitFrequencyGoal === option
                        ? "default"
                        : "outline"
                    }
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        config.habitFrequencyGoal === option
                          ? "text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {option}
                    </Text>
                  </Badge>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Chore Behaviour */}
      <View className="mb-3 bg-card rounded-lg border border-border overflow-hidden">
        <Pressable
          onPress={() => toggleExpanded("chore")}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center gap-3">
            <Home size={20} color={config.addChore ? "#7c3aed" : "#71717a"} />
            <Text className="text-foreground font-medium">Chore</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Switch
              value={config.addChore}
              onValueChange={(value) => updateConfig({ addChore: value })}
              trackColor={{ false: "#71717a", true: "#a78bfa" }}
              thumbColor={config.addChore ? "#7c3aed" : "#f4f4f5"}
            />
            {config.addChore &&
              (expandedBehaviour === "chore" ? (
                <ChevronUp size={16} color="#71717a" />
              ) : (
                <ChevronDown size={16} color="#71717a" />
              ))}
          </View>
        </Pressable>

        {config.addChore && expandedBehaviour === "chore" && (
          <View className="px-3 pb-3 border-t border-border">
            <Text className="text-xs text-muted-foreground mt-2 mb-1">
              Next Due (scheduling via triggers)
            </Text>
            <Text className="text-sm text-foreground">
              Configure triggers in note detail
            </Text>
          </View>
        )}
      </View>

      {/* Reminder Behaviour */}
      <View className="bg-card rounded-lg border border-border overflow-hidden">
        <Pressable
          onPress={() => toggleExpanded("reminder")}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center gap-3">
            <Bell
              size={20}
              color={config.addReminder ? "#7c3aed" : "#71717a"}
            />
            <Text className="text-foreground font-medium">Reminder</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Switch
              value={config.addReminder}
              onValueChange={(value) => updateConfig({ addReminder: value })}
              trackColor={{ false: "#71717a", true: "#a78bfa" }}
              thumbColor={config.addReminder ? "#7c3aed" : "#f4f4f5"}
            />
            {config.addReminder &&
              (expandedBehaviour === "reminder" ? (
                <ChevronUp size={16} color="#71717a" />
              ) : (
                <ChevronDown size={16} color="#71717a" />
              ))}
          </View>
        </Pressable>

        {config.addReminder && expandedBehaviour === "reminder" && (
          <View className="px-3 pb-3 border-t border-border">
            <Text className="text-xs text-muted-foreground mt-2 mb-1">
              Notification Settings
            </Text>
            <Text className="text-sm text-foreground">
              Configure notification timing via triggers
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export const defaultBehaviourConfig: BehaviourConfig = {
  addTask: false,
  taskPriority: Priority.Normal,
  addHabit: false,
  habitFrequencyGoal: "daily",
  addChore: false,
  addReminder: false,
};
