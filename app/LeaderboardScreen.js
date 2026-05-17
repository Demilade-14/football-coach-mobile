// app/LeaderboardScreen.js — UPGRADED
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Realistic mock players with countries, positions, levels
const MOCK_PLAYERS = [
  { name: 'Ahmed K.',  country: '🇳🇬', position: 'CAM', level: 'Elite',    sessions: 87, hours: 145, streak: 12, xp: 4820 },
  { name: 'Sarah M.',  country: '🇬🇧', position: 'ST',  level: 'Pro',      sessions: 76, hours: 128, streak: 8,  xp: 4210 },
  { name: 'David O.',  country: '🇬🇭', position: 'CB',  level: 'Elite',    sessions: 65, hours: 110, streak: 15, xp: 3980 },
  { name: 'Emma L.',   country: '🇫🇷', position: 'CM',  level: 'Pro',      sessions: 54, hours: 92,  streak: 6,  xp: 3100 },
  { name: 'Kofi A.',   country: '🇬🇭', position: 'GK',  level: 'Amateur',  sessions: 43, hours: 70,  streak: 4,  xp: 2400 },
  { name: 'Luis R.',   country: '🇧🇷', position: 'LW',  level: 'Pro',      sessions: 38, hours: 63,  streak: 9,  xp: 2150 },
  { name: 'Yuki T.',   country: '🇯🇵', position: 'CDM', level: 'Amateur',  sessions: 31, hours: 51,  streak: 3,  xp: 1700 },
  { name: 'Fatima S.', country: '🇸🇳', position: 'RB',  level: 'Beginner', sessions: 22, hours: 36,  streak: 2,  xp: 1200 },
];

const LEVEL_COLORS = {
  Elite: '#ffd700',
  Pro: '#4fc3f7',
  Amateur: '#66bb6a',
  Beginner: '#a8dadc',
};

