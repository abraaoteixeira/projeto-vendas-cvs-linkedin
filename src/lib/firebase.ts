import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true';
const isTesting = process.env.NODE_ENV === 'test' || !!process.env.PLAYWRIGHT_TEST;

if (!isEmulator && !isTesting) {
  const missingVars: string[] = [];
  if (!firebaseConfig.apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missingVars.length > 0) {
    console.warn(`Warning: Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  }
}

// Initialize Firebase for SSR (Server-Side Rendering) compatibility
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

if (isEmulator) {
  const g = globalThis as any;
  if (!g._firebase_emulators_connected) {
    // Only connect real client emulators if we are in browser
    if (typeof window !== 'undefined') {
      try {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectStorageEmulator(storage, '127.0.0.1', 9199);
      } catch (err) {
        console.warn('Failed to connect client-side emulators:', err);
      }
    }
    g._firebase_emulators_connected = true;
  }
}

// Mock servers removed to prevent gRPC parsing errors and spam.

export async function runFirestore<T>(promise: Promise<T>, timeoutMs = 500): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Firestore operation timed out"));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { app, db, storage };
