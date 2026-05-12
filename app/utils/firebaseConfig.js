import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get values from Expo extra
const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebase?.apiKey,
  authDomain: extra.firebase?.authDomain,
  projectId: extra.firebase?.projectId,
  storageBucket: extra.firebase?.storageBucket,
  messagingSenderId: extra.firebase?.messagingSenderId,
  appId: extra.firebase?.appId,
};

// Validate config
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(
    `❌ Missing Firebase config keys: ${missingKeys.join(', ')}`
  );
}

// Initialize Firebase app
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Auth safely
let auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  console.log('✅ Firebase Auth initialized');
} catch (error) {
  auth = getAuth(app);

  console.log('ℹ️ Firebase Auth already initialized');
}

// Initialize Firestore
const db = getFirestore(app);

console.log('🔥 Firebase fully initialized');

export { app, auth, db };