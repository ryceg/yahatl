/**
 * StreakWidget Component
 *
 * Displays habits with streak information.
 * Shows current streak, at-risk status, and frequency goal.
 */
import * as React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Flame, TrendingUp, AlertTriangle, Target } from 'lucide-react-native';
import { StreakItem } from '@/lib/api/client';
import { Card, CardContent, Badge } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { cn } from '@/lib/utils';

interface StreakWidgetProps {
  /** Streak items to display */
  items: StreakItem[] | undefined;
  /** Loading state */
  isLoading?: boolean;
  /** Max items to show (default: 5) */
  maxItems?: number;
  /** Callback when an item is pressed */
  onItemPress?: (noteId: string) => void;
  /** Callback to show all habits */
  onShowAll?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Get flame color based on streak length
 */
function getFlameColor(streak: number): string {
  if (streak >= 30) return 'text-orange-500';
  if (streak >= 14) return 'text-yellow-500';
  if (streak >= 7) return 'text-amber-400';
  return 'text-muted-foreground';
}

/**
 * Get streak badge content
 */
function getStreakBadge(streak: number): { label: string; variant: 'default' | 'secondary' | 'success' } {
  if (streak >= 30) return { label: `${streak}🔥 Legendary!`, variant: 'success' };
  if (streak >= 14) return { label: `${streak}🔥 On fire!`, variant: 'default' };
  if (streak >= 7) return { label: `${streak}🔥`, variant: 'secondary' };
  return { label: `${streak}`, variant: 'secondary' };
}

export function StreakWidget({
  items,
  isLoading = false,
  maxItems = 5,
  onItemPress,
  onShowAll,
  className,
}: StreakWidgetProps) {
  // Sort by at-risk first, then by streak length
  const sortedItems = React.useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      // At-risk items first
      if (a.atRisk && !b.atRisk) return -1;
      if (!a.atRisk && b.atRisk) return 1;
      // Then by streak length (descending)
      return (b.currentStreak ?? 0) - (a.currentStreak ?? 0);
    });
  }, [items]);

  const displayItems = sortedItems.slice(0, maxItems);
  const hasMore = sortedItems.length > maxItems;
  const atRiskCount = items?.filter((i) => i.atRisk).length ?? 0;

  return (
    <View className={cn('mb-6', className)}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Flame size={18} className="text-orange-500" />
          <Text className="text-lg font-semibold text-foreground">
            Streaks
          </Text>
          {atRiskCount > 0 && (
            <Badge variant="destructive">
              <AlertTriangle size={10} className="mr-1" />
              <Text className="text-xs">{atRiskCount} at risk</Text>
            </Badge>
          )}
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
                const streak = item.currentStreak ?? 0;
                const flameColor = getFlameColor(streak);
                const streakBadge = getStreakBadge(streak);

                return (
                  <Pressable
                    key={item.noteId ?? index}
                    onPress={() => item.noteId && onItemPress?.(item.noteId)}
                    className={cn(
                      'flex-row items-center py-3',
                      index !== displayItems.length - 1 &&
                        'border-b border-border/50'
                    )}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <View
                      className={cn(
                        'mr-3 rounded-lg p-2',
                        item.atRisk ? 'bg-destructive/10' : 'bg-orange-500/10'
                      )}
                    >
                      {item.atRisk ? (
                        <AlertTriangle size={16} className="text-destructive" />
                      ) : (
                        <Flame size={16} className={flameColor} />
                      )}
                    </View>
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-base text-foreground"
                        numberOfLines={1}
                      >
                        {item.title ?? 'Untitled'}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <View className="flex-row items-center">
                          <Target size={10} className="text-muted-foreground mr-1" />
                          <Text className="text-xs text-muted-foreground">
                            {item.frequencyGoal ?? 'Daily'}
                          </Text>
                        </View>
                        {(item.longestStreak ?? 0) > streak && (
                          <View className="flex-row items-center">
                            <TrendingUp
                              size={10}
                              className="text-muted-foreground mr-1"
                            />
                            <Text className="text-xs text-muted-foreground">
                              Best: {item.longestStreak}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {item.atRisk ? (
                        <Badge variant="destructive">
                          <AlertTriangle size={10} className="mr-1" />
                          <Text className="text-xs">At Risk!</Text>
                        </Badge>
                      ) : streak > 0 ? (
                        <Badge variant={streakBadge.variant}>
                          <Text className="text-xs">{streakBadge.label}</Text>
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Text className="text-xs">Start streak</Text>
                        </Badge>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={Flame}
              title="No habits yet"
              description="Add habits to track your streaks"
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </View>
  );
}

