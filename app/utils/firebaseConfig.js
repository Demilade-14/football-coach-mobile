import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Initialize these as null - they'll be set during initialization
let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;

/**
 * Get Firebase configuration from Expo config
 * @returns {Object} Firebase config object
 * @throws {Error} If required config values are missing
 */
function getFirebaseConfig() {
  const extra = Constants.expoConfig?.extra || {};
  const config = {
    apiKey: extra.firebase?.apiKey,
    authDomain: extra.firebase?.authDomain,
    projectId: extra.firebase?.projectId,
    storageBucket: extra.firebase?.storageBucket,
    messagingSenderId: extra.firebase?.messagingSenderId,
    appId: extra.firebase?.appId,
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
  
  // Initialize Auth with React Native persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  
  // Initialize Firestore
  db = getFirestore(app);
  
  isFirebaseInitialized = true;
  console.log('✅ Firebase initialized successfully');
  console.log('🔥 Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  firebaseInitError = error;
  console.error('❌ Firebase initialization error:', error.message);
  console.error('📋 Check your .env file and app.config.js');
}

// Export all necessary items
export { auth, db, isFirebaseInitialized, firebaseInitError };