import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import {
    Button,
    Card,
    DataTable,
    SegmentedButtons,
    Text,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

const stiffnessValues = {
  Paper: 0.4,
  Cardboard: 0.8,
};

export default function HandFanTestScreen() {
  const { teamName, memberName } = useLocalSearchParams<{
    teamName: string;
    memberName: string;
  }>();

  const [designName, setDesignName] = useState('');
  const [distance, setDistance] = useState('30');
  const [material, setMaterial] = useState<'Paper' | 'Cardboard'>('Paper');
  const [bendAngle, setBendAngle] = useState('');
  const [reflection, setReflection] = useState('');

  const [results, setResults] = useState<any[]>([]);

  const calculateForce = () => {
    const theta = Number(bendAngle);
    const k = stiffnessValues[material];

    return Number((k * theta).toFixed(2));
  };

  const saveToSQLite = async (
    design: string,
    dist: string,
    angle: number,
    force: number,
    latitude: number | null,
    longitude: number | null
  ) => {
    if (Platform.OS === 'web') return;

    const SQLite = await import('expo-sqlite');
    const localDb = await SQLite.openDatabaseAsync('labrats.db');

    await localDb.execAsync(`
      CREATE TABLE IF NOT EXISTS hand_fan_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT,
        member_name TEXT,
        design_name TEXT,
        distance TEXT,
        material TEXT,
        bend_angle REAL,
        estimated_force REAL,
        latitude REAL,
        longitude REAL,
        reflection TEXT,
        created_at INTEGER
      );
    `);

    await localDb.runAsync(
      `INSERT INTO hand_fan_results
      (team_name, member_name, design_name, distance, material,
       bend_angle, estimated_force, latitude, longitude,
       reflection, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(teamName),
        String(memberName),
        design,
        dist,
        material,
        angle,
        force,
        latitude,
        longitude,
        reflection,
        Date.now(),
      ]
    );
  };

  const saveTrial = async () => {
    if (!designName || !bendAngle) return;

    const angle = Number(bendAngle);
    const estimatedForce = calculateForce();

    let latitude = null;
    let longitude = null;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }
    } catch (error) {
      console.log('Location unavailable');
    }

    const result = {
      design: designName,
      distance,
      material,
      bendAngle: angle,
      estimatedForce,
      latitude,
      longitude,
    };

    setResults([...results, result]);

    try {
      await addDoc(collection(db, 'handFanResults'), {
        activity: 'Hand Fan Challenge',
        teamName: String(teamName),
        memberName: String(memberName),
        designName,
        distance,
        material,
        bendAngle: angle,
        estimatedForce,
        latitude,
        longitude,
        reflection,
        userId: auth.currentUser?.uid || 'guest',
        createdAt: serverTimestamp(),
      });

      await saveToSQLite(
        designName,
        distance,
        angle,
        estimatedForce,
        latitude,
        longitude
      );
    } catch (error) {
      console.log('Save failed');
    }

    setDesignName('');
    setBendAngle('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Hand Fan Challenge
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Team: {teamName} | Member: {memberName}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Trial Input
            </Text>

            <TextInput
              mode="outlined"
              label="Fan Design Name"
              value={designName}
              onChangeText={setDesignName}
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.label}>
              Distance
            </Text>

            <SegmentedButtons
              value={distance}
              onValueChange={setDistance}
              buttons={[
                { value: '15', label: '15cm' },
                { value: '30', label: '30cm' },
                { value: '45', label: '45cm' },
              ]}
            />

            <Text variant="bodyMedium" style={styles.label}>
              Material
            </Text>

            <SegmentedButtons
              value={material}
              onValueChange={(value) =>
                setMaterial(value as 'Paper' | 'Cardboard')
              }
              buttons={[
                { value: 'Paper', label: 'Paper' },
                { value: 'Cardboard', label: 'Cardboard' },
              ]}
            />

            <TextInput
              mode="outlined"
              label="Bend Angle (degrees)"
              value={bendAngle}
              onChangeText={setBendAngle}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text variant="titleMedium" style={styles.force}>
              Estimated Force: {bendAngle ? calculateForce() : 0} N
            </Text>

            <TextInput
              mode="outlined"
              label="Reflection"
              value={reflection}
              onChangeText={setReflection}
              multiline
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={saveTrial}
              style={styles.button}
            >
              Save Trial
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Results Table
            </Text>

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Design</DataTable.Title>
                <DataTable.Title>Dist</DataTable.Title>
                <DataTable.Title>Angle</DataTable.Title>
                <DataTable.Title>Force</DataTable.Title>
              </DataTable.Header>

              {results.map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell>{item.design}</DataTable.Cell>
                  <DataTable.Cell>{item.distance}</DataTable.Cell>
                  <DataTable.Cell>{item.bendAngle}°</DataTable.Cell>
                  <DataTable.Cell>{item.estimatedForce}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: '/activity/hand-fan-summary',
              params: {
                teamName: String(teamName),
                memberName: String(memberName),
                totalTrials: String(results.length),
                reflection,
              },
            })
          }
        >
          View Summary
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20 },
  title: { textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', marginBottom: 20 },
  card: { marginBottom: 20 },
  sectionTitle: { marginBottom: 12 },
  input: { marginBottom: 16 },
  label: { marginBottom: 8, marginTop: 8 },
  force: { marginVertical: 16, textAlign: 'center' },
  button: { marginTop: 10 },
});