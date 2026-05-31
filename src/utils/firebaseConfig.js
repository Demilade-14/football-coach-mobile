import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCI7tK2KL-xUAr-vasApm-Yq5I7V26cQgs",
  authDomain: "football-coach-mobile.firebaseapp.com",
  projectId: "football-coach-mobile",
  storageBucket: "football-coach-mobile.firebasestorage.app",
  messagingSenderId: "797090821026",
  appId: "1:797090821026:android:aa1e06aa1c7b02c28cf8fb",
};
let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;
try {
  const app = getApps().length === 0
    ? initializeApp(FIREBASE_CONFIG)
    : getApp();
  // Use getAuth for ALL platforms - simplest and most reliable
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log("✅ Firebase initialized. Auth:", auth ? "OK" : "NULL");
} catch (error) {
  firebaseInitError = error;
  console.error("❌ Firebase init failed:", error.message);
}
export { auth, db, isFirebaseInitialized, firebaseInitError };

