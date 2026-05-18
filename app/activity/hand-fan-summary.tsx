import { useAppTheme } from '@/constants/ContextTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HandFanSummaryScreen() {
  const { theme } = useAppTheme();

  const {
    teamName,
    memberName,
    totalTrials,
    reflection,
  } = useLocalSearchParams();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Hand Fan Results
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Team: {teamName || 'Unknown Team'} | Member:{' '}
          {memberName || 'Unknown Member'}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Activity Summary
            </Text>

            <Text>Total Trials Completed: {totalTrials || 0}</Text>

            <Text style={styles.info}>
              Different distances and materials change the amount
              of force applied to the paper or cardboard.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Reflection
            </Text>

            <Text>
              {reflection || 'No reflection entered.'}
            </Text>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          icon="star"
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: '/rating',
              params: { activity: 'Hand Fan Challenge' },
            })
          }
        >
          Rate This Activity
        </Button>

<Button
  mode="contained-tonal"
  icon="format-list-bulleted"
  style={styles.button}
  onPress={() => router.push('/(tabs)/activity')}
>
  Back to Activities
</Button>

<Button
  mode="outlined"
  icon="home"
  onPress={() => router.push('/(tabs)')}
>
  Return Home
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
  info: {
    marginTop: 12,
  },
  button: {
    marginBottom: 10,
  },
});