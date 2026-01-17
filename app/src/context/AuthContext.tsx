/**
 * Authentication context for managing HA connection
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import YahtlApiClient from '../api/client';
import type { AppConfig } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  config: AppConfig | null;
  client: YahtlApiClient | null;
  login: (haUrl: string, haToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateConfig: (config: Partial<AppConfig>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_POMODORO_CONFIG = {
  work_duration: 25,
  short_break: 5,
  long_break: 15,
  sessions_before_long_break: 4,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [client, setClient] = useState<YahtlApiClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const haUrl = await SecureStore.getItemAsync('ha_url');
      const haToken = await SecureStore.getItemAsync('ha_token');
      const configJson = await AsyncStorage.getItem('app_config');

      if (haUrl && haToken) {
        const savedConfig = configJson ? JSON.parse(configJson) : {};
        const fullConfig: AppConfig = {
          ha_url: haUrl,
          ha_token: haToken,
          pomodoro: savedConfig.pomodoro || DEFAULT_POMODORO_CONFIG,
          default_list_id: savedConfig.default_list_id,
        };

        const apiClient = new YahtlApiClient(haUrl, haToken);

        // Test connection
        const connected = await apiClient.testConnection();
        if (connected) {
          setConfig(fullConfig);
          setClient(apiClient);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (haUrl: string, haToken: string): Promise<boolean> => {
    try {
      const apiClient = new YahtlApiClient(haUrl, haToken);

      // Test connection
      const connected = await apiClient.testConnection();
      if (!connected) {
        return false;
      }

      // Save credentials
      await SecureStore.setItemAsync('ha_url', haUrl);
      await SecureStore.setItemAsync('ha_token', haToken);

      const newConfig: AppConfig = {
        ha_url: haUrl,
        ha_token: haToken,
        pomodoro: DEFAULT_POMODORO_CONFIG,
      };

      await AsyncStorage.setItem('app_config', JSON.stringify({
        pomodoro: newConfig.pomodoro,
        default_list_id: newConfig.default_list_id,
      }));

      setConfig(newConfig);
      setClient(apiClient);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('ha_url');
      await SecureStore.deleteItemAsync('ha_token');
      await AsyncStorage.removeItem('app_config');

      setConfig(null);
      setClient(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    if (!config) return;

    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    // Save non-sensitive config
    await AsyncStorage.setItem('app_config', JSON.stringify({
      pomodoro: newConfig.pomodoro,
      default_list_id: newConfig.default_list_id,
    }));

    // Update credentials if changed
    if (updates.ha_url) {
      await SecureStore.setItemAsync('ha_url', updates.ha_url);
    }
    if (updates.ha_token) {
      await SecureStore.setItemAsync('ha_token', updates.ha_token);
    }

    // Recreate client if credentials changed
    if (updates.ha_url || updates.ha_token) {
      const newClient = new YahtlApiClient(newConfig.ha_url, newConfig.ha_token);
      setClient(newClient);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        config,
        client,
        login,
        logout,
        updateConfig,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
