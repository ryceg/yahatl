/**
 * Main app navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PlanningScreen from '../screens/PlanningScreen';
import CaptureScreen from '../screens/CaptureScreen';
import NotesScreen from '../screens/NotesScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Planning') {
              iconName = focused ? 'list-circle' : 'list-circle-outline';
            } else if (route.name === 'Capture') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Notes') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else {
              iconName = 'help';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Planning"
          component={PlanningScreen}
          options={{ title: 'Planning' }}
        />
        <Tab.Screen
          name="Capture"
          component={CaptureScreen}
          options={{ title: 'Capture' }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesScreen}
          options={{ title: 'Notes' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
