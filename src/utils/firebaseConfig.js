import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDdQ-WKhqmkQo5BJWs3QpMRwJfW9h4HK1Q",
  authDomain: "football-coach-mobile.firebaseapp.com",
  projectId: "football-coach-mobile",
  storageBucket: "football-coach-mobile.firebasestorage.app",
  messagingSenderId: "797090821026",
  appId: "1:797090821026:android:3d0520c60654124b8cf8fb",
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
