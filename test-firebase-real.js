// test-firebase-real.js - Test with your actual Firebase config
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
// ⚠️ Replace these with your ACTUAL values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDdQ-WKhqmkQo5BJWs3QpMRwJfW9h4HK1Q",  // Your real API key
  authDomain: "football-coach-mobile.firebaseapp.com",       // Your real auth domain
  projectId: "football-coach-mobile",                         // Your real project ID
  storageBucket: "football-coach-mobile.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
console.log("🔍 Testing Firebase connection...");
console.log("📋 Config:", {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + "...",  // Hide full key
  projectId: firebaseConfig.projectId
});
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log("✅ Firebase app initialized!");
  // Try anonymous sign-in to test auth
  signInAnonymously(auth)
    .then((userCredential) => {
      console.log("✅ Auth test successful! User UID:", userCredential.user.uid);
      console.log("🎉 Your Firebase config is working!");
    })
    .catch((error) => {
      console.error("❌ Auth test failed:", error.code, error.message);
      if (error.code === 'auth/invalid-api-key') {
        console.error("💡 Your API key is invalid or restricted");
      } else if (error.code === 'auth/app-deleted') {
        console.error("💡 This Firebase project may be deleted");
      }
    });
} catch (error) {
  console.error("❌ Initialization failed:", error.message);
}
