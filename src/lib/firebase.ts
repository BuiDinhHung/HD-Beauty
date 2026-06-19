import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

// Lazy getters — safe to call from client components; SSR won't call them
// because all pages that use Firebase are `'use client'` and guarded by useEffect
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getApp(): FirebaseApp {
  if (!_app) _app = getFirebaseApp();
  return _app;
}

export const auth: Auth = (() => {
  if (typeof window === 'undefined') {
    return {} as Auth;
  }
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
})();

export const db: Firestore = (() => {
  if (typeof window === 'undefined') {
    return {} as Firestore;
  }
  if (!_db) _db = getFirestore(getApp());
  return _db;
})();

export default getApp;
