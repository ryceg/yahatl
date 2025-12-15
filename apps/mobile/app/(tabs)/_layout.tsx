import "../../global.css";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import {
  CalendarCheck,
  Inbox,
  LayoutDashboard,
  Settings,
} from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const inactiveColor = isDark ? "#71717a" : "#a1a1aa";
  const activeColor = isDark ? "#a78bfa" : "#7c3aed";
  const backgroundColor = isDark ? "hsl(240, 10%, 3.9%)" : "hsl(0, 0%, 100%)";
  const borderColor = isDark ? "hsl(240, 3.7%, 15.9%)" : "hsl(240, 5.9%, 90%)";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
        },
        headerTintColor: isDark ? "#fafafa" : "#0a0a0a",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="planner"
        options={{
          title: "Planner",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: "Capture",
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
