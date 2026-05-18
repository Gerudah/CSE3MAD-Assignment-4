import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService } from '@/db';
import { router, useLocalSearchParams } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Area, CartesianChart, Line } from 'victory-native';
import { auth, db } from '../../firebaseConfig';

export default function EarthquakeTestScreen() {
  const { sessionId, protoId, design, teamName, memberName } =
    useLocalSearchParams<{
      sessionId: string;
      protoId: string;
      design: string;
      teamName: string;
      memberName: string;
    }>();

  const { theme } = useAppTheme();
  const designNum = parseInt(design ?? '1', 10);

  const [isTesting, setIsTesting] = useState(false);
  const [displacementValues, setDisplacementValues] = useState<number[]>([]);
  const [maxDisplacement, setMaxDisplacement] = useState(0);
  const [movementRange, setMovementRange] = useState(0);
  const [saving, setSaving] = useState(false);

  const valuesRef = useRef<number[]>([]);

  useEffect(() => {
    let subscription: any;

    if (isTesting) {
      Accelerometer.setUpdateInterval(200);

      subscription = Accelerometer.addListener((data) => {
        const displacementCm =
          Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);

        const scaledDisplacement = Number(
          (displacementCm * 10).toFixed(2)
        );

        valuesRef.current = [
          ...valuesRef.current,
          scaledDisplacement,
        ].slice(-30);

        setDisplacementValues(valuesRef.current);

        const max = Math.max(...valuesRef.current);
        const min = Math.min(...valuesRef.current);

        setMaxDisplacement(Number(max.toFixed(2)));
        setMovementRange(Number((max - min).toFixed(2)));
      });
    }

    return () => {
      subscription?.remove();
    };
  }, [isTesting]);

  function startTest() {
    valuesRef.current = [];
    setDisplacementValues([]);
    setMaxDisplacement(0);
    setMovementRange(0);
    setIsTesting(true);

    // Parallel vibration + sensor reading
    Vibration.vibrate([0, 500, 200, 500, 200, 500], false);
  }

  async function stopAndSave() {
    setIsTesting(false);
    Vibration.cancel();
    setSaving(true);

    const stabilityScore = Math.max(
      0,
      Number((100 - movementRange * 10).toFixed(0))
    );

    // SQLite measurements
    await measurementService.add(
      protoId,
      'movement_range_cm',
      movementRange,
      'cm',
      'shake_test'
    );

    await measurementService.add(
      protoId,
      'max_displacement_cm',
      maxDisplacement,
      'cm',
      'shake_test'
    );

    await measurementService.add(
      protoId,
      'stability_score',
      stabilityScore,
      'score',
      'shake_test'
    );

    // Firestore save
    await addDoc(collection(db, 'earthquakeResults'), {
      activity: 'Earthquake-Resistant Structure',
      sessionId,
      prototypeId: protoId,
      teamName: String(teamName || 'Unknown Team'),
      memberName: String(memberName || 'Unknown Member'),
      designNumber: designNum,
      movementRangeCm: movementRange,
      maxDisplacementCm: maxDisplacement,
      stabilityScore,
      userId: auth.currentUser?.uid || 'guest',
      userEmail: auth.currentUser?.email || 'guest',
      createdAt: serverTimestamp(),
    });

    setSaving(false);

    if (designNum < 3) {
      router.push({
        pathname: '/activity/earthquake-design',
        params: {
          sessionId,
          design: String(designNum + 1),
          teamName,
          memberName,
        },
      });
    } else {
      router.push({
        pathname: '/activity/earthquake-summary',
        params: {
          sessionId,
          teamName,
          memberName,
        },
      });
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Design {designNum} Shake Test
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Team: {teamName} | Member: {memberName}
        </Text>

        <Text variant="bodyLarge" style={styles.instructions}>
          Place the phone in the centre of the structure,
          then start the shake test.
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Live Displacement Graph
            </Text>

            <View style={styles.graph}>
              <CartesianChart
                data={
                  displacementValues.length > 0
                    ? displacementValues.map((y, x) => ({ x, y }))
                    : [{ x: 0, y: 0 }]
                }
                xKey="x"
                yKeys={['y']}
                domain={{ y: [0, displacementValues.length > 0 ? Math.max(35, Math.max(...displacementValues)) : 35] }}
                xAxis={{ lineWidth: 0, tickCount: 0 }}
                yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                padding={5}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Area
                      points={points.y}
                      y0={chartBounds.bottom}
                      color={theme.colors.primary}
                      opacity={0.25}
                    />
                    <Line
                      points={points.y}
                      color={theme.colors.primary}
                      strokeWidth={2}
                    />
                  </>
                )}
              </CartesianChart>
            </View>

            <Text variant="bodyLarge" style={styles.resultText}>
              Max displacement: {maxDisplacement} cm
            </Text>

            <Text variant="bodyLarge" style={styles.resultText}>
              Movement range: {movementRange} cm
            </Text>
          </Card.Content>
        </Card>

        {!isTesting ? (
          <Button
            mode="contained"
            onPress={startTest}
            style={styles.button}
            icon="vibrate"
          >
            Start Vibration Test
          </Button>
        ) : (
          <Button
            mode="contained-tonal"
            onPress={stopAndSave}
            loading={saving}
            disabled={saving}
            style={styles.button}
            icon="content-save"
          >
            Stop & Save Result
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 16 },
  instructions: { textAlign: 'center', marginBottom: 24 },
  card: { marginBottom: 24 },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  graph: {
    height: 160,
    marginBottom: 16,
  },
  resultText: {
    textAlign: 'center',
    marginBottom: 6,
  },
  button: {
    width: '100%',
  },
});