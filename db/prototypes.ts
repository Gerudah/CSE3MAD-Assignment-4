import { getDb } from './database';
import type { Prototype } from './types';

export async function create(
  sessionId: string,
  prototypeNumber: number,
  designDescription?: string
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO prototypes (id, session_id, prototype_number, design_description, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, sessionId, prototypeNumber, designDescription ?? null, Date.now()]
  );
  return id;
}

export async function getById(id: string): Promise<Prototype | null> {
  const db = await getDb();
  return db.getFirstAsync<Prototype>('SELECT * FROM prototypes WHERE id = ?', [id]);
}

export async function getBySession(sessionId: string): Promise<Prototype[]> {
  const db = await getDb();
  return db.getAllAsync<Prototype>(
    'SELECT * FROM prototypes WHERE session_id = ? ORDER BY prototype_number ASC',
    [sessionId]
  );
}

export async function updateDescription(
  id: string,
  designDescription: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE prototypes SET design_description = ? WHERE id = ?',
    [designDescription, id]
  );
}
