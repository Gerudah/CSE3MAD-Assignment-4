import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService, sessionService } from '@/db';
import { uploadBestScore } from '@/services/leaderboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, CartesianChart } from 'victory-native';

type LocationStats = {
  name: string;
  avgDb: number;
  maxDb: number;
  predictedDb: number | null;
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
          return {
            name: proto.design_description ?? `Location ${proto.prototype_number}`,
            avgDb:       avgRows.length  > 0 ? avgRows[avgRows.length - 1].value  : 0,
            maxDb:       maxRows.length  > 0 ? maxRows[maxRows.length - 1].value  : 0,
            predictedDb: predRows.length > 0 ? predRows[0].value : null,
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

  const quietest  = stats.length > 0 ? stats.reduce((a, b) => a.avgDb < b.avgDb ? a : b) : null;
  const loudest   = stats.length > 0 ? stats.reduce((a, b) => a.avgDb > b.avgDb ? a : b) : null;
  const yMax = stats.length > 0 ? Math.ceil(Math.max(...stats.map(s => s.maxDb)) * 1.15) || 80 : 80;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Noise Level Results</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown'} | Member: {memberName || 'Unknown'}
        </Text>

        {!loaded ? (
          <Text style={styles.loading}>Loading results...</Text>
        ) : (
          <>
            {/* Highlight cards */}
            {quietest && loudest && (
              <View style={styles.highlightRow}>
                <Card style={[styles.highlightCard, { borderColor: theme.colors.secondary, borderWidth: 2 }]}>
                  <Card.Content>
                    <Text variant="labelSmall" style={{ color: theme.colors.secondary }}>QUIETEST</Text>
                    <Text variant="titleSmall">{quietest.name}</Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>{quietest.avgDb} dB avg</Text>
                  </Card.Content>
                </Card>
                <Card style={[styles.highlightCard, { borderColor: theme.colors.error, borderWidth: 2 }]}>
                  <Card.Content>
                    <Text variant="labelSmall" style={{ color: theme.colors.error }}>LOUDEST</Text>
                    <Text variant="titleSmall">{loudest.name}</Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.error }}>{loudest.avgDb} dB avg</Text>
                  </Card.Content>
                </Card>
              </View>
            )}

            {/* Bar chart — avg dB per location */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Average Noise Level by Location</Text>
                <View style={styles.chart}>
                  <CartesianChart
                    data={stats.map((s, i) => ({ x: i + 1, y: s.avgDb }))}
                    xKey="x"
                    yKeys={['y']}
                    domain={{ y: [0, yMax] }}
                    domainPadding={{ left: 20, right: 20 }}
                    xAxis={{ lineWidth: 1, lineColor: theme.colors.outline, tickCount: 0 }}
                    yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                    padding={8}
                  >
                    {({ points, chartBounds }) => (
                      <Bar
                        points={points.y}
                        chartBounds={chartBounds}
                        color={theme.colors.primary}
                        roundedCorners={{ topLeft: 4, topRight: 4 }}
                        innerPadding={0.3}
                      />
                    )}
                  </CartesianChart>
                </View>
                <Text variant="bodySmall" style={[styles.axisNote, { color: theme.colors.onSurfaceVariant }]}>
                  {stats.map((s, i) => `${i + 1}=${s.name}`).join(' · ')}
                </Text>
              </Card.Content>
            </Card>

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
                        <DataTable.Cell>{s.name}</DataTable.Cell>
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
                  </DataTable.Header>
                  {stats.map((s, i) => (
                    <DataTable.Row key={i}>
                      <DataTable.Cell>{s.name}</DataTable.Cell>
                      <DataTable.Cell numeric>{s.avgDb}</DataTable.Cell>
                      <DataTable.Cell numeric>{s.maxDb}</DataTable.Cell>
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
          disabled={!reflection.trim()}
          style={styles.button}
          icon="content-save"
        >
          {completed ? 'Reflection Saved' : 'Save Reflection'}
        </Button>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', marginBottom: 24 },
  loading: { textAlign: 'center', marginTop: 32 },
  highlightRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  highlightCard: { flex: 1 },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  chart: { height: 180 },
  axisNote: { textAlign: 'center', marginTop: 6, lineHeight: 16 },
  divider: { marginVertical: 16 },
  input: { marginBottom: 16 },
  button: { marginBottom: 10 },
});
