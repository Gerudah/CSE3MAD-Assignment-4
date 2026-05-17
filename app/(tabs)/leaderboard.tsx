import { useAppTheme } from '@/constants/ContextTheme';
import { getDb } from '@/db';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Divider, SegmentedButtons, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type LeaderboardEntry = {
  rank: number;
  session_id: string;
  team_id: string;
  activity_id: string;
  best_drop_time: number;
  completed_at: number | null;
};

const MEDAL_COLORS = ['#FFD700', '#A8A9AD', '#CD7F32'];

export default function LeaderboardScreen() {
  const { theme } = useAppTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        try {
          const db = await getDb();

          const [rows, teamRow] = await Promise.all([
            db.getAllAsync<Omit<LeaderboardEntry, 'rank'>>(
              `SELECT s.id AS session_id, s.team_id, s.activity_id, s.completed_at,
                      MAX(m.value) AS best_drop_time
               FROM sessions s
               JOIN prototypes p ON p.session_id = s.id
               JOIN measurements m ON m.prototype_id = p.id
               WHERE p.prototype_number > 1
                 AND m.metric_key = 'drop_time_s'
               GROUP BY s.id
               ORDER BY best_drop_time DESC`
            ),
            db.getFirstAsync<{ team_id: string }>(
              'SELECT team_id FROM sessions ORDER BY started_at DESC LIMIT 1'
            ),
          ]);

          if (active) {
            setEntries(rows.map((r, i) => ({ ...r, rank: i + 1 })));
            setMyTeamId(teamRow?.team_id ?? null);
          }
        } finally {
          if (active) setLoading(false);
        }
      }
      load();
      return () => { active = false; };
    }, [])
  );

  function formatDate(ts: number | null) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString();
  }

  function rankLabel(rank: number) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  }

  const myEntry = myTeamId ? entries.find(e => e.team_id === myTeamId) ?? null : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Leaderboard</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Ranked by longest drop time (most drag)
        </Text>
        <SegmentedButtons
          value={activityFilter}
          onValueChange={setActivityFilter}
          style={styles.filter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'parachute_drop', label: 'Parachute Drop' },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            No results yet.{'\n'}Complete a Parachute Drop session to appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.session_id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => {
            const isMedal = item.rank <= 3;
            const isMyTeam = item.team_id === myTeamId;
            const medalColor = isMedal ? MEDAL_COLORS[item.rank - 1] : undefined;

            return (
              <Surface
                style={[
                  styles.row,
                  isMyTeam && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                elevation={0}
              >
                <View
                  style={[
                    styles.rankBadge,
                    isMedal && {
                      backgroundColor: medalColor + '33',
                      borderColor: medalColor,
                      borderWidth: 1.5,
                    },
                    !isMedal && {
                      backgroundColor: theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.rankText,
                      { color: isMedal ? medalColor : theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {rankLabel(item.rank)}
                  </Text>
                </View>

                <View style={styles.info}>
                  <View style={styles.teamRow}>
                    <Text variant="titleMedium" numberOfLines={1}>
                      {item.team_id}
                    </Text>
                    {isMyTeam && (
                      <Text
                        variant="labelSmall"
                        style={[styles.youBadge, { color: theme.colors.primary }]}
                      >
                        YOU
                      </Text>
                    )}
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {item.activity_id} • {formatDate(item.completed_at)}
                  </Text>
                </View>

                <View style={styles.score}>
                  <Text
                    variant="titleLarge"
                    style={{
                      color: isMedal ? medalColor : theme.colors.primary,
                    }}
                  >
                    {item.best_drop_time.toFixed(3)}s
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    drop time
                  </Text>
                </View>
              </Surface>
            );
          }}
        />
      )}

      {/* Sticky "your rank" card — always visible at bottom */}
      {!loading && myTeamId !== null && (
        <Surface
          style={[
            styles.stickyCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          elevation={4}
        >
          <View style={styles.stickyLeft}>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              Your Team
            </Text>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              {myTeamId}
            </Text>
          </View>

          {myEntry ? (
            <>
              <View style={styles.stickyRankBadge}>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                >
                  {rankLabel(myEntry.rank)}
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  of {entries.length}
                </Text>
              </View>

              <View style={styles.stickyScore}>
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.primary }}
                >
                  {myEntry.best_drop_time.toFixed(3)}s
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  best drop
                </Text>
              </View>
            </>
          ) : (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onPrimaryContainer, flex: 1, textAlign: 'right' }}
            >
              No score yet
            </Text>
          )}
        </Surface>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 12, alignItems: 'center' },
  title: { marginBottom: 4 },
  loader: { marginTop: 48 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rankBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankText: { textAlign: 'center' },
  info: { flex: 1, marginRight: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youBadge: { fontWeight: 'bold', letterSpacing: 0.5 },
  score: { alignItems: 'flex-end' },
  stickyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  stickyLeft: { flex: 1 },
  stickyRankBadge: { alignItems: 'center', minWidth: 48 },
  stickyScore: { alignItems: 'flex-end', minWidth: 72 },
  filter: { marginTop: 12, alignSelf: 'stretch' },
});
