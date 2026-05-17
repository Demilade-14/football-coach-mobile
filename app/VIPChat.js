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
// ? Your Gemini API Key
const GEMINI_API_KEY = 'AIzaSyAF6bWgc-nxtKkaSkHCT5i-EGYjtrV_3tQ';
// System prompt for football coaching personality
const SYSTEM_PROMPT = `You are Coach AI, an elite football (soccer) coach with 20+ years of professional experience. You've coached in the Premier League, La Liga, and Champions League.
**Your Style:**
- Warm, encouraging, deeply knowledgeable
- Use football terminology naturally
- Give SPECIFIC, actionable advice with drills, reps, and duration
- Use emojis sparingly (max 2-3 per message)
- Keep responses under 200 words
- Use bullet points for drills
- Address player by name when known
- Ask follow-up questions for personalization
**Your Expertise:**
- Technical: shooting, passing, dribbling, first touch, heading
- Tactical: positioning, formations, game reading
- Physical: fitness, speed, strength, injury prevention
- Mental: confidence, focus, handling pressure
- Career: getting scouted, trials, academy advice
Always provide concrete drills with specific times and repetitions!`;
const QUICK_ACTIONS = [
  { icon: '?', label: 'Shooting drill', prompt: 'Give me a specific shooting drill I can do alone today' },
  { icon: '??', label: 'Passing tips', prompt: 'How can I improve my passing accuracy under pressure?' },
  { icon: '??', label: 'Mental game', prompt: 'I get very nervous before big matches. How do I stay calm?' },
  { icon: '??', label: 'Fitness plan', prompt: 'Give me a football-specific fitness plan for this week' },
  { icon: '???', label: 'Defending', prompt: 'How do I improve my 1v1 defending?' },
  { icon: '?', label: 'Dribbling', prompt: 'Best dribbling drills to beat defenders?' },
  { icon: '??', label: 'Get scouted', prompt: 'What do I need to do to get noticed by scouts?' },
  { icon: '??', label: 'Weak foot', prompt: 'My weak foot is terrible. Help me improve it!' },
];
const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: false }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: false }),
          Animated.delay(700 - delay),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 180);
    animate(dot3, 360);
  }, []);
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingAvatar}>
        <Text style={styles.avatarEmoji}>??</Text>
      </View>
      <View style={styles.typingBubble}>
        <Text style={styles.typingLabel}>Coach AI is thinking...</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
};
const MessageBubble = ({ item }) => {
  const isPlayer = item.sender === 'Player';
  return (
    <View style={[
      styles.messageRow,
      isPlayer ? styles.messageRowRight : styles.messageRowLeft,
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
          <Text style={styles.avatarEmoji}>??</Text>
        </View>
      )}
    </View>
  );
};
export default function VIPChat() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [checkingVIP, setCheckingVIP] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [userName, setUserName] = useState('Champion');
  const [conversationHistory, setConversationHistory] = useState([]);
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
        Alert.alert('?? Premium Feature', 'Upgrade to VIP for unlimited AI coaching!', [
          { text: 'Not Now', onPress: () => router.back(), style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.replace('/VIPSubscription') },
        ]);
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
      text: `Hey ${userName}! ?? I'm Coach AI ?? your personal football coach.
I can help you with:
? Skill drills & technique
?? Tactics & positioning  
?? Mental game & confidence
?? Fitness & recovery
?? Getting scouted
Tap a quick start below or ask me anything!`,
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
  // ? REAL Gemini 1.5 Flash AI API CALL
  const callGeminiAPI = async (userMessage) => {
    if (!GEMINI_API_KEY) {
      throw new Error('No API key');
    }
    console.log('?? Sending to Gemini API...');
    console.log('?? API Key:', GEMINI_API_KEY.substring(0, 10) + '...');
    // Build conversation context
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}`
      : '';
    const fullPrompt = `${SYSTEM_PROMPT}${conversationContext}\n\nPlayer: ${userMessage}\nCoach AI:`;
    try {
      // ? Use correct Gemini API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              topP: 0.8,
              topK: 40,
            }
          }),
        }
      );
      console.log('?? Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('? API Error:', errorData);
        if (response.status === 403) {
          throw new Error('API key invalid or API not enabled. Enable Generative Language API in Google Cloud Console.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Check if Gemini API is enabled.');
        } else {
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
      }
      const data = await response.json();
      console.log('? API Response:', data);
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      return {
        reply,
        newHistory: [
          ...conversationHistory,
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: [{ text: reply }] }
        ]
      };
    } catch (error) {
      console.error('? Gemini API call failed:', error);
      throw error;
    }
  };
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
      const { reply, newHistory } = await callGeminiAPI(text);
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
      console.error('AI error:', error);
      const coachMsg = {
        id: (Date.now() + 1).toString(),
        text: `?? **Connection Issue**
