import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StretchSpeedSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { theme } = useAppTheme();
  const { teamName, memberName } = useAuth();
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        await sessionService.updateLocation(
          sessionId,
          location.coords.latitude,
          location.coords.longitude
        );
      }
    } catch {
      // GPS is helpful but should not block the activity
    }
    setSaving(false);

    router.push({
      pathname: '/activity/stretch-speed-test',
      params: {
        sessionId,
        teamName: teamName ?? '',
        memberName: memberName ?? '',
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Before You Start
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Find a clear space where you can swing your arms freely in all directions.
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          You will complete 3 sets of 4 movements:{'\n\n'}
          {'  '}Set 1: Circle → Sweep → Extension → Figure-8{'\n'}
          {'  '}Set 2: Circle → Sweep → Extension → Figure-8{'\n'}
          {'  '}Set 3: Circle → Sweep → Extension → Figure-8{'\n\n'}
          Hold the phone in one hand and keep a firm grip throughout.
          The gyroscope measures rotation speed and smoothness.
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          Safety reminder: Check that there are no people or objects nearby before
          swinging your arm. Stand in an open space.
        </Text>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={saving}
          loading={saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Start Tests
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 24, textAlign: 'center' },
  note: { padding: 14, marginBottom: 16, lineHeight: 22, borderRadius: 8 },
  button: { marginTop: 8 },
  buttonContent: { paddingVertical: 8 },
});
