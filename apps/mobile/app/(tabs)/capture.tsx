import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Plus, Inbox } from 'lucide-react-native';

import { Input, Button, Card, CardContent } from '@/components/ui';
import {
  TagInput,
  TemplateSelector,
  TemplateType,
  BehaviourToggles,
  BehaviourConfig,
  defaultBehaviourConfig,
  Priority,
  RecentCaptureItem,
} from '@/components/capture';
import {
  useQuickCapture,
  useRecentCaptures,
  useRecentTags,
} from '@/lib/hooks/useCapture';

export default function CaptureScreen() {
  // Form state
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>(TemplateType.None);
  const [behaviourConfig, setBehaviourConfig] = useState<BehaviourConfig>(
    defaultBehaviourConfig
  );
  const [showDetails, setShowDetails] = useState(false);

  // Refs
  const titleInputRef = useRef<TextInput>(null);

  // Animation
  const detailsHeight = useSharedValue(0);
  const detailsOpacity = useSharedValue(0);

  // Queries and mutations
  const quickCapture = useQuickCapture();
  const { data: recentCaptures = [], isLoading: isLoadingCaptures } =
    useRecentCaptures(5);
  const { data: recentTags = [] } = useRecentTags(10);

  // Auto-focus title input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Animate details section
  useEffect(() => {
    detailsHeight.value = withTiming(showDetails ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    detailsOpacity.value = withTiming(showDetails ? 1 : 0, {
      duration: 200,
    });
  }, [showDetails, detailsHeight, detailsOpacity]);

  const detailsAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: detailsHeight.value * 500,
    opacity: detailsOpacity.value,
    overflow: 'hidden',
  }));

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return;

    try {
      await quickCapture.mutateAsync({
        title: title.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });

      // Haptic feedback on success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Clear form
      setTitle('');
      setTags([]);
      setBody('');
      setTemplateType(TemplateType.None);
      setBehaviourConfig(defaultBehaviourConfig);
      setShowDetails(false);

      // Re-focus for next capture
      titleInputRef.current?.focus();
    } catch (error) {
      // Haptic feedback on error
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to capture:', error);
    }
  }, [title, tags, quickCapture]);

  const handleRecentCapturePress = useCallback((id: string) => {
    router.push(`/notes/${id}`);
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center gap-2 mb-4">
            <Inbox size={24} color="#7c3aed" />
            <Text className="text-xl font-bold text-foreground">
              Quick Capture
            </Text>
          </View>

          {/* Main Capture Card */}
          <Card className="mb-4">
            <CardContent className="py-4">
              {/* Title Input */}
              <Input
                ref={titleInputRef}
                placeholder="What's on your mind?"
                value={title}
                onChangeText={setTitle}
                onSubmitEditing={handleSubmit}
                className="mb-4 border-0 bg-transparent text-lg"
                returnKeyType="done"
                blurOnSubmit={false}
              />

              {/* Tag Input */}
              <TagInput
                tags={tags}
                onTagsChange={setTags}
                suggestions={recentTags}
                className="mb-4"
              />

              {/* Add More Detail Toggle */}
              <Pressable
                onPress={toggleDetails}
                className="flex-row items-center justify-between py-2 border-t border-border"
              >
                <Text className="text-sm text-muted-foreground">
                  Add more detail
                </Text>
                {showDetails ? (
                  <ChevronUp size={20} color="#71717a" />
                ) : (
                  <ChevronDown size={20} color="#71717a" />
                )}
              </Pressable>

              {/* Expandable Details Section */}
              <Animated.View style={detailsAnimatedStyle}>
                <View className="pt-4 space-y-4">
                  {/* Template Selector */}
                  <TemplateSelector
                    value={templateType}
                    onChange={setTemplateType}
                    className="mb-4"
                  />

                  {/* Body Editor */}
                  <View className="mb-4">
                    <Text className="text-sm font-medium text-foreground mb-2">
                      Notes
                    </Text>
                    <TextInput
                      value={body}
                      onChangeText={setBody}
                      placeholder="Add more details..."
                      placeholderTextColor="#71717a"
                      multiline
                      numberOfLines={4}
                      className="min-h-24 p-3 bg-background border border-input rounded-md text-foreground"
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Behaviour Toggles */}
                  <BehaviourToggles
                    config={behaviourConfig}
                    onChange={setBehaviourConfig}
                  />
                </View>
              </Animated.View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <Button
              className="flex-1"
              onPress={handleSubmit}
              disabled={!title.trim() || quickCapture.isPending}
            >
              {quickCapture.isPending ? 'Saving...' : 'Save to Inbox'}
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push('/notes/new')}
              className="px-4"
            >
              <Plus size={20} color="#71717a" />
            </Button>
          </View>

          {/* Recent Captures Section */}
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-3">
              Recently Captured
            </Text>

            {isLoadingCaptures ? (
              <View className="py-4">
                <Text className="text-center text-muted-foreground">
                  Loading...
                </Text>
              </View>
            ) : recentCaptures.length === 0 ? (
              <View className="py-8 items-center">
                <Inbox size={32} color="#71717a" />
                <Text className="text-muted-foreground mt-2">
                  No recent captures
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                  Your captured items will appear here
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {recentCaptures.map((item) => (
                  <RecentCaptureItem
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    tags={item.tags}
                    createdAt={item.createdAt}
                    onPress={handleRecentCapturePress}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
