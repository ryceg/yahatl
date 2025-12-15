/**
 * In-App Notification Banner
 *
 * Displays push notifications received while the app is in the foreground.
 * Slides down from the top of the screen with a modern design.
 */
import React, { useEffect } from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Bell, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useNotificationStore } from '@/lib/stores/notificationStore';

export function NotificationBanner() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    foregroundNotification,
    isBannerVisible,
    dismissBanner,
  } = useNotificationStore();

  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isBannerVisible && foregroundNotification) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(-150, {
        damping: 20,
        stiffness: 200,
      });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isBannerVisible, foregroundNotification, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    dismissBanner();

    // Navigate to the relevant note if data is provided
    const data = foregroundNotification?.request.content.data;
    if (data?.noteId && typeof data.noteId === 'string') {
      router.push(`/notes/${data.noteId}`);
    } else if (data?.screen && typeof data.screen === 'string') {
      router.push(data.screen as any);
    }
  };

  if (!foregroundNotification) {
    return null;
  }

  const { title, body } = foregroundNotification.request.content;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          paddingTop: 50, // Account for status bar
          paddingHorizontal: 16,
          paddingBottom: 8,
        },
        animatedStyle,
      ]}
      pointerEvents={isBannerVisible ? 'auto' : 'none'}
    >
      <Pressable onPress={handlePress}>
        <View
          className={`
            flex-row items-center gap-3 p-4 rounded-2xl
            ${isDark ? 'bg-card/95' : 'bg-card/95'}
            shadow-lg
          `}
          style={{
            backgroundColor: isDark
              ? 'rgba(30, 30, 35, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Icon */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'hsl(262, 83%, 58%)' }}
          >
            <Bell size={20} color="#fff" />
          </View>

          {/* Content */}
          <View className="flex-1 mr-2">
            {title && (
              <Text
                className="font-semibold text-foreground text-base"
                numberOfLines={1}
                style={{ color: isDark ? '#fff' : '#1a1a1a' }}
              >
                {title}
              </Text>
            )}
            {body && (
              <Text
                className="text-muted-foreground text-sm mt-0.5"
                numberOfLines={2}
                style={{ color: isDark ? '#999' : '#666' }}
              >
                {body}
              </Text>
            )}
          </View>

          {/* Dismiss button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              dismissBanner();
            }}
            hitSlop={10}
            className="p-1"
          >
            <X
              size={18}
              color={isDark ? '#666' : '#999'}
            />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

