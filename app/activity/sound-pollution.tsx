import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITY_ID = 'sound_pollution';

const EQUIPMENT = [
  'Mobile phone (microphone required)',
  'Permission to move between school locations',
];

const LOCATIONS_EXAMPLE = [
  'Classroom (quiet)',
  'School hallway (between classes)',
  'Library',
  'Cafeteria / canteen',
  'Outside near traffic',
  'Outside in a quiet area',
  'Sports hall or gym',
];

const INSTRUCTIONS = [
  'Choose a location and predict its noise level (dB).',
  'Hold the phone still and measure for 5 seconds.',
  'Record at least 3 different locations.',
  'Compare your predictions to the actual readings.',
  'Discuss which environments are noise pollution concerns.',
];

export default function SoundPollutionIntroScreen() {
  const { theme } = useAppTheme();
  const { teamId } = useAuth();

  async function handleStart() {
    const sessionId = await sessionService.create(teamId ?? 'unknown', ACTIVITY_ID);
    router.push({
      pathname: '/activity/sound-pollution-setup',
      params: { sessionId },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>🔊</Text>

        <Text variant="headlineMedium" style={styles.title}>
          Sound Pollution Hunter
        </Text>

        <Text variant="bodyMedium" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
          Engineering Challenges
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>15 mins</Chip>
          <Chip icon="signal" compact>Easy</Chip>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Use the phone microphone to measure and compare noise levels across
          different school environments. Identify sources of sound pollution.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Equipment Needed</Text>
        {EQUIPMENT.map((item, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>• {item}</Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Example Locations</Text>
        {LOCATIONS_EXAMPLE.map((loc, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>• {loc}</Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>What You Will Do</Text>
        {INSTRUCTIONS.map((step, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>{i + 1}. {step}</Text>
        ))}

        <Text variant="bodyMedium" style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          Tip: Hold the phone at the same height and distance from noise sources
          across all measurements for fair comparisons.
        </Text>

        <Button
          mode="contained"
          onPress={handleStart}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="play-circle"
        >
          Begin Activity
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24, alignItems: 'center' },
  emoji: { marginBottom: 4, textAlign: 'center' },
  title: { marginBottom: 4, textAlign: 'center' },
  category: { marginBottom: 12, textAlign: 'center' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  description: { textAlign: 'center', marginBottom: 4 },
  divider: { width: '100%', marginVertical: 16 },
  sectionTitle: { alignSelf: 'flex-start', marginBottom: 8 },
  listItem: { alignSelf: 'flex-start', marginBottom: 6, paddingLeft: 4 },
  tip: { padding: 12, borderRadius: 8, marginTop: 8, width: '100%' },
  button: { marginTop: 24, width: '100%' },
  buttonContent: { paddingVertical: 8 },
});
