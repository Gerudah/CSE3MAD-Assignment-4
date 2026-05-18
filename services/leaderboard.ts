import { getDb } from '@/db';
import { db as firestoreDb } from '@/firebaseConfig';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

type ActivityConfig = {
  bestScoreQuery: string;
  unit: string;
  higherIsBetter: boolean;
  scoreLabel: string;
};

const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  parachute_drop: {
    bestScoreQuery: `SELECT MAX(m.value) AS score
      FROM measurements m JOIN prototypes p ON p.id = m.prototype_id
      WHERE p.session_id = ? AND p.prototype_number > 1 AND m.metric_key = 'drop_time_s'`,
    unit: 's',
    higherIsBetter: true,
    scoreLabel: 'drop time',
  },
  hand_fan: {
    bestScoreQuery: `SELECT MAX(m.value) AS score
      FROM measurements m JOIN prototypes p ON p.id = m.prototype_id
      WHERE p.session_id = ? AND m.metric_key = 'estimated_force_n'`,
    unit: 'N',
    higherIsBetter: true,
    scoreLabel: 'estimated force',
  },
  reaction_board: {
    bestScoreQuery: `SELECT MIN(m.value) AS score
      FROM measurements m JOIN prototypes p ON p.id = m.prototype_id
      WHERE p.session_id = ? AND m.metric_key = 'reaction_time_ms'
      AND m.phase = 'Dominant Hand'`,
    unit: 'ms',
    higherIsBetter: false,
    scoreLabel: 'reaction time',
  },
  breathing_pace: {
    bestScoreQuery: `SELECT MIN(m.value) AS score
      FROM measurements m JOIN prototypes p ON p.id = m.prototype_id
      WHERE p.session_id = ? AND m.metric_key = 'breathing_rate_bpm'
      AND m.phase = 'Resting'`,
    unit: 'bpm',
    higherIsBetter: false,
    scoreLabel: 'resting BPM',
  },
};

export async function uploadBestScore(sessionId: string): Promise<void> {
  const sqliteDb = await getDb();

  const session = await sqliteDb.getFirstAsync<{ team_id: string; activity_id: string }>(
    'SELECT team_id, activity_id FROM sessions WHERE id = ?',
    [sessionId]
  );
  if (!session) return;

  const { team_id, activity_id } = session;
  const config = ACTIVITY_CONFIGS[activity_id];
  if (!config) return;

  const row = await sqliteDb.getFirstAsync<{ score: number | null }>(
    config.bestScoreQuery,
    [sessionId]
  );
  if (row?.score == null) return;

  const newScore = row.score;
  const docRef = doc(firestoreDb, 'leaderboard', `${activity_id}_${team_id}`);
  const existing = await getDoc(docRef);

  if (existing.exists()) {
    const existingScore = existing.data().score as number;
    const isImprovement = config.higherIsBetter
      ? newScore > existingScore
      : newScore < existingScore;
    if (!isImprovement) return;
  }

  await setDoc(docRef, {
    team_id,
    activity_id,
    session_id: sessionId,
    score: newScore,
    score_unit: config.unit,
    score_label: config.scoreLabel,
    higher_is_better: config.higherIsBetter,
    completed_at: serverTimestamp(),
  });
}
