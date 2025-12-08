import { View, Text, ScrollView } from 'react-native';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export default function DashboardScreen() {
  // TODO: Replace with TanStack Query hooks when API client is available
  const stats = {
    overdueCount: 0,
    tasksDueToday: 0,
    streaksAtRisk: 0,
    waitingOn: 0,
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Stats Grid */}
      <View className="mb-6 flex-row flex-wrap gap-3">
        <Card className="flex-1 min-w-[45%]">
          <CardContent className="py-4">
            <Text className="text-3xl font-bold text-destructive">
              {stats.overdueCount}
            </Text>
            <Text className="text-sm text-muted-foreground">Overdue</Text>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[45%]">
          <CardContent className="py-4">
            <Text className="text-3xl font-bold text-primary">
              {stats.tasksDueToday}
            </Text>
            <Text className="text-sm text-muted-foreground">Due Today</Text>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[45%]">
          <CardContent className="py-4">
            <Text className="text-3xl font-bold text-foreground">
              {stats.streaksAtRisk}
            </Text>
            <Text className="text-sm text-muted-foreground">Streaks at Risk</Text>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[45%]">
          <CardContent className="py-4">
            <Text className="text-3xl font-bold text-foreground">
              {stats.waitingOn}
            </Text>
            <Text className="text-sm text-muted-foreground">Waiting On</Text>
          </CardContent>
        </Card>
      </View>

      {/* Upcoming Section */}
      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Upcoming
        </Text>
        <Card>
          <CardContent className="py-4">
            <Text className="text-muted-foreground">
              No upcoming reminders
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Streaks Section */}
      <View className="mb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">
            Active Streaks
          </Text>
          <Badge variant="secondary">0</Badge>
        </View>
        <Card>
          <CardContent className="py-4">
            <Text className="text-muted-foreground">
              No active streaks
            </Text>
          </CardContent>
        </Card>
      </View>

      {/* Quick Filters */}
      <View className="mb-6">
        <Text className="mb-3 text-lg font-semibold text-foreground">
          Browse
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Badge variant="outline">All Notes</Badge>
          <Badge variant="outline">People</Badge>
          <Badge variant="outline">Recipes</Badge>
          <Badge variant="outline">Projects</Badge>
        </View>
      </View>

      {/* TODO: Add calendar view overlay when Google Calendar integration is ready */}
    </ScrollView>
  );
}
