import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Login Page</Text>
      <Text variant="bodyLarge" style={styles.text}>Students can log in here.</Text>
      <Button mode="contained" onPress={() => router.replace('/')}>
        Log In
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
});
