import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9WRb0nTHzzee9HaTguYCeW5yCymJEAuA",
  authDomain: "labrats-21f74.firebaseapp.com",
  projectId: "labrats-21f74",
  storageBucket: "labrats-21f74.firebasestorage.app",
  messagingSenderId: "920278325110",
  appId: "1:920278325110:web:ef3927bb853721e2640c57",
  measurementId: "G-10ZKT970Y4"
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;