import { useAppTheme } from '@/constants/ContextTheme';
import type { Prototype } from '@/db';
import { measurementService, prototypeService, sessionService } from '@/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bar, CartesianChart } from 'victory-native';

type StructureResult = {
  prototype: Prototype;
  movementRange: number | null;
  maxDisplacement: number | null;
  stabilityScore: number | null;
};

export default function EarthquakeSummaryScreen() {
  const { sessionId, teamName, memberName } = useLocalSearchParams<{
    sessionId: string;
    teamName: string;
    memberName: string;
  }>();

  const { theme } = useAppTheme();

  const [results, setResults] = useState<StructureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const prototypes = await prototypeService.getBySession(sessionId);

      const loadedResults = await Promise.all(
        prototypes.map(async (prototype) => {
          const movementRange = await measurementService.getByPrototypeAndKey(
            prototype.id,
            'movement_range_cm'
          );

          const maxDisplacement = await measurementService.getByPrototypeAndKey(
            prototype.id,
            'max_displacement_cm'
          );

          const stabilityScore = await measurementService.getByPrototypeAndKey(
            prototype.id,
            'stability_score'
          );

          return {
            prototype,
            movementRange:
              movementRange.length > 0 ? movementRange[movementRange.length - 1].value : null,
            maxDisplacement:
              maxDisplacement.length > 0 ? maxDisplacement[maxDisplacement.length - 1].value : null,
            stabilityScore:
              stabilityScore.length > 0 ? stabilityScore[stabilityScore.length - 1].value : null,
          };
        })
      );

      setResults(loadedResults);
      setLoading(false);
    }

    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  const bestResult =
    results.length > 0
      ? results.reduce((best, current) => {
          const bestScore = best.stabilityScore ?? -1;
          const currentScore = current.stabilityScore ?? -1;
          return currentScore > bestScore ? current : best;
        })
      : null;

  async function saveReflection() {
    await sessionService.complete(sessionId, reflection);
    setCompleted(true);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Earthquake Results
        </Text>

        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Team: {teamName || 'Unknown Team'} | Member: {memberName || 'Unknown Member'}
        </Text>

        {loading ? (
          <Text style={styles.loading}>Loading results...</Text>
        ) : results.length === 0 ? (
          <Text style={styles.loading}>No structure results recorded yet.</Text>
        ) : (
          <>
            {results.map((item) => {
              const isBest = bestResult?.prototype.id === item.prototype.id;

              return (
                <Card
                  key={item.prototype.id}
                  mode="outlined"
                  style={[
                    styles.card,
                    isBest && { borderWidth: 2, borderColor: theme.colors.primary },
                  ]}
                >
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text variant="titleMedium">
                        Design {item.prototype.prototype_number}
                      </Text>

                      {isBest && (
                        <Text style={{ color: theme.colors.primary }}>
                          Best
                        </Text>
                      )}
                    </View>

                    <Text variant="bodyMedium" style={styles.description}>
                      {item.prototype.design_description || 'No description'}
                    </Text>

                    <DataTable>
                      <DataTable.Row>
                        <DataTable.Cell>Movement range</DataTable.Cell>
                        <DataTable.Cell numeric>
                          {item.movementRange !== null ? `${item.movementRange} cm` : '—'}
                        </DataTable.Cell>
                      </DataTable.Row>

                      <DataTable.Row>
                        <DataTable.Cell>Max displacement</DataTable.Cell>
                        <DataTable.Cell numeric>
                          {item.maxDisplacement !== null ? `${item.maxDisplacement} cm` : '—'}
                        </DataTable.Cell>
                      </DataTable.Row>

                      <DataTable.Row>
                        <DataTable.Cell>Stability score</DataTable.Cell>
                        <DataTable.Cell numeric>
                          {item.stabilityScore !== null ? `${item.stabilityScore}/100` : '—'}
                        </DataTable.Cell>
                      </DataTable.Row>
                    </DataTable>
                  </Card.Content>
                </Card>
              );
            })}

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  Results Bar Chart
                </Text>

                <View style={styles.summaryChart}>
                  <CartesianChart
                    data={results.map(r => ({
                      x: r.prototype.prototype_number,
                      y: r.stabilityScore ?? 0,
                    }))}
                    xKey="x"
                    yKeys={['y']}
                    domain={{ y: [0, 100] }}
                    domainPadding={{ left: 30, right: 30 }}
                    xAxis={{ lineWidth: 1, lineColor: theme.colors.outline, tickCount: 0 }}
                    yAxis={[{ lineWidth: 0, tickCount: 0 }]}
                    padding={8}
                  >
                    {({ points, chartBounds }) => (
                      <Bar
                        points={points.y}
                        chartBounds={chartBounds}
                        color={theme.colors.primary}
                        roundedCorners={{ topLeft: 6, topRight: 6 }}
                        innerPadding={0.4}
                      />
                    )}
                  </CartesianChart>
                </View>
              </Card.Content>
            </Card>
          </>
        )}

        <Divider style={styles.divider} />

        <TextInput
          label="Reflection / comment"
          mode="outlined"
          multiline
          value={reflection}
          onChangeText={setReflection}
          placeholder="What design features helped reduce movement?"
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
              params: { activity: 'Earthquake-Resistant Structure' },
            })
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
  card: { marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  summaryChart: {
    height: 180,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 10,
  },
});