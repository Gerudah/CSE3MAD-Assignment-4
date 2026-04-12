import { StyleSheet, Text, View } from 'react-native';

export default function RecordingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recordings Page</Text>
      <Text style={styles.text}>Saved recordings and results will appear here.</Text>
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