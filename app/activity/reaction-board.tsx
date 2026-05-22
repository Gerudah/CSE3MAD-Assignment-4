import { useAppTheme } from '@/constants/ContextTheme';
import { scheduleChallengeReminder } from '@/services/notifications';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const EQUIPMENT = [
  'Phone or tablet',
  'Open space',
  'One teammate',
];

const INSTRUCTIONS = [
  'Complete the dominant hand reaction test.',
  'Repeat the test using your non-dominant hand.',
  'Complete the tracing accuracy challenge.',
  'Compare reaction speed and accuracy results.',
  'Save results to Firestore and SQLite.',
];

export default function ReactionBoardIntroScreen() {
  const { theme } = useAppTheme();

  async function handleStart() {
    await scheduleChallengeReminder(90);

    router.push('/activity/reaction-board-setup');
  }

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="displaySmall" style={styles.emoji}>
          ⚡
        </Text>

        <Text variant="headlineMedium" style={styles.title}>
          Reaction Board Challenge
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.category,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Health & Medical Sciences
        </Text>

        <View style={styles.chips}>
          <Chip icon="clock-outline" compact>
            15 mins
          </Chip>

          <Chip icon="signal" compact>
            Medium
          </Chip>
        </View>

        <Text
          variant="bodyLarge"
          style={styles.description}
        >
          Measure reaction speed, coordination, and tracing accuracy through a
          series of fast-paced physical interaction tests.
        </Text>

        <Divider style={styles.divider} />

        <Text
          variant="titleMedium"
          style={styles.sectionTitle}
        >
          Equipment Needed
        </Text>

        {EQUIPMENT.map((item, i) => (
          <Text
            key={i}
            variant="bodyMedium"
            style={styles.listItem}
          >
            • {item}
          </Text>
        ))}

        <Divider style={styles.divider} />

        <Text
          variant="titleMedium"
          style={styles.sectionTitle}
        >
          What You Will Do
        </Text>

        {INSTRUCTIONS.map((step, i) => (
          <Text
            key={i}
            variant="bodyMedium"
            style={styles.listItem}
          >
            {i + 1}. {step}
          </Text>
        ))}

        <Text
          variant="bodyMedium"
          style={[
            styles.tip,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          Tip: Stay relaxed and focus on the screen for the fastest reaction times.
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