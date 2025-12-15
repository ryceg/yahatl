import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { Input, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  suggestions = [],
  placeholder = 'Add tag...',
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        onTagsChange([...tags, trimmedTag]);
      }
      setInputValue('');
      setShowSuggestions(false);
    },
    [tags, onTagsChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onTagsChange]
  );

  const handleSubmitEditing = useCallback(() => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  }, [inputValue, addTag]);

  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
    setShowSuggestions(text.length > 0);
  }, []);

  return (
    <View className={cn('w-full', className)}>
      {/* Selected Tags */}
      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex-row items-center gap-1 pr-1"
            >
              <Text className="text-secondary-foreground">{tag}</Text>
              <Pressable
                onPress={() => removeTag(tag)}
                hitSlop={8}
                className="ml-1 p-0.5 rounded-full bg-secondary-foreground/20"
              >
                <X size={12} className="text-secondary-foreground" />
              </Pressable>
            </Badge>
          ))}
        </View>
      )}

      {/* Input */}
      <View className="relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmitEditing}
          onFocus={() => setShowSuggestions(inputValue.length > 0 || filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          returnKeyType="done"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <View className="absolute top-14 left-0 right-0 z-10 bg-card border border-border rounded-md shadow-lg max-h-40">
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => addTag(suggestion)}
                  className="px-3 py-2 border-b border-border last:border-b-0 active:bg-muted"
                >
                  <Text className="text-foreground">{suggestion}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Quick Tag Suggestions (when no input) */}
      {!inputValue && suggestions.length > 0 && tags.length === 0 && (
        <View className="mt-2">
          <Text className="text-xs text-muted-foreground mb-2">Recent tags:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {suggestions.slice(0, 5).map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => addTag(suggestion)}
                >
                  <Badge variant="outline">
                    <Text className="text-foreground">{suggestion}</Text>
                  </Badge>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
