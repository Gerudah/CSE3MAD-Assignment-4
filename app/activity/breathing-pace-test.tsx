import { router, useLocalSearchParams } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

type Condition = 'Resting' | 'Jogging' | 'Star Jumps';

export default function BreathingPaceTestScreen() {
  const { teamName, memberName } = useLocalSearchParams<{
    teamName: string;
    memberName: string;
  }>();

  const [condition, setCondition] = useState<Condition>('Resting');

  const [isRecording, setIsRecording] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [breathingRate, setBreathingRate] = useState(0);

  const [restingRate, setRestingRate] = useState<number | null>(null);
  const [joggingRate, setJoggingRate] = useState<number | null>(null);
  const [starJumpRate, setStarJumpRate] = useState<number | null>(null);

  const [reflection, setReflection] = useState('');

  useEffect(() => {
    let subscription: any;

    if (isRecording) {
      Accelerometer.setUpdateInterval(300);

      subscription = Accelerometer.addListener((data) => {
        const magnitude =
          Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);

        const simulatedBreathing = Math.round(magnitude * 8 + 10);

        setBreathingRate(simulatedBreathing);

        setWaveform((prev) => {
          const updated = [...prev, simulatedBreathing];
          return updated.slice(-20);
        });
      });
    }

    return () => {
      subscription?.remove();
    };
  }, [isRecording]);

  const saveToSQLite = async (conditionName: string, bpm: number) => {
    if (Platform.OS === 'web') return;

    const SQLite = await import('expo-sqlite');
    const localDb = await SQLite.openDatabaseAsync('labrats.db');

    await localDb.execAsync(`
      CREATE TABLE IF NOT EXISTS breathing_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT,
        member_name TEXT,
        condition TEXT,
        bpm REAL,
        reflection TEXT,
        created_at INTEGER
      );
    `);

    await localDb.runAsync(
      `INSERT INTO breathing_results
      (team_name, member_name, condition, bpm, reflection, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(teamName),
        String(memberName),
        conditionName,
        bpm,
        reflection,
        Date.now(),
      ]
    );
  };

  const saveToFirestore = async (conditionName: string, bpm: number) => {
    await addDoc(collection(db, 'breathingResults'), {
      activity: 'Breathing Pace Trainer',
      teamName: String(teamName),
      memberName: String(memberName),
      condition: conditionName,
      bpm,
      reflection,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: serverTimestamp(),
    });
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (condition === 'Resting') {
      setRestingRate(breathingRate);
    } else if (condition === 'Jogging') {
      setJoggingRate(breathingRate);
    } else {
      setStarJumpRate(breathingRate);
    }

    await saveToFirestore(condition, breathingRate);
    await saveToSQLite(condition, breathingRate);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Breathing Pace Trainer
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          Team: {teamName} | Member: {memberName}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">
              Current Condition: {condition}
            </Text>

            <Text variant="headlineLarge" style={styles.bpm}>
              {breathingRate} BPM
            </Text>

            <View style={styles.waveform}>
              {waveform.map((value, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height: value * 2,
                    },
                  ]}
                />
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.conditionButtons}>
          <Button
            mode={condition === 'Resting' ? 'contained' : 'outlined'}
            onPress={() => setCondition('Resting')}
            style={styles.button}
          >
            Resting
          </Button>

          <Button
            mode={condition === 'Jogging' ? 'contained' : 'outlined'}
            onPress={() => setCondition('Jogging')}
            style={styles.button}
          >
            Jogging
          </Button>

          <Button
            mode={condition === 'Star Jumps' ? 'contained' : 'outlined'}
            onPress={() => setCondition('Star Jumps')}
            style={styles.button}
          >
            Star Jumps
          </Button>
        </View>

        {!isRecording ? (
          <Button mode="contained" onPress={() => setIsRecording(true)} style={styles.button}>
            Start Recording
          </Button>
        ) : (
          <Button mode="contained-tonal" onPress={stopRecording} style={styles.button}>
            Stop Recording
          </Button>
        )}

        <TextInput
          mode="outlined"
          label="Reflection"
          value={reflection}
          onChangeText={setReflection}
          multiline
          style={styles.input}
        />

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.resultsTitle}>
              Results Comparison
            </Text>

            <Text>Resting BPM: {restingRate ?? 'No data'}</Text>
            <Text>Jogging BPM: {joggingRate ?? 'No data'}</Text>
            <Text>Star Jump BPM: {starJumpRate ?? 'No data'}</Text>
          </Card.Content>
        </Card>
        <Button
  mode="contained"
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: '/activity/breathing-pace-summary',
      params: {
        teamName: String(teamName || 'Unknown Team'),
        memberName: String(memberName || 'Unknown Member'),
        restingRate: restingRate !== null ? String(restingRate) : '',
        joggingRate: joggingRate !== null ? String(joggingRate) : '',
        starJumpRate: starJumpRate !== null ? String(starJumpRate) : '',
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
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  bpm: {
    textAlign: 'center',
    marginVertical: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 10,
  },
  waveBar: {
    width: 8,
    marginHorizontal: 2,
    backgroundColor: '#4CAF50',
  },
  conditionButtons: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 20,
  },
  resultsTitle: {
    marginBottom: 10,
  },
});