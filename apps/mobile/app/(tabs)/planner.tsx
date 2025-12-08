import { View, Text, ScrollView } from 'react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@/components/ui';

export default function PlannerScreen() {
  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Today's Plan Section */}
      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Today's Plan
        </Text>
        <Card className="mb-3">
          <CardContent className="flex-row items-center justify-between py-4">
            <View className="flex-1">
              <Text className="text-base font-medium text-card-foreground">
                No tasks planned yet
              </Text>
              <Text className="text-sm text-muted-foreground">
                Drag items from candidates below
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Candidates Section */}
      <View className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">
            Candidates
          </Text>
          <Badge variant="secondary">0</Badge>
        </View>

        {/* Urgent Section */}
        <View className="mb-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Badge variant="destructive">Urgent</Badge>
          </View>
          <Text className="text-sm text-muted-foreground">
            No urgent items
          </Text>
        </View>

        {/* Due Soon Section */}
        <View className="mb-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Badge variant="warning">Due Soon</Badge>
          </View>
          <Text className="text-sm text-muted-foreground">
            No items due soon
          </Text>
        </View>

        {/* Available Section */}
        <View className="mb-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Badge>Available</Badge>
          </View>
          <Text className="text-sm text-muted-foreground">
            No available items
          </Text>
        </View>
      </View>

      {/* TODO: Replace with TanStack Query hooks when API client is available */}
      {/*
        Implementation notes:
        - usePlanner() hook to fetch candidates and today's plan
        - Drag-and-drop to move items to today's plan
        - Swipe gestures for complete/snooze actions
        - Pull-to-refresh for manual sync
      */}
    </ScrollView>
  );
}
