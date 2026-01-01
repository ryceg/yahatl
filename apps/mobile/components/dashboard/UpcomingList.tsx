/**
 * UpcomingList Component
 *
 * Displays upcoming items for the next 7 days.
 * Each item is tappable to open note details.
 */
import * as React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Repeat,
  AlertTriangle,
} from "lucide-react-native";
import { UpcomingItem } from "@/lib/api/api";
import { Card, CardContent, Badge } from "@/components/ui";
import { EmptyState } from "@/components/common";
import { cn } from "@/lib/utils";

interface UpcomingListProps {
  /** Upcoming items to display */
  items: UpcomingItem[] | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Max items to show (default: 5) */
  maxItems?: number;
  /** Callback when an item is pressed */
  onItemPress?: (noteId: string) => void;
  /** Callback to show all items */
  onShowAll?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Get appropriate icon for item type
 */
function getTypeIcon(type: string | undefined) {
  switch (type?.toLowerCase()) {
    case "task":
      return CheckCircle2;
    case "chore":
      return Repeat;
    default:
      return Clock;
  }
}

/**
 * Get day label relative to today
 */
function getDayLabel(date: Date | undefined): string {
  if (!date) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date);
  const itemDay = new Date(
    itemDate.getFullYear(),
    itemDate.getMonth(),
    itemDate.getDate()
  );

  const diffDays = Math.round(
    (itemDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) {
    return itemDate.toLocaleDateString("en-US", { weekday: "short" });
  }
  return itemDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get day label variant for styling
 */
function getDayVariant(
  date: Date | undefined
): "destructive" | "warning" | "secondary" {
  if (!date) return "secondary";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(date);
  const itemDay = new Date(
    itemDate.getFullYear(),
    itemDate.getMonth(),
    itemDate.getDate()
  );

  const diffDays = Math.round(
    (itemDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "destructive";
  if (diffDays === 0) return "warning";
  return "secondary";
}

export function UpcomingList({
  items,
  isLoading = false,
  maxItems = 5,
  onItemPress,
  onShowAll,
  className,
}: UpcomingListProps) {
  const displayItems = items?.slice(0, maxItems) ?? [];
  const hasMore = (items?.length ?? 0) > maxItems;

  return (
    <View className={cn("mb-6", className)}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <Text className="text-lg font-semibold text-foreground">
            Upcoming
          </Text>
        </View>
        {hasMore && onShowAll && (
          <Pressable onPress={onShowAll}>
            <Text className="text-sm font-medium text-primary">Show all</Text>
          </Pressable>
        )}
      </View>

      <Card>
        <CardContent className="py-3">
          {isLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : displayItems.length > 0 ? (
            <View>
              {displayItems.map((item, index) => {
                const TypeIcon = getTypeIcon(item.type);
                const dayLabel = getDayLabel(item.dueDate);
                const dayVariant = getDayVariant(item.dueDate);

                return (
                  <Pressable
                    key={item.noteId ?? index}
                    onPress={() => item.noteId && onItemPress?.(item.noteId)}
                    className={cn(
                      "flex-row items-center py-3",
                      index !== displayItems.length - 1 &&
                        "border-b border-border/50"
                    )}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View className="mr-3 rounded-lg bg-muted p-2">
                      <TypeIcon size={16} className="text-muted-foreground" />
                    </View>
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-base text-foreground"
                        numberOfLines={1}
                      >
                        {item.title ?? "Untitled"}
                      </Text>
                      {item.priority && item.priority !== "Normal" && (
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {item.priority} priority
                        </Text>
                      )}
                    </View>
                    <Badge variant={dayVariant}>
                      {dayVariant === "destructive" && (
                        <AlertTriangle size={10} className="mr-1" />
                      )}
                      <Text className="text-xs">{dayLabel}</Text>
                    </Badge>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={Calendar}
              title="All clear!"
              description="Nothing due in the next 7 days"
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </View>
  );
}
