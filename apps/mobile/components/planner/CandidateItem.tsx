/**
 * CandidateItem Component
 *
 * Individual candidate item for the planner.
 * Displays note title, template badge, reason for surfacing.
 * Supports swipe right to add to today's plan.
 */
import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FileText,
  Repeat,
  ListChecks,
  ChevronRight,
} from 'lucide-react-native';
import { CandidateItem as CandidateItemType, CandidateReason, TemplateType, Priority } from '@/lib/api/api';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CandidateItemProps {
  item: CandidateItemType;
  onAddToToday: (noteId: string) => void;
  onPress?: (noteId: string) => void;
}

/**
 * Get the template icon based on template type.
 */
function getTemplateIcon(templateType: TemplateType | undefined) {
  switch (templateType) {
    case TemplateType.Project:
      return ListChecks;
    case TemplateType.Recipe:
      return FileText;
    default:
      return FileText;
  }
}

/**
 * Get the reason label for display.
 */
function getReasonLabel(item: CandidateItemType): string {
  const reason = item.reason ?? CandidateReason.Available;
  switch (reason) {
    case CandidateReason.Overdue:
      return item.overdueDays ? `Overdue ${item.overdueDays}d` : 'Overdue';
    case CandidateReason.DueToday:
      return 'Due today';
    case CandidateReason.WindowClosingSoon:
      return 'Window closing';
    case CandidateReason.StreakAtRisk:
      return 'Streak at risk';
    case CandidateReason.IntervalElapsed:
      return 'Time to do';
    case CandidateReason.ConditionMet:
      return 'Condition met';
    case CandidateReason.Available:
    default:
      return 'Available';
  }
}

/**
 * Get the reason badge variant.
 */
function getReasonVariant(reason: CandidateReason | undefined): 'destructive' | 'warning' | 'secondary' | 'default' {
  switch (reason) {
    case CandidateReason.Overdue:
    case CandidateReason.StreakAtRisk:
      return 'destructive';
    case CandidateReason.DueToday:
    case CandidateReason.WindowClosingSoon:
      return 'warning';
    case CandidateReason.IntervalElapsed:
    case CandidateReason.ConditionMet:
      return 'secondary';
    default:
      return 'default';
  }
}

/**
 * Get the reason icon.
 */
function getReasonIcon(reason: CandidateReason | undefined) {
  switch (reason) {
    case CandidateReason.Overdue:
      return AlertTriangle;
    case CandidateReason.DueToday:
    case CandidateReason.WindowClosingSoon:
      return Clock;
    case CandidateReason.StreakAtRisk:
      return Flame;
    case CandidateReason.IntervalElapsed:
      return Repeat;
    case CandidateReason.ConditionMet:
      return CheckCircle2;
    default:
      return null;
  }
}

/**
 * Get priority color class.
 */
function getPriorityIndicator(priority: Priority | undefined): string | null {
  switch (priority) {
    case Priority.Urgent:
      return 'bg-red-500';
    case Priority.High:
      return 'bg-orange-500';
    case Priority.Low:
      return 'bg-gray-400';
    default:
      return null;
  }
}

export function CandidateItem({ item, onAddToToday, onPress }: CandidateItemProps) {
  const TemplateIcon = getTemplateIcon(item.templateType);
  const reasonLabel = getReasonLabel(item);
  const reasonVariant = getReasonVariant(item.reason);
  const ReasonIcon = getReasonIcon(item.reason);
  const priorityIndicator = getPriorityIndicator(item.priority);

  const handlePress = () => {
    if (item.noteId) {
      onPress?.(item.noteId);
    }
  };

  const handleAddToToday = () => {
    if (item.noteId) {
      onAddToToday(item.noteId);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center rounded-lg border border-border bg-card p-3 mb-2"
    >
      {/* Priority indicator */}
      {priorityIndicator && (
        <View className={cn('w-1 h-full rounded-full mr-3', priorityIndicator)} />
      )}

      {/* Template icon */}
      <View className="mr-3 rounded bg-muted p-2">
        <TemplateIcon size={16} className="text-muted-foreground" />
      </View>

      {/* Content */}
      <View className="flex-1 mr-2">
        <Text className="text-base font-medium text-card-foreground" numberOfLines={1}>
          {item.title ?? 'Untitled'}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Badge variant={reasonVariant} className="self-start">
            {ReasonIcon && <ReasonIcon size={10} className="mr-1" />}
            <Text className="text-xs">{reasonLabel}</Text>
          </Badge>
          {item.streakAtRisk && item.reason !== CandidateReason.StreakAtRisk && (
            <Badge variant="destructive" className="self-start">
              <Flame size={10} className="mr-1" />
              <Text className="text-xs">Streak</Text>
            </Badge>
          )}
        </View>
      </View>

      {/* Add to today button */}
      <Pressable
        onPress={handleAddToToday}
        className="rounded-full bg-primary/10 p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronRight size={20} className="text-primary" />
      </Pressable>
    </Pressable>
  );
}
