import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Input, Button, Card, CardContent, Badge } from '@/components/ui';

export default function CaptureScreen() {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    // TODO: Call API to create inbox note when NSwag client is available
    // const { mutate: createNote } = useCreateNote();
    // createNote({ title, tags, isInbox: true });

    console.log('Creating note:', { title, tags, isInbox: true });

    // Clear form
    setTitle('');
    setTags([]);

    // Optionally navigate to the new note
    // router.push('/notes/new');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 p-4">
        <Text className="mb-4 text-lg font-semibold text-foreground">
          Quick Capture
        </Text>

        <Card className="mb-4">
          <CardContent className="py-4">
            <Input
              placeholder="What's on your mind?"
              value={title}
              onChangeText={setTitle}
              className="mb-4 border-0 bg-transparent text-lg"
              autoFocus
            />

            <View className="flex-row flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-secondary-foreground">{tag}</Text>
                  <Text
                    className="text-muted-foreground ml-1"
                    onPress={() => handleRemoveTag(tag)}
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
          </CardContent>
        </Card>

        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            onPress={handleSubmit}
            disabled={!title.trim()}
          >
            Save to Inbox
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/notes/new')}
          >
            Expand
          </Button>
        </View>

        {/* TODO: Add voice input button */}
        {/* TODO: Add recent tags for quick selection */}
      </View>
    </KeyboardAvoidingView>
  );
}
