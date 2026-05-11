import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Firebase config from app.config.js extra.firebase
const extra = Constants.expoConfig?.extra || {};
const firebaseData = extra.firebase || {};

const firebaseConfig = {
  apiKey: firebaseData.apiKey,
  authDomain: firebaseData.authDomain,
  projectId: firebaseData.projectId,
  storageBucket: firebaseData.storageBucket,
  messagingSenderId: firebaseData.messagingSenderId,
  appId: firebaseData.appId,
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
    console.log('ℹ️ Firebase App already exists');
    app = getApp();
  }
  
  // Initialize Auth with React Native persistence
  console.log('🔐 Initializing Firebase Auth...');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized');
  
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