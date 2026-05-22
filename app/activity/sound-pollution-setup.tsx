import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SoundPollutionSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { theme } = useAppTheme();
  const { teamName, memberName } = useAuth();
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        await sessionService.updateLocation(sessionId, loc.coords.latitude, loc.coords.longitude);
      }
    } catch {
      // GPS is helpful but not required
    }
    setSaving(false);

    router.push({
      pathname: '/activity/sound-pollution-test',
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
        <Text variant="headlineSmall" style={styles.title}>Before You Start</Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          You will measure noise levels at multiple locations and compare them.
        </Text>

        <Text variant="bodyMedium" style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}>
          How to get accurate readings:{'\n\n'}
          {'  '}• Hold the phone at arm's length, mic facing the noise source.{'\n'}
          {'  '}• Stand still for the full 5-second measurement.{'\n'}
          {'  '}• Measure at least 3 different locations.{'\n'}
          {'  '}• Try to include one quiet and one loud location.{'\n\n'}
          The app will request microphone permission when you start measuring.
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
          Start Measuring
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
  note: { padding: 14, marginBottom: 24, lineHeight: 22, borderRadius: 8 },
  button: {},
  buttonContent: { paddingVertical: 8 },
});
