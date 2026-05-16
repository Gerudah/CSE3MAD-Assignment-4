import { useAppTheme } from '@/constants/ContextTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ParachuteSetupScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { theme } = useAppTheme();
  const [height, setHeight] = useState('');
  const [mass, setMass] = useState('');

  const heightNum = parseFloat(height);
  const massNum = parseFloat(mass);
  const valid = !isNaN(heightNum) && heightNum > 0 && !isNaN(massNum) && massNum > 0;

  function handleContinue() {
    if (!valid) return;
    router.push({
      pathname: '/activity/parachute-design',
      params: { sessionId, proto: '1', height, mass },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Before You Start</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Measure your drop height and weigh your toy so the app can calculate forces automatically.
        </Text>

        <View style={styles.field}>
          <TextInput
            label="Drop height (metres)"
            mode="outlined"
            keyboardType="decimal-pad"
            value={height}
            onChangeText={setHeight}
            placeholder="e.g. 1.2"
            right={<TextInput.Affix text="m" />}
          />
          <HelperText type="info">
            Measure from the toy's release point to the ground. Use the same height for every drop.
          </HelperText>
        </View>

        <View style={styles.field}>
          <TextInput
            label="Toy mass (kilograms)"
            mode="outlined"
            keyboardType="decimal-pad"
            value={mass}
            onChangeText={setMass}
            placeholder="e.g. 0.02"
            right={<TextInput.Affix text="kg" />}
          />
          <HelperText type="info">
            Use a kitchen scale if available. A small army figurine is roughly 0.02 kg.
          </HelperText>
        </View>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }]}
        >
          You will do three drops:{'\n'}
          {'  '}1. Baseline — no parachute (reference){'\n'}
          {'  '}2. Design 1 — your first parachute{'\n'}
          {'  '}3. Design 2 — your improved design
        </Text>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!valid}
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
  field: { marginBottom: 12 },
  note: { padding: 14, marginBottom: 24, lineHeight: 22 },
  button: {},
  buttonContent: { paddingVertical: 8 },
});
