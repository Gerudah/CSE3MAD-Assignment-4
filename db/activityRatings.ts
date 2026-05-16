import { getDb } from './database';
import { randomUUID } from './uuid';
import type { ActivityRating } from './types';

export async function add(
  sessionId: string,
  studentId: string,
  stars: number,
  comment?: string
): Promise<string> {
  const db = await getDb();
  const id = randomUUID();
  await db.runAsync(
    'INSERT INTO activity_ratings (id, session_id, student_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, sessionId, studentId, stars, comment ?? null, Date.now()]
  );
  return id;
}

export async function getBySession(sessionId: string): Promise<ActivityRating[]> {
  const db = await getDb();
  return db.getAllAsync<ActivityRating>(
    'SELECT * FROM activity_ratings WHERE session_id = ?',
    [sessionId]
  );
}
