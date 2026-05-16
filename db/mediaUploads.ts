import { getDb } from './database';
import type { MediaUpload } from './types';

export async function add(
  prototypeId: string,
  studentId: string,
  mediaType: string,
  localUri: string,
  captureMode?: string,
  durationSeconds?: number
): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO media_uploads (id, prototype_id, student_id, media_type, local_uri, capture_mode, duration_seconds, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, prototypeId, studentId, mediaType, localUri, captureMode ?? null, durationSeconds ?? null, Date.now()]
  );
  return id;
}

export async function getByPrototype(prototypeId: string): Promise<MediaUpload[]> {
  const db = await getDb();
  return db.getAllAsync<MediaUpload>(
    'SELECT * FROM media_uploads WHERE prototype_id = ?',
    [prototypeId]
  );
}

// Call after a successful Firebase Storage upload to record the remote URL
export async function setStorageUrl(id: string, storageUrl: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE media_uploads SET storage_url = ? WHERE id = ?', [storageUrl, id]);
}
