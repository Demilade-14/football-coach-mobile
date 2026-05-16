// app/VIPChat.js - Real AI Coach powered by Claude API
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, Animated, ActivityIndicator,
  UIManager, Pressable, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// ============================================================
// CLAUDE API CONFIG
// Add EXPO_PUBLIC_CLAUDE_API_KEY to your .env file
// ============================================================
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are Coach AI, an elite football (soccer) coach and sports psychologist with 20+ years of professional experience. You have coached in the Premier League, La Liga, Champions League, and with national teams.

Your personality:
- Warm, encouraging, and deeply knowledgeable
- You speak with authority but never arrogance
- You use football terminology correctly and naturally
- You're empathetic — acknowledge feelings FIRST before giving advice
- You celebrate wins (big and small) enthusiastically
- You use emojis naturally but not excessively (max 2-3 per message)
- You ask smart follow-up questions for personalized advice

Your expertise covers:
- Technical: passing, shooting, dribbling, first touch, crossing, heading, set pieces, weak foot
- Tactical: formations, positioning, pressing, transitions, game reading, off-the-ball movement
- Positions: GK, CB, FB, CDM, CM, CAM, winger, striker — deep specific knowledge of each
- Physical: fitness, agility, speed, strength, injury prevention, recovery, stretching
- Mental: confidence, focus, game nerves, leadership, resilience, visualization, pre-match routines
- Nutrition and recovery science specifically for footballers
- Getting scouted, trials advice, academy application strategies
- Youth development (ages 8-21) and amateur to semi-professional pathways
- How to train effectively alone without a team
- Video analysis and what to watch in professional games to learn

