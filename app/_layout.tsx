import { AuthProvider, useAuth } from '@/constants/AuthContext';
import { ThemeProvider, useAppTheme } from '@/constants/ContextTheme';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

function AuthLoadingOverlay() {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
      <Animated.Text
        style={[styles.appName, { opacity: pulse, color: theme.colors.primary }]}
      >
        LabRats
      </Animated.Text>
      <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
        STEMM Activity Explorer
      </Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
}

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
  const { loading } = useAuth();

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
      {loading && <AuthLoadingOverlay />}
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    marginBottom: 48,
  },
  spinner: {},
});
