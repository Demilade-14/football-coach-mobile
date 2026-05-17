// app/ChallengesScreen.js — FIXED + UPGRADED
// BUG FIX: Challenges now properly reset every Monday
// Completed status is stored with the ISO week key so each week is independent
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Helpers ──────────────────────────────────────────────────

// Returns a string key like "2025-W22" for the current Mon–Sun week
const getWeekKey = () => {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  // ISO week number
  const dayOfYear = Math.floor((now - jan1) / 86400000);
  const week = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

// Days left until next Monday
const getDaysUntilReset = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const daysLeft = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return daysLeft;
};

// ── Challenge definitions (rotate by week — pick subset each week) ──
const ALL_CHALLENGES = [
  { id: 'c1',  title: 'Train 5 Days This Week',          icon: '🔥', target: 5,   type: 'days',     reward: 50,  xp: true },
  { id: 'c2',  title: 'Log 10+ Hours Training',           icon: '⏱', target: 600, type: 'minutes',  reward: 100, xp: true },
  { id: 'c3',  title: 'Practice Shooting (3 sessions)',   icon: '⚽', target: 3,   type: 'shooting', reward: 40,  xp: true },
  { id: 'c4',  title: 'Log a 60-min Session',             icon: '💪', target: 60,  type: 'longest',  reward: 30,  xp: true },
  { id: 'c5',  title: 'Train 3 Days in a Row',            icon: '📅', target: 3,   type: 'streak',   reward: 60,  xp: true },
  { id: 'c6',  title: 'Log Any 2 Sessions',               icon: '✅', target: 2,   type: 'sessions', reward: 20,  xp: true },
  { id: 'c7',  title: 'Dribbling Focus (2 sessions)',     icon: '🌀', target: 2,   type: 'dribbling',reward: 35,  xp: true },
  { id: 'c8',  title: 'Fitness Training (2 sessions)',    icon: '🏃', target: 2,   type: 'fitness',  reward: 35,  xp: true },
  { id: 'c9',  title: 'Reach 300 minutes This Week',      icon: '🕐', target: 300, type: 'minutes',  reward: 70,  xp: true },
  { id: 'c10', title: 'Log Sessions 4 Different Days',   icon: '🗓', target: 4,   type: 'days',     reward: 55,  xp: true },
];

// Pick 5 challenges per week (rotate based on week number)
const getWeeklyChallenges = () => {
  const weekNum = parseInt(getWeekKey().split('-W')[1]);
  const startIdx = (weekNum * 3) % ALL_CHALLENGES.length;
  const selected = [];
  for (let i = 0; i < 5; i++) {
    selected.push(ALL_CHALLENGES[(startIdx + i) % ALL_CHALLENGES.length]);
  }
  return selected;
};

// ── Animated progress bar ────────────────────────────────────
const ProgressBar = ({ progress, total, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(1, progress / Math.max(total, 1));

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={pb.track}>
      <Animated.View style={[pb.fill, { flex: anim, backgroundColor: color || '#1e88e5' }]} />
      <View style={{ flex: Animated.subtract ? undefined : 1 - pct }} />
    </View>
  );
};

const pb = StyleSheet.create({
  track: { height: 8, backgroundColor: '#0d1620', borderRadius: 4, overflow: 'hidden', flexDirection: 'row' },
  fill: { borderRadius: 4 },
});

