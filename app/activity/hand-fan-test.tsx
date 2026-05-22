import { measurementService, prototypeService, sessionService } from '@/db';
import { uploadBestScore } from '@/services/leaderboard';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import {
    Button,
    Card,
    DataTable,
    SegmentedButtons,
    Text,
    TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const stiffnessValues = {
  Paper: 0.4,
  Cardboard: 0.8,
};

export default function HandFanTestScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string;
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

  const saveToDb = async (
    design: string,
    dist: string,
    mat: string,
    angle: number,
    force: number,
    latitude: number | null,
    longitude: number | null,
    trialNumber: number
  ) => {
    const protoId = await prototypeService.create(sessionId, trialNumber, `${design} (${mat})`);
    await measurementService.add(protoId, 'bend_angle_deg', angle, 'deg');
    await measurementService.add(protoId, 'estimated_force_n', force, 'N');
    await measurementService.add(protoId, 'distance_cm', Number(dist), 'cm');
    if (latitude !== null && longitude !== null) {
      await sessionService.updateLocation(sessionId, latitude, longitude);
    }
  };

  const saveTrial = async () => {
    if (!designName || !bendAngle) return;

    const angle = Number(bendAngle);
    const estimatedForce = calculateForce();
    const trialNumber = results.length + 1;

    let latitude = null;
    let longitude = null;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }
    } catch {
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
    await saveToDb(designName, distance, material, angle, estimatedForce, latitude, longitude, trialNumber);

    setDesignName('');
    setBendAngle('');
  };

  async function handleViewSummary() {
    try {
      await sessionService.complete(sessionId, reflection);
      await uploadBestScore(sessionId);
    } catch {
      // non-fatal
    }
    router.push({
      pathname: '/activity/hand-fan-summary',
      params: {
        teamName: String(teamName),
        memberName: String(memberName),
        totalTrials: String(results.length),
        reflection,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
          onPress={handleViewSummary}
        >
          View Summary
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
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
