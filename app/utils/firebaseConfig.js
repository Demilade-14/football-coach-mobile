import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  if (__DEV__) {
    console.log("?? Firebase config check:", {
      apiKey: firebaseConfig.apiKey ? "? SET" : "? MISSING",
      projectId: firebaseConfig.projectId || "? MISSING",
      appId: firebaseConfig.appId || "? MISSING",
    });
  }
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(", ")}. 
Check your .env file and GitHub Secrets. 
Required: EXPO_PUBLIC_FIREBASE_API_KEY, PROJECT_ID, APP_ID`);
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
  isFirebaseInitialized = true;
  if (__DEV__) {
    console.log("? Firebase initialized successfully:", {
      projectId: firebaseConfig.projectId,
      auth: !!auth,
      db: !!db,
    });
  }
} catch (error) {
  firebaseInitError = error;
  isFirebaseInitialized = false;
  console.error("? Firebase initialization error:", {
    message: error.message,
    name: error.name,
    stack: __DEV__ ? error.stack : undefined,
  });
}
export { auth, db, isFirebaseInitialized, firebaseInitError };
