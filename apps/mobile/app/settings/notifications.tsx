import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useState } from "react";
import { Clock } from "lucide-react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@/components/ui";

// Time options for notification scheduling
const TIME_OPTIONS = [
  { label: "6:00 AM", value: "06:00" },
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "8:00 PM", value: "20:00" },
  { label: "9:00 PM", value: "21:00" },
];

type TimePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimePicker({ label, value, onChange }: TimePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedOption = TIME_OPTIONS.find((opt) => opt.value === value);

  return (
    <View className="mb-2">
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-row items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <Text className="text-base text-card-foreground">{label}</Text>
        </View>
        <Text className="text-base font-medium text-primary">
          {selectedOption?.label ?? value}
        </Text>
      </Pressable>

      {isExpanded && (
        <View className="flex-row flex-wrap gap-2 py-2">
          {TIME_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsExpanded(false);
              }}
              className={`rounded-lg px-3 py-2 ${
                value === option.value
                  ? "bg-primary"
                  : "bg-secondary"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  value === option.value
                    ? "text-primary-foreground"
                    : "text-secondary-foreground"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

type NotificationToggleProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function NotificationToggle({
  title,
  description,
  value,
  onValueChange,
}: NotificationToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-1 pr-4">
        <Text className="text-base font-medium text-card-foreground">
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  // Toggle states
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [overdueNotifications, setOverdueNotifications] = useState(true);
  const [streakNotifications, setStreakNotifications] = useState(true);
  const [blockerNotifications, setBlockerNotifications] = useState(false);

  // Time preferences
  const [morningReminderTime, setMorningReminderTime] = useState("08:00");
  const [eveningReviewTime, setEveningReviewTime] = useState("20:00");
  const [overdueNagTime, setOverdueNagTime] = useState("09:00");

  const handleSave = () => {
    // TODO: Save notification preferences to API
    console.log("Saving notification preferences:", {
      reminderNotifications,
      overdueNotifications,
      streakNotifications,
      blockerNotifications,
      morningReminderTime,
      eveningReviewTime,
      overdueNagTime,
    });
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Push Notification Toggles */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Configure which notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-2">
          <NotificationToggle
            title="Reminders"
            description="Get notified when reminders fire"
            value={reminderNotifications}
            onValueChange={setReminderNotifications}
          />

          <View className="my-2 h-px bg-border" />

          <NotificationToggle
            title="Overdue Tasks"
            description="Nag when tasks become overdue"
            value={overdueNotifications}
            onValueChange={setOverdueNotifications}
          />

          <View className="my-2 h-px bg-border" />

          <NotificationToggle
            title="Streak Alerts"
            description="Morning notification when streak is at risk"
            value={streakNotifications}
            onValueChange={setStreakNotifications}
          />

          <View className="my-2 h-px bg-border" />

          <NotificationToggle
            title="Blocker Resolved"
            description="Notify when a blocker clears"
            value={blockerNotifications}
            onValueChange={setBlockerNotifications}
          />
        </CardContent>
      </Card>

      {/* Notification Time Preferences */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
          <CardDescription>
            Set preferred times for scheduled notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimePicker
            label="Morning reminder"
            value={morningReminderTime}
            onChange={setMorningReminderTime}
          />

          <View className="my-2 h-px bg-border" />

          <TimePicker
            label="Evening review"
            value={eveningReviewTime}
            onChange={setEveningReviewTime}
          />

          <View className="my-2 h-px bg-border" />

          <TimePicker
            label="Overdue nag time"
            value={overdueNagTime}
            onChange={setOverdueNagTime}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onPress={handleSave} className="mb-8">
        Save Preferences
      </Button>
    </ScrollView>
  );
}
