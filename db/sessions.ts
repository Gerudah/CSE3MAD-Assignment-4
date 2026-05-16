import { getDb } from './database';
import type { Session } from './types';

export async function create(
  teamId: string,
  activityId: string,
  gpsLatitude?: number,
  gpsLongitude?: number
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO sessions (id, team_id, activity_id, started_at, gps_latitude, gps_longitude) VALUES (?, ?, ?, ?, ?, ?)',
    [id, teamId, activityId, Date.now(), gpsLatitude ?? null, gpsLongitude ?? null]
  );
  return id;
}

export async function getById(id: string): Promise<Session | null> {
  const db = await getDb();
  return db.getFirstAsync<Session>('SELECT * FROM sessions WHERE id = ?', [id]);
}

export async function getByTeamAndActivity(
  teamId: string,
  activityId: string
): Promise<Session[]> {
  const db = await getDb();
  return db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE team_id = ? AND activity_id = ? ORDER BY started_at DESC',
    [teamId, activityId]
  );
}

export async function complete(
  id: string,
  groupReflection: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sessions SET completed_at = ?, group_reflection = ? WHERE id = ?',
    [Date.now(), groupReflection, id]
  );
}

export async function updateLocation(
  id: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sessions SET gps_latitude = ?, gps_longitude = ? WHERE id = ?',
    [latitude, longitude, id]
  );
}
