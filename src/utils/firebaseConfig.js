// src/utils/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) throw new Error("Missing Firebase config: " + missing.join(", "));
  return config;
}
try {
  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Android/iOS need initializeAuth with AsyncStorage persistence
  // Web uses getAuth directly
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (e) {
      // Already initialized
      auth = getAuth(app);
    }
  }
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log("? Firebase initialized successfully");
  console.log("?? Project ID:", firebaseConfig.projectId);
} catch (error) {
  firebaseInitError = error;
  console.error("? Firebase initialization error:", error.message);
}
export { auth, db, isFirebaseInitialized, firebaseInitError };
