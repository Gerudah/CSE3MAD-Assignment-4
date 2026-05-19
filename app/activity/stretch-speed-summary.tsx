import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService, sessionService } from '@/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, CartesianChart } from 'victory-native';

const MOVEMENT_LABELS: Record<string, string> = {
  circle:    'Arm Circle',
  sweep:     'Vertical Sweep',
  extension: 'Horiz. Extension',
  figure8:   'Figure-8',
};

const MOVEMENT_KEYS = ['circle', 'sweep', 'extension', 'figure8'] as const;

type MovementStats = {
  key: string;
  label: string;
  avgDurationS: number;
  avgJitterMm: number;
  predictedJitterMm: number | null;
};

export default function StretchSpeedSummaryScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string;
    teamName: string;
    memberName: string;
  }>();

  const { theme } = useAppTheme();
  const [stats, setStats] = useState<MovementStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const prototypes = await prototypeService.getBySession(sessionId);

      const results: MovementStats[] = await Promise.all(
        MOVEMENT_KEYS.map(async (key) => {
          const label = MOVEMENT_LABELS[key];
          const proto = prototypes.find(p => p.design_description === label);

          if (!proto) {
            return { key, label, avgDurationS: 0, avgJitterMm: 0, predictedJitterMm: null };
          }

          const durationRows = await measurementService.getByPrototypeAndKey(proto.id, 'duration_s');
          const jitterRows   = await measurementService.getByPrototypeAndKey(proto.id, 'jitter_mm');
          const predRows     = await measurementService.getByPrototypeAndKey(proto.id, 'jitter_prediction_mm');

          const avg = (rows: { value: number }[]) =>
            rows.length > 0
              ? Number((rows.reduce((s, r) => s + r.value, 0) / rows.length).toFixed(2))
              : 0;

          return {
            key,
            label,
            avgDurationS: avg(durationRows),
            avgJitterMm: avg(jitterRows),
            predictedJitterMm: predRows.length > 0 ? predRows[0].value : null,
          };
        })
      );

      setStats(results);
      setLoaded(true);
    })();
  }, [sessionId]);

  async function saveReflection() {
    await sessionService.complete(sessionId, reflection);
    setCompleted(true);
  }

  const jitterYMax = stats.length > 0
    ? Math.ceil(Math.max(...stats.flatMap(s => [s.avgJitterMm, s.predictedJitterMm ?? 0])) * 1.2) || 10
    : 10;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>
          Activity Results
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown Team'} | Member: {memberName || 'Unknown Member'}
        </Text>

        {!loaded ? (
          <Text style={styles.loading}>Loading results...</Text>
        ) : (
          <>
            {/* Prediction vs Actual Jitter */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Predicted vs Actual Jitter
                </Text>

                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Movement</DataTable.Title>
                    <DataTable.Title numeric>Predicted</DataTable.Title>
                    <DataTable.Title numeric>Actual</DataTable.Title>
                    <DataTable.Title numeric>Diff</DataTable.Title>
                  </DataTable.Header>

                  {stats.map((d, i) => {
                    const diff = d.predictedJitterMm !== null
                      ? Number((d.avgJitterMm - d.predictedJitterMm).toFixed(2))
                      : null;
                    return (
                      <DataTable.Row key={i}>
                        <DataTable.Cell>{d.label}</DataTable.Cell>
                        <DataTable.Cell numeric>
                          {d.predictedJitterMm !== null ? `${d.predictedJitterMm} mm` : '—'}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          {d.avgJitterMm > 0 ? `${d.avgJitterMm} mm` : '—'}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          {diff !== null ? `${diff > 0 ? '+' : ''}${diff}` : '—'}
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
                </DataTable>

                <Text variant="bodySmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
                  Diff = actual − predicted. Negative means you moved more smoothly than expected.
                </Text>
              </Card.Content>
            </Card>

            {/* Actual jitter bar chart */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Avg Jitter by Movement (mm)
                </Text>

                <View style={styles.chartContainer}>
                  <CartesianChart
                    data={stats.map((d, i) => ({ x: i + 1, y: d.avgJitterMm }))}
                    xKey="x"
                    yKeys={['y']}
                    domain={{ y: [0, jitterYMax] }}
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
                        innerPadding={0.35}
                      />
                    )}
                  </CartesianChart>
                </View>

                <Text variant="bodySmall" style={[styles.axisLabel, { color: theme.colors.onSurfaceVariant }]}>
                  1 = Circle · 2 = Sweep · 3 = Extension · 4 = Figure-8 · Lower = smoother
                </Text>
              </Card.Content>
            </Card>

            {/* Duration bar chart */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Avg Duration by Movement (s)
                </Text>

                <View style={styles.chartContainer}>
                  <CartesianChart
                    data={stats.map((d, i) => ({ x: i + 1, y: d.avgDurationS }))}
                    xKey="x"
                    yKeys={['y']}
                    domain={{ y: [0, Math.ceil(Math.max(...stats.map(s => s.avgDurationS)) * 1.2) || 5] }}
                    domainPadding={{ left: 20, right: 20 }}
                    xAxis={{ lineWidth: 1, lineColor: theme.colors.outline, tickCount: 0 }}
                    yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                    padding={8}
                  >
                    {({ points, chartBounds }) => (
                      <Bar
                        points={points.y}
                        chartBounds={chartBounds}
                        color={theme.colors.secondary}
                        roundedCorners={{ topLeft: 4, topRight: 4 }}
                        innerPadding={0.35}
                      />
                    )}
                  </CartesianChart>
                </View>

                <Text variant="bodySmall" style={[styles.axisLabel, { color: theme.colors.onSurfaceVariant }]}>
                  1 = Circle · 2 = Sweep · 3 = Extension · 4 = Figure-8
                </Text>
              </Card.Content>
            </Card>

            {/* Full breakdown table */}
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>Full Breakdown</Text>

                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Movement</DataTable.Title>
                    <DataTable.Title numeric>Avg Duration</DataTable.Title>
                    <DataTable.Title numeric>Avg Jitter</DataTable.Title>
                  </DataTable.Header>

                  {stats.map((d, i) => (
                    <DataTable.Row key={i}>
                      <DataTable.Cell>{d.label}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        {d.avgDurationS > 0 ? `${d.avgDurationS} s` : '—'}
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        {d.avgJitterMm > 0 ? `${d.avgJitterMm} mm` : '—'}
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
          placeholder="How did your predictions compare to reality? Which movement had the most jitter and why?"
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
            router.push({
              pathname: '/rating',
              params: { activity: 'Human Performance Lab - Stretch Speed & Gracefulness' },
            })
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
  subtitle: { textAlign: 'center', marginBottom: 24 },
  loading: { textAlign: 'center', marginTop: 32 },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 12 },
  chartContainer: { height: 180 },
  axisLabel: { textAlign: 'center', marginTop: 6 },
  note: { marginTop: 8, textAlign: 'center', lineHeight: 18 },
  divider: { marginVertical: 16 },
  input: { marginBottom: 16 },
  button: { marginBottom: 10 },
});
