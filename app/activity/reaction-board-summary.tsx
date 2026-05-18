import { useAppTheme } from '@/constants/ContextTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReactionBoardSummaryScreen() {
  const { theme } = useAppTheme();

  const {
    teamName,
    memberName,
    dominantAverage,
    dominantBest,
    dominantWorst,
    nonDominantAverage,
    nonDominantBest,
    nonDominantWorst,
    difference,
    tracingAccuracy,
    tracingAverageDelay,
  } = useLocalSearchParams();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Reaction Board Results
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown Team'} | Member: {memberName || 'Unknown Member'}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Dominant Hand</Text>
            <Text>Average: {dominantAverage || 'No data'} ms</Text>
            <Text>Best: {dominantBest || 'No data'} ms</Text>
            <Text>Worst: {dominantWorst || 'No data'} ms</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Non-Dominant Hand</Text>
            <Text>Average: {nonDominantAverage || 'No data'} ms</Text>
            <Text>Best: {nonDominantBest || 'No data'} ms</Text>
            <Text>Worst: {nonDominantWorst || 'No data'} ms</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Comparison</Text>
            <Text>Difference between hands: {difference || 'No data'} ms</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Tracing Challenge</Text>
            <Text>Accuracy: {tracingAccuracy || 'No data'}%</Text>
            <Text>Average delay: {tracingAverageDelay || 'No data'} ms</Text>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Text variant="bodyMedium" style={styles.reflection}>
          These results help students compare reaction speed, hand dominance, coordination, and tracing accuracy.
        </Text>

        <Button
          mode="contained"
          icon="star"
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: '/rating',
              params: { activity: 'Reaction Board Challenge' },
            })
          }
        >
          Rate This Activity
        </Button>

        <Button mode="text" onPress={() => router.push('/(tabs)/activity')}>
          Back to Activities
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
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  reflection: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
});