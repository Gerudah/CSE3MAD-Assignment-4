import AdBanner from '@/components/AdBanner.web';
import { useAppTheme } from '@/constants/ContextTheme';
import { getDb } from '@/db';
import { db as firestoreDb } from '@/firebaseConfig';
import { useFocusEffect } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Chip,
  Divider,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type FirestoreEntry = {
  team_id: string;
  activity_id: string;
  score: number;
  score_unit: string;
  score_label: string;
  higher_is_better: boolean;
  completed_at: any;
};

type LeaderboardEntry = FirestoreEntry & { rank: number };

const MEDAL_COLORS = ['#FFD700', '#A8A9AD', '#CD7F32'];

const ACTIVITY_FILTERS = [
  { value: 'parachute_drop',             label: 'Parachute' },
  { value: 'sound_pollution',            label: 'Noise Hunt' },
  { value: 'hand_fan',                   label: 'Hand Fan' },
  { value: 'earthquake_structure',       label: 'Earthquake' },
  { value: 'stretch_speed_gracefulness', label: 'Stretch Lab' },
  { value: 'reaction_board',             label: 'Reaction' },
  { value: 'breathing_pace',             label: 'Breathing' },
];

const ACTIVITY_LABELS: Record<string, string> = {
  parachute_drop:             'Parachute Drop',
  sound_pollution:            'Sound Pollution Hunter',
  hand_fan:                   'Hand Fan Challenge',
  earthquake_structure:       'Earthquake Structure',
  stretch_speed_gracefulness: 'Human Performance Lab',
  reaction_board:             'Reaction Board',
  breathing_pace:             'Breathing Pace',
};

function rankEntries(rows: FirestoreEntry[]): LeaderboardEntry[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) =>
    a.higher_is_better ? b.score - a.score : a.score - b.score
  );
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}

function formatScore(score: number, unit: string): string {
  if (unit === 'ms')  return `${Math.round(score)} ms`;
  if (unit === 's')   return `${score.toFixed(2)} s`;
  if (unit === 'pts') return `${Math.round(score)} pts`;
  if (unit === 'mm')  return `${score.toFixed(2)} mm`;
  if (unit === 'dB')  return `${Math.round(score)} dB`;
  if (unit === 'N')   return `${score.toFixed(2)} N`;
  if (unit === 'bpm') return `${Math.round(score)} bpm`;
  return `${score.toFixed(2)} ${unit}`;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString();
}

function rankLabel(rank: number): string {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `#${rank}`;
}

export default function LeaderboardScreen() {
  const { theme } = useAppTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('parachute_drop');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setLoading(true);
        try {
          const sqliteDb = await getDb();
          const teamRow = await sqliteDb.getFirstAsync<{ team_id: string }>(
            'SELECT team_id FROM sessions ORDER BY started_at DESC LIMIT 1'
          );
          if (active) setMyTeamId(teamRow?.team_id ?? null);

          const ref = collection(firestoreDb, 'leaderboard');
          const q = query(ref, where('activity_id', '==', activityFilter));
          const snapshot = await getDocs(q);
          const rows = snapshot.docs.map(d => d.data() as FirestoreEntry);

          if (active) setEntries(rankEntries(rows));
        } finally {
          if (active) setLoading(false);
        }
      }

      load();
      return () => { active = false; };
    }, [activityFilter])
  );

  const myEntry = myTeamId ? entries.find(e => e.team_id === myTeamId) ?? null : null;
  const activityLabel = ACTIVITY_LABELS[activityFilter] ?? activityFilter;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Leaderboard</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {activityLabel} — best score per team
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {ACTIVITY_FILTERS.map(f => (
            <Chip
              key={f.value}
              selected={activityFilter === f.value}
              onPress={() => setActivityFilter(f.value)}
              style={styles.filterChip}
              showSelectedCheck={false}
            >
              {f.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            No results yet for {activityLabel}.{'\n'}Complete this activity to appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => `${item.activity_id}_${item.team_id}`}
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
                  isMyTeam && { backgroundColor: theme.colors.primaryContainer },
                ]}
                elevation={0}
              >
                <View
                  style={[
                    styles.rankBadge,
                    isMedal && { backgroundColor: medalColor + '33', borderColor: medalColor, borderWidth: 1.5 },
                    !isMedal && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    variant="labelLarge"
                    style={[styles.rankText, { color: isMedal ? medalColor : theme.colors.onSurfaceVariant }]}
                  >
                    {rankLabel(item.rank)}
                  </Text>
                </View>

                <View style={styles.info}>
                  <View style={styles.teamRow}>
                    <Text variant="titleMedium" numberOfLines={1}>{item.team_id}</Text>
                    {isMyTeam && (
                      <Text variant="labelSmall" style={[styles.youBadge, { color: theme.colors.primary }]}>
                        YOU
                      </Text>
                    )}
                  </View>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.score_label} · {formatDate(item.completed_at)}
                  </Text>
                </View>

                <View style={styles.score}>
                  <Text
                    variant="titleLarge"
                    style={{ color: isMedal ? medalColor : theme.colors.primary }}
                  >
                    {formatScore(item.score, item.score_unit)}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.score_label}
                  </Text>
                </View>
              </Surface>
            );
          }}
        />
      )}

      {!loading && myTeamId !== null && (
        <Surface
          style={[styles.stickyCard, { backgroundColor: theme.colors.primaryContainer }]}
          elevation={4}
        >
          <View style={styles.stickyLeft}>
            <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Your Team
            </Text>
            <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.onPrimaryContainer }}>
              {myTeamId}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
              {activityLabel}
            </Text>
          </View>

          {myEntry ? (
            <>
              <View style={styles.stickyRankBadge}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {rankLabel(myEntry.rank)}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  of {entries.length}
                </Text>
              </View>
              <View style={styles.stickyScore}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {formatScore(myEntry.score, myEntry.score_unit)}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                  {myEntry.score_label}
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
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 0, alignItems: 'center' },
  title: { marginBottom: 4 },
  filterScroll: { marginTop: 12, marginBottom: 8, alignSelf: 'stretch' },
  filterContent: { paddingHorizontal: 4, gap: 8, flexDirection: 'row' },
  filterChip: { marginHorizontal: 2 },
  loader: { marginTop: 48 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  rankBadge: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rankText: { textAlign: 'center' },
  info: { flex: 1, marginRight: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youBadge: { fontWeight: 'bold', letterSpacing: 0.5 },
  score: { alignItems: 'flex-end' },
  stickyCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  stickyLeft: { flex: 1 },
  stickyRankBadge: { alignItems: 'center', minWidth: 48 },
  stickyScore: { alignItems: 'flex-end', minWidth: 72 },
});