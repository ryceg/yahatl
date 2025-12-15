/**
 * ErrorState Component
 *
 * Error display with retry button.
 */
import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again later.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center py-12 px-6', className)}>
      <View className="mb-4 rounded-full bg-destructive/10 p-4">
        <AlertCircle size={32} className="text-destructive" />
      </View>
      <Text className="mb-2 text-center text-lg font-medium text-foreground">
        {title}
      </Text>
      <Text className="mb-4 text-center text-sm text-muted-foreground">
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="flex-row items-center gap-2 rounded-md bg-secondary px-4 py-2"
        >
          <RefreshCw size={16} className="text-secondary-foreground" />
          <Text className="font-medium text-secondary-foreground">
            Try Again
          </Text>
        </Pressable>
      )}
    </View>
  );
}
