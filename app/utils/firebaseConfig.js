import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;

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
  
  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);
    
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }
  
  return config;
}

try {
  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log('✅ Firebase initialized');
  
} catch (error) {
  firebaseInitError = error;
  console.error('❌ Firebase init error:', error.message);
}

export { auth, db, isFirebaseInitialized, firebaseInitError };