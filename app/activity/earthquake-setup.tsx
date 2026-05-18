import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EarthquakeSetupScreen() {
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
      pathname: '/activity/earthquake-design',
      params: {
        sessionId,
        design: '1',
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
          Prepare your structure testing area before beginning.
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          You will test three designs:{'\n'}
          {'  '}1. First structure design{'\n'}
          {'  '}2. Improved structure design{'\n'}
          {'  '}3. Final structure design{'\n\n'}
          Place the phone in the centre of the platform before each shake test.
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
          Start Structure Designs
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
