import { StyleSheet, Text, View } from 'react-native';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard Page</Text>
      <Text style={styles.text}>Rankings will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
  },
});