import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface RecentCaptureItemProps {
  id: string;
  title: string;
  tags: string[];
  createdAt: Date | string;
  onPress: (id: string) => void;
  className?: string;
}

export function RecentCaptureItem({
  id,
  title,
  tags,
  createdAt,
  onPress,
  className,
}: RecentCaptureItemProps) {
  const formatRelativeTime = (dateInput: Date | string): string => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Pressable
      onPress={() => onPress(id)}
      className={cn(
        'flex-row items-center gap-3 p-3 bg-card rounded-lg border border-border active:bg-muted',
        className
      )}
    >
      <View className="flex-1">
        <Text
          className="text-foreground font-medium mb-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>

        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <Clock size={12} color="#71717a" />
            <Text className="text-xs text-muted-foreground">
              {formatRelativeTime(createdAt)}
            </Text>
          </View>

          {tags.length > 0 && (
            <View className="flex-row gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="py-0">
                  <Text className="text-xs text-muted-foreground">{tag}</Text>
                </Badge>
              ))}
              {tags.length > 2 && (
                <Text className="text-xs text-muted-foreground">
                  +{tags.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
