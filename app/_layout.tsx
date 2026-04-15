import { ThemeProvider, useAppTheme } from '@/constants/ContextTheme';
import { Stack } from 'expo-router';

function RootStack() {
  const { theme } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { color: theme.colors.onSurface },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="team-formation" options={{ title: 'Team Formation' }} />
      <Stack.Screen name="rating" options={{ title: 'Rating' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
