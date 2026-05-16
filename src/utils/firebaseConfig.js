// src/utils/firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;
/**
 * Get Firebase configuration from environment variables
 */
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  // Check for missing values
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }
  return config;
}
/**
 * Initialize Firebase safely
 */
try {
  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Initialize Auth
  auth = getAuth(app);
  // Initialize Firestore
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log('✅ Firebase initialized successfully');
  console.log('🔥 Project ID:', firebaseConfig.projectId);
} catch (error) {
  firebaseInitError = error;
  console.error('❌ Firebase initialization error:', error.message);
  console.error('📋 Check your .env file and GitHub Secrets');
  console.error('📋 Required env vars:');
  console.error('  - EXPO_PUBLIC_FIREBASE_API_KEY');
  console.error('  - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  console.error('  - EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  console.error('  - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  console.error('  - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  console.error('  - EXPO_PUBLIC_FIREBASE_APP_ID');
}
// Export all necessary items
export { auth, db, isFirebaseInitialized, firebaseInitError };
