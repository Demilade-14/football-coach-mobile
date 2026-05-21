// =============================================================
// FILE: /app/AICoach.js
// PURPOSE: AI Chat Coach screen — full production UI
// =============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSubscription } from "../src/context/SubscriptionContext";
import {
  loadMessages,
  saveMessages,
  clearMessages,
  syncMessagesToCloud,
  loadMessagesFromCloud,
} from "../src/utils/chatStorage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// ── Message bubble component ──────────────────────────────────
function MessageBubble({ item }) {
  const isUser = item.role === "user";
  const isError = item.isError;

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>⚽</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          isError && styles.bubbleError,
        ]}
      >
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {item.content}
        </Text>
        <Text style={styles.bubbleTime}>
          {new Date(item.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

// ── Typing indicator ──────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingWrapper}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarText}>⚽</Text>
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Quick suggestions ─────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  "Best formation for 11 players?",
  "How to improve team pressing?",
  "Training drills for strikers",
  "Motivating underperforming players",
];

// ── Main Component ────────────────────────────────────────────
export default function AICoach() {
  const router = useRouter();
  const { isVip, userId } = useSubscription();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryPayload, setRetryPayload] = useState(null);

  const flatListRef = useRef(null);

  // ── Load message history on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // VIP: try to load from cloud first
        if (isVip && userId) {
          const cloudMessages = await loadMessagesFromCloud(userId);
          if (cloudMessages && cloudMessages.length > 0) {
            setMessages(cloudMessages);
            setIsLoading(false);
            return;
          }
        }
        // Free: load from local storage
        const localMessages = await loadMessages();
        setMessages(localMessages);
      } catch {
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isVip, userId]);

  // ── Save messages whenever they change ───────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    saveMessages(messages);
    if (isVip && userId) {
      syncMessagesToCloud(userId, messages); // Non-blocking
    }
  }, [messages, isVip, userId]);

  // ── Scroll to bottom ─────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, isTyping]);

  // ── Build history for API context (last 10 messages) ─────────
  const getApiHistory = useCallback(() => {
    return messages
      .filter((m) => !m.isError)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text = input) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      setInput("");
      setRetryPayload(null);

      const userMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: getApiHistory(),
            userId: userId || "anonymous",
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!res.ok) {
          // Rate limit check
          if (res.status === 429 && data.isRateLimit) {
            setMessages((prev) => [
              ...prev,
              {
                id: `err_${Date.now()}`,
                role: "assistant",
                content: "⏱️ You've reached the free limit of 30 chats/hour. Upgrade to VIP for unlimited coaching!",
                timestamp: Date.now(),
                isError: true,
              },
            ]);
            return;
          }
          throw new Error(data.error || "Server error");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: "assistant",
            content: data.reply,
            timestamp: data.timestamp || Date.now(),
          },
        ]);
      } catch (err) {
        const isTimeout = err.name === "AbortError";
        const errMsg = isTimeout
          ? "Response timed out. Please try again."
          : err.message || "Failed to get response. Check your connection.";

        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${errMsg}`,
            timestamp: Date.now(),
            isError: true,
          },
        ]);

        // Store for retry
        setRetryPayload(trimmed);
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, getApiHistory, userId]
  );

  // ── Clear chat ───────────────────────────────────────────────
  const handleClear = () => {
    Alert.alert("Clear Chat", "Delete all messages? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setMessages([]);
          await clearMessages();
        },
      },
    ]);
  };

  // ── Render ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚽ AI Coach</Text>
          {isVip && <Text style={styles.headerVipBadge}>VIP</Text>}
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>⚽</Text>
              <Text style={styles.emptyStateTitle}>Your AI Coach is ready!</Text>
              <Text style={styles.emptyStateSubtitle}>
                Ask me anything about formations, drills, tactics, or player management.
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {isTyping && <TypingIndicator />}
              {/* Quick suggestions (show only when chat is empty) */}
              {messages.length === 0 && !isTyping && (
                <View style={styles.suggestionsContainer}>
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => sendMessage(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          }
        />

        {/* Retry banner */}
        {retryPayload && (
          <TouchableOpacity style={styles.retryBanner} onPress={() => sendMessage(retryPayload)}>
            <Text style={styles.retryText}>↩ Tap to retry last message</Text>
          </TouchableOpacity>
        )}

        {/* Input area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor="#475569"
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Rate limit reminder for free users */}
        {!isVip && (
          <TouchableOpacity
            style={styles.upgradeHint}
            onPress={() => router.push("/VIPSubscription")}
          >
            <Text style={styles.upgradeHintText}>
              ✨ Free: 30 chats/hr · <Text style={styles.upgradeHintLink}>Upgrade to VIP</Text> for unlimited
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  centered: { justifyContent: "center", alignItems: "center" },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerBtn: { padding: 8, minWidth: 40 },
  headerBtnText: { color: "#94A3B8", fontSize: 20 },
  headerCenter: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#F1F5F9" },
  headerVipBadge: {
    backgroundColor: "#FCD34D",
    color: "#78350F",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  bubbleWrapper: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
  bubbleWrapperUser: { justifyContent: "flex-end" },
  bubbleWrapperAI: { justifyContent: "flex-start" },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: { fontSize: 16 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  bubbleUser: { backgroundColor: "#2563EB", borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: "#1E293B", borderBottomLeftRadius: 4 },
  bubbleError: { backgroundColor: "#7F1D1D" },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#EFF6FF" },
  bubbleTextAI: { color: "#E2E8F0" },
  bubbleTime: { fontSize: 10, color: "#64748B", marginTop: 4, textAlign: "right" },
  // Typing indicator
  typingWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12, paddingHorizontal: 16 },
  typingBubble: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#1E293B",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#64748B" },
  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 32 },
  emptyStateEmoji: { fontSize: 48, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: "700", color: "#E2E8F0", marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 },
  // Suggestions
  suggestionsContainer: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  suggestionChip: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  suggestionText: { color: "#94A3B8", fontSize: 13 },
  // Retry
  retryBanner: {
    backgroundColor: "#7F1D1D",
    padding: 10,
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  retryText: { color: "#FCA5A5", fontSize: 13, fontWeight: "600" },
  // Input area
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  input: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: "#F1F5F9",
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  // Upgrade hint
  upgradeHint: { paddingVertical: 8, alignItems: "center" },
  upgradeHintText: { color: "#475569", fontSize: 12 },
  upgradeHintLink: { color: "#60A5FA", fontWeight: "700" },
});