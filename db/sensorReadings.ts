import { getDb } from './database';
import type { SensorReading } from './types';

type NewReading = Omit<SensorReading, 'id'>;

export async function add(reading: NewReading): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO sensor_readings (id, prototype_id, sensor_type, value_x, value_y, value_z, sampled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, reading.prototype_id, reading.sensor_type, reading.value_x ?? null, reading.value_y ?? null, reading.value_z ?? null, reading.sampled_at]
  );
  return id;
}

// Use for high-frequency sensor capture — wraps inserts in a single transaction
export async function bulkAdd(readings: NewReading[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const r of readings) {
      await db.runAsync(
        'INSERT INTO sensor_readings (id, prototype_id, sensor_type, value_x, value_y, value_z, sampled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), r.prototype_id, r.sensor_type, r.value_x ?? null, r.value_y ?? null, r.value_z ?? null, r.sampled_at]
      );
    }
  });
}

export async function getByPrototype(prototypeId: string): Promise<SensorReading[]> {
  const db = await getDb();
  return db.getAllAsync<SensorReading>(
    'SELECT * FROM sensor_readings WHERE prototype_id = ? ORDER BY sampled_at ASC',
    [prototypeId]
  );
}

// Call after processing is done to keep storage lean
export async function clearByPrototype(prototypeId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sensor_readings WHERE prototype_id = ?', [prototypeId]);
}