// ── Challenge card ───────────────────────────────────────────
const ChallengeCard = ({ challenge, isClaimed, canClaim, onClaim, animDelay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  const pct = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
  const barColor = isClaimed ? '#28a745' : canClaim ? '#ffd700' : '#1e88e5';

  return (
    <Animated.View style={[styles.card, isClaimed && styles.cardClaimed, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.cardTop}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{challenge.icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, isClaimed && styles.cardTitleClaimed]}>{challenge.title}</Text>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {challenge.progress} / {challenge.target}
              {challenge.type === 'minutes' ? ' min' : challenge.type === 'days' || challenge.type === 'streak' ? ' days' : ''}
            </Text>
            <Text style={[styles.pctLabel, canClaim && !isClaimed && styles.pctLabelGold]}>{pct}%</Text>
          </View>
          <ProgressBar progress={challenge.progress} total={challenge.target} color={barColor} />
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.rewardLabel}>+{challenge.reward}</Text>
          <Text style={styles.rewardXP}>XP</Text>
          {isClaimed ? (
            <View style={styles.claimedBadge}><Text style={styles.claimedIcon}>✓</Text></View>
          ) : canClaim ? (
            <TouchableOpacity style={styles.claimBtn} onPress={onClaim}>
              <Text style={styles.claimBtnText}>Claim</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

// ── Main component ───────────────────────────────────────────
export default function ChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [totalXP, setTotalXP] = useState(0);
  const [daysLeft, setDaysLeft] = useState(1);
  const weekKey = getWeekKey();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      // Load this week's claimed challenges — keyed by week so they auto-reset
      const claimKey = `claimed_challenges_${weekKey}`;
      const claimedRaw = await AsyncStorage.getItem(claimKey);
      const claimed = claimedRaw ? JSON.parse(claimedRaw) : [];
      setClaimedIds(claimed);

      // Load all-time XP
      const xpRaw = await AsyncStorage.getItem('total_xp');
      setTotalXP(xpRaw ? parseInt(xpRaw) : 0);

      setDaysLeft(getDaysUntilReset());

      // Load sessions from AsyncStorage
      const sessionsRaw = await AsyncStorage.getItem('training_sessions');
      const sessions = sessionsRaw ? JSON.parse(sessionsRaw) : [];

      // Only this week's sessions (Mon–Sun)
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0=Mon
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const weekSessions = sessions.filter(s => {
        try { return new Date(s.date) >= weekStart; } catch { return false; }
      });

      const totalMinutes = weekSessions.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
      const uniqueDays = new Set(weekSessions.map(s => s.date)).size;
      const longestSession = weekSessions.reduce((max, s) => Math.max(max, parseInt(s.duration || 0)), 0);

      // Streak (overall, not just this week)
      let streak = 0;
      const allDates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
      let cur = new Date().toISOString().split('T')[0];
      for (const d of allDates) {
        if (d === cur) { streak++; const p = new Date(cur); p.setDate(p.getDate() - 1); cur = p.toISOString().split('T')[0]; }
        else if (d < cur) break;
      }

      // Activity counts this week
      const activityCounts = {};
      weekSessions.forEach(s => {
        const a = (s.activity || '').toLowerCase();
        activityCounts[a] = (activityCounts[a] || 0) + 1;
      });

      const weekly = getWeeklyChallenges().map(ch => {
        let progress = 0;
        switch (ch.type) {
          case 'days':      progress = uniqueDays; break;
          case 'minutes':   progress = totalMinutes; break;
          case 'sessions':  progress = weekSessions.length; break;
          case 'longest':   progress = longestSession; break;
          case 'streak':    progress = streak; break;
          case 'shooting':  progress = activityCounts['shooting'] || 0; break;
          case 'dribbling': progress = activityCounts['dribbling'] || 0; break;
          case 'fitness':   progress = activityCounts['fitness'] || 0; break;
          default: progress = 0;
        }
        return { ...ch, progress, completed: progress >= ch.target };
      });

      setChallenges(weekly);
    } catch (e) {
      console.error('Failed to load challenges:', e);
    }
  };

  const claimReward = async (challenge) => {
    try {
      const claimKey = `claimed_challenges_${weekKey}`;
      const updated = [...claimedIds, challenge.id];
      await AsyncStorage.setItem(claimKey, JSON.stringify(updated));
      setClaimedIds(updated);

      const newXP = totalXP + challenge.reward;
      await AsyncStorage.setItem('total_xp', String(newXP));
      setTotalXP(newXP);

      Alert.alert('🎉 Reward Claimed!', `+${challenge.reward} XP added to your total!\nTotal XP: ${newXP.toLocaleString()}`);
    } catch (e) {
      console.error('Failed to claim:', e);
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const claimedCount = claimedIds.length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎯 Weekly Challenges</Text>
          <Text style={styles.subtitle}>Resets every Monday</Text>
        </View>

        {/* Week summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{completedCount}/{challenges.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryVal}>{claimedCount}</Text>
            <Text style={styles.summaryLabel}>Claimed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: '#ff7043' }]}>{daysLeft}d</Text>
            <Text style={styles.summaryLabel}>Until Reset</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: '#ffd700' }]}>{totalXP.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total XP</Text>
          </View>
        </View>

        {/* Week label */}
        <View style={styles.weekLabel}>
          <Text style={styles.weekKey}>📅 {weekKey} challenges</Text>
          <View style={styles.resetPill}>
            <Text style={styles.resetText}>Resets in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Challenge cards */}
        <View style={styles.list}>
          {challenges.map((ch, i) => (
            <ChallengeCard
              key={ch.id}
              challenge={ch}
              isClaimed={claimedIds.includes(ch.id)}
              canClaim={ch.completed && !claimedIds.includes(ch.id)}
              onClaim={() => claimReward(ch)}
              animDelay={i * 80}
            />
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoTitle}>How Challenges Work</Text>
          <Text style={styles.infoText}>• New set of 5 challenges every Monday{'\n'}• Progress tracked from your logged sessions{'\n'}• Claim XP when a challenge is completed{'\n'}• Unclaimed XP is lost when the week resets</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  backBtn: { color: '#1e88e5', fontSize: 15, fontWeight: '700', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#3a6186' },
  summaryBar: {
    flexDirection: 'row', backgroundColor: '#111d2e',
    marginHorizontal: 20, borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1a2f46',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '800', color: '#66bb6a', marginBottom: 2 },
  summaryLabel: { fontSize: 10, color: '#3a6186', fontWeight: '700', letterSpacing: 0.5 },
  summaryDivider: { width: 1, backgroundColor: '#1a2f46', marginVertical: 4 },
  weekLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  weekKey: { color: '#3a6186', fontSize: 12, fontWeight: '700' },
  resetPill: { backgroundColor: '#1a2f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  resetText: { color: '#ff7043', fontSize: 11, fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: '#111d2e', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1a2f46',
  },
  cardClaimed: { borderColor: '#28a745', opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0d1620', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: '#dce8f8', fontSize: 14, fontWeight: '700' },
  cardTitleClaimed: { color: '#3a6186' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#3a6186', fontSize: 11, fontWeight: '600' },
  pctLabel: { color: '#1e88e5', fontSize: 11, fontWeight: '700' },
  pctLabelGold: { color: '#ffd700' },
  cardRight: { alignItems: 'center', gap: 6, minWidth: 52 },
  rewardLabel: { color: '#ffd700', fontSize: 16, fontWeight: '800' },
  rewardXP: { color: '#3a6186', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: -6 },
  claimedBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#28a745', alignItems: 'center', justifyContent: 'center' },
  claimedIcon: { color: '#fff', fontSize: 16, fontWeight: '800' },
  claimBtn: { backgroundColor: '#ffd700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  claimBtnText: { color: '#080f1a', fontSize: 11, fontWeight: '800' },
  infoBanner: { backgroundColor: '#111d2e', marginHorizontal: 16, marginTop: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1a2f46' },
  infoTitle: { color: '#a8dadc', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#3a6186', fontSize: 12, lineHeight: 20 },
});