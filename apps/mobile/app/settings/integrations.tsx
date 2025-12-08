import { View, Text, ScrollView } from 'react-native';
import { Calendar, Users, Link2 } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';

export default function IntegrationsSettingsScreen() {
  // TODO: Get integration status from API

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Google Calendar */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Calendar size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Read-only calendar overlay</CardDescription>
            </View>
            <Badge variant="outline">Not connected</Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text className="mb-4 text-sm text-muted-foreground">
            Connect your Google Calendar to see events alongside your tasks and
            reminders.
          </Text>
          <Button onPress={() => console.log('Connect Google Calendar')}>
            Connect Calendar
          </Button>
        </CardContent>
      </Card>

      {/* Google Contacts */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Users size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <CardTitle>Google Contacts</CardTitle>
              <CardDescription>Import contacts as People notes</CardDescription>
            </View>
            <Badge variant="outline">Not connected</Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text className="mb-4 text-sm text-muted-foreground">
            Import contacts to create Person notes with birthdays and sync
            information one-way from Google.
          </Text>
          <Button onPress={() => console.log('Connect Google Contacts')}>
            Connect Contacts
          </Button>
        </CardContent>
      </Card>

      {/* Home Assistant */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Link2 size={20} className="text-foreground" />
            </View>
            <View className="flex-1">
              <CardTitle>Home Assistant</CardTitle>
              <CardDescription>MQTT integration status</CardDescription>
            </View>
            <Badge variant="success">Connected</Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            YAHATL entities are automatically published to Home Assistant via
            MQTT. Configure automations in HA to respond to task events.
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
