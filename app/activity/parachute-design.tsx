import { useAppTheme } from '@/constants/ContextTheme';
import { prototypeService } from '@/db';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const LABELS: Record<number, { title: string; hint: string; defaultDesc: string }> = {
  1: {
    title: 'Baseline Test — No Parachute',
    hint: 'Drop the bare toy first to get a reference time. No parachute yet.',
    defaultDesc: 'No parachute — bare drop for baseline reference.',
  },
  2: {
    title: 'Design 1 — First Parachute',
    hint: 'Build your first parachute and describe the design below.',
    defaultDesc: '',
  },
  3: {
    title: 'Design 2 — Improved Parachute',
    hint: 'Redesign and improve on your first attempt.',
    defaultDesc: '',
  },
};

export default function ParachuteDesignScreen() {
  const { sessionId, proto, height, mass } = useLocalSearchParams<{
    sessionId: string;
    proto: string;
    height: string;
    mass: string;
  }>();
  const protoNum = parseInt(proto ?? '1', 10);
  const label = LABELS[protoNum] ?? { title: `Prototype ${protoNum}`, hint: '', defaultDesc: '' };
  const { theme } = useAppTheme();

  const [description, setDescription] = useState(label.defaultDesc);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleRecordVideo() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function handlePickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
    });
    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }

  async function handleNext() {
    if (!description.trim() || !videoUri) return;
    setSaving(true);
    try {
      const protoId = await prototypeService.create(sessionId, protoNum, description.trim());
      router.push({
        pathname: '/activity/parachute-analyze',
        params: { sessionId, protoId, proto, videoUri, height, mass },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: label.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>{label.title}</Text>
        <Text
          variant="bodyMedium"
          style={[styles.step, { color: theme.colors.onSurfaceVariant }]}
        >
          Step {protoNum} of 3
        </Text>

        <Text variant="bodyLarge" style={styles.hint}>{label.hint}</Text>

        <TextInput
          label="Design description"
          mode="outlined"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
          placeholder={
            protoNum === 1
              ? 'e.g. No parachute — bare drop'
              : 'e.g. Plastic bag canopy, 30 cm sides, 4 strings tied to figurine'
          }
          style={styles.input}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>Drop Video</Text>
        <Text variant="bodyMedium" style={[styles.videoHint, { color: theme.colors.onSurfaceVariant }]}>
          Film from the side so the full fall is visible.
          {protoNum > 1 ? ' Slow-motion mode is recommended for accurate contact time.' : ''}
        </Text>

        <View style={styles.videoButtons}>
          <Button mode="outlined" icon="camera" onPress={handleRecordVideo} style={styles.videoBtn}>
            Record
          </Button>
          <Button mode="outlined" icon="folder-video" onPress={handlePickVideo} style={styles.videoBtn}>
            Pick File
          </Button>
        </View>

        {videoUri ? (
          <Chip icon="check-circle" style={styles.chip}>Video ready</Chip>
        ) : (
          <Chip icon="video-off-outline" style={styles.chip}>No video selected</Chip>
        )}

        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!description.trim() || !videoUri || saving}
          loading={saving}
          style={styles.nextBtn}
          contentStyle={styles.nextBtnContent}
          icon="arrow-right"
        >
          Analyze Video
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 4 },
  step: { textAlign: 'center', marginBottom: 16 },
  hint: { marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 24 },
  sectionTitle: { marginBottom: 6 },
  videoHint: { marginBottom: 12 },
  videoButtons: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  videoBtn: { flex: 1 },
  chip: { alignSelf: 'flex-start', marginBottom: 32 },
  nextBtn: {},
  nextBtnContent: { paddingVertical: 8 },
});
