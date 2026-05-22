import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService } from '@/db';
import { uploadBestScore } from '@/services/leaderboard';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Gyroscope } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, ProgressBar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line } from 'victory-native';

// 4 movements × 3 sets = 12 total attempts
const MOVEMENTS = [
  { key: 'circle',    label: 'Arm Circle',          instruction: 'Rotate your entire arm in a large circle, holding the phone firmly.' },
  { key: 'sweep',     label: 'Vertical Sweep',       instruction: 'Raise your arm fully above your head, then lower it back down in one smooth motion.' },
  { key: 'extension', label: 'Horizontal Extension', instruction: 'Extend your arm out to the side, then bring it back to your body.' },
  { key: 'figure8',   label: 'Figure-8',             instruction: 'Trace a large figure-8 shape in front of you with your whole arm.' },
];
const SETS = 3;
const TOTAL = MOVEMENTS.length * SETS; // 12

// Approximate arm-tip jitter in mm from gyro std-dev.
// gyro rad/s × arm_length 0.6 m × sample_interval 0.016 s × 1000 mm/m ≈ × 9.6
const JITTER_SCALE = 9.6;
// Single-sample gyro magnitude (rad/s) above which a jerk is detected
const HAPTIC_THRESHOLD = 2.5;
const HAPTIC_COOLDOWN_MS = 350;

type AttemptResult = {
  set: number;
  movementKey: string;
  movementLabel: string;
  durationS: number;
  jitterMm: number;
};

