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
const initFirebase = () => {
  try {
    console.log("🔥 Starting Firebase init...");
    console.log("Platform:", Platform.OS);
    const app = getApps().length === 0 
      ? initializeApp(FIREBASE_CONFIG) 
      : getApp();
    console.log("✅ Firebase app ready");
    if (Platform.OS === "web") {
      auth = getAuth(app);
      console.log("✅ Web auth ready");
    } else {
      try {
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        console.log("✅ AsyncStorage loaded");
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
        console.log("✅ Native auth ready");
      } catch (authError) {
        console.log("⚠️ initializeAuth error:", authError.code, authError.message);
        auth = getAuth(app);
        console.log("✅ Fallback auth ready");
      }
    }
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("✅ Firebase fully initialized. Auth:", auth ? "OK" : "NULL");
  } catch (error) {
    firebaseInitError = error;
    console.error("❌ Firebase init failed:", error.code, error.message);
  }
};
initFirebase();
export { auth, db, isFirebaseInitialized, firebaseInitError };
