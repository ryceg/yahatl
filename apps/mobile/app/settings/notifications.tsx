import { View, Text, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function NotificationsSettingsScreen() {
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [overdueNotifications, setOverdueNotifications] = useState(true);
  const [streakNotifications, setStreakNotifications] = useState(true);
  const [blockerNotifications, setBlockerNotifications] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Configure which notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-card-foreground">
                Reminders
              </Text>
              <Text className="text-sm text-muted-foreground">
                Get notified when reminders fire
              </Text>
            </View>
            <Switch
              value={reminderNotifications}
              onValueChange={setReminderNotifications}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-card-foreground">
                Overdue Tasks
              </Text>
              <Text className="text-sm text-muted-foreground">
                Nag when tasks become overdue
              </Text>
            </View>
            <Switch
              value={overdueNotifications}
              onValueChange={setOverdueNotifications}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-card-foreground">
                Streak Alerts
              </Text>
              <Text className="text-sm text-muted-foreground">
                Morning notification when streak is at risk
              </Text>
            </View>
            <Switch
              value={streakNotifications}
              onValueChange={setStreakNotifications}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-base font-medium text-card-foreground">
                Blocker Resolved
              </Text>
              <Text className="text-sm text-muted-foreground">
                Notify when a blocker clears
              </Text>
            </View>
            <Switch
              value={blockerNotifications}
              onValueChange={setBlockerNotifications}
            />
          </View>
        </CardContent>
      </Card>

      {/* TODO: Save notification preferences to API */}
    </ScrollView>
  );
}
