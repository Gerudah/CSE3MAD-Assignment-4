import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, mediaService } from '@/db';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const STUDENT_ID = 'demo-student'; // TODO: replace with real auth user

export default function ParachuteAnalyzeScreen() {
  const { sessionId, protoId, proto, videoUri, height, mass } = useLocalSearchParams<{
    sessionId: string;
    protoId: string;
    proto: string;
    videoUri: string;
    height: string;
    mass: string;
  }>();
  const protoNum = parseInt(proto ?? '1', 10);
  const screenTitle = protoNum === 1 ? 'Baseline — Analyze' : `Design ${protoNum - 1} — Analyze`;
  const { theme } = useAppTheme();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [releaseTime, setReleaseTime] = useState<number | null>(null);
  const [impactTime, setImpactTime] = useState<number | null>(null);
  const [stopTime, setStopTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const currentTimeRef = useRef(0);

  const player = useVideoPlayer(videoUri ?? null, (p) => {
    p.pause();
  });

  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', ({ currentTime: t }) => {
      setCurrentTime(t);
      currentTimeRef.current = t;
    });
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay' && player.duration) {
        setDuration(player.duration);
      }
    });
    return () => {
      timeSub.remove();
      statusSub.remove();
    };
  }, [player]);

  function step(delta: number) {
    const maxTime = duration > 0 ? duration : Infinity;
    const newTime = Math.max(0, Math.min(maxTime, currentTimeRef.current + delta));
    player.currentTime = newTime;
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
  }

  function fmt(t: number) {
    return t.toFixed(3) + 's';
  }

  const dropTime =
    releaseTime !== null && impactTime !== null ? impactTime - releaseTime : null;
  const contactTime =
    impactTime !== null && stopTime !== null ? stopTime - impactTime : null;
  const allMarked = dropTime !== null && contactTime !== null;

  async function handleSave() {
    if (!allMarked) return;
    setSaving(true);
    try {
      await measurementService.add(protoId, 'drop_time_s', dropTime!, 's', 'test');
      await measurementService.add(protoId, 'contact_time_s', contactTime!, 's', 'test');
      await mediaService.add(
        protoId,
        STUDENT_ID,
        'video',
        videoUri,
        'record',
        dropTime! + contactTime!
      );

      if (protoNum < 3) {
        router.push({
          pathname: '/activity/parachute-design',
          params: { sessionId, proto: String(protoNum + 1), height, mass },
        });
      } else {
        router.push({
          pathname: '/activity/parachute-summary',
          params: { sessionId, height, mass },
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: screenTitle }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>{screenTitle}</Text>
        <Text variant="bodyMedium" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          Use play/pause to navigate the video. Step buttons fine-tune by 0.1s or 0.5s.
          Mark three events in order.
        </Text>

        <VideoView
          player={player}
          style={styles.video}
          allowsFullscreen
          allowsPictureInPicture={false}
          nativeControls
        />

        {/* Fine-step controls */}
        <View style={styles.stepRow}>
          <Button compact mode="outlined" onPress={() => step(-0.5)} style={styles.stepBtn}>
            −0.5s
          </Button>
          <Button compact mode="outlined" onPress={() => step(-0.1)} style={styles.stepBtn}>
            −0.1s
          </Button>
          <Text variant="titleMedium" style={styles.timeDisplay}>
            {fmt(currentTime)}
          </Text>
          <Button compact mode="outlined" onPress={() => step(0.1)} style={styles.stepBtn}>
            +0.1s
          </Button>
          <Button compact mode="outlined" onPress={() => step(0.5)} style={styles.stepBtn}>
            +0.5s
          </Button>
        </View>

        <Divider style={styles.divider} />

        {/* Three ordered markers */}
        <Text variant="titleSmall" style={styles.markerTitle}>Mark events in order:</Text>
        <View style={styles.markers}>
          <Button
            mode={releaseTime !== null ? 'contained-tonal' : 'outlined'}
            icon="flag-outline"
            onPress={() => setReleaseTime(currentTimeRef.current)}
            style={styles.markerBtn}
          >
            {releaseTime !== null ? `1. Release: ${fmt(releaseTime)}` : '1. Mark Release (drop)'}
          </Button>

          <Button
            mode={impactTime !== null ? 'contained-tonal' : 'outlined'}
            icon="flag"
            disabled={releaseTime === null}
            onPress={() => setImpactTime(currentTimeRef.current)}
            style={styles.markerBtn}
          >
            {impactTime !== null
              ? `2. First Impact: ${fmt(impactTime)}`
              : '2. Mark First Impact (landing)'}
          </Button>

          <Button
            mode={stopTime !== null ? 'contained-tonal' : 'outlined'}
            icon="flag-checkered"
            disabled={impactTime === null}
            onPress={() => setStopTime(currentTimeRef.current)}
            style={styles.markerBtn}
          >
            {stopTime !== null
              ? `3. Stopped: ${fmt(stopTime)}`
              : '3. Mark Stop Moving'}
          </Button>
        </View>

        {/* Results cards (appear as markers are placed) */}
        {(dropTime !== null || contactTime !== null) && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.resultRow}>
              {dropTime !== null && (
                <Card mode="contained" style={styles.resultCard}>
                  <Card.Content>
                    <Text variant="labelMedium">Drop Time</Text>
                    <Text
                      variant="headlineMedium"
                      style={[styles.resultVal, { color: theme.colors.primary }]}
                    >
                      {dropTime.toFixed(3)}s
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      release → impact
                    </Text>
                  </Card.Content>
                </Card>
              )}
              {contactTime !== null && (
                <Card mode="contained" style={styles.resultCard}>
                  <Card.Content>
                    <Text variant="labelMedium">Contact Time</Text>
                    <Text
                      variant="headlineMedium"
                      style={[styles.resultVal, { color: theme.colors.secondary }]}
                    >
                      {contactTime.toFixed(3)}s
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      impact → stopped
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          </>
        )}

        <View style={styles.actions}>
          {allMarked && (
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              icon="check"
              style={styles.saveBtn}
              contentStyle={styles.saveBtnContent}
            >
              {protoNum < 3 ? 'Save & Next Test' : 'Save & See Results'}
            </Button>
          )}
          <Button
            mode="text"
            onPress={() =>
              router.push({
                pathname: '/activity/parachute-summary',
                params: { sessionId, height, mass },
              })
            }
          >
            Skip to Results
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20 },
  title: { textAlign: 'center', marginBottom: 8 },
  hint: { textAlign: 'center', marginBottom: 16 },
  video: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#000',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 4,
  },
  stepBtn: { flex: 1 },
  timeDisplay: { flex: 1.2, textAlign: 'center' },
  divider: { marginVertical: 16 },
  markerTitle: { marginBottom: 10 },
  markers: { gap: 10 },
  markerBtn: { width: '100%' },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  resultCard: { flex: 1 },
  resultVal: { textAlign: 'center', marginTop: 4, marginBottom: 2 },
  actions: { gap: 8, marginTop: 16 },
  saveBtn: {},
  saveBtnContent: { paddingVertical: 8 },
});
