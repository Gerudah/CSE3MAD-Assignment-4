import { StyleSheet, Text, View } from 'react-native';

export default function TeamFormationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Formation Page</Text>
      <Text style={styles.text}>Students can create or join a team here.</Text>
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
    textAlign: 'center',
  },
});