${error.message}
**To fix:**
1. Go to Google Cloud Console
2. Enable "Generative Language API"
3. Wait 2-3 minutes
4. Restart the app
Or use the quick action buttons below!`,
        sender: 'Coach',
        timestamp: new Date().toISOString(),
      };
      setMessages([...withUser, coachMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, messages, conversationHistory]);
  const clearChat = () => {
    Alert.alert('New Session', 'Start fresh?', [
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
  if (checkingVIP) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4fc3f7" />
        <Text style={styles.loadingText}>Connecting to Coach AI...</Text>
      </View>
    );
  }
  if (!isVIP) return null;
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.backArrow}>??</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <Text style={styles.headerAvatar}>??</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Coach AI</Text>
            <Text style={styles.headerSub}>?? Premium • Always Available</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.headerBtn}>
          <Text style={styles.headerBtnIcon}>???</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? <TypingDots /> : null}
      />
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
          >
            {isTyping ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendIcon}>?</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.sessionInfo}>?? Gemini 1.5 Flash AI • Real-time coaching</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080e1a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4fc3f7', marginTop: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#0b1220',
    borderBottomWidth: 1, borderBottomColor: '#162032',
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#4fc3f7', fontSize: 22, fontWeight: '700' },
  headerBtnIcon: { color: '#4fc3f7', fontSize: 22 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { fontSize: 28 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#00e676', borderWidth: 2, borderColor: '#0b1220',
  },
  headerTitle: { color: '#e8f0fc', fontSize: 16, fontWeight: '700' },
  headerSub: { color: '#4fc3f7', fontSize: 10, marginTop: 1 },
  messagesList: { padding: 14, paddingBottom: 10 },
  messageRow: { flexDirection: 'row', marginVertical: 5, alignItems: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  coachAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0d1f35', alignItems: 'center', justifyContent: 'center',
    marginRight: 7, marginBottom: 2, borderWidth: 1, borderColor: '#1e3a5f',
  },
  playerAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#0d2040', alignItems: 'center', justifyContent: 'center',
    marginLeft: 7, marginBottom: 2,
  },
  avatarEmoji: { fontSize: 15 },
  messageBubble: {
    maxWidth: width * 0.74, padding: 13, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  coachBubble: { backgroundColor: '#0d1e33', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#1b3352' },
  playerBubble: { backgroundColor: '#1246a0', borderBottomRightRadius: 4 },
  senderLabel: { color: '#4fc3f7', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  messageText: { fontSize: 15, lineHeight: 23 },
  coachText: { color: '#dce8f8' },
  playerText: { color: '#fff' },
  timeText: { fontSize: 10, marginTop: 5, opacity: 0.5 },
  timeLeft: { color: '#6fa8c9' },
  timeRight: { color: '#9dc4e8' },
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingBottom: 6, marginTop: 4 },
  typingAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#0d1f35',
    alignItems: 'center', justifyContent: 'center', marginRight: 7, borderWidth: 1, borderColor: '#1e3a5f',
  },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0d1e33',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#1b3352',
  },
  typingLabel: { color: '#4fc3f7', fontSize: 12, fontWeight: '600' },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4fc3f7', marginHorizontal: 3 },
  quickSection: { borderTopWidth: 1, borderTopColor: '#162032', paddingVertical: 10 },
  quickTitle: { color: '#2d4a60', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 8 },
  quickList: { paddingHorizontal: 12, gap: 8 },
  quickChip: {
    backgroundColor: '#0d1e33', borderWidth: 1, borderColor: '#1b3352',
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, alignItems: 'center', gap: 4, minWidth: 78,
  },
  quickChipPressed: { backgroundColor: '#162840', borderColor: '#4fc3f7' },
  quickChipIcon: { fontSize: 19 },
  quickChipLabel: { color: '#6fa8c9', fontSize: 11, fontWeight: '600' },
  inputSection: {
    borderTopWidth: 1, borderTopColor: '#162032', backgroundColor: '#0b1220',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 18,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  textInput: {
    flex: 1, backgroundColor: '#0d1e33', color: '#dce8f8',
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 24, fontSize: 15,
    maxHeight: 120, lineHeight: 22, borderWidth: 1, borderColor: '#1b3352',
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1246a0',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1246a0', shadowOpacity: 0.5, shadowRadius: 8, elevation: 5,
  },
  sendBtnOff: { backgroundColor: '#162032', shadowOpacity: 0 },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sessionInfo: { color: '#233344', fontSize: 10, textAlign: 'center', marginTop: 7, letterSpacing: 0.3 },
});
