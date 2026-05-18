import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITY_ID = 'earthquake_structure';
const TEAM_ID = 'demo-team';

const EQUIPMENT = [
  'Cardboard',
  'Paper',
  'Scissors',
  'Sticky tape',
  'Plastic or paper cups',
  'Mobile phone with vibration support',
];

const INSTRUCTIONS = [
  'Build an anti-vibration layer by folding paper or cardboard.',
  'Place a flat cardboard platform on top.',
  'Place the phone in the centre of the structure.',
  'Activate vibration mode in the STEMM App.',
  'Modify the structure to reduce movement, such as adding pillars or folds.',
  'Test and compare three different structure designs.',
];

export default function EarthquakeIntroScreen() {
  const { theme } = useAppTheme();

  async function handleStart() {
    const sessionId = await sessionService.create(TEAM_ID, ACTIVITY_ID);
    router.push({
      pathname: '/activity/earthquake-setup',
      params: { sessionId },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>🏗️</Text>

        <Text variant="headlineMedium" style={styles.title}>
          Earthquake-Resistant Structure
        </Text>

        <Text variant="bodyMedium" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
          Engineering + Earth Science
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>30 mins</Chip>
          <Chip icon="signal" compact>Hard</Chip>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Design and test structures that can withstand vibration by measuring phone movement during a simulated earthquake.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Equipment Needed</Text>

        {EQUIPMENT.map((item, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>What You Will Do</Text>

        {INSTRUCTIONS.map((step, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>
            {index + 1}. {step}
          </Text>
        ))}

        <Text variant="bodyMedium" style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          Tip: A better structure should reduce phone movement during vibration.
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