export default function StretchSpeedTestScreen() {
  const { sessionId, teamName, memberName } =
    useLocalSearchParams<{ sessionId: string; teamName: string; memberName: string }>();

  const { theme } = useAppTheme();

  // --- Phase ---
  const [phase, setPhase] = useState<'predictions' | 'testing'>('predictions');

  // --- Predictions (one per movement, entered before testing) ---
  const [predictions, setPredictions] = useState<Record<string, string>>({
    circle: '', sweep: '', extension: '', figure8: '',
  });
  const [predictionError, setPredictionError] = useState('');

  // --- Testing state ---
  const [setNum, setSetNum] = useState(0);
  const [movementIdx, setMovementIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const gyroValuesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  // Reuse one prototype per movement across sets
  const protoIdRef = useRef<Partial<Record<string, string>>>({});
  const lastHapticRef = useRef(0);

  const attemptsDone = setNum * MOVEMENTS.length + movementIdx;
  const progress = attemptsDone / TOTAL;
  const currentMovement = MOVEMENTS[movementIdx];

  useEffect(() => {
    let subscription: ReturnType<typeof Gyroscope.addListener> | null = null;

    if (isRecording) {
      Gyroscope.setUpdateInterval(16); // ~60 Hz

      subscription = Gyroscope.addListener((data) => {
        const magnitude = Math.abs(data.x) + Math.abs(data.y) + Math.abs(data.z);
        gyroValuesRef.current = [...gyroValuesRef.current, magnitude].slice(-80);
        setWaveform([...gyroValuesRef.current]);

        if (magnitude > HAPTIC_THRESHOLD) {
          const now = Date.now();
          if (now - lastHapticRef.current > HAPTIC_COOLDOWN_MS) {
            lastHapticRef.current = now;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }
      });
    }

    return () => { subscription?.remove(); };
  }, [isRecording]);

  // --- Prediction phase ---
  function confirmPredictions() {
    const missing = MOVEMENTS.some(m => {
      const v = parseFloat(predictions[m.key]);
      return isNaN(v) || v < 0;
    });
    if (missing) {
      setPredictionError('Enter a predicted jitter (mm) for every movement.');
      return;
    }
    setPredictionError('');
    setPhase('testing');
  }

  // --- Testing phase ---
  function startRecording() {
    gyroValuesRef.current = [];
    setWaveform([]);
    startTimeRef.current = Date.now();
    setIsRecording(true);
  }

  async function stopAndSave() {
    setIsRecording(false);
    setSaving(true);

    const durationS = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(2));
    const values = gyroValuesRef.current;

    const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const variance = values.length > 1
      ? values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
      : 0;
    const jitterMm = Number((Math.sqrt(variance) * JITTER_SCALE).toFixed(2));

    // Get or create one prototype per movement (reused across sets)
    let protoId = protoIdRef.current[currentMovement.key];
    if (!protoId) {
      protoId = await prototypeService.create(
        sessionId,
        movementIdx + 1,
        currentMovement.label
      );
      protoIdRef.current = { ...protoIdRef.current, [currentMovement.key]: protoId };

      // Save prediction once, when prototype is first created
      const predicted = parseFloat(predictions[currentMovement.key]);
      if (!isNaN(predicted)) {
        await measurementService.add(protoId, 'jitter_prediction_mm', predicted, 'mm', currentMovement.key);
      }
    }

    await measurementService.add(protoId, 'duration_s', durationS, 's', currentMovement.key);
    await measurementService.add(protoId, 'jitter_mm', jitterMm, 'mm', currentMovement.key);

    const updatedResults = [...results, {
      set: setNum + 1,
      movementKey: currentMovement.key,
      movementLabel: currentMovement.label,
      durationS,
      jitterMm,
    }];
    setResults(updatedResults);

    const nextMovementIdx = movementIdx + 1;
    if (nextMovementIdx >= MOVEMENTS.length) {
      const nextSet = setNum + 1;
      if (nextSet >= SETS) {
        await finishActivity();
      } else {
        setSetNum(nextSet);
        setMovementIdx(0);
      }
    } else {
      setMovementIdx(nextMovementIdx);
    }

    setSaving(false);
  }

  async function finishActivity() {
    setDone(true);
    try {
      await uploadBestScore(sessionId);
    } catch {
      // non-fatal
    }
    router.push({
      pathname: '/activity/stretch-speed-summary' as any,
      params: { sessionId, teamName, memberName },
    });
  }

  const yMax = waveform.length > 0 ? Math.max(1, Math.max(...waveform)) : 1;

  // ─── Prediction phase UI ───────────────────────────────────────────────────
  if (phase === 'predictions') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView contentContainerStyle={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>
              Make Your Predictions
            </Text>

            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Before testing, predict how much jitter (mm) you expect for each movement.
              Lower jitter means smoother, more graceful movement.
            </Text>

            {MOVEMENTS.map(m => (
              <View key={m.key} style={styles.predictionRow}>
                <Text variant="titleSmall" style={styles.predictionLabel}>{m.label}</Text>
                <Text variant="bodySmall" style={[styles.predictionHint, { color: theme.colors.onSurfaceVariant }]}>
                  {m.instruction}
                </Text>
                <TextInput
                  mode="outlined"
                  label="Predicted jitter (mm)"
                  value={predictions[m.key]}
                  onChangeText={v => setPredictions(p => ({ ...p, [m.key]: v }))}
                  keyboardType="decimal-pad"
                  style={styles.predictionInput}
                  right={<TextInput.Affix text="mm" />}
                />
              </View>
            ))}

            {predictionError ? (
              <HelperText type="error" visible>{predictionError}</HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={confirmPredictions}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="arrow-right"
            >
              Confirm &amp; Start Testing
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Testing phase UI ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Set {setNum + 1} of {SETS} — Movement {movementIdx + 1} of {MOVEMENTS.length}
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          {attemptsDone} / {TOTAL} attempts completed
        </Text>

        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progressBar}
        />

        <Card style={[styles.movementCard, { borderColor: theme.colors.primary }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.movementName, { color: theme.colors.primary }]}>
              {currentMovement.label}
            </Text>
            <Text variant="bodyMedium" style={styles.instruction}>
              {currentMovement.instruction}
            </Text>
            <Text variant="bodySmall" style={[styles.predictionHint, { color: theme.colors.onSurfaceVariant }]}>
              Your prediction: {predictions[currentMovement.key]} mm jitter
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Live Gyroscope</Text>

            <View style={styles.graph}>
              <CartesianChart
                data={
                  waveform.length > 0
                    ? waveform.map((y, x) => ({ x, y }))
                    : [{ x: 0, y: 0 }]
                }
                xKey="x"
                yKeys={['y']}
                domain={{ y: [0, yMax] }}
                xAxis={{ lineWidth: 0, tickCount: 0 }}
                yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                padding={4}
              >
                {({ points }) => (
                  <Line
                    points={points.y}
                    color={isRecording ? theme.colors.primary : theme.colors.outline}
                    strokeWidth={2}
                  />
                )}
              </CartesianChart>
            </View>
          </Card.Content>
        </Card>

        {results.length > 0 && (() => {
          const last = results[results.length - 1];
          return (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>Last Result</Text>
                <Text variant="bodyMedium">
                  {last.movementLabel} (Set {last.set})
                </Text>
                <Text variant="bodyMedium">
                  Duration: {last.durationS} s · Jitter: {last.jitterMm} mm
                </Text>
              </Card.Content>
            </Card>
          );
        })()}

        {!isRecording ? (
          <Button
            mode="contained"
            onPress={startRecording}
            style={styles.button}
            icon="record-circle"
            disabled={saving || done}
          >
            Start Recording
          </Button>
        ) : (
          <Button
            mode="contained-tonal"
            onPress={stopAndSave}
            loading={saving}
            disabled={saving}
            style={styles.button}
            icon="stop-circle"
          >
            Stop &amp; Save
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 12 },
  progressBar: { marginBottom: 20, borderRadius: 4, height: 6 },
  predictionRow: { marginBottom: 16 },
  predictionLabel: { marginBottom: 2, fontWeight: '600' },
  predictionHint: { marginBottom: 6, lineHeight: 18 },
  predictionInput: { marginTop: 4 },
  movementCard: { marginBottom: 16, borderWidth: 2 },
  movementName: { textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  instruction: { textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  card: { marginBottom: 16 },
  cardTitle: { textAlign: 'center', marginBottom: 10 },
  graph: { height: 140 },
  button: { width: '100%', marginTop: 4 },
  buttonContent: { paddingVertical: 6 },
});
