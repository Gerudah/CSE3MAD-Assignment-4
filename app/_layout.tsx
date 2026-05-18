import { AuthProvider, useAuth } from '@/constants/AuthContext';
import { ThemeProvider, useAppTheme } from '@/constants/ContextTheme';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

function AuthGuard() {
  const { user, teamId, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const onLogin = segments[0] === 'login';
    const onTeamFormation = segments[0] === 'team-formation';

    if (!user && !onLogin) {
      router.replace('/login');
    } else if (user && onLogin) {
      router.replace(teamId ? '/(tabs)' : '/team-formation');
    } else if (user && !teamId && !onTeamFormation) {
      router.replace('/team-formation');
    }
  }, [user, teamId, loading, segments]);

  return null;
}

function RootStack() {
  const { theme, isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { color: theme.colors.onSurface },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="team-formation" options={{ title: 'Team Formation' }} />
        <Stack.Screen name="rating" options={{ title: 'Rate Activity' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="activity" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
