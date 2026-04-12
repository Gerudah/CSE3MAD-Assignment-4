import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Page</Text>
      <Text style={styles.text}>Students can log in here.</Text>

      <Pressable style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Log In</Text>
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
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});