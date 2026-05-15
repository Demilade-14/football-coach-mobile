// At the TOP of app.config.js, before any other code:
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}
const appJson = require('./app.json');

// Optional: Validate required env vars at config time
const requiredFirebaseVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredFirebaseVars.filter(
  (key) => !process.env[key]
);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'production') {
  console.warn(
    `⚠️  Missing Firebase env vars: ${missingVars.join(', ')}. 
    Check your .env file or GitHub Secrets.`
  );
}

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: 'b6b2547d-284d-4bc3-9237-fa1eeee0d4e5',
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || '',
    },
    android: {
      ...appJson.expo.android,
      package: 'com.zeedain14.footballcoachmobile',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundColor: '#0d1b2a',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: 'com.zeedain14.footballcoachmobile',
    },
  },
};
