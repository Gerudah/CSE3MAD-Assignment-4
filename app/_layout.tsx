import { ThemeProvider, useAppTheme } from '@/constants/ContextTheme';
import { registerBackgroundSyncTask } from '@/services/backgroundSync';
import { requestNotificationPermission } from '@/services/notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

function RootStack() {
  const { theme, isDark } = useAppTheme();

  useEffect(() => {
    requestNotificationPermission();
    registerBackgroundSyncTask();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: {
            color: theme.colors.onSurface,
          },
        }}
      >
        <Stack.Screen
          name="login"
          options={{ title: 'Login' }}
        />

        <Stack.Screen
          name="team-formation"
          options={{ title: 'Team Formation' }}
        />

        <Stack.Screen
          name="rating"
          options={{ title: 'Rate Activity' }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="activity"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}