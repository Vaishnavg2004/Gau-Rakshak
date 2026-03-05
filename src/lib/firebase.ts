import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const env = import.meta.env;

// Firebase configuration (can be overridden via Vite env vars)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCDId8q8A4KgeyUOvnEk2sxDJLM8GflQ_0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "gaurakshak-9a785.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://gaurakshak-9a785-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "gaurakshak-9a785",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "gaurakshak-9a785.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "690967336485",
  appId: env.VITE_FIREBASE_APP_ID || "1:690967336485:web:f09213c6d3dc906b6c11cc",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-XYE8N9ZMNS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { analytics };

export default app;

