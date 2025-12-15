/**
 * EmptyState Component
 *
 * Reusable empty state display with icon, title, description, and optional action.
 */
import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-6', className)}>
      {Icon && (
        <View className="mb-4 rounded-full bg-muted p-4">
          <Icon size={32} className="text-muted-foreground" />
        </View>
      )}
      <Text className="mb-2 text-center text-lg font-medium text-foreground">
        {title}
      </Text>
      {description && (
        <Text className="mb-4 text-center text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="rounded-md bg-primary px-4 py-2"
        >
          <Text className="font-medium text-primary-foreground">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
