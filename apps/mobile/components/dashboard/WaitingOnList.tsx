/**
 * WaitingOnList Component
 *
 * Displays items that are blocked/waiting on something.
 * Each item is tappable to open note details.
 */
import * as React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Clock, User, FileText, ChevronRight } from 'lucide-react-native';
import { WaitingItem } from '@/lib/api/client';
import { Card, CardContent, Badge } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { cn } from '@/lib/utils';

interface WaitingOnListProps {
  /** Waiting items to display */
  items: WaitingItem[] | undefined;
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
 * Get blocker type icon
 */
function getBlockerIcon(blockerType: string | undefined) {
  switch (blockerType?.toLowerCase()) {
    case 'person':
      return User;
    case 'freetext':
    default:
      return FileText;
  }
}

/**
 * Get blocker badge variant
 */
function getBlockerVariant(
  blockerType: string | undefined
): 'secondary' | 'outline' {
  switch (blockerType?.toLowerCase()) {
    case 'person':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function WaitingOnList({
  items,
  isLoading = false,
  maxItems = 5,
  onItemPress,
  onShowAll,
  className,
}: WaitingOnListProps) {
  const displayItems = items?.slice(0, maxItems) ?? [];
  const hasMore = (items?.length ?? 0) > maxItems;

  return (
    <View className={cn('mb-6', className)}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Clock size={18} className="text-yellow-600" />
          <Text className="text-lg font-semibold text-foreground">
            Waiting On
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
                const BlockerIcon = getBlockerIcon(item.blockerType);
                const blockerVariant = getBlockerVariant(item.blockerType);

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
                    <View className="mr-3 rounded-lg bg-yellow-500/10 p-2">
                      <BlockerIcon size={16} className="text-yellow-600" />
                    </View>
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-base text-foreground"
                        numberOfLines={1}
                      >
                        {item.title ?? 'Untitled'}
                      </Text>
                      <Text
                        className="text-xs text-muted-foreground mt-0.5"
                        numberOfLines={1}
                      >
                        {item.reason ?? 'Blocked'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Badge variant={blockerVariant}>
                        <BlockerIcon size={10} className="mr-1" />
                        <Text className="text-xs capitalize">
                          {item.blockerType ?? 'Blocked'}
                        </Text>
                      </Badge>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={Clock}
              title="Nothing blocked"
              description="No items waiting on external dependencies"
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </View>
  );
}

