// =============================================================
// FILE: /src/utils/userId.js
// PURPOSE: Generate & persist a unique anonymous user ID
// =============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const USER_ID_KEY = "app_user_id";

/**
 * Returns a stable unique ID for this device/app install.
 * Created once on first launch, persisted in AsyncStorage.
 */
export async function getUserId() {
  try {
    const existing = await AsyncStorage.getItem(USER_ID_KEY);
    if (existing) return existing;

    // Generate new UUID
    const newId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    const shortId = `user_${newId.substring(0, 16)}`;
    await AsyncStorage.setItem(USER_ID_KEY, shortId);
    return shortId;
  } catch (err) {
    // Fallback if crypto fails
    const fallback = `user_${Date.now().toString(36)}`;
    return fallback;
  }
}