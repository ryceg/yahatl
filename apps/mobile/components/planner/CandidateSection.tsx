/**
 * CandidateSection Component
 *
 * Collapsible section for grouping candidate items by urgency.
 */
import * as React from 'react';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { CandidateItem as CandidateItemType } from '@/lib/api/client';
import { Badge } from '@/components/ui';
import { CandidateItem } from './CandidateItem';
import { cn } from '@/lib/utils';

type SectionVariant = 'urgent' | 'dueSoon' | 'available';

interface CandidateSectionProps {
  title: string;
  variant: SectionVariant;
  items: CandidateItemType[];
  onAddToToday: (noteId: string) => void;
  onItemPress?: (noteId: string) => void;
  defaultExpanded?: boolean;
}

/**
 * Get badge variant based on section type.
 */
function getBadgeVariant(variant: SectionVariant): 'destructive' | 'warning' | 'secondary' {
  switch (variant) {
    case 'urgent':
      return 'destructive';
    case 'dueSoon':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function CandidateSection({
  title,
  variant,
  items,
  onAddToToday,
  onItemPress,
  defaultExpanded = true,
}: CandidateSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    rotation.value = withTiming(isExpanded ? 0 : 180, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const badgeVariant = getBadgeVariant(variant);

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      {/* Header */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
          <Badge variant={badgeVariant}>
            {items.length}
          </Badge>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} className="text-muted-foreground" />
        </Animated.View>
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <View className="mt-1">
          {items.map((item) => (
            <CandidateItem
              key={item.noteId}
              item={item}
              onAddToToday={onAddToToday}
              onPress={onItemPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}
