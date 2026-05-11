import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Firebase config from Expo config or manifest extra values
const expoExtra = Constants.expoConfig?.extra;
const manifestExtra = Constants.manifest?.extra || Constants.manifest2?.extra;
const extra = expoExtra || manifestExtra || {};
const firebaseData = extra.firebase || {};
const normalize = (value) => (typeof value === 'string' ? value.trim() : value);
const firebaseConfig = {
  apiKey: normalize(firebaseData.apiKey) || normalize(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalize(firebaseData.authDomain) || normalize(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalize(firebaseData.projectId) || normalize(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalize(firebaseData.storageBucket) || normalize(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: normalize(firebaseData.messagingSenderId) || normalize(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: normalize(firebaseData.appId) || normalize(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

// Debug log (remove in production)
console.log('🔥 Firebase Config loaded from:', Constants.expoConfig ? 'Expo Config' : 'Fallback');
console.log('📱 Expo Extra keys:', Object.keys(extra));
console.log('🔍 Firebase Config loaded:', {
  apiKey: firebaseConfig.apiKey ? '✅ Present' : '❌ Missing',
  authDomain: firebaseConfig.authDomain ? '✅ Present' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Present' : '❌ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Present' : '❌ Missing',
});

// Initialize Firebase
let app;
let auth;
let db;
let firebaseInitError = null;

try {
  // Validate config
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config keys: ${missingKeys.join(', ')}`);
  }

  if (!getApps().length) {
    console.log('🚀 Initializing Firebase App...');
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase App initialized');
  } else {
    app = getApp();
    console.log('ℹ️ Firebase App already exists');
  }

  // Initialize Auth with React Native persistence
  console.log('🔐 Initializing Firebase Auth...');
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('✅ Firebase Auth initialized');
  } catch (authError) {
    console.warn('⚠️ initializeAuth failed; trying getAuth fallback:', authError?.message);
    try {
      auth = getAuth(app);
      console.log('✅ Firebase Auth obtained via getAuth fallback');
    } catch (fallbackError) {
      console.error('❌ Firebase Auth fallback failed:', fallbackError?.message);
      throw authError;
    }
  }

  if (!auth) {
    throw new Error('Firebase Auth instance could not be created');
  }

  // Initialize Firestore
  console.log('📚 Initializing Firestore...');
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
  
  console.log('🎉 Firebase initialization complete!');
  
} catch (error) {
  firebaseInitError = error;
  console.error('❌ Firebase initialization error:', error.message);
  console.error('🔍 Full error details:', error);
}

const isFirebaseInitialized = !!app && !!auth && !!db;

console.log('📊 Firebase Initialization Status:', {
  initialized: isFirebaseInitialized,
  hasApp: !!app,
  hasAuth: !!auth,
  hasDb: !!db,
  hasError: !!firebaseInitError,
  error: firebaseInitError?.message,
});

export { app, auth, db, isFirebaseInitialized, firebaseInitError };