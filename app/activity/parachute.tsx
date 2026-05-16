import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITY_ID = 'parachute_drop';
const TEAM_ID = 'demo-team'; // TODO: replace with real team from team formation

const EQUIPMENT = [
  'Small toy (e.g. army soldier figurine)',
  'Table or elevated surface (~1 m high)',
  'Paper or plastic bag for canopy',
  'String or thread',
  'Scissors and tape',
];

const INSTRUCTIONS = [
  'Drop the toy WITHOUT a parachute — this is your baseline.',
  'Build a parachute using the provided materials.',
  'Drop the toy from the same height and record the fall.',
  'Review speed and force results in the app.',
  'Redesign and test up to two more prototypes within 20 minutes.',
];

export default function ParachuteIntroScreen() {
  const { theme } = useAppTheme();

  async function handleStart() {
    const sessionId = await sessionService.create(TEAM_ID, ACTIVITY_ID);
    router.push({ pathname: '/activity/parachute-setup', params: { sessionId } });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>🪂</Text>
        <Text variant="headlineMedium" style={styles.title}>Parachute Drop Challenge</Text>
        <Text variant="bodyMedium" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
          Engineering + Physics
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>20 mins</Chip>
          <Chip icon="signal" compact>Medium</Chip>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Design, build, and test a parachute for a small toy to reduce its landing speed and impact
          force. You will complete a baseline drop, then test up to two parachute designs and compare
          the physics results.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Equipment Needed</Text>
        {EQUIPMENT.map((item, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>• {item}</Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>What You Will Do</Text>
        {INSTRUCTIONS.map((step, i) => (
          <Text key={i} variant="bodyMedium" style={styles.listItem}>{i + 1}. {step}</Text>
        ))}

        <Text variant="bodyMedium" style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          Tip: Position your phone on the side so it captures the full fall from release to landing.
          Use slow-motion mode if available for the parachute drops.
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
