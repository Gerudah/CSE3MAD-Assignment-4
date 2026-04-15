import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Home Page</Text>
      <Text variant="bodyLarge" style={styles.text}>Welcome to the STEMM app.</Text>
      <Button mode="contained" onPress={() => router.push('/team-formation')} style={styles.button}>
        Go to Team Formation
      </Button>
      <Button mode="contained" onPress={() => router.push('/rating')} style={styles.button}>
        Go to Rating Page
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
  },
  text: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
});
