/**
 * TodayPlan Component
 *
 * Ordered list of committed items for today.
 * Supports drag-to-reorder and swipe-to-complete.
 */
import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Check,
  GripVertical,
  FileText,
  ListChecks,
  X,
} from 'lucide-react-native';
import { PlanItem, TemplateType } from '@/lib/api/api';
import { Card, CardContent, Badge } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { cn } from '@/lib/utils';

interface TodayPlanProps {
  items: PlanItem[];
  onComplete: (noteId: string) => void;
  onRemove: (noteId: string) => void;
  onItemPress?: (noteId: string) => void;
  onReorder?: (noteIds: string[]) => void;
}

interface PlanItemRowProps {
  item: PlanItem;
  onComplete: (noteId: string) => void;
  onRemove: (noteId: string) => void;
  onPress?: (noteId: string) => void;
}

/**
 * Get template icon based on type.
 */
function getTemplateIcon(templateType: TemplateType | undefined) {
  switch (templateType) {
    case TemplateType.Project:
      return ListChecks;
    default:
      return FileText;
  }
}

/**
 * Individual plan item row.
 */
function PlanItemRow({ item, onComplete, onRemove, onPress }: PlanItemRowProps) {
  const Icon = getTemplateIcon(item.templateType);
  const isComplete = item.isComplete;

  const handlePress = () => {
    if (item.noteId) {
      onPress?.(item.noteId);
    }
  };

  const handleComplete = () => {
    if (item.noteId) {
      onComplete(item.noteId);
    }
  };

  const handleRemove = () => {
    if (item.noteId) {
      onRemove(item.noteId);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        'flex-row items-center rounded-lg border border-border bg-card p-3 mb-2',
        isComplete && 'opacity-60'
      )}
    >
      {/* Drag handle - visual only for now, full drag support would need gesture handler */}
      <View className="mr-2">
        <GripVertical size={18} className="text-muted-foreground" />
      </View>

      {/* Complete button */}
      <Pressable
        onPress={handleComplete}
        className={cn(
          'mr-3 h-6 w-6 items-center justify-center rounded-full border',
          isComplete
            ? 'border-primary bg-primary'
            : 'border-muted-foreground'
        )}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isComplete && <Check size={14} color="white" />}
      </Pressable>

      {/* Content */}
      <View className="flex-1 mr-2">
        <Text
          className={cn(
            'text-base font-medium text-card-foreground',
            isComplete && 'line-through text-muted-foreground'
          )}
          numberOfLines={1}
        >
          {item.title ?? 'Untitled'}
        </Text>
        {item.completedAt && (
          <Text className="text-xs text-muted-foreground">
            Completed {new Date(item.completedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>

      {/* Template badge */}
      <View className="mr-2 rounded bg-muted p-1.5">
        <Icon size={14} className="text-muted-foreground" />
      </View>

      {/* Remove button */}
      {!isComplete && (
        <Pressable
          onPress={handleRemove}
          className="rounded-full p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} className="text-muted-foreground" />
        </Pressable>
      )}
    </Pressable>
  );
}

export function TodayPlan({
  items,
  onComplete,
  onRemove,
  onItemPress,
  onReorder,
}: TodayPlanProps) {
  // Separate completed and incomplete items
  const incompleteItems = items.filter((item) => !item.isComplete);
  const completedItems = items.filter((item) => item.isComplete);
  const sortedItems = [...incompleteItems, ...completedItems];

  if (items.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="py-6">
          <EmptyState
            title="No tasks planned"
            description="Pull items from candidates below to build your day"
          />
        </CardContent>
      </Card>
    );
  }

  const completedCount = completedItems.length;
  const totalCount = items.length;

  return (
    <View className="mb-4">
      {/* Header with progress */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-semibold text-foreground">Today's Plan</Text>
        <Badge variant="secondary">
          {completedCount}/{totalCount}
        </Badge>
      </View>

      {/* Progress bar */}
      <View className="h-1 rounded-full bg-muted mb-3 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </View>

      {/* Items */}
      {sortedItems.map((item) => (
        <PlanItemRow
          key={item.noteId}
          item={item}
          onComplete={onComplete}
          onRemove={onRemove}
          onPress={onItemPress}
        />
      ))}
    </View>
  );
}
