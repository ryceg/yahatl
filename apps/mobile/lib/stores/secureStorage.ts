import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

/**
 * Custom Zustand StateStorage adapter using expo-secure-store.
 * Used for persisting sensitive data like auth tokens securely.
 */
export const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};