Rules:
- ALWAYS give specific, actionable advice — never vague or generic tips
- For skill questions: provide a concrete drill with reps/sets/duration
- For mental questions: give specific psychological techniques with steps
- Keep responses focused and under 200 words unless a detailed breakdown is truly needed
- Use bullet points or numbered lists for drills and multi-step advice
- If asked something completely unrelated to football/sports/fitness, gently redirect
- Address the player by name when you know it
- Never make up statistics or fake player quotes
- Be honest if you are unsure about something specific`;

// ============================================================
// QUICK ACTION PROMPTS
// ============================================================
const QUICK_ACTIONS = [
  { icon: '?', label: 'Shooting drill', prompt: 'Give me a specific shooting drill I can do alone today' },
  { icon: '??', label: 'Passing tips', prompt: 'How can I improve my passing accuracy under pressure?' },
  { icon: '??', label: 'Mental game', prompt: 'I get very nervous before big matches. How do I stay calm and perform my best?' },
  { icon: '??', label: 'Fitness plan', prompt: 'Give me a football-specific fitness plan I can do this week' },
  { icon: '???', label: 'Defending', prompt: 'How do I improve my 1v1 defending? I keep getting beaten by fast attackers' },
  { icon: '???', label: 'Dribbling', prompt: 'What are the best dribbling drills to help me beat defenders?' },
  { icon: '??', label: 'Get scouted', prompt: 'What do I need to do to get noticed by scouts and coaches?' },
  { icon: '??', label: 'Weak foot', prompt: 'My weak foot is really bad. Give me a programme to improve it in 4 weeks' },
];

// ============================================================
// ANIMATED TYPING DOTS
// ============================================================
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay(700 - delay),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 180);
    animate(dot3, 360);
  }, []);

  const dotStyle = (anim) => ({
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#4fc3f7',
    marginHorizontal: 3,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingAvatar}>
        <Text style={styles.avatarEmoji}>??</Text>
      </View>
      <View style={styles.typingBubble}>
        <Text style={styles.typingLabel}>Coach AI is thinking...</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={dotStyle(dot1)} />
          <Animated.View style={dotStyle(dot2)} />
          <Animated.View style={dotStyle(dot3)} />
        </View>
      </View>
    </View>
  );
};

// ============================================================
// MESSAGE BUBBLE
// ============================================================
const MessageBubble = ({ item }) => {
  const isPlayer = item.sender === 'Player';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.messageRow,
      isPlayer ? styles.messageRowRight : styles.messageRowLeft,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {!isPlayer && (
        <View style={styles.coachAvatar}>
          <Text style={styles.avatarEmoji}>??</Text>
        </View>
      )}
      <View style={[styles.messageBubble, isPlayer ? styles.playerBubble : styles.coachBubble]}>
        {!isPlayer && <Text style={styles.senderLabel}>COACH AI</Text>}
        <Text style={[styles.messageText, isPlayer ? styles.playerText : styles.coachText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isPlayer ? styles.timeRight : styles.timeLeft]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {isPlayer && (
        <View style={styles.playerAvatar}>
          <Text style={styles.avatarEmoji}>?</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function VIPChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [checkingVIP, setCheckingVIP] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userName, setUserName] = useState('Champion');
  const flatListRef = useRef(null);

  useEffect(() => { checkVIPAccess(); }, []);

  useEffect(() => {
    if (isVIP) {
      loadUserProfile().then(loadMessages);
    }
  }, [isVIP]);

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages, isTyping]);

  const checkVIPAccess = async () => {
    try {
      const vipStatus = await AsyncStorage.getItem('isVIP');
      if (__DEV__ && !vipStatus) {
        await AsyncStorage.setItem('isVIP', 'true');
        setIsVIP(true);
      } else if (vipStatus === 'true') {
        setIsVIP(true);
      } else {
        Alert.alert(
          '? Premium Feature',
          'Upgrade to VIP for unlimited AI coaching sessions!',
          [
            { text: 'Not Now', onPress: () => router.back(), style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.replace('/VIPSubscription') },
          ]
        );
      }
    } catch (e) {
      router.back();
    } finally {
      setCheckingVIP(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserName(u.name || 'Champion');
        return u.name || 'Champion';
      }
    } catch (e) {}
    return 'Champion';
  };

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem('vip_chat_v2');
      if (stored) {
        const { msgs, history } = JSON.parse(stored);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
          setConversationHistory(history || []);
          setShowQuickActions(false);
          return;
        }
      }
    } catch (e) {}
    sendWelcomeMessage();
  };

  const sendWelcomeMessage = () => {
    const welcome = {
      id: 'welcome',
      text: `Hey ${userName}! ?? I'm Coach AI — your personal football coach.\n\nI can help you with:\n• Skill drills & technique\n• Tactics & positioning\n• Mental game & confidence\n• Fitness & recovery\n• Getting scouted\n\nTap a quick start below or ask me anything!`,
      sender: 'Coach',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  };

  const saveData = async (msgs, history) => {
    try {
      await AsyncStorage.setItem('vip_chat_v2', JSON.stringify({ msgs, history }));
    } catch (e) {}
  };

  // -- CALL CLAUDE API --
  const callClaudeAPI = async (userMessage, history) => {
    if (!CLAUDE_API_KEY) {
      throw new Error('NO_API_KEY');
    }

    const updatedHistory = [...history, { role: 'user', content: userMessage }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: updatedHistory,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I couldn't generate a response. Please try again!";

    return {
      reply,
      newHistory: [...updatedHistory, { role: 'assistant', content: reply }],
    };
  };

  // -- SEND MESSAGE --
  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    setShowQuickActions(false);

    const userMsg = {
      id: Date.now().toString(),
      text,
      sender: 'Player',
      timestamp: new Date().toISOString(),
    };

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setIsTyping(true);

    try {
      const { reply, newHistory } = await callClaudeAPI(text, conversationHistory);

      const coachMsg = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'Coach',
        timestamp: new Date().toISOString(),
      };

      const final = [...withUser, coachMsg];
      setMessages(final);
      setConversationHistory(newHistory);
      await saveData(final, newHistory);

    } catch (error) {
      const isNoKey = error.message === 'NO_API_KEY';
      const coachMsg = {
        id: (Date.now() + 1).toString(),
        text: isNoKey
          ? `?? API key not set up yet.\n\nTo enable real AI responses, add your Anthropic API key to your .env file:\n\nEXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...`
          : `Sorry, I couldn't connect right now. Please check your internet and try again.\n\nError: ${error.message}`,
        sender: 'Coach',
        timestamp: new Date().toISOString(),
      };
      setMessages([...withUser, coachMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, messages, conversationHistory]);

  const clearChat = () => {
    Alert.alert('New Session', 'Start a fresh coaching session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Fresh', style: 'destructive', onPress: async () => {
          setMessages([]);
          setConversationHistory([]);
          setShowQuickActions(true);
          await AsyncStorage.removeItem('vip_chat_v2');
          sendWelcomeMessage();
        },
      },
    ]);
  };

  // -- LOADING --
  if (checkingVIP) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4fc3f7" />
        <Text style={styles.loadingText}>Connecting to Coach AI...</Text>
      </View>
    );
  }

  if (!isVIP) return null;

  const sessionCount = Math.floor(conversationHistory.length / 2);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* -- HEADER -- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.backArrow}>?</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <Text style={styles.headerAvatar}>??</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Coach AI</Text>
            <Text style={styles.headerSub}>? Premium · Always Available</Text>
          </View>
        </View>

        <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
          <Text style={styles.headerBtnIcon}>?</Text>
        </TouchableOpacity>
      </View>

      {/* -- MESSAGES LIST -- */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? <TypingDots /> : null}
      />

      {/* -- QUICK ACTIONS -- */}
      {showQuickActions && (
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>QUICK START</Text>
          <FlatList
            data={QUICK_ACTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.label}
            contentContainerStyle={styles.quickList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.quickChip,
                  pressed && styles.quickChipPressed,
                ]}
                onPress={() => sendMessage(item.prompt)}
              >
                <Text style={styles.quickChipIcon}>{item.icon}</Text>
                <Text style={styles.quickChipLabel}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* -- INPUT -- */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your coach anything..."
            placeholderTextColor="#3d5166"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={600}
            editable={!isTyping}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnOff]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.75}
          >
            {isTyping
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendIcon}>?</Text>
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.sessionInfo}>
          ?? Claude AI · {sessionCount} exchange{sessionCount !== 1 ? 's' : ''} this session
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080e1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4fc3f7', marginTop: 16, fontSize: 15, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#0b1220',
    borderBottomWidth: 1, borderBottomColor: '#162032',
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#4fc3f7', fontSize: 22, fontWeight: '700' },
  headerBtnIcon: { color: '#4fc3f7', fontSize: 22, fontWeight: '700' },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { fontSize: 28 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#00e676',
    borderWidth: 2, borderColor: '#0b1220',
  },
  headerTitle: { color: '#e8f0fc', fontSize: 16, fontWeight: '700' },
  headerSub: { color: '#4fc3f7', fontSize: 10, marginTop: 1 },

  // Messages
  messagesList: { padding: 14, paddingBottom: 10 },
  messageRow: { flexDirection: 'row', marginVertical: 5, alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },

  coachAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0d1f35',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 7, marginBottom: 2,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  playerAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0d2040',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 7, marginBottom: 2,
  },
  avatarEmoji: { fontSize: 15 },

  messageBubble: {
    maxWidth: width * 0.74, padding: 13,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  coachBubble: {
    backgroundColor: '#0d1e33',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#1b3352',
  },
  playerBubble: {
    backgroundColor: '#1246a0',
    borderBottomRightRadius: 4,
  },
  senderLabel: {
    color: '#4fc3f7', fontSize: 10, fontWeight: '800',
    letterSpacing: 1, marginBottom: 5,
  },
  messageText: { fontSize: 15, lineHeight: 23 },
  coachText: { color: '#dce8f8' },
  playerText: { color: '#fff' },
  timeText: { fontSize: 10, marginTop: 5, opacity: 0.5 },
  timeLeft: { color: '#6fa8c9' },
  timeRight: { color: '#9dc4e8' },

  // Typing
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingBottom: 6, marginTop: 4,
  },
  typingAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0d1f35',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 7, borderWidth: 1, borderColor: '#1e3a5f',
  },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0d1e33',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#1b3352',
  },
  typingLabel: { color: '#4fc3f7', fontSize: 12, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },

  // Quick Actions
  quickSection: {
    borderTopWidth: 1, borderTopColor: '#162032',
    paddingVertical: 10,
  },
  quickTitle: {
    color: '#2d4a60', fontSize: 10, fontWeight: '800',
    letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 8,
  },
  quickList: { paddingHorizontal: 12, gap: 8 },
  quickChip: {
    backgroundColor: '#0d1e33',
    borderWidth: 1, borderColor: '#1b3352',
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    alignItems: 'center', gap: 4, minWidth: 78,
  },
  quickChipPressed: { backgroundColor: '#162840', borderColor: '#4fc3f7' },
  quickChipIcon: { fontSize: 19 },
  quickChipLabel: { color: '#6fa8c9', fontSize: 11, fontWeight: '600' },

  // Input
  inputSection: {
    borderTopWidth: 1, borderTopColor: '#162032',
    backgroundColor: '#0b1220',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 18,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  textInput: {
    flex: 1,
    backgroundColor: '#0d1e33',
    color: '#dce8f8',
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 24, fontSize: 15,
    maxHeight: 120, lineHeight: 22,
    borderWidth: 1, borderColor: '#1b3352',
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1246a0',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1246a0', shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
  },
  sendBtnOff: { backgroundColor: '#162032', shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sessionInfo: {
    color: '#233344', fontSize: 10,
    textAlign: 'center', marginTop: 7, letterSpacing: 0.3,
  },
});