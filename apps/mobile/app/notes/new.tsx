import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';

const TEMPLATE_TYPES = [
  { id: null, name: 'Plain Note' },
  { id: 'person', name: 'Person' },
  { id: 'recipe', name: 'Recipe' },
  { id: 'project', name: 'Project' },
  { id: 'gift_idea', name: 'Gift Idea' },
  { id: 'shopping_item', name: 'Shopping Item' },
];

export default function NewNoteScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateType, setTemplateType] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    // TODO: Call API to create note when NSwag client is available
    // const { mutate: createNote } = useCreateNote();
    // createNote({ title, body, templateType, tags });

    console.log('Creating note:', { title, body, templateType, tags });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <Button variant="ghost" onPress={() => router.back()}>
          <ArrowLeft size={24} className="text-foreground" />
        </Button>
        <Text className="text-lg font-semibold text-foreground">New Note</Text>
        <Button variant="ghost" onPress={handleSave} disabled={!title.trim()}>
          <Save size={24} className="text-primary" />
        </Button>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Template Selection */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">
            Template
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {TEMPLATE_TYPES.map((template) => (
              <Pressable
                key={template.id ?? 'plain'}
                onPress={() => setTemplateType(template.id)}
              >
                <Badge
                  variant={templateType === template.id ? 'default' : 'outline'}
                >
                  <Text
                    className={
                      templateType === template.id
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }
                  >
                    {template.name}
                  </Text>
                </Badge>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Title */}
        <Input
          label="Title"
          placeholder="Note title"
          value={title}
          onChangeText={setTitle}
          className="mb-4"
        />

        {/* Body */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">
            Content
          </Text>
          <Card>
            <CardContent className="p-0">
              <Input
                placeholder="Write your note..."
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={8}
                className="min-h-[200px] border-0 bg-transparent text-base"
                textAlignVertical="top"
              />
            </CardContent>
          </Card>
        </View>

        {/* Tags */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-foreground">Tags</Text>
          <View className="flex-row flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Text className="text-secondary-foreground">{tag}</Text>
                <Text
                  className="ml-1 text-muted-foreground"
                  onPress={() => setTags(tags.filter((t) => t !== tag))}
                >
                  ×
                </Text>
              </Badge>
            ))}
          </View>
          <View className="flex-row gap-2">
            <Input
              placeholder="Add tag..."
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              className="flex-1"
            />
            <Button variant="outline" onPress={handleAddTag}>
              Add
            </Button>
          </View>
        </View>

        {/* TODO: Add template-specific fields based on templateType */}
        {/* TODO: Add behaviour configuration */}
        {/* TODO: Add trigger/blocker configuration */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
