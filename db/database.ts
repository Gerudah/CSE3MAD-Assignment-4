import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync('labrats.db');

  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await _db.execAsync('PRAGMA journal_mode = WAL;');

  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      team_id TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      gps_latitude REAL,
      gps_longitude REAL,
      group_reflection TEXT
    );

    CREATE TABLE IF NOT EXISTS prototypes (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      prototype_number INTEGER NOT NULL,
      design_description TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY NOT NULL,
      prototype_id TEXT NOT NULL,
      metric_key TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      phase TEXT,
      recorded_at INTEGER NOT NULL,
      FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY NOT NULL,
      prototype_id TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      value_x REAL,
      value_y REAL,
      value_z REAL,
      sampled_at INTEGER NOT NULL,
      FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_ratings (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      stars INTEGER NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS media_uploads (
      id TEXT PRIMARY KEY NOT NULL,
      prototype_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      storage_url TEXT,
      capture_mode TEXT,
      duration_seconds INTEGER,
      uploaded_at INTEGER NOT NULL,
      FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE
    );
  `);

  return _db;
}
