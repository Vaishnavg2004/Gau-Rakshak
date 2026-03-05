import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const env = import.meta.env;

// Firebase configuration (can be overridden via Vite env vars)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDbi8r5PT1V91oiGvTjjniZkoalYbGGTAA",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "cowfit-demo-d2364.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://cowfit-demo-d2364-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "cowfit-demo-d2364",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "cowfit-demo-d2364.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "724557214275",
  appId: env.VITE_FIREBASE_APP_ID || "1:724557214275:web:769100f5a4087de0d6daf6",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-G8X98B0FCE",
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
