import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService, sessionService } from '@/db';
import { uploadBestScore } from '@/services/leaderboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, Divider, Icon, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle, Marker } from 'react-native-maps';

function riskColor(db: number): string {
  if (db < 60) return '#4CAF50';
  if (db < 75) return '#FFC107';
  if (db < 90) return '#FF9800';
  return '#F44336';
}

function riskLabel(db: number): string {
  if (db < 60) return 'Safe';
  if (db < 75) return 'Moderate';
  if (db < 90) return 'Loud';
  return 'Dangerous';
}

type LocationStats = {
  name: string;
  avgDb: number;
  maxDb: number;
  predictedDb: number | null;
  lat: number | null;
  lng: number | null;
};

export default function SoundPollutionSummaryScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string; teamName: string; memberName: string;
  }>();
  const { theme } = useAppTheme();

  const [stats, setStats] = useState<LocationStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const prototypes = await prototypeService.getBySession(sessionId);
      const results: LocationStats[] = await Promise.all(
        prototypes.map(async (proto) => {
          const avgRows  = await measurementService.getByPrototypeAndKey(proto.id, 'avg_db_spl');
          const maxRows  = await measurementService.getByPrototypeAndKey(proto.id, 'max_db_spl');
          const predRows = await measurementService.getByPrototypeAndKey(proto.id, 'predicted_db');
          const latRows  = await measurementService.getByPrototypeAndKey(proto.id, 'gps_lat');
          const lngRows  = await measurementService.getByPrototypeAndKey(proto.id, 'gps_lng');
          return {
            name:        proto.design_description ?? `Location ${proto.prototype_number}`,
            avgDb:       avgRows.length  > 0 ? avgRows[avgRows.length - 1].value  : 0,
            maxDb:       maxRows.length  > 0 ? maxRows[maxRows.length - 1].value  : 0,
            predictedDb: predRows.length > 0 ? predRows[0].value : null,
            lat:         latRows.length  > 0 ? latRows[0].value  : null,
            lng:         lngRows.length  > 0 ? lngRows[0].value  : null,
          };
        })
      );
      setStats(results);
      setLoaded(true);
    })();
  }, [sessionId]);

  async function saveReflection() {
    await uploadBestScore(sessionId);
    await sessionService.complete(sessionId, reflection);
    setCompleted(true);
  }

  const quietest = stats.length > 0 ? stats.reduce((a, b) => a.avgDb < b.avgDb ? a : b) : null;
  const loudest  = stats.length > 0 ? stats.reduce((a, b) => a.avgDb > b.avgDb ? a : b) : null;
  const yMax     = stats.length > 0 ? Math.ceil(Math.max(...stats.map(s => s.maxDb)) * 1.15) || 80 : 80;

  const gpsStats = stats.filter(s => s.lat !== null && s.lng !== null);
  const mapRegion = gpsStats.length > 0 ? (() => {
    const lats = gpsStats.map(s => s.lat!);
    const lngs = gpsStats.map(s => s.lng!);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    return {
      latitude:      (minLat + maxLat) / 2,
      longitude:     (minLng + maxLng) / 2,
      latitudeDelta:  Math.max(0.005, (maxLat - minLat) * 2.5),
      longitudeDelta: Math.max(0.005, (maxLng - minLng) * 2.5),
    };
  })() : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>Noise Level Results</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown'} | Member: {memberName || 'Unknown'}
        </Text>

        {!loaded ? (
          <Text style={styles.loading}>Loading results...</Text>
        ) : (
          <>
            {/* Risk legend */}
            <View style={styles.legendRow}>
              {[
                { label: '<60 dB  Safe',      color: '#4CAF50' },
                { label: '60–75  Moderate',   color: '#FFC107' },
                { label: '75–90  Loud',        color: '#FF9800' },
                { label: '>90 dB  Dangerous', color: '#F44336' },
              ].map(r => (
                <View key={r.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: r.color }]} />
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{r.label}</Text>
                </View>
              ))}
            </View>

            {/* Highlight cards */}
            {quietest && loudest && (
              <View style={styles.highlightRow}>
                <Card style={[styles.highlightCard, { borderColor: riskColor(quietest.avgDb), borderWidth: 2 }]}>
                  <Card.Content>
                    <Text variant="labelSmall" style={{ color: riskColor(quietest.avgDb) }}>QUIETEST</Text>
                    <Text variant="titleSmall">{quietest.name}</Text>
                    <Text variant="bodyLarge" style={{ color: riskColor(quietest.avgDb) }}>{quietest.avgDb} dB avg</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{riskLabel(quietest.avgDb)}</Text>
                  </Card.Content>
                </Card>
                <Card style={[styles.highlightCard, { borderColor: riskColor(loudest.avgDb), borderWidth: 2 }]}>
                  <Card.Content>
                    <Text variant="labelSmall" style={{ color: riskColor(loudest.avgDb) }}>LOUDEST</Text>
                    <Text variant="titleSmall">{loudest.name}</Text>
                    <Text variant="bodyLarge" style={{ color: riskColor(loudest.avgDb) }}>{loudest.avgDb} dB avg</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{riskLabel(loudest.avgDb)}</Text>
                  </Card.Content>
                </Card>
              </View>
            )}

            {/* Custom risk-coloured bar chart */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Average Noise by Location</Text>
                <View style={styles.chartContainer}>
                  {stats.map((s, i) => {
                    const pct = Math.min(100, Math.round((s.avgDb / yMax) * 100));
                    return (
                      <View key={i} style={styles.barRow}>
                        <Text style={[styles.barIndex, { color: theme.colors.onSurfaceVariant }]}>{i + 1}</Text>
                        <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: riskColor(s.avgDb) }]} />
                        </View>
                        <Text style={[styles.barVal, { color: riskColor(s.avgDb) }]}>{s.avgDb}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text variant="bodySmall" style={[styles.axisNote, { color: theme.colors.onSurfaceVariant }]}>
                  {stats.map((s, i) => `${i + 1}=${s.name}`).join(' · ')}
                </Text>
              </Card.Content>
            </Card>

            {/* Map of measurement locations */}
            {mapRegion && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.sectionTitle}>Measurement Locations</Text>
                  <MapView
                    style={styles.map}
                    initialRegion={mapRegion}
                    scrollEnabled
                    zoomEnabled
                  >
                    {gpsStats.map((s, i) => {
                      const coord = { latitude: s.lat!, longitude: s.lng! };
                      const color = riskColor(s.avgDb);
                      return [
                        <Circle
                          key={`circle-${i}`}
                          center={coord}
                          radius={5}
                          fillColor={`${color}45`}
                          strokeColor={color}
                          strokeWidth={2}
                        />,
                        <Marker
                          key={`pin-${i}`}
                          coordinate={coord}
                          title={s.name}
                          description={`${s.avgDb} dB avg · ${riskLabel(s.avgDb)}`}
                          tracksViewChanges={false}
                        />,
                      ];
                    })}
                  </MapView>
                  <Text variant="bodySmall" style={[styles.axisNote, { color: theme.colors.onSurfaceVariant }]}>
                    Pin colour matches noise risk level · tap a pin for details
                  </Text>
                </Card.Content>
              </Card>
            )}

            {/* Predictions vs actual */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Predicted vs Actual</Text>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Location</DataTable.Title>
                    <DataTable.Title numeric>Predicted</DataTable.Title>
                    <DataTable.Title numeric>Avg dB</DataTable.Title>
                    <DataTable.Title numeric>Diff</DataTable.Title>
                  </DataTable.Header>
                  {stats.map((s, i) => {
                    const diff = s.predictedDb !== null
                      ? Math.round(s.avgDb - s.predictedDb) : null;
                    return (
                      <DataTable.Row key={i}>
                        <DataTable.Cell>
                          <View style={styles.riskCellRow}>
                            <View style={[styles.riskDot, { backgroundColor: riskColor(s.avgDb) }]} />
                            <Text variant="bodySmall">{s.name}</Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          {s.predictedDb !== null ? `${s.predictedDb} dB` : '—'}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>{s.avgDb} dB</DataTable.Cell>
                        <DataTable.Cell numeric>
                          {diff !== null ? `${diff > 0 ? '+' : ''}${diff}` : '—'}
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
                </DataTable>
                <Text variant="bodySmall" style={[styles.axisNote, { color: theme.colors.onSurfaceVariant }]}>
                  Diff = actual − predicted. Positive means louder than expected.
                </Text>
              </Card.Content>
            </Card>

            {/* Full table */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Full Readings</Text>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Location</DataTable.Title>
                    <DataTable.Title numeric>Avg dB</DataTable.Title>
                    <DataTable.Title numeric>Max dB</DataTable.Title>
                    <DataTable.Title style={styles.riskCol}>Risk</DataTable.Title>
                  </DataTable.Header>
                  {stats.map((s, i) => (
                    <DataTable.Row key={i}>
                      <DataTable.Cell>{s.name}</DataTable.Cell>
                      <DataTable.Cell numeric>{s.avgDb}</DataTable.Cell>
                      <DataTable.Cell numeric>{s.maxDb}</DataTable.Cell>
                      <DataTable.Cell style={styles.riskCol}>
                        <Text style={{ color: riskColor(s.avgDb) }}>{riskLabel(s.avgDb)}</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          </>
        )}

        <Divider style={styles.divider} />

        <TextInput
          label="Discussion / reflection"
          mode="outlined"
          multiline
          value={reflection}
          onChangeText={setReflection}
          placeholder="Which location was most surprising? What are the risks of prolonged noise exposure?"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={saveReflection}
          disabled={completed || !reflection.trim()}
          style={styles.button}
          icon={completed ? 'check-circle' : 'content-save'}
        >
          {completed ? 'Reflection Saved' : 'Save Reflection'}
        </Button>

        {completed && (
          <View style={[styles.savedBanner, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon source="check-circle" size={18} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, marginLeft: 8 }}>
              Reflection saved successfully!
            </Text>
          </View>
        )}

        <Button
          mode="contained-tonal"
          style={styles.button}
          icon="star"
          onPress={() =>
            router.push({ pathname: '/rating', params: { activity: 'Sound Pollution Hunter' } })
          }
        >
          Rate This Activity
        </Button>

        <Button mode="text" onPress={() => router.push('/(tabs)/activity')}>
          Back to Activities
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
  subtitle: { textAlign: 'center', marginBottom: 16 },
  loading: { textAlign: 'center', marginTop: 32 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  highlightRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  highlightCard: { flex: 1 },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  // Custom bar chart
  chartContainer: { marginVertical: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barIndex: { width: 16, textAlign: 'right', fontSize: 12 },
  barTrack: { flex: 1, height: 20, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barVal: { width: 36, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  axisNote: { textAlign: 'center', marginTop: 6, lineHeight: 16 },
  // Map
  map: { height: 240, borderRadius: 8, marginTop: 4 },
  riskCol: { paddingLeft: 16 },
  // Table risk cell
  riskCellRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { marginVertical: 16 },
  input: { marginBottom: 16 },
  button: { marginBottom: 10 },
  savedBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 10 },
});
