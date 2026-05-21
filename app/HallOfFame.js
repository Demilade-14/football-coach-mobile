// app/HallOfFame.js — FIXED
// FIX 1: Delete now works — root cause was nested TouchableOpacity conflict.
//         The outer card wrapper was a TouchableOpacity that intercepted the
//         delete button's press event. Fixed by making the card a plain View
//         and giving each action its own independent TouchableOpacity.
// FIX 2: All positions added: LW, RW, CF, RWB, LWB, LM, RM, SS
// FIX 3: useNativeDriver: false for Expo web compatibility

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Alert, TextInput, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllPlayers, deletePlayer } from '../src/utils/playerDatabase';

const getRatingColor = (overall) => {
  if (overall >= 85) return '#ffd700';
  if (overall >= 75) return '#66bb6a';
  if (overall >= 65) return '#4fc3f7';
  if (overall >= 55) return '#ff9800';
  if (overall >= 40) return '#ef5350';
  return '#9e9e9e';
};

const getRatingTier = (overall) => {
  if (overall >= 85) return { label: 'ELITE',  color: '#ffd700' };
  if (overall >= 75) return { label: 'GOLD',   color: '#ffa726' };
  if (overall >= 65) return { label: 'SILVER', color: '#90a4ae' };
  if (overall >= 55) return { label: 'BRONZE', color: '#a1887f' };
  if (overall >= 40) return { label: 'IRON',   color: '#ef5350' };
  return               { label: 'ROOKIE', color: '#9e9e9e' };
};

// Full position list including all new additions
const ALL_POSITIONS = [
  'All',
  'GK',
  'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'LM', 'RM', 'CAM',
  'LW', 'RW', 'CF', 'SS', 'ST',
];

const SORT_OPTIONS = [
  { key: 'rating', label: '⭐ Rating' },
  { key: 'name',   label: '🔤 Name'   },
  { key: 'age',    label: '🎂 Age'    },
];

const AttrPill = ({ label, value }) => (
  <View style={s.attrPill}>
    <Text style={s.attrVal}>{value}</Text>
    <Text style={s.attrLbl}>{label}</Text>
  </View>
);

