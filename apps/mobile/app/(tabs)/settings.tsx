import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, User, Bell, Link2, LogOut } from 'lucide-react-native';
import { Card, CardContent, Button } from '@/components/ui';

type SettingsItemProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function SettingsItem({ icon, title, subtitle, onPress }: SettingsItemProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="mb-2">
        <CardContent className="flex-row items-center py-4">
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-secondary">
            {icon}
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-card-foreground">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-muted-foreground">{subtitle}</Text>
            )}
          </View>
          <ChevronRight size={20} className="text-muted-foreground" />
        </CardContent>
      </Card>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const handleLogout = () => {
    // TODO: Clear auth tokens and redirect to login
    // authStore.clearAuth();
    router.replace('/auth/login');
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Account Section */}
      <View className="mb-6">
        <Text className="mb-3 text-sm font-medium uppercase text-muted-foreground">
          Account
        </Text>
        <SettingsItem
          icon={<User size={20} className="text-foreground" />}
          title="Profile"
          subtitle="Manage your account"
          onPress={() => router.push('/settings/account')}
        />
      </View>

      {/* Preferences Section */}
      <View className="mb-6">
        <Text className="mb-3 text-sm font-medium uppercase text-muted-foreground">
          Preferences
        </Text>
        <SettingsItem
          icon={<Bell size={20} className="text-foreground" />}
          title="Notifications"
          subtitle="Push notifications & reminders"
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsItem
          icon={<Link2 size={20} className="text-foreground" />}
          title="Integrations"
          subtitle="Google Calendar, Contacts"
          onPress={() => router.push('/settings/integrations')}
        />
      </View>

      {/* Logout */}
      <View className="mt-4">
        <Button
          variant="destructive"
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2"
        >
          <LogOut size={18} color="#fafafa" />
          <Text className="text-destructive-foreground font-medium">
            Log Out
          </Text>
        </Button>
      </View>

      {/* App Info */}
      <View className="mt-8 items-center">
        <Text className="text-sm text-muted-foreground">YAHATL v1.0.0</Text>
        <Text className="text-xs text-muted-foreground">
          Yet Another Home Assistant Todo List
        </Text>
      </View>
    </ScrollView>
  );
}
