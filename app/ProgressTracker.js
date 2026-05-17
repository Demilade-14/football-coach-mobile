// app/ProgressTracker.js — UPGRADED
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 80;

// ── Mini bar chart for last 7 days ──────────────────────────
const WeekChart = ({ sessions }) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1);
    const mins = sessions
      .filter(s => s.date === key)
      .reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
    days.push({ key, label, mins });
  }
  const maxMins = Math.max(...days.map(d => d.mins), 1);

  return (
    <View style={chart.wrapper}>
      <Text style={chart.title}>LAST 7 DAYS</Text>
      <View style={chart.bars}>
        {days.map((d, i) => {
          const h = Math.max(4, (d.mins / maxMins) * BAR_MAX_HEIGHT);
          const today = d.key === new Date().toISOString().split('T')[0];
          return (
            <View key={d.key} style={chart.barCol}>
              {d.mins > 0 && (
                <Text style={chart.barVal}>{d.mins}m</Text>
              )}
              <View style={[chart.bar, { height: h }, today && chart.barToday, d.mins === 0 && chart.barEmpty]} />
              <Text style={[chart.barLabel, today && chart.barLabelToday]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const chart = StyleSheet.create({
  wrapper: { backgroundColor: '#111d2e', borderRadius: 16, marginHorizontal: 20, padding: 16, marginBottom: 16 },
  title: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_MAX_HEIGHT + 30 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barVal: { color: '#ffd700', fontSize: 8, fontWeight: '700' },
  bar: { width: 22, borderRadius: 6, backgroundColor: '#1e5a9e' },
  barToday: { backgroundColor: '#ffd700' },
  barEmpty: { backgroundColor: '#1a2840', height: 4 },
  barLabel: { color: '#3a5f80', fontSize: 11, fontWeight: '600' },
  barLabelToday: { color: '#ffd700' },
});

// ── Animated stat card ───────────────────────────────────────
const StatCard = ({ value, label, accent }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: anim }] }]}>
      <Text style={[styles.statNumber, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ── Activity type picker ─────────────────────────────────────
const ACTIVITIES = ['Dribbling', 'Shooting', 'Passing', 'Defending', 'Fitness', 'Tactical', 'Match', 'Other'];

export default function ProgressTracker() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all | week | month
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    activity: '',
    duration: '',
    notes: '',
  });

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('training_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) { setSessions([]); }
  };

  const saveSessions = async (updated) => {
    try {
      await AsyncStorage.setItem('training_sessions', JSON.stringify(updated));
      setSessions(updated);
    } catch (e) {}
  };

  const addSession = () => {
    if (!newSession.activity || !newSession.duration) {
      Alert.alert('Missing Info', 'Please fill in activity and duration');
      return;
    }
    const session = { id: Date.now(), ...newSession, timestamp: new Date().toISOString() };
    const updated = [session, ...sessions];
    saveSessions(updated);
    setNewSession({ date: new Date().toISOString().split('T')[0], activity: '', duration: '', notes: '' });
    setShowAddForm(false);
    Alert.alert('🎉 Logged!', 'Training session saved');
  };

  const deleteSession = (id) => {
    Alert.alert('Delete Session', 'Remove this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveSessions(sessions.filter(s => s.id !== id)) },
    ]);
  };

  const filteredSessions = React.useMemo(() => {
    const now = new Date();
    if (filter === 'week') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      return sessions.filter(s => new Date(s.date) >= cutoff);
    }
    if (filter === 'month') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
      return sessions.filter(s => new Date(s.date) >= cutoff);
    }
    return sessions;
  }, [sessions, filter]);

  const stats = React.useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remMin = totalMinutes % 60;
    const thisWeek = sessions.filter(s => {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      return new Date(s.date) >= cutoff;
    }).length;
    const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const longest = sessions.reduce((max, s) => Math.max(max, parseInt(s.duration || 0)), 0);

    // Streak
    let streak = 0;
    try {
      const uniqueDates = [...new Set(sessions.map(s => s.date))].sort((a, b) => b.localeCompare(a));
      let current = new Date().toISOString().split('T')[0];
      for (const d of uniqueDates) {
        if (d === current) {
          streak++;
          const prev = new Date(current); prev.setDate(prev.getDate() - 1);
          current = prev.toISOString().split('T')[0];
        } else if (d < current) break;
      }
    } catch {}

    // Most trained activity
    const activityMap = {};
    sessions.forEach(s => { activityMap[s.activity] = (activityMap[s.activity] || 0) + 1; });
    const topActivity = Object.entries(activityMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    return { totalSessions, totalHours, remMin, thisWeek, avgDuration, longest, streak, topActivity };
  }, [sessions]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Progress Tracker</Text>
        <Text style={styles.subtitle}>Track your training journey</Text>
      </View>

      {/* Top stats row */}
      <View style={styles.statsRow}>
        <StatCard value={stats.totalSessions} label="Sessions" />
        <StatCard value={`${stats.totalHours}h ${stats.remMin}m`} label="Total Time" accent="#4fc3f7" />
        <StatCard value={`🔥 ${stats.streak}`} label="Day Streak" accent="#ff7043" />
      </View>
      <View style={styles.statsRow}>
        <StatCard value={`${stats.avgDuration}m`} label="Avg / Session" />
        <StatCard value={`${stats.longest}m`} label="Longest" accent="#ab47bc" />
        <StatCard value={stats.thisWeek} label="This Week" accent="#66bb6a" />
      </View>

      {/* Top activity badge */}
      {stats.topActivity !== '—' && (
        <View style={styles.topActivityBadge}>
          <Text style={styles.topActivityText}>⚽ Favourite: <Text style={{ color: '#ffd700' }}>{stats.topActivity}</Text></Text>
        </View>
      )}

      {/* Week chart */}
      <WeekChart sessions={sessions} />

      {/* Analytics button */}
      <TouchableOpacity style={styles.analyticsButton} onPress={() => router.push('/PerformanceGraphsScreen')}>
        <Text style={styles.analyticsButtonText}>📈 Full Analytics</Text>
      </TouchableOpacity>

      {/* Add session button */}
      <TouchableOpacity style={[styles.addButton, showAddForm && styles.addButtonCancel]} onPress={() => setShowAddForm(!showAddForm)}>
        <Text style={styles.addButtonText}>{showAddForm ? '✕ Cancel' : '+ Log Training Session'}</Text>
      </TouchableOpacity>

      {/* Add form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#3a5f80"
            value={newSession.date}
            onChangeText={(t) => setNewSession({ ...newSession, date: t })}
          />
          <Text style={styles.formLabel}>Activity Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
            <View style={styles.activityPicker}>
              {ACTIVITIES.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[styles.activityChip, newSession.activity === a && styles.activityChipActive]}
                  onPress={() => setNewSession({ ...newSession, activity: a })}
                >
                  <Text style={[styles.activityChipText, newSession.activity === a && styles.activityChipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.formLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 45"
            placeholderTextColor="#3a5f80"
            keyboardType="numeric"
            value={newSession.duration}
            onChangeText={(t) => setNewSession({ ...newSession, duration: t })}
          />
          <Text style={styles.formLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="How did it go?"
            placeholderTextColor="#3a5f80"
            multiline
            numberOfLines={3}
            value={newSession.notes}
            onChangeText={(t) => setNewSession({ ...newSession, notes: t })}
          />
          <TouchableOpacity style={styles.saveButton} onPress={addSession}>
            <Text style={styles.saveButtonText}>💾 Save Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {['all', 'week', 'month'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? 'All' : f === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session list */}
      <View style={styles.sessionsContainer}>
        <Text style={styles.sectionTitle}>Training History ({filteredSessions.length})</Text>
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Start logging your training!</Text>
          </View>
        ) : (
          filteredSessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionMeta}>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                  <View style={styles.activityTag}>
                    <Text style={styles.activityTagText}>{session.activity}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteSession(session.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sessionFooter}>
                <Text style={styles.sessionDuration}>⏱ {session.duration} min</Text>
                {session.notes ? <Text style={styles.sessionNotes} numberOfLines={2}>{session.notes}</Text> : null}
              </View>
              {/* duration mini bar */}
              <View style={styles.durationBar}>
                <View style={[styles.durationFill, { width: `${Math.min(100, (parseInt(session.duration || 0) / 120) * 100)}%` }]} />
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },
  header: { padding: 20, paddingTop: 50 },
  backButton: { color: '#1e88e5', fontSize: 15, fontWeight: '700', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#3a6186' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: '#111d2e', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#1a2f46',
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#ffd700', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#3a6186', textAlign: 'center', fontWeight: '600', letterSpacing: 0.5 },
  topActivityBadge: {
    backgroundColor: '#111d2e', marginHorizontal: 20, borderRadius: 10, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#1a2f46', alignItems: 'center',
  },
  topActivityText: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },
  analyticsButton: {
    backgroundColor: '#1246a0', marginHorizontal: 20, padding: 15,
    borderRadius: 12, alignItems: 'center', marginBottom: 12,
  },
  analyticsButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  addButton: {
    backgroundColor: '#28a745', marginHorizontal: 20, padding: 15,
    borderRadius: 12, alignItems: 'center', marginBottom: 16,
  },
  addButtonCancel: { backgroundColor: '#c0392b' },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  addForm: {
    backgroundColor: '#111d2e', marginHorizontal: 20, padding: 20,
    borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a2f46',
  },
  formLabel: { color: '#3a6186', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: '#080f1a', color: '#dce8f8', padding: 14,
    borderRadius: 10, marginBottom: 16, fontSize: 15, borderWidth: 1, borderColor: '#1a2f46',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  activityPicker: { flexDirection: 'row', gap: 8 },
  activityChip: {
    backgroundColor: '#080f1a', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#1a2f46',
  },
  activityChipActive: { backgroundColor: '#1246a0', borderColor: '#4fc3f7' },
  activityChipText: { color: '#3a6186', fontSize: 13, fontWeight: '600' },
  activityChipTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#ffd700', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#080f1a', fontSize: 15, fontWeight: '800' },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  filterTab: {
    flex: 1, backgroundColor: '#111d2e', padding: 10,
    borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1a2f46',
  },
  filterTabActive: { backgroundColor: '#1246a0', borderColor: '#4fc3f7' },
  filterTabText: { color: '#3a6186', fontSize: 12, fontWeight: '700' },
  filterTabTextActive: { color: '#fff' },
  sessionsContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#dce8f8', marginBottom: 14, letterSpacing: 0.3 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 17, color: '#3a6186', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#1a2f46' },
  sessionCard: {
    backgroundColor: '#111d2e', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#1a2f46',
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sessionMeta: { gap: 6 },
  sessionDate: { color: '#3a6186', fontSize: 12, fontWeight: '700' },
  activityTag: { backgroundColor: '#1246a0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  activityTagText: { color: '#4fc3f7', fontSize: 12, fontWeight: '700' },
  deleteButton: { fontSize: 18 },
  sessionFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sessionDuration: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },
  sessionNotes: { color: '#3a6186', fontSize: 12, flex: 1, fontStyle: 'italic' },
  durationBar: { height: 3, backgroundColor: '#0d1b2e', borderRadius: 2, overflow: 'hidden' },
  durationFill: { height: '100%', backgroundColor: '#1e88e5', borderRadius: 2 },
});