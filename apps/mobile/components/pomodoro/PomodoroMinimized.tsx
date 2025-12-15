/**
 * PomodoroMinimized Component
 *
 * Small floating pill indicator that shows when the Pomodoro timer
 * is active but minimized. Displays time remaining and allows
 * quick access to the full timer.
 */
import * as React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Timer, Pause } from 'lucide-react-native';
import { usePomodoroStore, formatTime } from '@/lib/stores/pomodoroStore';

interface PomodoroMinimizedProps {
  /** Called when user taps to expand the timer */
  onExpand: () => void;
}

export function PomodoroMinimized({ onExpand }: PomodoroMinimizedProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Store state
  const isActive = usePomodoroStore((s) => s.isActive);
  const isExpanded = usePomodoroStore((s) => s.isExpanded);
  const isPaused = usePomodoroStore((s) => s.isPaused);
  const remaining = usePomodoroStore((s) => s.remaining);

  // Animation values
  const translateY = useSharedValue(100);
  const pulseOpacity = useSharedValue(1);

  // Show/hide animation
  React.useEffect(() => {
    if (isActive && !isExpanded) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      translateY.value = withSpring(100, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [isActive, isExpanded, translateY]);

  // Pulse animation when paused
  React.useEffect(() => {
    if (isPaused) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isPaused, pulseOpacity]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Don't render if not active or if expanded
  if (!isActive || isExpanded) {
    return null;
  }

  const primaryColor = 'hsl(262, 83%, 58%)';
  const pillBg = isDark ? 'rgba(124, 58, 237, 0.95)' : 'rgba(124, 58, 237, 0.95)';

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 100, // Above tab bar
          alignSelf: 'center',
          zIndex: 999,
        },
        containerAnimatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onExpand}
        className="flex-row items-center gap-2 px-5 py-3 rounded-full"
        style={{
          backgroundColor: pillBg,
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <Animated.View style={contentAnimatedStyle} className="flex-row items-center gap-2">
          {isPaused ? (
            <Pause size={18} color="#fff" />
          ) : (
            <Timer size={18} color="#fff" />
          )}
          <Text
            className="text-lg font-bold font-mono"
            style={{
              color: '#fff',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatTime(remaining)}
          </Text>
          <Text className="text-xs opacity-70" style={{ color: '#fff' }}>
            🍅
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

