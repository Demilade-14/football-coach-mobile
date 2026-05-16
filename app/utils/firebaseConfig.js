import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
let auth = null;
let db = null;
let isFirebaseInitialized = false;
let firebaseInitError = null;
try {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(", ")}`);
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  db = getFirestore(app);
  isFirebaseInitialized = true;
  console.log("Firebase initialized:", firebaseConfig.projectId);
} catch (error) {
  firebaseInitError = error;
  console.error("Firebase initialization error:", error);
}
export { auth, db, isFirebaseInitialized, firebaseInitError };
