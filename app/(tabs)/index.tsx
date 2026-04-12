import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Page</Text>
      <Text style={styles.text}>Welcome to the STEMM app.</Text>

      <Pressable style={styles.button} onPress={() => router.push('/team-formation')}>
        <Text style={styles.buttonText}>Go to Team Formation</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => router.push('/rating')}>
        <Text style={styles.buttonText}>Go to Rating Page</Text>
      </Pressable>
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
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});