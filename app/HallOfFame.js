// app/HallOfFame.js — UPGRADED
// Added: filter by Age / Rating / Name, search, animated cards, better profile display
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Alert, TextInput, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllPlayers, deletePlayer } from '../src/utils/playerDatabase';

const { width } = Dimensions.get('window');

// ── Helpers ──────────────────────────────────────────────────
const getRatingColor = (overall) => {
  if (overall >= 85) return '#ffd700';
  if (overall >= 75) return '#66bb6a';
  if (overall >= 65) return '#4fc3f7';
  if (overall >= 55) return '#ff9800';
  return '#ef5350';
};

const getRatingTier = (overall) => {
  if (overall >= 85) return { label: 'ELITE', color: '#ffd700' };
  if (overall >= 75) return { label: 'GOLD',  color: '#ffa726' };
  if (overall >= 65) return { label: 'SILVER', color: '#90a4ae' };
  if (overall >= 55) return { label: 'BRONZE', color: '#a1887f' };
  return { label: 'IRON', color: '#6b7280' };
};

const POSITIONS = ['All', 'GK', 'CB', 'FB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

// ── Sort & filter bar ────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'rating', label: '⭐ Rating' },
  { key: 'name',   label: '🔤 Name' },
  { key: 'age',    label: '🎂 Age' },
];

