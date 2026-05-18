import { measurementService, prototypeService } from '@/db';
import { uploadBestScore } from '@/services/leaderboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type GameState = 'ready' | 'waiting' | 'tap' | 'result';
type Phase = 'dominant' | 'nonDominant' | 'tracing';

const BOARD_SIZE = 260;
const TARGET_SIZE = 70;

const PHASE_PROTO_NUM: Record<string, number> = {
  'Dominant Hand': 1,
  'Non-Dominant Hand': 2,
  'Tracing Challenge': 3,
};

export default function ReactionBoardScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string;
    teamName: string;
    memberName: string;
  }>();

  const team = String(teamName || 'Unknown Team');
  const member = String(memberName || 'Unknown Member');

  const [gameState, setGameState] = useState<GameState>('ready');
  const [phase, setPhase] = useState<Phase>('dominant');
  const startTimeRef = useRef(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);

  const [dominantAttempts, setDominantAttempts] = useState<number[]>([]);
  const [nonDominantAttempts, setNonDominantAttempts] = useState<number[]>([]);

  const [tracingStarted, setTracingStarted] = useState(false);
  const [targetX, setTargetX] = useState(100);
  const [targetY, setTargetY] = useState(100);
  const targetStartTimeRef = useRef(0);
  const [tracingAttempts, setTracingAttempts] = useState(0);
  const [tracingHits, setTracingHits] = useState(0);
  const [tracingDelays, setTracingDelays] = useState<number[]>([]);

  const [message, setMessage] = useState('Choose a phase, then start the test.');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks created prototype IDs per phase label to avoid duplicates
  const phaseProtoRef = useRef<Record<string, string>>({});

  // Capture start time after the "TAP NOW!" render, not inside the timeout
  useEffect(() => {
    if (gameState === 'tap') {
      startTimeRef.current = Date.now();
    }
  }, [gameState]);

  // Capture target start time after the target position re-renders
  useEffect(() => {
    if (tracingStarted) {
      targetStartTimeRef.current = Date.now();
    }
  }, [targetX, targetY]);

  const calculateAverage = (attempts: number[]) => {
    if (attempts.length === 0) return null;
    return Math.round(attempts.reduce((t, v) => t + v, 0) / attempts.length);
  };

  const calculateBest = (attempts: number[]) =>
    attempts.length === 0 ? null : Math.min(...attempts);

  const calculateWorst = (attempts: number[]) =>
    attempts.length === 0 ? null : Math.max(...attempts);

  const dominantAverage = calculateAverage(dominantAttempts);
  const nonDominantAverage = calculateAverage(nonDominantAttempts);
  const tracingAverageDelay = calculateAverage(tracingDelays);
  const tracingAccuracy =
    tracingAttempts > 0 ? Math.round((tracingHits / tracingAttempts) * 100) : null;

  const saveToDb = async (
    phaseName: string,
    value: number,
    accuracy?: number | null
  ) => {
    let protoId = phaseProtoRef.current[phaseName];
    if (!protoId) {
      protoId = await prototypeService.create(
        sessionId,
        PHASE_PROTO_NUM[phaseName] ?? 1,
        phaseName
      );
      phaseProtoRef.current = { ...phaseProtoRef.current, [phaseName]: protoId };
    }
    await measurementService.add(protoId, 'reaction_time_ms', value, 'ms', phaseName);
    if (accuracy != null) {
      await measurementService.add(protoId, 'tracing_accuracy_pct', accuracy, '%', phaseName);
    }
  };

  const saveResult = async (
    phaseName: string,
    value: number,
    unit: string,
    accuracy?: number | null
  ) => {
    await saveToDb(phaseName, value, accuracy);
    setMessage(`${phaseName} result saved: ${value} ${unit}`);
  };

  const changePhase = (newPhase: Phase) => {
    if (gameState === 'waiting' || gameState === 'tap') return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setPhase(newPhase);
    setGameState('ready');
    setReactionTime(null);
    setTracingStarted(false);

    if (newPhase === 'dominant') {
      setMessage('Phase 1: Test reaction time with your dominant hand.');
    } else if (newPhase === 'nonDominant') {
      setMessage('Phase 2: Repeat the test with your non-dominant hand.');
    } else {
      setMessage('Phase 3: Tap the moving target as quickly as possible.');
    }
  };

  const startReactionTest = () => {
    setGameState('waiting');
    setReactionTime(null);
    setMessage('Wait for it...');

    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    timeoutRef.current = setTimeout(() => {
      setGameState('tap');
      setMessage('TAP NOW!');
    }, randomDelay);
  };

  const handleReactionTap = async () => {
    if (gameState === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState('ready');
      setMessage('Too early! Press start and try again.');
      return;
    }

    if (gameState === 'tap') {
      const result = Date.now() - startTimeRef.current;
      setReactionTime(result);

      if (phase === 'dominant') {
        setDominantAttempts([...dominantAttempts, result]);
        await saveResult('Dominant Hand', result, 'ms');
      } else {
        setNonDominantAttempts([...nonDominantAttempts, result]);
        await saveResult('Non-Dominant Hand', result, 'ms');
      }

      setGameState('result');
    }
  };

  const moveTarget = () => {
    const maxPosition = BOARD_SIZE - TARGET_SIZE;
    setTargetX(Math.floor(Math.random() * maxPosition));
    setTargetY(Math.floor(Math.random() * maxPosition));
  };

  const startTracing = () => {
    setTracingStarted(true);
    setTracingAttempts(0);
    setTracingHits(0);
    setTracingDelays([]);
    setMessage('Phase 3 started. Tap the target five times.');
    moveTarget();
  };

  const handleBoardPress = async (event: GestureResponderEvent) => {
    if (!tracingStarted || phase !== 'tracing') return;

    const { locationX, locationY } = event.nativeEvent;
    const centerX = targetX + TARGET_SIZE / 2;
    const centerY = targetY + TARGET_SIZE / 2;
    const distance = Math.sqrt((locationX - centerX) ** 2 + (locationY - centerY) ** 2);
    const hit = distance <= TARGET_SIZE / 2;

    const delay = Date.now() - targetStartTimeRef.current;
    const newAttempts = tracingAttempts + 1;
    const newHits = hit ? tracingHits + 1 : tracingHits;
    const newDelays = hit ? [...tracingDelays, delay] : tracingDelays;
    const newAccuracy = Math.round((newHits / newAttempts) * 100);

    setTracingAttempts(newAttempts);
    setTracingHits(newHits);
    setTracingDelays(newDelays);

    await saveResult('Tracing Challenge', delay, 'ms delay', newAccuracy);

    if (newAttempts >= 5) {
      setTracingStarted(false);
      setMessage(`Tracing complete. Accuracy: ${newAccuracy}%`);
      return;
    }

    setMessage(hit ? `Hit! Delay: ${delay} ms` : 'Missed! Try again.');
    moveTarget();
  };

  const resetAttempts = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setDominantAttempts([]);
    setNonDominantAttempts([]);
    setReactionTime(null);
    setGameState('ready');
    setPhase('dominant');
    setTracingStarted(false);
    setTracingAttempts(0);
    setTracingHits(0);
    setTracingDelays([]);
    phaseProtoRef.current = {};
    setMessage('Choose a phase, then start the test.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>
          Reaction Board Challenge
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          Team: {team} | Member: {member}
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          Complete dominant hand, non-dominant hand, and tracing tests to compare reaction speed and accuracy.
        </Text>

        <View style={styles.phaseButtons}>
          <Button mode={phase === 'dominant' ? 'contained' : 'outlined'} onPress={() => changePhase('dominant')} style={styles.phaseButton}>
            Phase 1: Dominant
          </Button>

          <Button mode={phase === 'nonDominant' ? 'contained' : 'outlined'} onPress={() => changePhase('nonDominant')} style={styles.phaseButton}>
            Phase 2: Non-Dominant
          </Button>

          <Button mode={phase === 'tracing' ? 'contained' : 'outlined'} onPress={() => changePhase('tracing')} style={styles.phaseButton}>
            Phase 3: Tracing
          </Button>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.phaseText}>
              Current Phase:{' '}
              {phase === 'dominant'
                ? 'Dominant Hand'
                : phase === 'nonDominant'
                  ? 'Non-Dominant Hand'
                  : 'Tracing Challenge'}
            </Text>

            <Text variant="headlineSmall" style={styles.message}>
              {message}
            </Text>

            {reactionTime !== null && (
              <Text variant="titleMedium" style={styles.result}>
                Last reaction result: {reactionTime} ms
              </Text>
            )}
          </Card.Content>
        </Card>

        {phase !== 'tracing' ? (
          <View style={styles.buttonGroup}>
            <Button mode="contained" onPress={startReactionTest} disabled={gameState === 'waiting' || gameState === 'tap'} style={styles.button}>
              Start Test
            </Button>

            <Button mode="contained-tonal" onPress={handleReactionTap} disabled={gameState === 'ready' || gameState === 'result'} style={styles.tapButton}>
              Tap Button
            </Button>
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <Button mode="contained" onPress={startTracing} style={styles.button}>
              Start Tracing Challenge
            </Button>

            <Pressable onPress={handleBoardPress} style={styles.board}>
              <View style={[styles.target, { left: targetX, top: targetY }]} />
            </Pressable>

            <Text variant="bodyMedium" style={styles.centerText}>
              Attempts: {tracingAttempts}/5 | Hits: {tracingHits}
            </Text>
          </View>
        )}

        <Button mode="outlined" onPress={resetAttempts} style={styles.button}>
          Reset All Attempts
        </Button>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.attemptTitle}>
              Results Comparison
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>Dominant Hand</Text>
            <Text>Attempts: {dominantAttempts.length}</Text>
            <Text>Average: {dominantAverage !== null ? `${dominantAverage} ms` : 'No data'}</Text>
            <Text>Best: {calculateBest(dominantAttempts) !== null ? `${calculateBest(dominantAttempts)} ms` : 'No data'}</Text>
            <Text>Worst: {calculateWorst(dominantAttempts) !== null ? `${calculateWorst(dominantAttempts)} ms` : 'No data'}</Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>Non-Dominant Hand</Text>
            <Text>Attempts: {nonDominantAttempts.length}</Text>
            <Text>Average: {nonDominantAverage !== null ? `${nonDominantAverage} ms` : 'No data'}</Text>
            <Text>Best: {calculateBest(nonDominantAttempts) !== null ? `${calculateBest(nonDominantAttempts)} ms` : 'No data'}</Text>
            <Text>Worst: {calculateWorst(nonDominantAttempts) !== null ? `${calculateWorst(nonDominantAttempts)} ms` : 'No data'}</Text>

            {dominantAverage !== null && nonDominantAverage !== null && (
              <Text variant="bodyLarge" style={styles.comparison}>
                Difference: {Math.abs(dominantAverage - nonDominantAverage)} ms
              </Text>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>Tracing Challenge</Text>
            <Text>Attempts: {tracingAttempts}</Text>
            <Text>Accuracy: {tracingAccuracy !== null ? `${tracingAccuracy}%` : 'No data'}</Text>
            <Text>Average Delay: {tracingAverageDelay !== null ? `${tracingAverageDelay} ms` : 'No data'}</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          style={styles.button}
          onPress={async () => {
            try { await uploadBestScore(sessionId); } catch { /* non-fatal */ }
            router.push({
              pathname: '/activity/reaction-board-summary',
              params: {
                teamName: team,
                memberName: member,
                dominantAverage: dominantAverage !== null ? String(dominantAverage) : '',
                dominantBest: calculateBest(dominantAttempts) !== null ? String(calculateBest(dominantAttempts)) : '',
                dominantWorst: calculateWorst(dominantAttempts) !== null ? String(calculateWorst(dominantAttempts)) : '',
                nonDominantAverage: nonDominantAverage !== null ? String(nonDominantAverage) : '',
                nonDominantBest: calculateBest(nonDominantAttempts) !== null ? String(calculateBest(nonDominantAttempts)) : '',
                nonDominantWorst: calculateWorst(nonDominantAttempts) !== null ? String(calculateWorst(nonDominantAttempts)) : '',
                difference:
                  dominantAverage !== null && nonDominantAverage !== null
                    ? String(Math.abs(dominantAverage - nonDominantAverage))
                    : '',
                tracingAccuracy: tracingAccuracy !== null ? String(tracingAccuracy) : '',
                tracingAverageDelay: tracingAverageDelay !== null ? String(tracingAverageDelay) : '',
              },
            });
          }}
        >
          View Summary
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, alignItems: 'center' },
  title: { textAlign: 'center', marginBottom: 10 },
  description: { textAlign: 'center', marginBottom: 20 },
  phaseButtons: { width: '100%', marginBottom: 15 },
  phaseButton: { marginBottom: 10 },
  card: { width: '100%', marginBottom: 20 },
  phaseText: { textAlign: 'center', marginBottom: 10 },
  message: { textAlign: 'center', marginBottom: 10 },
  result: { textAlign: 'center', marginTop: 8 },
  buttonGroup: { width: '100%', marginBottom: 20 },
  button: { width: '100%', marginBottom: 10 },
  tapButton: { marginBottom: 10, paddingVertical: 10 },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#eeeeee',
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 12,
    alignSelf: 'center',
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: TARGET_SIZE / 2,
    backgroundColor: '#4CAF50',
  },
  centerText: { textAlign: 'center' },
  attemptTitle: { marginBottom: 10, textAlign: 'center' },
  sectionTitle: { marginTop: 12, marginBottom: 4 },
  comparison: { marginTop: 15, textAlign: 'center' },
});