// ── PlayerCard — card is a plain View so delete button press is never intercepted ──
const PlayerCard = ({ player, rank, onShare, onDelete, animDelay }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const ovr   = player.overall ?? 0;
  const color = getRatingColor(ovr);
  const tier  = getRatingTier(ovr);
  const MEDALS = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, delay: animDelay, useNativeDriver: false }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7,   delay: animDelay, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    // KEY FIX: plain Animated.View, NOT TouchableOpacity
    // This means the child TouchableOpacity buttons fire without conflict
    <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

      {/* Info row */}
      <View style={s.cardHeader}>
        <View style={s.rankWrap}>
          {rank <= 3
            ? <Text style={s.rankMedal}>{MEDALS[rank - 1]}</Text>
            : <Text style={s.rankNum}>#{rank}</Text>
          }
        </View>

        <View style={[s.avatar, { borderColor: color }]}>
          <Text style={s.avatarInitial}>
            {(player.name || '?').charAt(0).toUpperCase()}
          </Text>
          <View style={[s.ovrBubble, { backgroundColor: color }]}>
            <Text style={s.ovrBubbleNum}>{ovr || '?'}</Text>
          </View>
        </View>

        <View style={s.playerInfo}>
          <Text style={s.playerName} numberOfLines={1}>{player.name || 'Unknown'}</Text>

          <View style={s.tagRow}>
            {player.position ? (
              <View style={s.posTag}><Text style={s.posTagText}>{player.position}</Text></View>
            ) : null}
            {player.age ? (
              <Text style={s.agePill}>Age {player.age}</Text>
            ) : null}
            <View style={[s.tierBadge, { borderColor: tier.color }]}>
              <Text style={[s.tierText, { color: tier.color }]}>{tier.label}</Text>
            </View>
          </View>

          {(player.pace || player.shooting || player.passing) ? (
            <View style={s.attrRow}>
              {player.pace      ? <AttrPill label="PAC" value={player.pace}      /> : null}
              {player.shooting  ? <AttrPill label="SHO" value={player.shooting}  /> : null}
              {player.passing   ? <AttrPill label="PAS" value={player.passing}   /> : null}
              {player.dribbling ? <AttrPill label="DRI" value={player.dribbling} /> : null}
              {player.defending ? <AttrPill label="DEF" value={player.defending} /> : null}
              {player.physical  ? <AttrPill label="PHY" value={player.physical}  /> : null}
            </View>
          ) : null}
        </View>

        <View style={s.ovrWrap}>
          <Text style={[s.ovrNum, { color }]}>{ovr || '—'}</Text>
          <Text style={s.ovrLabel}>OVR</Text>
        </View>
      </View>

      {/* Action buttons — fully independent, no nesting issues */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.shareBtn}
          activeOpacity={0.7}
          onPress={onShare}
        >
          <Text style={s.actionIcon}>📤</Text>
          <Text style={s.actionText}>Share</Text>
        </TouchableOpacity>

        <View style={s.actionDivider} />

        <TouchableOpacity
          style={s.deleteBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          onPress={onDelete}
        >
          <Text style={s.actionIcon}>🗑️</Text>
          <Text style={[s.actionText, { color: '#ef5350' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────
export default function HallOfFame() {
  const router = useRouter();
  const [players,   setPlayers]   = useState([]);
  const [sortKey,   setSortKey]   = useState('rating');
  const [sortAsc,   setSortAsc]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const data = await getAllPlayers();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('loadPlayers:', e);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (player) => {
    try {
      await Share.share({
        message: `⚽ ${player.name} | OVR: ${player.overall} | ${player.position || 'N/A'} | Football Coach app`,
      });
    } catch {}
  };

  // FIXED delete handler — updates local state immediately for instant feedback
  const handleDelete = (player) => {
    Alert.alert(
      'Delete Player',
      `Remove "${player.name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlayer(player.id);
              // Update local list immediately — no need to reload from DB
              setPlayers(prev => prev.filter(p => p.id !== player.id));
            } catch (err) {
              console.error('deletePlayer failed:', err);
              Alert.alert('Error', 'Delete failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const filtered = React.useMemo(() => {
    let list = [...players];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q)
      );
    }

    if (posFilter !== 'All') list = list.filter(p => p.position === posFilter);

    if (ageFilter !== 'All') {
      list = list.filter(p => {
        const a = parseInt(p.age);
        if (isNaN(a)) return false;
        if (ageFilter === 'U18')    return a < 18;
        if (ageFilter === 'U21')    return a >= 18 && a <= 21;
        if (ageFilter === 'Senior') return a > 21;
        return true;
      });
    }

    list.sort((a, b) => {
      if (sortKey === 'name') {
        return sortAsc
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      }
      if (sortKey === 'age') {
        const va = parseInt(a.age) || 0, vb = parseInt(b.age) || 0;
        return sortAsc ? va - vb : vb - va;
      }
      const va = a.overall || 0, vb = b.overall || 0;
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [players, sortKey, sortAsc, search, posFilter, ageFilter]);

  const topRating = players.length ? Math.max(...players.map(p => p.overall || 0)) : 0;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>🏆 Hall of Fame</Text>
          <Text style={s.subtitle}>{players.length} Player{players.length !== 1 ? 's' : ''}</Text>
          {topRating > 0 && (
            <View style={s.topBadge}>
              <Text style={s.topBadgeText}>👑 Top: {topRating} OVR</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Text style={s.searchIconTxt}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search name or position..."
            placeholderTextColor="#3a6186"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort */}
        <View style={s.sortRow}>
          <Text style={s.rowLabel}>SORT:</Text>
          {SORT_OPTIONS.map(o => (
            <TouchableOpacity
              key={o.key}
              style={[s.chip, sortKey === o.key && s.chipActiveBlue]}
              onPress={() => toggleSort(o.key)}
            >
              <Text style={[s.chipTxt, sortKey === o.key && s.chipTxtActive]}>
                {o.label}{sortKey === o.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age filter */}
        <View style={s.filterRow}>
          <Text style={s.rowLabel}>AGE:</Text>
          {['All', 'U18', 'U21', 'Senior'].map(a => (
            <TouchableOpacity
              key={a}
              style={[s.chip, ageFilter === a && s.chipActiveGreen]}
              onPress={() => setAgeFilter(a)}
            >
              <Text style={[s.chipTxt, ageFilter === a && s.chipTxtActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Position filter — scrollable, includes ALL new positions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={s.posRow}>
            {ALL_POSITIONS.map(pos => (
              <TouchableOpacity
                key={pos}
                style={[s.posChip, posFilter === pos && s.posChipActive]}
                onPress={() => setPosFilter(pos)}
              >
                <Text style={[s.posChipTxt, posFilter === pos && s.chipTxtActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {(search || posFilter !== 'All' || ageFilter !== 'All') && (
          <Text style={s.resultCount}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Cards */}
        {loading ? (
          <View style={s.empty}><Text style={s.emptyTxt}>Loading...</Text></View>
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>⚽</Text>
            <Text style={s.emptyTxt}>
              {players.length === 0 ? 'No players yet' : 'No matches found'}
            </Text>
            {players.length === 0 && (
              <TouchableOpacity style={s.createBtn} onPress={() => router.push('/ProfileForm')}>
                <Text style={s.createBtnTxt}>+ Create Player</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map((player, i) => (
              <PlayerCard
                key={String(player.id)}
                player={player}
                rank={i + 1}
                animDelay={i * 60}
                onShare={() => handleShare(player)}
                onDelete={() => handleDelete(player)}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/ProfileForm')}>
          <Text style={s.addBtnTxt}>+ Add New Player</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },

  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, alignItems: 'center', backgroundColor: '#0b1220', borderBottomWidth: 1, borderBottomColor: '#1a2f46' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: '#1e88e5', fontSize: 15, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '900', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#3a6186', marginBottom: 10 },
  topBadge: { backgroundColor: '#1a2f46', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  topBadgeText: { color: '#ffd700', fontSize: 13, fontWeight: '700' },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111d2e', marginHorizontal: 20, marginTop: 16, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1a2f46' },
  searchIconTxt: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#dce8f8', fontSize: 14, paddingVertical: 12 },
  clearBtn: { color: '#3a6186', fontSize: 16, padding: 4 },

  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, gap: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, gap: 8 },
  rowLabel: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46' },
  chipActiveBlue: { backgroundColor: '#1246a0', borderColor: '#4fc3f7' },
  chipActiveGreen: { backgroundColor: '#28a745', borderColor: '#66bb6a' },
  chipTxt: { color: '#3a6186', fontSize: 11, fontWeight: '700' },
  chipTxtActive: { color: '#fff' },

  posRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  posChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46' },
  posChipActive: { backgroundColor: '#c0392b', borderColor: '#e53935' },
  posChipTxt: { color: '#3a6186', fontSize: 12, fontWeight: '700' },

  resultCount: { color: '#3a6186', fontSize: 12, fontWeight: '600', paddingHorizontal: 20, marginTop: 10 },

  list: { padding: 16, gap: 14 },

  // Card — plain View, no outer TouchableOpacity
  card: { backgroundColor: '#111d2e', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2f46' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },

  rankWrap: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 24 },
  rankNum: { fontSize: 14, fontWeight: '800', color: '#3a6186' },

  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, backgroundColor: '#0d1620', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 24, fontWeight: '800', color: '#dce8f8' },
  ovrBubble: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111d2e' },
  ovrBubbleNum: { fontSize: 8, fontWeight: '900', color: '#080f1a' },

  playerInfo: { flex: 1 },
  playerName: { color: '#dce8f8', fontSize: 16, fontWeight: '800', marginBottom: 6 },

  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  posTag: { backgroundColor: '#1246a0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  posTagText: { color: '#4fc3f7', fontSize: 10, fontWeight: '800' },
  agePill: { color: '#3a6186', fontSize: 10, fontWeight: '700', backgroundColor: '#1a2f46', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  attrRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  attrPill: { backgroundColor: '#1a2f46', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignItems: 'center', minWidth: 36 },
  attrVal: { color: '#ffd700', fontSize: 11, fontWeight: '800' },
  attrLbl: { color: '#3a6186', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },

  ovrWrap: { alignItems: 'center' },
  ovrNum: { fontSize: 30, fontWeight: '900' },
  ovrLabel: { color: '#3a6186', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Action buttons at bottom of card
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1a2f46' },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  actionDivider: { width: 1, backgroundColor: '#1a2f46' },
  actionIcon: { fontSize: 16 },
  actionText: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { color: '#3a6186', fontSize: 17, fontWeight: '600', marginBottom: 20 },
  createBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  createBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  addBtn: { backgroundColor: '#1246a0', marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: 14, alignItems: 'center' },
  addBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});