import { useAppTheme } from '@/constants/ContextTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BreathingPaceSummaryScreen() {
  const { theme } = useAppTheme();

  const {
    teamName,
    memberName,
    restingRate,
    joggingRate,
    starJumpRate,
    reflection,
  } = useLocalSearchParams();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Breathing Pace Results
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown Team'} | Member: {memberName || 'Unknown Member'}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Breathing Results</Text>
            <Text>Resting BPM: {restingRate || 'No data'}</Text>
            <Text>After 1 minute jog: {joggingRate || 'No data'} BPM</Text>
            <Text>After 100 star jumps: {starJumpRate || 'No data'} BPM</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Comparison</Text>
            <Text>
              Jogging change: {restingRate && joggingRate
                ? `${Number(joggingRate) - Number(restingRate)} BPM`
                : 'No data'}
            </Text>
            <Text>
              Star jumps change: {restingRate && starJumpRate
                ? `${Number(starJumpRate) - Number(restingRate)} BPM`
                : 'No data'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Reflection</Text>
            <Text>{reflection || 'No reflection entered.'}</Text>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Text variant="bodyMedium" style={styles.explanation}>
          Breathing rate usually increases after exercise because the body needs more oxygen during physical activity.
        </Text>

        <Button
          mode="contained"
          icon="star"
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: '/rating',
              params: { activity: 'Breathing Pace Trainer' },
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
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8 },
  divider: { marginVertical: 16 },
  explanation: { textAlign: 'center', marginBottom: 20 },
  button: { marginBottom: 10 },
});