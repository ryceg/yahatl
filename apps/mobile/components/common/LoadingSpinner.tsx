/**
 * LoadingSpinner Component
 *
 * Centered loading indicator with optional message.
 */
import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  className?: string;
}

export function LoadingSpinner({
  message,
  size = 'large',
  className,
}: LoadingSpinnerProps) {
  return (
    <View className={cn('flex-1 items-center justify-center py-12', className)}>
      <ActivityIndicator
        size={size}
        color="hsl(262, 83%, 58%)"
      />
      {message && (
        <Text className="mt-4 text-sm text-muted-foreground">{message}</Text>
      )}
    </View>
  );
}
