import { useAppTheme } from '@/constants/ContextTheme';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const EQUIPMENT = [
  'Mobile phone with STEMM Lab app',
  'Flat surface or mat',
];

const INSTRUCTIONS = [
  'Place the phone gently on the chest.',
  'Record breathing at rest.',
  'Perform light exercise: jog one minute on the spot.',
  'Record breathing after jogging.',
  'Perform 100 star jumps.',
  'Record breathing again and compare results.',
  'Rotate for each team member.',
];

export default function BreathingPaceIntroScreen() {
  const { theme } = useAppTheme();

function handleStart() {
  router.push('/activity/breathing-pace-setup');
}
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>🫁</Text>

        <Text variant="headlineMedium" style={styles.title}>
          Breathing Pace Trainer
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.category, { color: theme.colors.onSurfaceVariant }]}
        >
          Medical Science
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>10 mins</Chip>
          <Chip icon="signal" compact>Easy</Chip>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Analyse breathing patterns at rest and after exercise using phone movement data.
        </Text>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Equipment Needed
        </Text>

        {EQUIPMENT.map((item, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          What You Will Do
        </Text>

        {INSTRUCTIONS.map((step, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>
            {index + 1}. {step}
          </Text>
        ))}

        <Text
          variant="bodyMedium"
          style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          Tip: Keep the phone steady on the chest and breathe normally during each recording.
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
  safe: {
    flex: 1,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  category: {
    marginBottom: 12,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    marginVertical: 16,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  listItem: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  tip: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
  },
  button: {
    marginTop: 24,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});