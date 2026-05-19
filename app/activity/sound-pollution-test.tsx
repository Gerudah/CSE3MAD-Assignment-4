// Requires: npx expo install expo-av
import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService } from '@/db';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button, Card, Chip, DataTable, HelperText,
  Text, TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartesianChart, Line } from 'victory-native';

// dBFS → approximate SPL calibration offset (phone mic typical sensitivity)
const DB_OFFSET = 90;
const MEASURE_DURATION_MS = 5000;
const MIN_LOCATIONS = 3;

const PRESET_LOCATIONS = [
  'Classroom', 'School Hallway', 'Library', 'Cafeteria',
  'Outside (quiet)', 'Outside (traffic)', 'Sports Hall', 'Bathroom',
];

type LocationReading = {
  name: string;
  predictedDb: number;
  avgDb: number;
  maxDb: number;
  protoId: string;
};

export default function SoundPollutionTestScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string; teamName: string; memberName: string;
  }>();
  const { theme } = useAppTheme();

  const [readings, setReadings] = useState<LocationReading[]>([]);

  // Location selection
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [prediction, setPrediction] = useState('');
  const [inputError, setInputError] = useState('');

  // Measurement state
  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [liveDb, setLiveDb] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const samplesRef = useRef<number[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      countdownRef.current && clearInterval(countdownRef.current);
      stopTimerRef.current && clearTimeout(stopTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
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

    samplesRef.current = [];
    setWaveform([]);
    setLiveDb(0);
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
            setWaveform(prev => [...prev, spl].slice(-40));
          }
        },
        200,
      );
      recordingRef.current = recording;
    } catch {
      setMeasuring(false);
      setInputError('Failed to start recording. Check microphone access.');
      return;
    }

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);

    // Auto-stop after MEASURE_DURATION_MS
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

    const protoId = await prototypeService.create(
      sessionId,
      readings.length + 1,
      locationName,
    );
    await measurementService.add(protoId, 'avg_db_spl', avgDb, 'dB', locationName);
    await measurementService.add(protoId, 'max_db_spl', maxDb, 'dB', locationName);
    await measurementService.add(protoId, 'predicted_db', pred, 'dB', locationName);

    setReadings(prev => [...prev, { name: locationName, predictedDb: pred, avgDb, maxDb, protoId }]);

    // Reset form
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Sound Level Measurements</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName} | Measured: {readings.length} location{readings.length !== 1 ? 's' : ''}
        </Text>

        {/* Location chips */}
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

        {/* Live meter card */}
        {(measuring || liveDb > 0) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {measuring ? `Measuring — ${countdown}s remaining` : 'Last measurement'}
              </Text>

              <Text variant="displaySmall" style={[styles.dbDisplay, { color: theme.colors.primary }]}>
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
                      color={measuring ? theme.colors.primary : theme.colors.outline}
                      strokeWidth={2}
                    />
                  )}
                </CartesianChart>
              </View>
            </Card.Content>
          </Card>
        )}

        {!measuring ? (
          <Button
            mode="contained"
            onPress={startMeasurement}
            disabled={saving}
            loading={saving}
            style={styles.button}
            icon="microphone"
          >
            Measure for 5 Seconds
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

        {/* Recorded locations */}
        {readings.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>Recorded Locations</Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Location</DataTable.Title>
                  <DataTable.Title numeric>Predicted</DataTable.Title>
                  <DataTable.Title numeric>Avg dB</DataTable.Title>
                  <DataTable.Title numeric>Max dB</DataTable.Title>
                </DataTable.Header>
                {readings.map((r, i) => (
                  <DataTable.Row key={i}>
                    <DataTable.Cell>{r.name}</DataTable.Cell>
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
});
