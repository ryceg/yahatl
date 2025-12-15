import { View, Text, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { Calendar, Users, Link2, Check, X } from "lucide-react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/ui";

type IntegrationStatus = "connected" | "disconnected" | "connecting";

type IntegrationCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: IntegrationStatus;
  statusText?: string;
  infoText: string;
  onConnect: () => void;
  onDisconnect?: () => void;
  actionLabel?: string;
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
};

function IntegrationCard({
  icon,
  title,
  description,
  status,
  statusText,
  infoText,
  onConnect,
  onDisconnect,
  actionLabel = "Connect",
  secondaryAction,
}: IntegrationCardProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <Card className="mb-4">
      <CardHeader>
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            {icon}
          </View>
          <View className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </View>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected && <Check size={12} className="mr-1" />}
            {statusText ?? (isConnected ? "Connected" : "Not connected")}
          </Badge>
        </View>
      </CardHeader>
      <CardContent>
        <Text className="mb-4 text-sm text-muted-foreground">{infoText}</Text>

        <View className="flex-row gap-2">
          {isConnected ? (
            <>
              {secondaryAction && (
                <Button
                  variant="outline"
                  onPress={secondaryAction.onPress}
                  className="flex-1"
                >
                  {secondaryAction.label}
                </Button>
              )}
              {onDisconnect && (
                <Button
                  variant="destructive"
                  onPress={onDisconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              )}
            </>
          ) : (
            <Button
              onPress={onConnect}
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? "Connecting..." : actionLabel}
            </Button>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsSettingsScreen() {
  // TODO: Get actual integration status from API
  const [calendarStatus, setCalendarStatus] =
    useState<IntegrationStatus>("disconnected");
  const [contactsStatus, setContactsStatus] =
    useState<IntegrationStatus>("disconnected");

  const handleConnectCalendar = () => {
    setCalendarStatus("connecting");
    // TODO: Implement Google OAuth flow
    setTimeout(() => {
      setCalendarStatus("connected");
      Alert.alert("Success", "Google Calendar connected successfully");
    }, 1500);
  };

  const handleDisconnectCalendar = () => {
    Alert.alert(
      "Disconnect Calendar",
      "Are you sure you want to disconnect Google Calendar?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            setCalendarStatus("disconnected");
          },
        },
      ]
    );
  };

  const handleConnectContacts = () => {
    setContactsStatus("connecting");
    // TODO: Implement Google OAuth flow
    setTimeout(() => {
      setContactsStatus("connected");
      Alert.alert("Success", "Google Contacts connected successfully");
    }, 1500);
  };

  const handleDisconnectContacts = () => {
    Alert.alert(
      "Disconnect Contacts",
      "Are you sure you want to disconnect Google Contacts?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            setContactsStatus("disconnected");
          },
        },
      ]
    );
  };

  const handleImportContacts = () => {
    Alert.alert(
      "Import Contacts",
      "This will import your Google Contacts as Person notes. Existing entries will be updated.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: () => {
            // TODO: Implement contact import
            Alert.alert("Success", "Contacts imported successfully");
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Google Calendar */}
      <IntegrationCard
        icon={<Calendar size={20} className="text-foreground" />}
        title="Google Calendar"
        description="Read-only calendar overlay"
        status={calendarStatus}
        infoText="Connect your Google Calendar to see events alongside your tasks and reminders. Events are displayed read-only and cannot be modified from YAHATL."
        onConnect={handleConnectCalendar}
        onDisconnect={handleDisconnectCalendar}
        actionLabel="Connect Calendar"
      />

      {/* Google Contacts */}
      <IntegrationCard
        icon={<Users size={20} className="text-foreground" />}
        title="Google Contacts"
        description="Import contacts as People notes"
        status={contactsStatus}
        infoText="Import contacts to create Person notes with birthdays. Data syncs one-way from Google to YAHATL."
        onConnect={handleConnectContacts}
        onDisconnect={handleDisconnectContacts}
        actionLabel="Connect Contacts"
        secondaryAction={
          contactsStatus === "connected"
            ? {
                label: "Import Now",
                onPress: handleImportContacts,
              }
            : undefined
        }
      />

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
            <Badge variant="default">
              <Check size={12} className="mr-1" />
              Connected
            </Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text className="text-sm text-muted-foreground">
            YAHATL entities are automatically published to Home Assistant via
            MQTT. Configure automations in Home Assistant to respond to task
            events, reminders, and blockers.
          </Text>
          <View className="mt-4 rounded-lg bg-secondary p-3">
            <Text className="text-xs font-medium uppercase text-muted-foreground">
              MQTT Status
            </Text>
            <View className="mt-2 flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-green-500" />
              <Text className="text-sm text-foreground">
                Broker connected • Last sync: just now
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
