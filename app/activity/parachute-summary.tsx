import { useAppTheme } from '@/constants/ContextTheme';
import { measurementService, prototypeService } from '@/db';
import type { Prototype } from '@/db';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, DataTable, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type ProtoResult = {
  prototype: Prototype;
  dropTime: number | null;
  contactTime: number | null;
};

type Physics = {
  velocity: number;
  acceleration: number;
  weight: number;
  netForce: number;
  dragForce: number;
  gForce: number;
};

function calcPhysics(
  height: number,
  mass: number,
  dropTime: number,
  contactTime: number
): Physics {
  const velocity = height / dropTime;
  const acceleration = velocity / dropTime;
  const weight = mass * 9.8;
  const netForce = mass * acceleration;
  const dragForce = Math.max(0, weight - netForce);
  const gForce = (velocity / contactTime) / 9.8;
  return { velocity, acceleration, weight, netForce, dragForce, gForce };
}

function getLabel(protoNum: number): string {
  if (protoNum === 1) return 'Baseline (No Parachute)';
  return `Design ${protoNum - 1}`;
}

export default function ParachuteSummaryScreen() {
  const { sessionId, height: heightStr, mass: massStr } =
    useLocalSearchParams<{ sessionId: string; height: string; mass: string }>();
  const height = parseFloat(heightStr ?? '0');
  const mass = parseFloat(massStr ?? '0');
  const { theme } = useAppTheme();

  const [results, setResults] = useState<ProtoResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const protos = await prototypeService.getBySession(sessionId);
      const protoResults: ProtoResult[] = await Promise.all(
        protos.map(async (p) => {
          const dropMeas = await measurementService.getByPrototypeAndKey(p.id, 'drop_time_s');
          const contactMeas = await measurementService.getByPrototypeAndKey(
            p.id,
            'contact_time_s'
          );
          return {
            prototype: p,
            dropTime: dropMeas.length > 0 ? dropMeas[dropMeas.length - 1].value : null,
            contactTime: contactMeas.length > 0 ? contactMeas[contactMeas.length - 1].value : null,
          };
        })
      );
      setResults(protoResults);
      setLoading(false);
    }
    if (sessionId) load();
  }, [sessionId]);

  // Best parachute = slowest drop time among non-baseline prototypes
  const parachuteResults = results.filter(
    (r) => r.prototype.prototype_number > 1 && r.dropTime !== null
  );
  const bestResult =
    parachuteResults.length > 0
      ? parachuteResults.reduce((best, r) =>
          (r.dropTime ?? 0) > (best.dropTime ?? 0) ? r : best
        )
      : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Results</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Parachute Drop Challenge
        </Text>
        <Text variant="bodySmall" style={[styles.params, { color: theme.colors.onSurfaceVariant }]}>
          Drop height: {height} m  •  Toy mass: {mass} kg
        </Text>

        {loading ? (
          <Text style={styles.loading}>Loading results…</Text>
        ) : results.length === 0 ? (
          <Text style={styles.loading}>No results recorded yet.</Text>
        ) : (
          <>
            {results.map((r) => {
              const protoNum = r.prototype.prototype_number;
              const isBest = bestResult?.prototype.id === r.prototype.id;
              const physics =
                r.dropTime !== null &&
                r.contactTime !== null &&
                height > 0 &&
                mass > 0
                  ? calcPhysics(height, mass, r.dropTime, r.contactTime)
                  : null;

              return (
                <Card
                  key={r.prototype.id}
                  mode="outlined"
                  style={[
                    styles.card,
                    isBest && { borderWidth: 2, borderColor: theme.colors.primary },
                  ]}
                >
                  <Card.Content>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <Text variant="titleMedium">{getLabel(protoNum)}</Text>
                      <View style={styles.chips}>
                        {protoNum === 1 && <Chip compact>Baseline</Chip>}
                        {isBest && (
                          <Chip icon="trophy" compact style={{ backgroundColor: theme.colors.primaryContainer }}>
                            Best
                          </Chip>
                        )}
                      </View>
                    </View>

                    <Text
                      variant="bodySmall"
                      numberOfLines={2}
                      style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {r.prototype.design_description ?? 'No description'}
                    </Text>

                    {/* Time measurements */}
                    <View style={styles.times}>
                      <View style={styles.timeItem}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Drop Time
                        </Text>
                        <Text
                          variant="titleLarge"
                          style={{ color: theme.colors.primary }}
                        >
                          {r.dropTime != null ? r.dropTime.toFixed(3) + 's' : '—'}
                        </Text>
                      </View>
                      <View style={styles.timeItem}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Contact Time
                        </Text>
                        <Text
                          variant="titleLarge"
                          style={{ color: theme.colors.secondary }}
                        >
                          {r.contactTime != null ? r.contactTime.toFixed(3) + 's' : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Physics calculations */}
                    {physics && (
                      <>
                        <Divider style={styles.innerDivider} />
                        <Text
                          variant="labelSmall"
                          style={[styles.physicsTitle, { color: theme.colors.onSurfaceVariant }]}
                        >
                          PHYSICS CALCULATIONS
                        </Text>
                        <DataTable>
                          <DataTable.Row>
                            <DataTable.Cell>Final speed</DataTable.Cell>
                            <DataTable.Cell numeric>
                              {physics.velocity.toFixed(2)} m/s
                            </DataTable.Cell>
                          </DataTable.Row>
                          <DataTable.Row>
                            <DataTable.Cell>Acceleration</DataTable.Cell>
                            <DataTable.Cell numeric>
                              {physics.acceleration.toFixed(2)} m/s²
                            </DataTable.Cell>
                          </DataTable.Row>
                          <DataTable.Row>
                            <DataTable.Cell>Weight</DataTable.Cell>
                            <DataTable.Cell numeric>
                              {physics.weight.toFixed(3)} N
                            </DataTable.Cell>
                          </DataTable.Row>
                          <DataTable.Row>
                            <DataTable.Cell>Net force</DataTable.Cell>
                            <DataTable.Cell numeric>
                              {physics.netForce.toFixed(3)} N
                            </DataTable.Cell>
                          </DataTable.Row>
                          {protoNum > 1 && (
                            <DataTable.Row>
                              <DataTable.Cell>Drag force</DataTable.Cell>
                              <DataTable.Cell numeric>
                                {physics.dragForce.toFixed(3)} N
                              </DataTable.Cell>
                            </DataTable.Row>
                          )}
                          <DataTable.Row>
                            <DataTable.Cell>G-force (landing)</DataTable.Cell>
                            <DataTable.Cell numeric>
                              {physics.gForce.toFixed(1)} g
                            </DataTable.Cell>
                          </DataTable.Row>
                        </DataTable>
                      </>
                    )}
                  </Card.Content>
                </Card>
              );
            })}

            {/* Best design callout */}
            {bestResult && (
              <Card mode="contained" style={styles.winnerCard}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.winnerTitle}>
                    Best Parachute Design
                  </Text>
                  <Text variant="bodyMedium">
                    {getLabel(bestResult.prototype.prototype_number)}:{' '}
                    {bestResult.prototype.design_description}
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={[styles.winnerTime, { color: theme.colors.primary }]}
                  >
                    {bestResult.dropTime?.toFixed(3)}s drop time — slowest fall = most drag!
                  </Text>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        <Divider style={styles.divider} />

        <Button
          mode="contained"
          onPress={() =>
            router.push({
              pathname: '/rating',
              params: { activity: 'Parachute Drop Challenge' },
            })
          }
          style={styles.rateBtn}
          contentStyle={styles.rateBtnContent}
          icon="star"
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
  subtitle: { textAlign: 'center', marginBottom: 4 },
  params: { textAlign: 'center', marginBottom: 24 },
  loading: { textAlign: 'center', marginTop: 32 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 4 },
  desc: { marginBottom: 12 },
  times: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  timeItem: { flex: 1, alignItems: 'center' },
  innerDivider: { marginVertical: 8 },
  physicsTitle: { marginBottom: 4 },
  winnerCard: { marginBottom: 16 },
  winnerTitle: { marginBottom: 8 },
  winnerTime: { marginTop: 8 },
  divider: { marginVertical: 16 },
  rateBtn: { marginBottom: 12 },
  rateBtnContent: { paddingVertical: 8 },
});
