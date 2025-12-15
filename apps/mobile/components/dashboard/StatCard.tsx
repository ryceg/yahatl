/**
 * StatCard Component
 *
 * Displays a summary statistic with label.
 * Supports tap-to-filter interaction and loading state.
 */
import * as React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { cn } from "@/lib/utils";

type StatVariant = "default" | "destructive" | "warning" | "success" | "muted";

interface StatCardProps {
  /** The numeric value to display */
  value: number;
  /** Label describing the stat */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Visual variant */
  variant?: StatVariant;
  /** Whether the stat is loading */
  isLoading?: boolean;
  /** Callback when tapped */
  onPress?: () => void;
  /** Additional className */
  className?: string;
}

const variantStyles: Record<StatVariant, { value: string; bg: string }> = {
  default: {
    value: "text-primary",
    bg: "bg-primary/5",
  },
  destructive: {
    value: "text-destructive",
    bg: "bg-destructive/5",
  },
  warning: {
    value: "text-yellow-600",
    bg: "bg-yellow-500/10",
  },
  success: {
    value: "text-green-600",
    bg: "bg-green-500/10",
  },
  muted: {
    value: "text-foreground",
    bg: "bg-muted/50",
  },
};

export function StatCard({
  value,
  label,
  icon: Icon,
  variant = "default",
  isLoading = false,
  onPress,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <View
      className={cn(
        "rounded-xl border border-border p-4",
        styles.bg,
        className
      )}
    >
      <View className="flex-row items-center justify-between">
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text className={cn("text-3xl font-bold", styles.value)}>
            {value}
          </Text>
        )}
        {Icon && (
          <View className="rounded-full bg-background/50 p-2">
            <Icon size={18} className="text-muted-foreground" />
          </View>
        )}
      </View>
      <Text className="mt-1 text-sm text-muted-foreground">{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-1 min-w-[45%]"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return <View className="flex-1 min-w-[45%]">{content}</View>;
}
