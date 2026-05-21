// =============================================================
// FILE: /src/utils/chatStorage.js
// PURPOSE: Save/load chat messages locally (free) + cloud (VIP)
// =============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_KEY = "ai_coach_messages";
const MAX_LOCAL_MESSAGES = 100; // Keep last 100 messages locally

// ── Local Storage ─────────────────────────────────────────────

export async function loadMessages() {
  try {
    const raw = await AsyncStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("[chatStorage] Load error:", err.message);
    return [];
  }
}

export async function saveMessages(messages) {
  try {
    // Keep only the most recent messages to avoid storage bloat
    const trimmed = messages.slice(-MAX_LOCAL_MESSAGES);
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("[chatStorage] Save error:", err.message);
  }
}

export async function clearMessages() {
  try {
    await AsyncStorage.removeItem(CHAT_KEY);
  } catch (err) {
    console.warn("[chatStorage] Clear error:", err.message);
  }
}

// ── Cloud Sync (VIP only) ─────────────────────────────────────
// This is a stub — connect to your own backend/Firebase/Supabase
// Replace the API_BASE URL and implement the backend endpoint

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export async function syncMessagesToCloud(userId, messages) {
  if (!userId) return;
  try {
    await fetch(`${API_BASE}/api/chat/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, messages: messages.slice(-50) }), // Sync last 50
    });
  } catch (err) {
    // Non-critical: silently fail, local data is still intact
    console.warn("[chatStorage] Cloud sync failed:", err.message);
  }
}

export async function loadMessagesFromCloud(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`${API_BASE}/api/chat/history?userId=${userId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.messages || null;
  } catch {
    return null; // Graceful fallback to local
  }
}