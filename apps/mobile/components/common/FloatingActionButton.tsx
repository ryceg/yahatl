/**
 * FloatingActionButton Component
 *
 * Floating action button positioned at the bottom right.
 */
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  className?: string;
}

export function FloatingActionButton({
  icon: Icon,
  onPress,
  className,
}: FloatingActionButtonProps) {
  return (
    <View className={cn('absolute bottom-6 right-6', className)}>
      <Pressable
        onPress={onPress}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <Icon size={24} color="hsl(0, 0%, 98%)" />
      </Pressable>
    </View>
  );
}
