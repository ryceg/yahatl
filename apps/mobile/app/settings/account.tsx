import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { User, LogOut } from "lucide-react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Button,
} from "@/components/ui";
import { useAuthStore } from "@/lib/stores/authStore";

export default function AccountSettingsScreen() {
  const { user, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Implement profile update API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Profile updated successfully");
    }, 500);
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    // TODO: Implement password update API call
    Alert.alert("Success", "Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion API call
            console.log("Delete account");
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* User Info Header */}
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
              <User size={32} color="#fafafa" />
            </View>
            <View className="flex-1">
              <CardTitle>{user?.name ?? "User"}</CardTitle>
              <CardDescription>{user?.email ?? "No email"}</CardDescription>
            </View>
          </View>
        </CardHeader>
      </Card>

      {/* Profile Edit */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="email@example.com"
          />
          <Button onPress={handleSaveProfile} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            label="Current Password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
          />
          <Input
            label="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
          />
          <Button variant="outline" onPress={handleUpdatePassword}>
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onPress={handleLogout}
            className="flex-row items-center justify-center gap-2"
          >
            <LogOut size={18} color="#fafafa" />
            Log Out
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onPress={handleDeleteAccount}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </ScrollView>
  );
}
