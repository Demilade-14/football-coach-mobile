const dotenv = require('dotenv');
const path = require('path');
const appJson = require('./app.json');

// Load env from the project root no matter which working directory Gradle or CI is using
dotenv.config({ path: path.resolve(__dirname, '.env') });
const env = process.env;

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo?.extra,
      eas: {
        projectId: 'b6b2547d-284d-4bc3-9237-fa1eeee0d4e5',
      },
      firebase: {
        apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      backendUrl: env.EXPO_PUBLIC_BACKEND_URL,
    },
  },
};