// ── Animated player card ─────────────────────────────────────
const PlayerCard = ({ player, rank, onShare, onDelete, onPress, animDelay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const ratingColor = getRatingColor(player.overall || 50);
  const tier = getRatingTier(player.overall || 50);
  const MEDALS = ['🥇', '🥈', '🥉'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: animDelay, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, delay: animDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {/* Card header row */}
        <View style={styles.cardHeader}>
          {/* Rank badge */}
          <View style={styles.rankBadge}>
            {rank <= 3
              ? <Text style={styles.rankMedal}>{MEDALS[rank - 1]}</Text>
              : <Text style={styles.rankNum}>#{rank}</Text>
            }
          </View>

          {/* Avatar with initials */}
          <View style={[styles.avatar, { borderColor: ratingColor }]}>
            <Text style={styles.avatarText}>
              {(player.name || '?').charAt(0).toUpperCase()}
            </Text>
            {/* Rating circle overlay */}
            <View style={[styles.ratingBadge, { backgroundColor: ratingColor }]}>
              <Text style={styles.ratingBadgeNum}>{player.overall || '?'}</Text>
            </View>
          </View>

          {/* Player info */}
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name || 'Unknown'}</Text>
            <View style={styles.infoRow}>
              {player.position && (
                <View style={styles.positionTag}>
                  <Text style={styles.positionText}>{player.position}</Text>
                </View>
              )}
              {player.age ? (
                <Text style={styles.agePill}>Age {player.age}</Text>
              ) : null}
              <View style={[styles.tierBadge, { borderColor: tier.color }]}>
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>
            {/* Attribute pills */}
            {(player.pace || player.shooting || player.passing) ? (
              <View style={styles.attributeRow}>
                {player.pace    && <AttrPill label="PAC" value={player.pace} />}
                {player.shooting && <AttrPill label="SHO" value={player.shooting} />}
                {player.passing  && <AttrPill label="PAS" value={player.passing} />}
                {player.dribbling && <AttrPill label="DRI" value={player.dribbling} />}
                {player.defending && <AttrPill label="DEF" value={player.defending} />}
                {player.physical  && <AttrPill label="PHY" value={player.physical} />}
              </View>
            ) : null}
          </View>

          {/* Overall big number */}
          <View style={styles.overallWrap}>
            <Text style={[styles.overallNum, { color: ratingColor }]}>{player.overall || '—'}</Text>
            <Text style={styles.overallLabel}>OVR</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionLabel, { color: '#ef5350' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AttrPill = ({ label, value }) => (
  <View style={styles.attrPill}>
    <Text style={styles.attrVal}>{value}</Text>
    <Text style={styles.attrLabel}>{label}</Text>
  </View>
);

// ── Main component ───────────────────────────────────────────
export default function HallOfFame() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [sortKey, setSortKey] = useState('rating');
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All'); // All | U18 | U21 | Senior

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    const data = await getAllPlayers();
    setPlayers(data || []);
  };

  const handleShare = async (player) => {
    try {
      await Share.share({
        message: `⚽ Check out my player ${player.name}!\n🏆 Overall: ${player.overall}\n📍 Position: ${player.position || 'N/A'}\nCreated on Football Coach app`,
        title: `${player.name} — Football Profile`,
      });
    } catch {}
  };

  const handleDelete = (player) => {
    Alert.alert('Delete Player', `Remove ${player.name} from Hall of Fame?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deletePlayer(player.id);
          await loadPlayers();
        },
      },
    ]);
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const sortedAndFiltered = React.useMemo(() => {
    let list = [...players];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.position || '').toLowerCase().includes(q));
    }

    // Position filter
    if (posFilter !== 'All') {
      list = list.filter(p => p.position === posFilter);
    }

    // Age filter
    if (ageFilter !== 'All') {
      list = list.filter(p => {
        const age = parseInt(p.age);
        if (isNaN(age)) return false;
        if (ageFilter === 'U18') return age < 18;
        if (ageFilter === 'U21') return age >= 18 && age <= 21;
        if (ageFilter === 'Senior') return age > 21;
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'rating') { valA = a.overall || 0; valB = b.overall || 0; }
      else if (sortKey === 'name') { valA = a.name || ''; valB = b.name || ''; return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA); }
      else if (sortKey === 'age') { valA = parseInt(a.age) || 0; valB = parseInt(b.age) || 0; }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [players, sortKey, sortAsc, search, posFilter, ageFilter]);

  const topRating = players.length ? Math.max(...players.map(p => p.overall || 0)) : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 Hall of Fame</Text>
          <Text style={styles.subtitle}>{players.length} Players Registered</Text>
          {topRating > 0 && (
            <View style={styles.topRatingBadge}>
              <Text style={styles.topRatingText}>👑 Top Rating: {topRating} OVR</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or position..."
            placeholderTextColor="#3a6186"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort buttons */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>SORT BY:</Text>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, sortKey === opt.key && styles.sortBtnActive]}
              onPress={() => toggleSort(opt.key)}
            >
              <Text style={[styles.sortBtnText, sortKey === opt.key && styles.sortBtnTextActive]}>
                {opt.label} {sortKey === opt.key ? (sortAsc ? '↑' : '↓') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterGroupLabel}>AGE:</Text>
          {['All', 'U18', 'U21', 'Senior'].map(a => (
            <TouchableOpacity key={a} style={[styles.filterChip, ageFilter === a && styles.filterChipActive]} onPress={() => setAgeFilter(a)}>
              <Text style={[styles.filterChipText, ageFilter === a && styles.filterChipTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Position filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posFilterScroll}>
          <View style={styles.posFilterRow}>
            {POSITIONS.map(pos => (
              <TouchableOpacity key={pos} style={[styles.posChip, posFilter === pos && styles.posChipActive]} onPress={() => setPosFilter(pos)}>
                <Text style={[styles.posChipText, posFilter === pos && styles.posChipTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Results count */}
        {(search || posFilter !== 'All' || ageFilter !== 'All') && (
          <Text style={styles.resultsCount}>{sortedAndFiltered.length} result{sortedAndFiltered.length !== 1 ? 's' : ''} found</Text>
        )}

        {/* Player list */}
        {sortedAndFiltered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyText}>
              {players.length === 0 ? 'No players yet' : 'No players match filters'}
            </Text>
            {players.length === 0 && (
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/ProfileForm')}>
                <Text style={styles.createBtnText}>+ Create Player</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.list}>
            {sortedAndFiltered.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                rank={i + 1}
                animDelay={i * 70}
                onShare={() => handleShare(player)}
                onDelete={() => handleDelete(player)}
                onPress={() => {}}
              />
            ))}
          </View>
        )}

        {/* Add player button */}
        <TouchableOpacity style={styles.addPlayerBtn} onPress={() => router.push('/ProfileForm')}>
          <Text style={styles.addPlayerText}>+ Add New Player</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },

  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, alignItems: 'center', backgroundColor: '#0b1220', borderBottomWidth: 1, borderBottomColor: '#1a2f46' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: '#1e88e5', fontSize: 15, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '900', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#3a6186', marginBottom: 10 },
  topRatingBadge: { backgroundColor: '#1a2f46', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  topRatingText: { color: '#ffd700', fontSize: 13, fontWeight: '700' },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111d2e', marginHorizontal: 20, marginTop: 16, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1a2f46' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#dce8f8', fontSize: 14, paddingVertical: 12 },
  searchClear: { color: '#3a6186', fontSize: 16, padding: 4 },

  // Sort
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 14, gap: 8 },
  sortLabel: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46' },
  sortBtnActive: { backgroundColor: '#1246a0', borderColor: '#4fc3f7' },
  sortBtnText: { color: '#3a6186', fontSize: 11, fontWeight: '700' },
  sortBtnTextActive: { color: '#fff' },

  // Age filter
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, gap: 8 },
  filterGroupLabel: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46' },
  filterChipActive: { backgroundColor: '#28a745', borderColor: '#66bb6a' },
  filterChipText: { color: '#3a6186', fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: '#fff' },

  // Position filter
  posFilterScroll: { marginTop: 10 },
  posFilterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  posChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#111d2e', borderWidth: 1, borderColor: '#1a2f46' },
  posChipActive: { backgroundColor: '#c0392b', borderColor: '#e53935' },
  posChipText: { color: '#3a6186', fontSize: 12, fontWeight: '700' },
  posChipTextActive: { color: '#fff' },

  resultsCount: { color: '#3a6186', fontSize: 12, fontWeight: '600', paddingHorizontal: 20, marginTop: 10 },

  // List
  list: { padding: 16, gap: 14 },

  // Card
  card: { backgroundColor: '#111d2e', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2f46' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rankBadge: { width: 36, alignItems: 'center' },
  rankMedal: { fontSize: 24 },
  rankNum: { fontSize: 14, fontWeight: '800', color: '#3a6186' },

  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, backgroundColor: '#0d1620', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#dce8f8' },
  ratingBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#111d2e' },
  ratingBadgeNum: { fontSize: 8, fontWeight: '900', color: '#080f1a' },

  playerInfo: { flex: 1 },
  playerName: { color: '#dce8f8', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  positionTag: { backgroundColor: '#1246a0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  positionText: { color: '#4fc3f7', fontSize: 10, fontWeight: '800' },
  agePill: { color: '#3a6186', fontSize: 10, fontWeight: '700', backgroundColor: '#1a2f46', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  attributeRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  attrPill: { backgroundColor: '#1a2f46', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignItems: 'center', minWidth: 36 },
  attrVal: { color: '#ffd700', fontSize: 11, fontWeight: '800' },
  attrLabel: { color: '#3a6186', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },

  overallWrap: { alignItems: 'center' },
  overallNum: { fontSize: 30, fontWeight: '900' },
  overallLabel: { color: '#3a6186', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1a2f46' },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 6 },
  actionDivider: { width: 1, backgroundColor: '#1a2f46' },
  actionIcon: { fontSize: 16 },
  actionLabel: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },

  // Empty
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#3a6186', fontSize: 17, fontWeight: '600', marginBottom: 20 },
  createBtn: { backgroundColor: '#28a745', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  addPlayerBtn: { backgroundColor: '#1246a0', marginHorizontal: 20, marginTop: 8, padding: 16, borderRadius: 14, alignItems: 'center' },
  addPlayerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});