const TABS = [
  { key: 'sessions', label: 'Sessions', icon: '⚽' },
  { key: 'hours',    label: 'Hours',    icon: '⏱' },
  { key: 'streak',   label: 'Streak',   icon: '🔥' },
  { key: 'xp',       label: 'XP',       icon: '⭐' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

const PlayerRow = ({ player, index, filter, isMe, animDelay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  const levelColor = LEVEL_COLORS[player.level] || '#a8dadc';
  const val = filter === 'hours' ? `${player[filter]}h` : filter === 'streak' ? `${player[filter]}d` : filter === 'xp' ? `${player[filter].toLocaleString()}` : player[filter];

  return (
    <Animated.View style={[
      styles.playerRow,
      isMe && styles.playerRowMe,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {/* Rank */}
      <View style={styles.rankWrap}>
        {index < 3
          ? <Text style={styles.medal}>{MEDALS[index]}</Text>
          : <Text style={styles.rankNum}>{index + 1}</Text>
        }
      </View>

      {/* Avatar circle */}
      <View style={[styles.avatar, { borderColor: levelColor }]}>
        <Text style={styles.avatarText}>{player.country}</Text>
      </View>

      {/* Info */}
      <View style={styles.playerDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.playerName}>{player.name}{isMe ? ' (You)' : ''}</Text>
          {isMe && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
        </View>
        <View style={styles.tagsRow}>
          <View style={[styles.levelTag, { borderColor: levelColor }]}>
            <Text style={[styles.levelText, { color: levelColor }]}>{player.level}</Text>
          </View>
          <Text style={styles.posTag}>{player.position}</Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreWrap}>
        <Text style={[styles.scoreVal, index === 0 && styles.goldScore]}>{val}</Text>
        <Text style={styles.scoreLabel}>{TABS.find(t => t.key === filter)?.label}</Text>
      </View>
    </Animated.View>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('sessions');
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => { buildLeaderboard(); }, [filter]);

  const buildLeaderboard = async () => {
    setLoading(true);
    try {
      const sessions = await AsyncStorage.getItem('training_sessions');
      const user = await AsyncStorage.getItem('user');
      const parsed = sessions ? JSON.parse(sessions) : [];
      const userData = user ? JSON.parse(user) : { name: 'You' };

      const totalSessions = parsed.length;
      const totalMinutes = parsed.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
      const totalHours = Math.floor(totalMinutes / 60);

      let streak = 0;
      const uniqueDates = [...new Set(parsed.map(s => s.date))].sort((a, b) => b.localeCompare(a));
      let current = new Date().toISOString().split('T')[0];
      for (const d of uniqueDates) {
        if (d === current) {
          streak++;
          const prev = new Date(current); prev.setDate(prev.getDate() - 1);
          current = prev.toISOString().split('T')[0];
        } else if (d < current) break;
      }

      const xp = totalSessions * 30 + totalHours * 10 + streak * 50;
      const level = xp >= 4000 ? 'Elite' : xp >= 2000 ? 'Pro' : xp >= 800 ? 'Amateur' : 'Beginner';

      const mePlayer = {
        name: userData.name || 'You',
        country: '🌍',
        position: 'YOU',
        level,
        sessions: totalSessions,
        hours: totalHours,
        streak,
        xp,
        isMe: true,
      };

      const allPlayers = [...MOCK_PLAYERS.map(p => ({ ...p, isMe: false })), mePlayer];
      const sorted = allPlayers.sort((a, b) => b[filter] - a[filter]);
      setLeaderboard(sorted);
      setMyRank(sorted.findIndex(p => p.isMe) + 1);
    } catch (e) {
      setLeaderboard(MOCK_PLAYERS.map(p => ({ ...p, isMe: false })));
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Global Rankings</Text>
        {myRank && (
          <View style={styles.myRankBadge}>
            <Text style={styles.myRankText}>Your rank: #{myRank}</Text>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, filter === t.key && styles.tabActive]} onPress={() => setFilter(t.key)}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Podium top 3 */}
          <View style={styles.podiumWrap}>
            {/* 2nd */}
            {topThree[1] && (
              <View style={[styles.podiumItem, styles.podiumSecond]}>
                <Text style={styles.podiumFlag}>{topThree[1].country}</Text>
                <Text style={styles.podiumMedal}>🥈</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name.split(' ')[0]}</Text>
                <View style={[styles.podiumBar, { height: 60, backgroundColor: '#4a5568' }]}>
                  <Text style={styles.podiumBarText}>2</Text>
                </View>
              </View>
            )}
            {/* 1st */}
            {topThree[0] && (
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <View style={styles.crownWrap}><Text style={styles.crown}>👑</Text></View>
                <Text style={styles.podiumFlag}>{topThree[0].country}</Text>
                <Text style={styles.podiumMedal}>🥇</Text>
                <Text style={styles.podiumNameFirst} numberOfLines={1}>{topThree[0].name.split(' ')[0]}</Text>
                <View style={[styles.podiumBar, { height: 90, backgroundColor: '#b8860b' }]}>
                  <Text style={styles.podiumBarText}>1</Text>
                </View>
              </View>
            )}
            {/* 3rd */}
            {topThree[2] && (
              <View style={[styles.podiumItem, styles.podiumThird]}>
                <Text style={styles.podiumFlag}>{topThree[2].country}</Text>
                <Text style={styles.podiumMedal}>🥉</Text>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name.split(' ')[0]}</Text>
                <View style={[styles.podiumBar, { height: 45, backgroundColor: '#7b6b4a' }]}>
                  <Text style={styles.podiumBarText}>3</Text>
                </View>
              </View>
            )}
          </View>

          {/* Rest of list */}
          <View style={styles.listWrap}>
            {leaderboard.map((player, i) => (
              <PlayerRow key={player.name} player={player} index={i} filter={filter} isMe={player.isMe} animDelay={i * 60} />
            ))}
          </View>

          {/* Info */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>💡 Rankings update as you log sessions. Train more to climb!</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#0b1220', borderBottomWidth: 1, borderBottomColor: '#1a2f46', alignItems: 'center' },
  backBtn: { color: '#1e88e5', fontSize: 15, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#3a6186', marginBottom: 10 },
  myRankBadge: { backgroundColor: '#1246a0', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  myRankText: { color: '#4fc3f7', fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#0b1220', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46', gap: 2 },
  tabActive: { backgroundColor: '#1246a0', borderColor: '#4fc3f7' },
  tabIcon: { fontSize: 14 },
  tabText: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { color: '#3a6186', marginTop: 12, fontSize: 14 },

  // Podium
  podiumWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, gap: 8 },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumFirst: { flex: 1.2 },
  podiumSecond: {},
  podiumThird: {},
  crownWrap: { marginBottom: 4 },
  crown: { fontSize: 22 },
  podiumFlag: { fontSize: 24, marginBottom: 4 },
  podiumMedal: { fontSize: 20, marginBottom: 4 },
  podiumName: { color: '#a8dadc', fontSize: 11, fontWeight: '700', marginBottom: 6, maxWidth: 70, textAlign: 'center' },
  podiumNameFirst: { color: '#ffd700', fontSize: 12, fontWeight: '800', marginBottom: 6, maxWidth: 80, textAlign: 'center' },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  podiumBarText: { color: 'rgba(255,255,255,0.5)', fontSize: 20, fontWeight: '900' },

  // List
  listWrap: { paddingHorizontal: 16, paddingTop: 8 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111d2e',
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1a2f46',
  },
  playerRowMe: { borderColor: '#4fc3f7', backgroundColor: '#0d1e33' },
  rankWrap: { width: 36, alignItems: 'center' },
  medal: { fontSize: 22 },
  rankNum: { fontSize: 16, fontWeight: '800', color: '#3a6186' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#0d1620' },
  avatarText: { fontSize: 22 },
  playerDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  playerName: { color: '#dce8f8', fontSize: 14, fontWeight: '700' },
  youBadge: { backgroundColor: '#1e88e5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  youBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tagsRow: { flexDirection: 'row', gap: 6 },
  levelTag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  levelText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  posTag: { color: '#3a6186', fontSize: 10, fontWeight: '700', paddingTop: 2 },
  scoreWrap: { alignItems: 'flex-end' },
  scoreVal: { color: '#ffd700', fontSize: 20, fontWeight: '800' },
  goldScore: { color: '#ffd700', textShadowColor: '#ffd700', textShadowRadius: 8 },
  scoreLabel: { color: '#3a6186', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  infoBanner: { backgroundColor: '#111d2e', marginHorizontal: 16, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1a2f46' },
  infoText: { color: '#3a6186', fontSize: 13, textAlign: 'center' },
});