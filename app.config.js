const appJson = require('./app.json');
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      eas: {
        projectId: 'b6b2547d-284d-4bc3-9237-fa1eeee0d4e5',
      },
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
      googleServicesFile: './google-services.json',
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: 'com.zeedain14.footballcoachmobile',
    },
  },
};
