import { getDb } from './database';
import { randomUUID } from './uuid';
import type { Measurement } from './types';

export async function add(
  prototypeId: string,
  metricKey: string,
  value: number,
  unit: string,
  phase?: string
): Promise<string> {
  const db = await getDb();
  const id = randomUUID();
  await db.runAsync(
    'INSERT INTO measurements (id, prototype_id, metric_key, value, unit, phase, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, prototypeId, metricKey, value, unit, phase ?? null, Date.now()]
  );
  return id;
}

export async function getByPrototype(prototypeId: string): Promise<Measurement[]> {
  const db = await getDb();
  return db.getAllAsync<Measurement>(
    'SELECT * FROM measurements WHERE prototype_id = ? ORDER BY recorded_at ASC',
    [prototypeId]
  );
}

export async function getByPrototypeAndKey(
  prototypeId: string,
  metricKey: string
): Promise<Measurement[]> {
  const db = await getDb();
  return db.getAllAsync<Measurement>(
    'SELECT * FROM measurements WHERE prototype_id = ? AND metric_key = ? ORDER BY recorded_at ASC',
    [prototypeId, metricKey]
  );
}
