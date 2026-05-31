// src/utils/adManager.js
// ✅ Simplified ad manager - NO VIP logic

// Ad unit IDs - Use TEST IDs for development
// Replace with your real AdMob IDs when publishing
export const AD_UNITS = {
  // Google's test IDs (safe for development)
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

// Simple frequency control for interstitial ads
let lastInterstitialTime = 0;
const MIN_TIME_BETWEEN_ADS = 3 * 60 * 1000; // 3 minutes

export const canShowInterstitial = () => {
  const now = Date.now();
  if (now - lastInterstitialTime > MIN_TIME_BETWEEN_ADS) {
    lastInterstitialTime = now;
    return true;
  }
  return false;
};

// Placeholder functions for now (replace with real ad SDK later)
export const showInterstitialAd = async () => {
  if (!canShowInterstitial()) {
    console.log('Ad skipped: too soon since last ad');
    return false;
  }
  
  console.log('🪧 Showing interstitial ad (placeholder)');
  // TODO: Integrate react-native-google-mobile-ads here
  return true;
};

export const showRewardedAd = async () => {
  console.log('🎁 Showing rewarded ad (placeholder)');
  // TODO: Integrate rewarded ads here
  return { success: true, reward: { type: 'coins', amount: 10 } };
};

// Track simple analytics
let adImpressions = 0;
export const trackAdImpression = (adType) => {
  adImpressions++;
  console.log(`📊 Ad impression #${adImpressions}: ${adType}`);
};