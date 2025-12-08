import { View, Text, ScrollView } from 'react-native';
import { User, Mail } from 'lucide-react-native';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';

export default function AccountSettingsScreen() {
  // TODO: Get user data from auth store / API

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <User size={32} color="#fafafa" />
            </View>
            <View>
              <CardTitle>Rhys Goodall</CardTitle>
              <CardDescription>rhys@example.com</CardDescription>
            </View>
          </View>
        </CardHeader>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input label="Display Name" value="Rhys Goodall" />
          <Input label="Email" value="rhys@example.com" keyboardType="email-address" />
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input label="Current Password" secureTextEntry placeholder="••••••••" />
          <Input label="New Password" secureTextEntry placeholder="••••••••" />
          <Input label="Confirm Password" secureTextEntry placeholder="••••••••" />
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
