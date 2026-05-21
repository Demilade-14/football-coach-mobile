// src/components/PlayerCardFC26.js
// FIX 1: GK position now shows DIV/HAN/KIC/REF/SPD/POS instead of PAC/SHO/PAS/DRI/DEF/PHY
// FIX 2: Overall is taken directly from the `overall` prop — no internal recalculation
//        so the correct position-aware rating from ProfileForm is always used
// FIX 3: Rating floor removed — low ratings display correctly (e.g. 12, 25, 38)

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ── Helpers ───────────────────────────────────────────────────

const isGK = (pos) => pos === 'GK' || pos === 'Goalkeeper';

const avg = (attrs, keys) => {
  const vals = keys.map(k => Number(attrs?.[k]) || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

// Six outfield stats shown for non-GK players
const getOutfieldStats = (attrs = {}) => [
  { label: 'PAC', value: avg(attrs, ['acceleration', 'sprintSpeed']) },
  { label: 'SHO', value: avg(attrs, ['finishing', 'shotPower', 'longShots', 'volleys', 'penalties']) },
  { label: 'PAS', value: avg(attrs, ['vision', 'crossing', 'shortPassing', 'longPassing', 'curve']) },
  { label: 'DRI', value: avg(attrs, ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure']) },
  { label: 'DEF', value: avg(attrs, ['interceptions', 'headingAccuracy', 'marking', 'standingTackle', 'slidingTackle']) },
  { label: 'PHY', value: avg(attrs, ['jumping', 'stamina', 'strength', 'aggression']) },
];

// Six GK-specific stats shown only when position is GK
const getGKStats = (attrs = {}) => [
  { label: 'DIV', value: Number(attrs?.diving)      || 0 },
  { label: 'HAN', value: Number(attrs?.handling)    || 0 },
  { label: 'KIC', value: Number(attrs?.kicking)     || 0 },
  { label: 'REF', value: Number(attrs?.reflexes)    || 0 },
  { label: 'SPD', value: avg(attrs, ['acceleration', 'sprintSpeed']) },
  { label: 'POS', value: Number(attrs?.positioning) || 0 },
];

// Tier styling based on overall
const getTier = (ovr) => {
  if (ovr >= 85) return { label: 'ICON',   border: '#9b59b6', bg: 'rgba(155,89,182,0.15)' };
  if (ovr >= 80) return { label: 'ELITE',  border: '#ffd700', bg: 'rgba(255,215,0,0.12)' };
  if (ovr >= 75) return { label: 'GOLD',   border: '#ffa726', bg: 'rgba(255,167,38,0.12)' };
  if (ovr >= 65) return { label: 'SILVER', border: '#90a4ae', bg: 'rgba(144,164,174,0.12)' };
  if (ovr >= 55) return { label: 'BRONZE', border: '#cd7f32', bg: 'rgba(205,127,50,0.12)' };
  if (ovr >= 40) return { label: 'IRON',   border: '#ef5350', bg: 'rgba(239,83,80,0.10)' };
  return           { label: 'ROOKIE',  border: '#78909c', bg: 'rgba(120,144,156,0.10)' };
};

// Stat value colour
const statColor = (v) => {
  if (v >= 75) return '#4caf50';
  if (v >= 55) return '#ffc107';
  if (v >= 1)  return '#ef5350';
  return '#4a6278'; // 0 = greyed out
};

const FLAG_MAP = {
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  France: '🇫🇷', Germany: '🇩🇪', Spain: '🇪🇸', Italy: '🇮🇹',
  Portugal: '🇵🇹', Netherlands: '🇳🇱', Belgium: '🇧🇪',
  Brazil: '🇧🇷', Argentina: '🇦🇷', Nigeria: '🇳🇬', Ghana: '🇬🇭',
  Senegal: '🇸🇳', 'South Africa': '🇿🇦', Egypt: '🇪🇬',
  'United States': '🇺🇸', Mexico: '🇲🇽', Canada: '🇨🇦',
  Japan: '🇯🇵', 'South Korea': '🇰🇷', Australia: '🇦🇺',
  China: '🇨🇳', India: '🇮🇳', Turkey: '🇹🇷', Poland: '🇵🇱',
  Norway: '🇳🇴', Sweden: '🇸🇪', Denmark: '🇩🇰', Switzerland: '🇨🇭',
  Austria: '🇦🇹', Russia: '🇷🇺', Ukraine: '🇺🇦', 'Saudi Arabia': '🇸🇦',
};

// ── Main component ────────────────────────────────────────────

const PlayerCardFC26 = ({ player = {} }) => {
  const {
    name            = 'Anonymous',
    position        = 'ST',
    attrs           = {},
    age,
    height          = '',
    nationality     = '',
    club            = '',
    jersey          = '',
    skillMoves      = 3,
    weakFoot        = 3,
    image           = null,
    playStyles      = [],
    attackWorkRate  = 'High',
    defenseWorkRate = 'Medium',
    bodyType        = 'average',
    archetype       = '',
    // ── KEY FIX: use overall directly from ProfileForm, never recalculate here ──
    overall         = 0,
  } = player;

  const gk    = isGK(position);
  const tier  = getTier(overall);
  // Switch the stat grid based on position
  const stats = gk ? getGKStats(attrs) : getOutfieldStats(attrs);
  const flag  = FLAG_MAP[nationality] || '🌍';

  return (
    <View style={[c.wrapper, { borderColor: tier.border, backgroundColor: '#0d1b2a' }]}>

      {/* Top bar */}
      <View style={[c.topBar, { backgroundColor: tier.bg }]}>
        <View style={c.ovrBlock}>
          <Text style={[c.ovrNum, { color: tier.border }]}>{overall}</Text>
          <Text style={c.posLabel}>{position}</Text>
        </View>
        {!!jersey && (
          <View style={c.jerseyBadge}>
            <Text style={c.jerseyText}>#{jersey}</Text>
          </View>
        )}
        <View style={[c.tierBadge, { backgroundColor: tier.border }]}>
          <Text style={c.tierText}>{tier.label}</Text>
        </View>
      </View>

      {/* Name */}
      <Text style={c.name} numberOfLines={1}>{String(name).toUpperCase()}</Text>

      {/* Player image */}
      <View style={c.imageWrap}>
        {image
          ? <Image source={{ uri: image }} style={c.playerImage} />
          : (
            <View style={c.noImage}>
              <Text style={c.noImageIcon}>{gk ? '🧤' : '⚽'}</Text>
              <Text style={c.noImageText}>No Photo</Text>
            </View>
          )
        }
      </View>

      {/* Club / flag / nationality */}
      <View style={c.metaRow}>
        <View style={c.metaBadge}>
          <Text style={c.metaText}>{club ? club.substring(0, 3).toUpperCase() : 'CLB'}</Text>
        </View>
        <Text style={c.flagText}>{flag}</Text>
        <View style={c.metaBadge}>
          <Text style={c.metaText}>{nationality ? nationality.substring(0, 3).toUpperCase() : 'NAT'}</Text>
        </View>
      </View>

      <View style={[c.divider, { backgroundColor: tier.border + '44' }]} />

      {/* Stats grid — switches between GK and outfield */}
      <View style={c.statsGrid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={c.statCell}>
            <Text style={[c.statVal, { color: statColor(value) }]}>{value}</Text>
            <Text style={c.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* GK hint */}
      {gk && (
        <Text style={c.gkHint}>🧤 GK — DIV · HAN · KIC · REF · SPD · POS</Text>
      )}

      <View style={[c.divider, { backgroundColor: tier.border + '44' }]} />

      {/* Footer: skill moves / archetype / weak foot */}
      <View style={c.footer}>
        <View style={c.footerSide}>
          <Text style={c.starLine}>{'★'.repeat(skillMoves)}{'☆'.repeat(5 - skillMoves)}</Text>
          <Text style={c.footerSub}>{skillMoves}★ SM</Text>
        </View>
        {!!archetype && (
          <View style={[c.archetypeChip, { borderColor: tier.border }]}>
            <Text style={[c.archetypeText, { color: tier.border }]} numberOfLines={1}>{archetype}</Text>
          </View>
        )}
        <View style={[c.footerSide, { alignItems: 'flex-end' }]}>
          <Text style={c.starLine}>{'★'.repeat(weakFoot)}{'☆'.repeat(5 - weakFoot)}</Text>
          <Text style={c.footerSub}>{weakFoot}★ WF</Text>
        </View>
      </View>

      {/* PlayStyles */}
      {playStyles && playStyles.length > 0 && (
        <View style={c.psRow}>
          {playStyles.slice(0, 4).map(ps => (
            <View key={ps} style={[c.psChip, { borderColor: tier.border + '66' }]}>
              <Text style={c.psText} numberOfLines={1}>{ps}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Work rates */}
      <View style={c.wrRow}>
        <Text style={c.wrText}>⚔️ {attackWorkRate}</Text>
        <Text style={c.wrDot}>·</Text>
        <Text style={c.wrText}>🛡️ {defenseWorkRate}</Text>
        {!!bodyType && (
          <>
            <Text style={c.wrDot}>·</Text>
            <Text style={c.wrText}>
              {bodyType === 'lean' ? '🏃' : bodyType === 'stocky' ? '💪' : '⚖️'} {bodyType}
            </Text>
          </>
        )}
      </View>

    </View>
  );
};

export default PlayerCardFC26;

// ── Styles ────────────────────────────────────────────────────

const c = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  ovrBlock:     { alignItems: 'center', minWidth: 44 },
  ovrNum:       { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  posLabel:     { color: '#7f8c8d', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  jerseyBadge:  { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  jerseyText:   { color: '#7f8c8d', fontSize: 12, fontWeight: '700' },
  tierBadge:    { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierText:     { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  name: {
    color: '#ecf0f1',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 10,
  },

  imageWrap:   { alignItems: 'center', marginBottom: 10 },
  playerImage: { width: 120, height: 120, borderRadius: 12 },
  noImage: {
    width: 120, height: 120, borderRadius: 12,
    backgroundColor: '#091525',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  noImageIcon: { fontSize: 30, marginBottom: 4 },
  noImageText: { color: '#3a6186', fontSize: 11 },

  metaRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  metaBadge:  { backgroundColor: '#091525', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, minWidth: 40, alignItems: 'center' },
  metaText:   { color: '#7f8c8d', fontSize: 11, fontWeight: '700' },
  flagText:   { fontSize: 22 },

  divider: { height: 1, marginVertical: 8, borderRadius: 1 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statCell:  { width: '30%', alignItems: 'center', marginVertical: 6 },
  statVal:   { fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#7f8c8d', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  gkHint: {
    color: '#3a6186',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerSide: { flex: 1 },
  starLine:   { color: '#f39c12', fontSize: 11 },
  footerSub:  { color: '#7f8c8d', fontSize: 9, marginTop: 2 },

  archetypeChip: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignItems: 'center', maxWidth: 100,
  },
  archetypeText: { fontSize: 10, fontWeight: '800' },

  psRow:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 8 },
  psChip: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: '#091525',
  },
  psText: { color: '#7f8c8d', fontSize: 9, fontWeight: '600' },

  wrRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6, gap: 4 },
  wrText: { color: '#7f8c8d', fontSize: 9 },
  wrDot:  { color: '#1e3a5f', fontSize: 9 },
});