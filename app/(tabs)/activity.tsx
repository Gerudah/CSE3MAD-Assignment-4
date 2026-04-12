import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Activity Page</Text>
      <Text style={styles.subtitle}>Choose a STEMM activity below.</Text>

      {activities.map((activity) => (
        <View key={activity.id} style={styles.card}>
          <Text style={styles.category}>{activity.category}</Text>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.detail}>{activity.description}</Text>
          <Text style={styles.detail}>Difficulty: {activity.difficulty}</Text>
          <Text style={styles.detail}>Duration: {activity.duration}</Text>

          <Pressable
            style={styles.button}
            onPress={() =>
  router.push({
    pathname: '/rating',
    params: { activity: activity.name },
  })
}
          >
            <Text style={styles.buttonText}>Rate This Activity</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  category: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  activityName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 16,
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});