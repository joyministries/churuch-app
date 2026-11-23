import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './store/theme';
import { useAuthStore } from './store';
import { setToken } from './services/api';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  // The API client needs the persisted token; without this every request is unauthenticated.
  const token = useAuthStore((s) => s.token);
  useEffect(() => { setToken(token ?? null); }, [token]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}