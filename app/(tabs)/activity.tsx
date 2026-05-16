import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const activities = [
  {
    id: 1,
    category: 'Engineering Challenges',
    name: 'Parachute Drop Challenge',
    description: 'Design and test a parachute to slow the fall of an object.',
    difficulty: 'Medium',
    duration: '20 mins',
  },
  {
    id: 2,
    category: 'Engineering Challenges',
    name: 'Sound Pollution Hunter',
    description: 'Investigate noise levels in different environments and record findings.',
    difficulty: 'Easy',
    duration: '15 mins',
  },
  {
    id: 3,
    category: 'Engineering Challenges',
    name: 'Hand Fan Challenge',
    description: 'Create a hand fan design that produces the strongest airflow.',
    difficulty: 'Easy',
    duration: '15 mins',
  },
  {
    id: 4,
    category: 'Engineering Challenges',
    name: 'Earthquake-Resistance Structure',
    description: 'Build a structure that can better withstand shaking and movement.',
    difficulty: 'Hard',
    duration: '30 mins',
  },
  {
    id: 5,
    category: 'Health and Medical Sciences',
    name: 'Human Performance Lab - Stretch, Speed and Gracefulness',
    description: 'Explore flexibility, movement speed and coordination through physical testing.',
    difficulty: 'Medium',
    duration: '25 mins',
  },
  {
    id: 6,
    category: 'Health and Medical Sciences',
    name: 'Reaction Board Challenge',
    description: 'Measure reaction speed using a response board or quick movement task.',
    difficulty: 'Medium',
    duration: '15 mins',
  },
  {
    id: 7,
    category: 'Health and Medical Sciences',
    name: 'Breathing Pace Trainer',
    description: 'Practice controlled breathing and monitor pace during activity or rest.',
    difficulty: 'Easy',
    duration: '10 mins',
  },
];

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Activity Page</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Choose a STEMM activity below.</Text>

        {activities.map((activity) => (
          <Card key={activity.id} style={styles.card}>
            <Card.Content>
              <Text variant="labelLarge" style={styles.category}>{activity.category}</Text>
              <Text variant="titleLarge" style={styles.activityName}>{activity.name}</Text>
              <Text variant="bodyMedium">{activity.description}</Text>
              <Text variant="bodyMedium">Difficulty: {activity.difficulty}</Text>
              <Text variant="bodyMedium">Duration: {activity.duration}</Text>
            </Card.Content>
            <Card.Actions>
              {activity.id === 1 ? (
                <Button
                  mode="contained"
                  onPress={() => router.push('/activity/parachute')}
                >
                  Start Activity
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={() =>
                    router.push({
                      pathname: '/rating',
                      params: { activity: activity.name },
                    })
                  }
                >
                  Rate This Activity
                </Button>
              )}
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
  },
  category: {
    marginBottom: 6,
  },
  activityName: {
    marginBottom: 8,
  },
});
