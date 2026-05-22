// Requires: npx expo install expo-av react-native-maps
import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService } from '@/db';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button, Card, Chip, DataTable, HelperText,
  Text, TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line } from 'victory-native';

const DB_OFFSET = 90;
const MEASURE_DURATION_MS = 5000;
const METER_INTERVAL_MS = 16;
const MIN_LOCATIONS = 3;

const PRESET_LOCATIONS = [
  'Classroom', 'School Hallway', 'Library', 'Cafeteria',
  'Outside (quiet)', 'Outside (traffic)', 'Sports Hall', 'Bathroom',
];

function riskColor(db: number): string {
  if (db < 60) return '#4CAF50';
  if (db < 75) return '#FFC107';
  if (db < 90) return '#FF9800';
  return '#F44336';
}

type LocationReading = {
  name: string;
  predictedDb: number;
  avgDb: number;
  maxDb: number;
  protoId: string;
  lat: number | null;
  lng: number | null;
};

export default function SoundPollutionTestScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string; teamName: string; memberName: string;
  }>();
  const { theme } = useAppTheme();

  const [readings, setReadings] = useState<LocationReading[]>([]);

  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [prediction, setPrediction] = useState('');
  const [inputError, setInputError] = useState('');

  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [liveDb, setLiveDb] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const samplesRef = useRef<number[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    // Start a continuous location watcher for the lifetime of this screen.
    // Avoids the cold-start problem: the provider warms up once on mount and
    // keeps locationRef current. Each measurement just snapshots it instantly —
    // no per-measurement race or timeout. The Measure button is blocked until
    // the first fix arrives so recordings always carry a location.
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsError('Location permission denied — measurements won\'t appear on the map.');
          setGpsReady(true); // unblock the button so the activity isn't completely broken
          return;
        }
        watcherRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 0 },
          (pos) => {
            locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setGpsReady(true);
          },
        );
      } catch {
        setGpsError('Location unavailable on this device.');
        setGpsReady(true); // unblock so the activity can still run without GPS
      }
    })();
    return () => {
      countdownRef.current && clearInterval(countdownRef.current);
      stopTimerRef.current && clearTimeout(stopTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      watcherRef.current?.remove();
    };
  }, []);

  const locationName = selectedLocation === 'Custom'
    ? customLocation.trim()
    : selectedLocation;

  function validateInputs(): boolean {
    if (!locationName) {
      setInputError('Choose or enter a location.');
      return false;
    }
    if (readings.some(r => r.name === locationName)) {
      setInputError('You already measured this location.');
      return false;
    }
    const pred = parseFloat(prediction);
    if (isNaN(pred) || pred < 0 || pred > 200) {
      setInputError('Enter a predicted noise level between 0 and 200 dB.');
      return false;
    }
    setInputError('');
    return true;
  }

  async function startMeasurement() {
    if (!validateInputs()) return;

    samplesRef.current = [];
    setWaveform([]);
    setLiveDb(0);

    // ── Microphone setup ──────────────────────────────────────────────────────
    // GPS is handled by the continuous watcher started in useEffect — no work needed here.
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setInputError('Microphone permission denied. Please enable it in Settings.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    } catch {
      setInputError('Could not access microphone.');
      return;
    }

    setMeasuring(true);
    setCountdown(Math.round(MEASURE_DURATION_MS / 1000));

    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const spl = Math.max(30, Math.round(status.metering + DB_OFFSET));
            setLiveDb(spl);
            samplesRef.current.push(spl);
            setWaveform(prev => [...prev, spl].slice(-120));
          }
        },
        METER_INTERVAL_MS,
      );
      recordingRef.current = recording;
    } catch {
      setMeasuring(false);
      setInputError('Failed to start recording. Check microphone access.');
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);

    stopTimerRef.current = setTimeout(stopAndSave, MEASURE_DURATION_MS);
  }

  async function stopAndSave() {
    countdownRef.current && clearInterval(countdownRef.current);
    stopTimerRef.current && clearTimeout(stopTimerRef.current);
    setMeasuring(false);
    setSaving(true);

    try {
      await recordingRef.current?.stopAndUnloadAsync();
    } catch { /* already stopped */ }
    recordingRef.current = null;

    const samples = samplesRef.current;
    const avgDb = samples.length > 0
      ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
      : 0;
    const maxDb = samples.length > 0 ? Math.max(...samples) : 0;
    const pred = parseFloat(prediction);

    // Snapshot the latest position from the continuous watcher (no await needed).
    const lat = locationRef.current?.lat ?? null;
    const lng = locationRef.current?.lng ?? null;

    const protoId = await prototypeService.create(
      sessionId,
      readings.length + 1,
      locationName,
    );
    await measurementService.add(protoId, 'avg_db_spl', avgDb, 'dB', locationName);
    await measurementService.add(protoId, 'max_db_spl', maxDb, 'dB', locationName);
    await measurementService.add(protoId, 'predicted_db', pred, 'dB', locationName);
    if (lat !== null && lng !== null) {
      await measurementService.add(protoId, 'gps_lat', lat, 'deg', locationName);
      await measurementService.add(protoId, 'gps_lng', lng, 'deg', locationName);
    }

    setReadings(prev => [...prev, { name: locationName, predictedDb: pred, avgDb, maxDb, protoId, lat, lng }]);

    setSelectedLocation('');
    setCustomLocation('');
    setPrediction('');
    setWaveform([]);
    setLiveDb(0);
    setSaving(false);
  }

  function handleViewSummary() {
    router.push({
      pathname: '/activity/sound-pollution-summary' as any,
      params: { sessionId, teamName, memberName },
    });
  }

  const yMax = waveform.length > 0 ? Math.max(80, Math.max(...waveform)) : 80;
  const currentRiskColor = riskColor(liveDb);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Sound Level Measurements</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName} | Measured: {readings.length} location{readings.length !== 1 ? 's' : ''}
        </Text>

        <Text variant="titleSmall" style={styles.label}>Select Location</Text>
        <View style={styles.chipRow}>
          {[...PRESET_LOCATIONS, 'Custom'].map(loc => (
            <Chip
              key={loc}
              selected={selectedLocation === loc}
              onPress={() => !measuring && setSelectedLocation(loc)}
              style={styles.chip}
              compact
            >
              {loc}
            </Chip>
          ))}
        </View>

        {selectedLocation === 'Custom' && (
          <TextInput
            mode="outlined"
            label="Location name"
            value={customLocation}
            onChangeText={setCustomLocation}
            style={styles.input}
            disabled={measuring}
          />
        )}

        <TextInput
          mode="outlined"
          label="Predicted noise level (dB)"
          value={prediction}
          onChangeText={setPrediction}
          keyboardType="decimal-pad"
          style={styles.input}
          disabled={measuring}
          right={<TextInput.Affix text="dB" />}
        />

        {inputError ? <HelperText type="error" visible>{inputError}</HelperText> : null}

        {(measuring || liveDb > 0) && (
          <Card style={[styles.card, { borderColor: currentRiskColor, borderWidth: measuring ? 2 : 0 }]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {measuring ? `Measuring — ${countdown}s remaining` : 'Last measurement'}
              </Text>

              <Text variant="displaySmall" style={[styles.dbDisplay, { color: currentRiskColor }]}>
                {liveDb} dB
              </Text>

              <View style={styles.waveform}>
                <CartesianChart
                  data={waveform.length > 0 ? waveform.map((y, x) => ({ x, y })) : [{ x: 0, y: 0 }]}
                  xKey="x"
                  yKeys={['y']}
                  domain={{ y: [30, yMax] }}
                  xAxis={{ lineWidth: 0, tickCount: 0 }}
                  yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                  padding={4}
                >
                  {({ points }) => (
                    <Line
                      points={points.y}
                      color={measuring ? currentRiskColor : theme.colors.outline}
                      strokeWidth={2}
                    />
                  )}
                </CartesianChart>
              </View>

              {measuring && (
                <View style={styles.riskLegend}>
                  {[
                    { label: '<60 safe', color: '#4CAF50' },
                    { label: '60–75', color: '#FFC107' },
                    { label: '75–90', color: '#FF9800' },
                    { label: '>90 danger', color: '#F44336' },
                  ].map(r => (
                    <View key={r.label} style={styles.riskItem}>
                      <View style={[styles.riskDot, { backgroundColor: r.color }]} />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{r.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {gpsError ? <HelperText type="error" visible>{gpsError}</HelperText> : null}

        {!measuring ? (
          <Button
            mode="contained"
            onPress={startMeasurement}
            disabled={saving || !gpsReady}
            loading={saving || !gpsReady}
            style={styles.button}
            icon={gpsReady ? 'microphone' : 'map-marker-radius'}
          >
            {gpsReady ? 'Measure for 5 Seconds' : 'Waiting for GPS...'}
          </Button>
        ) : (
          <Button
            mode="contained-tonal"
            onPress={stopAndSave}
            style={styles.button}
            icon="stop"
          >
            Stop Early &amp; Save
          </Button>
        )}

        {readings.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Recorded Locations</Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Location</DataTable.Title>
                  <DataTable.Title numeric>Pred.</DataTable.Title>
                  <DataTable.Title numeric>Avg dB</DataTable.Title>
                  <DataTable.Title numeric>Max dB</DataTable.Title>
                </DataTable.Header>
                {readings.map((r, i) => (
                  <DataTable.Row key={i}>
                    <DataTable.Cell>
                      <View style={styles.riskCellRow}>
                        <View style={[styles.riskDot, { backgroundColor: riskColor(r.avgDb) }]} />
                        <Text variant="bodySmall">{r.name}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>{r.predictedDb}</DataTable.Cell>
                    <DataTable.Cell numeric>{r.avgDb}</DataTable.Cell>
                    <DataTable.Cell numeric>{r.maxDb}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleViewSummary}
          disabled={readings.length < MIN_LOCATIONS || measuring}
          style={styles.button}
          icon="chart-bar"
        >
          {readings.length < MIN_LOCATIONS
            ? `Measure ${MIN_LOCATIONS - readings.length} more location${MIN_LOCATIONS - readings.length !== 1 ? 's' : ''}`
            : 'View Summary'}
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 20 },
  label: { marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { marginBottom: 4 },
  input: { marginBottom: 12 },
  card: { marginBottom: 16 },
  cardTitle: { textAlign: 'center', marginBottom: 8 },
  dbDisplay: { textAlign: 'center', marginBottom: 8, fontWeight: '700' },
  waveform: { height: 120 },
  button: { marginBottom: 12 },
  riskLegend: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  riskItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskCellRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
