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
  // Only initialize app if not already initialized
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  if (Platform.OS === "web") {
    // Web - just use getAuth (always safe to call multiple times)
    auth = getAuth(app);
  } else {
    // Android/iOS - must use initializeAuth with AsyncStorage
    // But getAuth() after initializeAuth() also works - use try/catch
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (authError) {
      // initializeAuth throws if already called - fall back to getAuth
      if (authError.code === "auth/already-initialized" || authError.message?.includes("already")) {
        auth = getAuth(app);
      } else {
        throw authError;
      }
    }
  }
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log("✅ Firebase initialized successfully");
} catch (error) {
  firebaseInitError = error;
  console.error("❌ Firebase initialization error:", error.message);
}
export { auth, db, isFirebaseInitialized, firebaseInitError };
