import { getApps, initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

// initializeAuth with inMemoryPersistence avoids the AsyncStorage crash on React Native.
// Try/catch handles hot reloads where auth is already initialized.
function getAuthInstance() {
  try {
    return initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    return getAuth(app);
  }
}
export const auth = getAuthInstance();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;