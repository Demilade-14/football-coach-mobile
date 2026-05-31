// src/utils/firebaseConfig.js
// FIX: Hardcoded config as fallback so Firebase NEVER fails to initialize in APK.
// Firebase client-side keys are public by design — safe to embed in app code.
// Uses AsyncStorage persistence so login survives app restarts.

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────
// Config — env vars first, hardcoded fallback second.
// This guarantees Firebase initializes in every environment:
// local dev, Expo Go, and production APK builds.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyDdQ-WKhqmkQo5BJWs3QpMRwJfW9h4HK1Q',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'football-coach-mobile.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         || 'football-coach-mobile',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'football-coach-mobile.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '797090821026',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             || '1:797090821026:android:3d0520c60654124b8cf8fb',
};

// ─────────────────────────────────────────────────────────────
// Initialize app — guard against duplicate initialization
// (React Native fast refresh can call this file multiple times)
// ─────────────────────────────────────────────────────────────
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ─────────────────────────────────────────────────────────────
// Initialize Auth with AsyncStorage persistence.
// getReactNativePersistence keeps the user logged in across restarts.
// Falls back to getAuth() if initializeAuth was already called.
// ─────────────────────────────────────────────────────────────
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // initializeAuth already called (e.g. hot reload) — just get the instance
  auth = getAuth(app);
}

export { auth };
export default app;
