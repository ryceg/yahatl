/**
 * PomodoroTimer Component
 *
 * Full-screen timer overlay with circular progress indicator.
 * Shows time remaining, pause/resume/stop controls, and linked note title.
 */
import * as React from 'react';
import { View, Text, Pressable, useColorScheme, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { Play, Pause, Square, Minimize2, FileText } from 'lucide-react-native';
import { Button } from '@/components/ui';
import {
  usePomodoroStore,
  formatTime,
  calculateProgress,
} from '@/lib/stores/pomodoroStore';
import { useStopPomodoro } from '@/lib/api/hooks';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PomodoroTimerProps {
  /** Called when user minimizes the overlay */
  onMinimize: () => void;
}

export function PomodoroTimer({ onMinimize }: PomodoroTimerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Store state
  const isActive = usePomodoroStore((s) => s.isActive);
  const isPaused = usePomodoroStore((s) => s.isPaused);
  const remaining = usePomodoroStore((s) => s.remaining);
  const duration = usePomodoroStore((s) => s.duration);
  const noteTitle = usePomodoroStore((s) => s.noteTitle);
  const pause = usePomodoroStore((s) => s.pause);
  const resume = usePomodoroStore((s) => s.resume);
  const stop = usePomodoroStore((s) => s.stop);

  // API mutation
  const stopPomodoro = useStopPomodoro();

  // Animation values
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  // Update progress animation
  React.useEffect(() => {
    const currentProgress = calculateProgress(remaining, duration);
    progress.value = withTiming(currentProgress, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
  }, [remaining, duration, progress]);

  // Pulse animation when paused
  React.useEffect(() => {
    if (isPaused) {
      scale.value = withSpring(0.98);
    } else {
      scale.value = withSpring(1);
    }
  }, [isPaused, scale]);

  const animatedCircleStyle = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePauseResume = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleStop = async () => {
    await stop(async (sessionId, completed) => {
      await stopPomodoro.mutateAsync({ complete: completed });
    });
  };

  if (!isActive) {
    return null;
  }

  const primaryColor = 'hsl(262, 83%, 58%)';
  const trackColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const backgroundColor = isDark ? 'hsl(240, 10%, 3.9%)' : 'hsl(0, 0%, 100%)';

  return (
    <View
      className="absolute inset-0 z-50"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-16 pb-4">
        <Text
          className="text-xl font-bold"
          style={{ color: isDark ? '#fff' : '#1a1a1a' }}
        >
          🍅 Focus Time
        </Text>
        <Pressable
          onPress={onMinimize}
          className="p-2 rounded-full"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        >
          <Minimize2 size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </Pressable>
      </View>

      {/* Timer Circle */}
      <View className="flex-1 items-center justify-center">
        <Animated.View style={containerAnimatedStyle}>
          <View className="items-center justify-center" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              <G rotation="-90" origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}>
                {/* Background Track */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={trackColor}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                {/* Progress Arc */}
                <AnimatedCircle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={primaryColor}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  animatedProps={animatedCircleStyle}
                />
              </G>
            </Svg>

            {/* Time Display */}
            <View className="absolute items-center">
              <Text
                className="text-5xl font-mono font-bold"
                style={{
                  color: isDark ? '#fff' : '#1a1a1a',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatTime(remaining)}
              </Text>
              {isPaused && (
                <Text
                  className="text-sm mt-2 uppercase tracking-wider"
                  style={{ color: primaryColor }}
                >
                  Paused
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Linked Note */}
        {noteTitle && (
          <View
            className="flex-row items-center gap-2 mt-8 px-4 py-2 rounded-full"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
          >
            <FileText size={16} color={isDark ? '#999' : '#666'} />
            <Text
              className="text-sm"
              style={{ color: isDark ? '#ccc' : '#444' }}
              numberOfLines={1}
            >
              {noteTitle}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View className="px-6 pb-12">
        <View className="flex-row items-center justify-center gap-6">
          {/* Stop Button */}
          <Pressable
            onPress={handleStop}
            className="items-center justify-center rounded-full"
            style={{
              width: 64,
              height: 64,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            <Square size={28} color="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" />
          </Pressable>

          {/* Pause/Resume Button */}
          <Pressable
            onPress={handlePauseResume}
            className="items-center justify-center rounded-full"
            style={{
              width: 80,
              height: 80,
              backgroundColor: primaryColor,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {isPaused ? (
              <Play size={36} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
            ) : (
              <Pause size={36} color="#fff" fill="#fff" />
            )}
          </Pressable>

          {/* Placeholder for symmetry */}
          <View style={{ width: 64, height: 64 }} />
        </View>

        {/* Session Info */}
        <View className="items-center mt-6">
          <Text
            className="text-sm"
            style={{ color: isDark ? '#666' : '#999' }}
          >
            {Math.round(duration / 60)} minute session
          </Text>
        </View>
      </View>
    </View>
  );
}

