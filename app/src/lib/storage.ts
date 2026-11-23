import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store has no web implementation — calling it in a browser throws
 * and takes zustand's rehydration down with it. Web falls back to localStorage
 * (same shape, async), native keeps the encrypted keychain.
 */
const memory: Record<string, string> = {};

function webStore() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(key);
    const s = webStore();
    if (!s) return memory[key] ?? null;
    try {
      return s.getItem(key);
    } catch {
      return memory[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const s = webStore();
    if (!s) {
      memory[key] = value;
      return;
    }
    try {
      s.setItem(key, value);
    } catch {
      memory[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    const s = webStore();
    delete memory[key];
    try {
      s?.removeItem(key);
    } catch {}
  },
};
