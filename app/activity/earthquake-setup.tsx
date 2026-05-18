import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EarthquakeSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { theme } = useAppTheme();

  const [teamName, setTeamName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = teamName.trim().length > 0 && memberName.trim().length > 0;

  async function handleContinue() {
    if (!valid) return;

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
      // GPS is helpful but should not block the activity.
    }

    setSaving(false);

    router.push({
      pathname: '/activity/earthquake-design',
      params: {
        sessionId,
        design: '1',
        teamName: teamName.trim(),
        memberName: memberName.trim(),
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
          Enter team details and prepare your structure testing area.
        </Text>

        <TextInput
          label="Team name"
          mode="outlined"
          value={teamName}
          onChangeText={setTeamName}
          placeholder="e.g. Lab Rats"
          style={styles.input}
        />
        <HelperText type="info">
          This identifies the team completing the earthquake challenge.
        </HelperText>

        <TextInput
          label="Team member name"
          mode="outlined"
          value={memberName}
          onChangeText={setMemberName}
          placeholder="e.g. Josh"
          style={styles.input}
        />
        <HelperText type="info">
          Each member can test a structure design and compare results.
        </HelperText>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          You will test three designs:{'\n'}
          {'  '}1. First structure design{'\n'}
          {'  '}2. Improved structure design{'\n'}
          {'  '}3. Final structure design{'\n\n'}
          The phone should be placed in the centre of the platform before each shake test.
        </Text>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!valid || saving}
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
  input: { marginBottom: 4 },
  note: {
    padding: 14,
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
    borderRadius: 8,
  },
  button: {},
  buttonContent: { paddingVertical: 8 },
});