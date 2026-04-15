import LightDarkToggle from '@/components/light-dark';
import { StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>Settings Page</Text>
      <Surface style={styles.surface} elevation={4}>
        <Text variant="bodyLarge">Dark Mode</Text>
        <LightDarkToggle />
      </Surface>
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
    marginBottom: 20,
  },
  surface: {
    flexDirection: 'row',
    padding: 8,
    paddingInline:15,
    borderRadius:15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
