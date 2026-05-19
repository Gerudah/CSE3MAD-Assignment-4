import { useAppTheme } from '@/constants/ContextTheme';
import { prototypeService } from '@/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EarthquakeDesignScreen() {
  const { sessionId, design, teamName, memberName } = useLocalSearchParams<{
    sessionId: string;
    design: string;
    teamName: string;
    memberName: string;
  }>();

  const { theme } = useAppTheme();
  const designNum = parseInt(design ?? '1', 10);

  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const title =
    designNum === 1
      ? 'Design 1 — First Structure'
      : designNum === 2
        ? 'Design 2 — Improved Structure'
        : 'Design 3 — Final Structure';

  async function handleContinue() {
    if (!description.trim()) return;

    setSaving(true);

    const protoId = await prototypeService.create(
      sessionId,
      designNum,
      description.trim()
    );

    setSaving(false);

    router.push({
      pathname: '/activity/earthquake-test',
      params: {
        sessionId,
        protoId,
        design: String(designNum),
        teamName,
        memberName,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Describe your structure before testing it.
        </Text>

        <TextInput
          label="Structure design description"
          mode="outlined"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Folded cardboard base with four paper pillars"
          style={styles.input}
        />

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          Include details such as folds, pillars, materials, platform shape, and changes from the previous design.
        </Text>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!description.trim() || saving}
          loading={saving}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Start Shake Test
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  input: { marginBottom: 20 },
  note: {
    padding: 14,
    marginBottom: 24,
    lineHeight: 22,
    borderRadius: 8,
  },
  button: {},
  buttonContent: { paddingVertical: 8 },
});