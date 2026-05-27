// src/utils/firebaseConfig.js
// ✅ Using web API key for Expo (works on all platforms)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDdQ-WKhqmkQo5BJWs3QpMRwJfW9h4HK1Q",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "football-coach-mobile.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "football-coach-mobile",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "football-coach-mobile.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "797090821026",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:797090821026:web:abcdef123456",
};

let auth = null;
let db = null;

try {
  const app = getApps().length === 0
    ? initializeApp(FIREBASE_CONFIG)
    : getApp();

  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
}

export { auth, db };