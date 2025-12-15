import React from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  FileText,
  User,
  UtensilsCrossed,
  FolderKanban,
  Gift,
  ShoppingCart,
} from 'lucide-react-native';
import { cn } from '@/lib/utils';

// Maps to backend TemplateType enum
export enum TemplateType {
  None = 0,
  Person = 1,
  Recipe = 2,
  Project = 3,
  GiftIdea = 4,
  ShoppingItem = 5,
}

interface TemplateOption {
  value: TemplateType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  description: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    value: TemplateType.None,
    label: 'Plain Note',
    icon: FileText,
    description: 'No template',
  },
  {
    value: TemplateType.Person,
    label: 'Person',
    icon: User,
    description: 'Contact info, birthday',
  },
  {
    value: TemplateType.Recipe,
    label: 'Recipe',
    icon: UtensilsCrossed,
    description: 'Ingredients, method',
  },
  {
    value: TemplateType.Project,
    label: 'Project',
    icon: FolderKanban,
    description: 'Status, deadline',
  },
  {
    value: TemplateType.GiftIdea,
    label: 'Gift Idea',
    icon: Gift,
    description: 'Recipient, price range',
  },
  {
    value: TemplateType.ShoppingItem,
    label: 'Shopping Item',
    icon: ShoppingCart,
    description: 'Quantity, category',
  },
];

interface TemplateSelectorProps {
  value: TemplateType;
  onChange: (value: TemplateType) => void;
  className?: string;
}

export function TemplateSelector({
  value,
  onChange,
  className,
}: TemplateSelectorProps) {
  return (
    <View className={cn('w-full', className)}>
      <Text className="text-sm font-medium text-foreground mb-2">
        Template Type
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {TEMPLATE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={cn(
                'flex-row items-center gap-2 px-3 py-2 rounded-md border',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background'
              )}
            >
              <Icon
                size={16}
                color={isSelected ? '#7c3aed' : '#71717a'}
              />
              <Text
                className={cn(
                  'text-sm',
                  isSelected ? 'text-primary font-medium' : 'text-foreground'
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export { TEMPLATE_OPTIONS };
