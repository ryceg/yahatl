import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Edit, Trash2, Clock, Tag } from 'lucide-react-native';
import {
  Button,
  Card,
  CardContent,
  Badge,
} from '@/components/ui';
import { useNote, useBehaviours, useCompleteTask, useDeleteNote } from '@/lib/api/hooks';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: note, isLoading, error } = useNote(id);
  const { data: behaviours } = useBehaviours(id);
  const completeTask = useCompleteTask();
  const deleteNote = useDeleteNote();

  const handleComplete = async () => {
    await completeTask.mutateAsync(id);
  };

  const handleDelete = async () => {
    await deleteNote.mutateAsync(id);
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !note) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-destructive">Failed to load note</Text>
        <Button variant="outline" onPress={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </View>
    );
  }

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
          <Button variant="ghost" onPress={handleDelete}>
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
        {note.tags && note.tags.length > 0 && (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {note.tags.map((tag: string) => (
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
            Created {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>

        {/* Body */}
        {note.body && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <Text className="text-foreground">{note.body}</Text>
            </CardContent>
          </Card>
        )}

        {/* Behaviours Section */}
        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Behaviours
          </Text>
          {!behaviours || behaviours.length === 0 ? (
            <Text className="text-muted-foreground">No behaviours attached</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {behaviours.map((b, i) => (
                <Badge key={i}>
                  <Text className="text-primary-foreground">{b.type}</Text>
                </Badge>
              ))}
            </View>
          )}
        </View>

        {/* Blockers Section */}
        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Blockers
          </Text>
          {!note.blockers || note.blockers.length === 0 ? (
            <Text className="text-muted-foreground">No blockers</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {note.blockers.map((b: { type?: string }, i: number) => (
                <Badge key={i} variant="destructive">
                  <Text className="text-destructive-foreground">{b.type}</Text>
                </Badge>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <Button
            className="flex-1"
            onPress={handleComplete}
            disabled={completeTask.isPending}
          >
            {completeTask.isPending ? 'Completing...' : 'Mark Complete'}
          </Button>
          <Button variant="outline" className="flex-1">
            Start Pomodoro
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
