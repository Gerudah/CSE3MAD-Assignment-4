import { getDb } from '@/db';
import { db as firestoreDb } from '@/firebaseConfig';
import * as BackgroundTask from 'expo-background-task';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

const BACKGROUND_SYNC_TASK = 'stemm-background-sync-task';

async function syncSQLiteResultsToFirestore() {
  const batteryLevel = await Battery.getBatteryLevelAsync();

  // Defer sync if battery is below 20%
  if (batteryLevel !== -1 && batteryLevel < 0.2) {
    console.log('Background sync deferred: battery too low.');
    return false;
  }

  const sqliteDb = await getDb();

  const rows = await sqliteDb.getAllAsync<any>(`
    SELECT 
      measurements.id AS measurement_id,
      measurements.prototype_id,
      measurements.metric_key,
      measurements.value,
      measurements.unit,
      measurements.phase,
      measurements.recorded_at,
      prototypes.session_id,
      prototypes.prototype_number,
      prototypes.design_description,
      sessions.team_id,
      sessions.activity_id,
      sessions.gps_latitude,
      sessions.gps_longitude
    FROM measurements
    JOIN prototypes ON measurements.prototype_id = prototypes.id
    JOIN sessions ON prototypes.session_id = sessions.id
    ORDER BY measurements.recorded_at DESC
    LIMIT 50
  `);

  for (const row of rows) {
    await setDoc(
      doc(collection(firestoreDb, 'backgroundSyncResults'), row.measurement_id),
      {
        measurementId: row.measurement_id,
        prototypeId: row.prototype_id,
        sessionId: row.session_id,
        teamId: row.team_id,
        activityId: row.activity_id,
        prototypeNumber: row.prototype_number,
        designDescription: row.design_description,
        metricKey: row.metric_key,
        value: row.value,
        unit: row.unit,
        phase: row.phase,
        recordedAt: row.recorded_at,
        gpsLatitude: row.gps_latitude,
        gpsLongitude: row.gps_longitude,
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.log(`Background sync completed. Synced ${rows.length} records.`);
  return true;
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const synced = await syncSQLiteResultsToFirestore();

    if (!synced) {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.log('Background sync failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSyncTask() {
  const status = await BackgroundTask.getStatusAsync();

  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    console.log('Background task unavailable.');
    return;
  }

  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

  if (!registered) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15,
    });

    console.log('Background sync task registered.');
  }
}

export async function runBackgroundSyncNowForTesting() {
  await syncSQLiteResultsToFirestore();
}