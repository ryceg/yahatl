import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Edit, Trash2, Clock, Tag } from 'lucide-react-native';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@/components/ui';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: Fetch note data using TanStack Query when API client is available
  // const { data: note, isLoading } = useNote(id);

  const note = {
    id,
    title: 'Sample Note',
    body: 'This is a sample note body. It would contain markdown content.',
    templateType: null,
    tags: ['sample', 'demo'],
    createdAt: new Date().toISOString(),
    behaviours: [] as string[],
    blockers: [] as string[],
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <Button variant="ghost" onPress={() => router.back()}>
          <ArrowLeft size={24} className="text-foreground" />
        </Button>
        <View className="flex-row gap-2">
          <Button variant="ghost">
            <Edit size={20} className="text-foreground" />
          </Button>
          <Button variant="ghost">
            <Trash2 size={20} className="text-destructive" />
          </Button>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Title */}
        <Text className="mb-2 text-2xl font-bold text-foreground">
          {note.title}
        </Text>

        {/* Tags */}
        {note.tags.length > 0 && (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <Tag size={12} className="mr-1 text-secondary-foreground" />
                <Text className="text-secondary-foreground">{tag}</Text>
              </Badge>
            ))}
          </View>
        )}

        {/* Meta */}
        <View className="mb-4 flex-row items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <Text className="text-sm text-muted-foreground">
            Created {new Date(note.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Body */}
        <Card className="mb-4">
          <CardContent className="py-4">
            <Text className="text-foreground">{note.body}</Text>
          </CardContent>
        </Card>

        {/* Behaviours Section */}
        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Behaviours
          </Text>
          {note.behaviours.length === 0 ? (
            <Text className="text-muted-foreground">No behaviours attached</Text>
          ) : (
            note.behaviours.map((b, i) => (
              <Badge key={i} className="mr-2">
                {b}
              </Badge>
            ))
          )}
        </View>

        {/* Blockers Section */}
        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Blockers
          </Text>
          {note.blockers.length === 0 ? (
            <Text className="text-muted-foreground">No blockers</Text>
          ) : (
            note.blockers.map((b, i) => (
              <Badge key={i} variant="destructive" className="mr-2">
                {b}
              </Badge>
            ))
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <Button className="flex-1">Mark Complete</Button>
          <Button variant="outline" className="flex-1">
            Start Pomodoro
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
