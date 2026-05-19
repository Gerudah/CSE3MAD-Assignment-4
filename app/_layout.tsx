import { AuthProvider, useAuth } from '@/constants/AuthContext';
import { ThemeProvider, useAppTheme } from '@/constants/ContextTheme';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text as RNText, View } from 'react-native';
import { Text } from 'react-native-paper';

function AuthLoadingOverlay() {
  const { theme } = useAppTheme();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
      <RNText style={[styles.appName, { color: theme.colors.primary }]}>
        LabRats
      </RNText>
      <Text variant="bodyMedium" style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>
        STEMM Activity Explorer
      </Text>
      <BlinkingEye />
      <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
        {'Loading' + '.'.repeat(dots)}
      </Text>
    </View>
  );
}

function BlinkingEye() {
  const { theme, isDark } = useAppTheme();
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pupilAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth left → center → right → center loop
    const look = Animated.loop(
      Animated.sequence([
        Animated.timing(pupilAnim, { toValue: -16, duration: 900, useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(pupilAnim, { toValue: 0,   duration: 600, useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(pupilAnim, { toValue: 16,  duration: 900, useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(pupilAnim, { toValue: 0,   duration: 600, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    look.start();

    // Random blink every ~2-3 s
    let blinkTimer: ReturnType<typeof setTimeout>;
    function schedBlink() {
      blinkTimer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.06, duration: 65,  useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
        ]).start(schedBlink);
      }, 1800 + Math.random() * 1200);
    }
    schedBlink();

    return () => {
      look.stop();
      clearTimeout(blinkTimer);
    };
  }, [blinkAnim, pupilAnim]);

  const borderColor = isDark ? '#999' : '#222';

  return (
    // scaleY collapses the whole eye for the blink; origin is at vertical midpoint
    <Animated.View style={[eyeStyles.eyeOval, { borderColor, transform: [{ scaleY: blinkAnim }] }]}>
      {/* Iris */}
      <Animated.View style={[eyeStyles.iris, {
        backgroundColor: theme.colors.primary,
        transform: [{ translateX: pupilAnim }],
      }]}>
        {/* Pupil */}
        <View style={eyeStyles.pupil} />
        {/* Specular highlight */}
        <View style={eyeStyles.highlight} />
      </Animated.View>
    </Animated.View>
  );
}

function FindingTeamOverlay() {
  const { theme } = useAppTheme();
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
      <BlinkingEye />
      <Text variant="titleMedium" style={[styles.findingText, { color: theme.colors.onBackground }]}>
        {'Finding your team' + '.'.repeat(dots)}
      </Text>
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
  const { loading, findingTeam } = useAuth();

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
      {!loading && findingTeam && <FindingTeamOverlay />}
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
  findingText: {
    marginTop: 24,
    marginBottom: 4,
  },
  loadingText: {
    marginTop: 16,
  },
});

const eyeStyles = StyleSheet.create({
  eyeOval: {
    width: 110,
    height: 56,
    borderRadius: 55,
    backgroundColor: '#F8F8F8',
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iris: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupil: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#0f0f0f',
  },
  highlight: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
