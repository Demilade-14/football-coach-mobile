// REMOVE this line at the top:
// require('dotenv').config();  // ❌ Delete this

const appJson = require('./app.json');
// ... rest stays the same
const appJson = require('./app.json');

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

        // IMPORTANT:
        // Use the exact bucket from Firebase Console
        storageBucket:
          process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

        messagingSenderId:
          process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },

      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || '',
    },

    android: {
      ...appJson.expo.android,

      package: 'com.zeedain14.footballcoachmobile',

      versionCode: 1,

      adaptiveIcon: {
        foregroundImage:
          './assets/images/android-icon-foreground.png',

        backgroundColor: '#0d1b2a',
      },

      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
    },

    ios: {
      ...appJson.expo.ios,

      bundleIdentifier:
        'com.zeedain14.footballcoachmobile',
    },
  },
};