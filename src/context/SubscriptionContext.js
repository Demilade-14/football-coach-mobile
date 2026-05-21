// =============================================================
// FILE: /src/context/SubscriptionContext.js
// PURPOSE: Global VIP state — wrap your app root with this
// =============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserId } from "../utils/userId"; // See userId.js below

// ── SecureStore fallback for web/emulator ─────────────────────
const secureGet = async (key) => {
  try {
    if (Platform.OS === "web") return await AsyncStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return await AsyncStorage.getItem(key);
  }
};

const secureSet = async (key, value) => {
  try {
    if (Platform.OS === "web") return await AsyncStorage.setItem(key, value);
    return await SecureStore.setItemAsync(key, value);
  } catch {
    return await AsyncStorage.setItem(key, value);
  }
};

const secureDelete = async (key) => {
  try {
    if (Platform.OS === "web") return await AsyncStorage.removeItem(key);
    return await SecureStore.deleteItemAsync(key);
  } catch {
    return await AsyncStorage.removeItem(key);
  }
};

// ── Context setup ─────────────────────────────────────────────
const SubscriptionContext = createContext(null);

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const CACHE_TTL_MS = 5 * 60 * 1000; // Re-check server every 5 minutes

export function SubscriptionProvider({ children }) {
  const [isVip, setIsVip] = useState(false);
  const [plan, setPlan] = useState(null); // "monthly" | "yearly" | null
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // ── Load cached status + verify with server ─────────────────
  useEffect(() => {
    initSubscription();
  }, []);

  const initSubscription = async () => {
    try {
      const id = await getUserId();
      setUserId(id);

      // Load cached status immediately (fast UX)
      const cached = await secureGet("vip_status");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setIsVip(parsed.isVip || false);
          setPlan(parsed.plan || null);
          setExpiresAt(parsed.expiresAt || null);
        }
      }

      // Verify with server in background
      await refreshStatus(id);
    } catch (err) {
      console.warn("[SubscriptionContext] Init error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = useCallback(async (uid = userId) => {
    if (!uid) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(`${API_BASE}/api/user/status?userId=${uid}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();

      // Update state
      setIsVip(data.isVip || false);
      setPlan(data.plan || null);
      setExpiresAt(data.expiresAt || null);

      // Cache to SecureStore
      await secureSet(
        "vip_status",
        JSON.stringify({
          isVip: data.isVip,
          plan: data.plan,
          expiresAt: data.expiresAt,
          cachedAt: Date.now(),
        })
      );
    } catch (err) {
      // Graceful offline fallback — use cached value
      console.warn("[SubscriptionContext] Server check failed (using cache):", err.message);
    }
  }, [userId]);

  const revokeVip = async () => {
    setIsVip(false);
    setPlan(null);
    setExpiresAt(null);
    await secureDelete("vip_status");
  };

  // Max players allowed based on tier
  const maxPlayers = isVip ? Infinity : 5;

  return (
    <SubscriptionContext.Provider
      value={{ isVip, plan, expiresAt, loading, userId, maxPlayers, refreshStatus, revokeVip }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── Custom hook ───────────────────────────────────────────────
export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}