import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITY_ID = 'stretch_speed_gracefulness';

const EQUIPMENT = [
  'Mobile phone (gyroscope required)',
  'Open space to move arms freely',
  'Optional: pen and paper for notes',
];

const MOVEMENTS = [
  'Movement 1 — Arm Circle: Hold the phone and rotate your entire arm in a large circle.',
  'Movement 2 — Vertical Sweep: Raise your arm fully above your head then lower it down.',
  'Movement 3 — Horizontal Extension: Extend your arm out to the side then bring it back.',
  'Movement 4 — Figure-8: Trace a large figure-8 shape in front of you with your whole arm.',
];

const INSTRUCTIONS = [
  'You will perform 4 movements in a round-robin format.',
  'Each set, perform Movement 1, then 2, then 3, then 4.',
  'Repeat for 3 sets total — 12 attempts in total.',
  'Hold the phone firmly throughout each movement.',
  'The app measures speed (how fast you move) and grace (how smooth).',
];

export default function StretchSpeedIntroScreen() {
  const { theme } = useAppTheme();
  const { teamId } = useAuth();

  async function handleStart() {
    const sessionId = await sessionService.create(teamId ?? 'unknown', ACTIVITY_ID);
    router.push({
      pathname: '/activity/stretch-speed-setup',
      params: { sessionId },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>🤸</Text>

        <Text variant="headlineMedium" style={styles.title}>
          Human Performance Lab
        </Text>

        <Text variant="titleMedium" style={[styles.subtitle, { color: theme.colors.primary }]}>
          Stretch, Speed &amp; Gracefulness
        </Text>

        <Text variant="bodyMedium" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
          Health and Medical Sciences
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>25 mins</Chip>
          <Chip icon="signal" compact>Medium</Chip>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Explore how your body moves — measuring arm movement speed and smoothness
          across four different arm exercises.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Equipment Needed</Text>

        {EQUIPMENT.map((item, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>• {item}</Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>The Four Movements</Text>

        {MOVEMENTS.map((m, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>{m}</Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>How It Works</Text>

        {INSTRUCTIONS.map((step, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>
            {i + 1}. {step}
          </Text>
        ))}

        <Text
          variant="bodyMedium"
          style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          Tip: Slow, steady movements produce a higher grace score. Fast movements
          produce a higher speed score. The figure-8 tests both at once!
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
  title: { marginBottom: 2, textAlign: 'center' },
  subtitle: { marginBottom: 4, textAlign: 'center', fontWeight: '600' },
  category: { marginBottom: 12, textAlign: 'center' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  description: { textAlign: 'center', marginBottom: 4 },
  divider: { width: '100%', marginVertical: 16 },
  sectionTitle: { alignSelf: 'flex-start', marginBottom: 8 },
  listItem: { alignSelf: 'flex-start', marginBottom: 6, paddingLeft: 4, lineHeight: 20 },
  tip: { padding: 12, borderRadius: 8, marginTop: 8, width: '100%' },
  button: { marginTop: 24, width: '100%' },
  buttonContent: { paddingVertical: 8 },
});
