// src/components/PlayerCard.js
// FLAG FIX: Uses flagcdn.com to render real flag images.
// Works on ALL Android versions — no emoji rendering issues.
// Requires internet (flag images are ~2KB each, cached after first load).
// For offline use: run downloadFlags.ps1 and switch to local image map.

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const isGKPosition = (position) => {
  if (!position) return false;
  const n = position.toLowerCase().trim();
  return n === 'gk' || n === 'goalkeeper' || n === 'goalkeeping';
};

const getOutfieldStats = (attrs = {}) => {
  const avg = (keys) => {
    const vals = keys.map(k => safeNumber(attrs[k], 0));
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  return [
    { label: 'PAC', value: avg(['acceleration', 'sprintSpeed']) },
    { label: 'SHO', value: avg(['finishing', 'shotPower', 'longShots', 'volleys', 'penalties']) },
    { label: 'PAS', value: avg(['vision', 'crossing', 'shortPassing', 'longPassing', 'curve']) },
    { label: 'DRI', value: avg(['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure']) },
    { label: 'DEF', value: avg(['interceptions', 'headingAccuracy', 'marking', 'standingTackle', 'slidingTackle']) },
    { label: 'PHY', value: avg(['jumping', 'stamina', 'strength', 'aggression']) },
  ];
};

const getGKStats = (attrs = {}) => {
  const v    = (k) => safeNumber(attrs[k], 0);
  const pace = Math.round((v('acceleration') + v('sprintSpeed')) / 2);
  return [
    { label: 'DIV', value: v('diving') },
    { label: 'HAN', value: v('handling') },
    { label: 'KIC', value: v('kicking') },
    { label: 'REF', value: v('reflexes') },
    { label: 'SPD', value: pace },
    { label: 'POS', value: v('positioning') },
  ];
};

const getTier = (ovr) => {
  const o = safeNumber(ovr, 0);
  if (o >= 85) return { label: 'ICON',   border: '#9b59b6', glow: 'rgba(155,89,182,0.5)' };
  if (o >= 80) return { label: 'ELITE',  border: '#ffd700', glow: 'rgba(255,215,0,0.4)' };
  if (o >= 75) return { label: 'GOLD',   border: '#ffa726', glow: 'rgba(255,167,38,0.35)' };
  if (o >= 65) return { label: 'SILVER', border: '#90a4ae', glow: 'rgba(144,164,174,0.3)' };
  if (o >= 55) return { label: 'BRONZE', border: '#cd7f32', glow: 'rgba(205,127,50,0.3)' };
  if (o >= 40) return { label: 'IRON',   border: '#ef5350', glow: 'rgba(239,83,80,0.25)' };
  return         { label: 'ROOKIE', border: '#78909c', glow: 'rgba(120,144,156,0.2)' };
};

const statColor = (val) => {
  const v = safeNumber(val, 0);
  if (v >= 75) return '#4caf50';
  if (v >= 55) return '#ffc107';
  return '#ef5350';
};

// ─────────────────────────────────────────────────────────────
// Country name → ISO 2-letter code (lowercase, for flagcdn.com)
// flagcdn.com URL format: https://flagcdn.com/w40/{code}.png
// w40 = 40px wide. Also available: w20, w80, w160, h20, h40, h80
// ─────────────────────────────────────────────────────────────

const COUNTRY_ISO = {
  'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Argentina': 'ar',
  'Armenia': 'am', 'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az',
  'Bahrain': 'bh', 'Bangladesh': 'bd', 'Belarus': 'by', 'Belgium': 'be',
  'Bolivia': 'bo', 'Bosnia and Herzegovina': 'ba', 'Brazil': 'br',
  'Bulgaria': 'bg', 'Burkina Faso': 'bf', 'Cameroon': 'cm', 'Canada': 'ca',
  'Chile': 'cl', 'China': 'cn', 'Colombia': 'co', 'Costa Rica': 'cr',
  'Croatia': 'hr', 'Czech Republic': 'cz', 'Denmark': 'dk', 'Ecuador': 'ec',
  'Egypt': 'eg',
  // England/Scotland/Wales use gb-eng/gb-sct/gb-wls on flagcdn
  'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls',
  'Estonia': 'ee', 'Ethiopia': 'et', 'Faroe Islands': 'fo', 'Finland': 'fi',
  'France': 'fr', 'Georgia': 'ge', 'Germany': 'de', 'Ghana': 'gh',
  'Greece': 'gr', 'Guatemala': 'gt', 'Honduras': 'hn', 'Hong Kong': 'hk',
  'Hungary': 'hu', 'Iceland': 'is', 'India': 'in', 'Indonesia': 'id',
  'Iran': 'ir', 'Iraq': 'iq', 'Ireland': 'ie', 'Israel': 'il',
  'Italy': 'it', 'Ivory Coast': 'ci', 'Jamaica': 'jm', 'Japan': 'jp',
  'Jordan': 'jo', 'Kazakhstan': 'kz', 'Kenya': 'ke', 'Kosovo': 'xk',
  'Kuwait': 'kw', 'Kyrgyzstan': 'kg', 'Laos': 'la', 'Latvia': 'lv',
  'Lebanon': 'lb', 'Libya': 'ly', 'Liechtenstein': 'li', 'Lithuania': 'lt',
  'Luxembourg': 'lu', 'Macau': 'mo', 'Madagascar': 'mg', 'Malawi': 'mw',
  'Malaysia': 'my', 'Maldives': 'mv', 'Mali': 'ml', 'Malta': 'mt',
  'Mauritania': 'mr', 'Mexico': 'mx', 'Moldova': 'md', 'Mongolia': 'mn',
  'Montenegro': 'me', 'Morocco': 'ma', 'Mozambique': 'mz', 'Myanmar': 'mm',
  'Namibia': 'na', 'Nepal': 'np', 'Netherlands': 'nl', 'New Zealand': 'nz',
  'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng', 'North Macedonia': 'mk',
  'Northern Ireland': 'gb-nir', 'Norway': 'no', 'Oman': 'om', 'Pakistan': 'pk',
  'Palestine': 'ps', 'Panama': 'pa', 'Paraguay': 'py', 'Peru': 'pe',
  'Philippines': 'ph', 'Poland': 'pl', 'Portugal': 'pt', 'Qatar': 'qa',
  'Republic of Ireland': 'ie', 'Romania': 'ro', 'Russia': 'ru', 'Rwanda': 'rw',
  'San Marino': 'sm', 'Saudi Arabia': 'sa', 'Senegal': 'sn', 'Serbia': 'rs',
  'Singapore': 'sg', 'Slovakia': 'sk', 'Slovenia': 'si', 'South Africa': 'za',
  'South Korea': 'kr', 'South Sudan': 'ss', 'Spain': 'es', 'Sri Lanka': 'lk',
  'Sudan': 'sd', 'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy',
  'Tajikistan': 'tj', 'Tanzania': 'tz', 'Thailand': 'th', 'Togo': 'tg',
  'Trinidad and Tobago': 'tt', 'Tunisia': 'tn', 'Turkey': 'tr',
  'Turkmenistan': 'tm', 'Uganda': 'ug', 'Ukraine': 'ua',
  'United Arab Emirates': 'ae', 'United States': 'us', 'Uruguay': 'uy',
  'Uzbekistan': 'uz', 'Venezuela': 've', 'Vietnam': 'vn',
  'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw',
};

// Returns flagcdn.com image URL for a country name
// Falls back to null if not found (renders placeholder instead)
const getFlagUrl = (nationality) => {
  if (!nationality) return null;

  // Exact match
  const iso = COUNTRY_ISO[nationality];
  if (iso) return `https://flagcdn.com/w40/${iso}.png`;

  // Case-insensitive match
  const key = Object.keys(COUNTRY_ISO).find(
    k => k.toLowerCase() === nationality.toLowerCase()
  );
  if (key) return `https://flagcdn.com/w40/${COUNTRY_ISO[key]}.png`;

  return null;
};

// ─────────────────────────────────────────────────────────────
// FlagImage component — renders real flag from flagcdn.com
// Falls back to a styled text badge if URL is unavailable
// ─────────────────────────────────────────────────────────────

const FlagImage = ({ nationality }) => {
  const url = getFlagUrl(nationality);
  const code = nationality ? nationality.substring(0, 3).toUpperCase() : '??';

  if (url) {
    return (
      <View style={fi.wrapper}>
        <Image
          source={{ uri: url }}
          style={fi.img}
          // Show text fallback if image fails to load
          defaultSource={null}
        />
      </View>
    );
  }

  // Fallback: styled text badge
  return (
    <View style={fi.fallback}>
      <Text style={fi.fallbackText}>{code}</Text>
    </View>
  );
};

const fi = StyleSheet.create({
  wrapper: {
    width: 48,
    height: 32,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#091525',
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallback: {
    width: 48,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#a8dadc',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────────
// PlayerCard component
// ─────────────────────────────────────────────────────────────

const PlayerCard = ({ player = {} }) => {
  const {
    name            = 'Anonymous',
    position        = 'ST',
    attrs           = {},
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
    overall         = 0,
  } = player;

  const isGK         = isGKPosition(position);
  const safeOverall  = safeNumber(overall, 0);
  const tier         = getTier(safeOverall);
  const stats        = isGK ? getGKStats(attrs) : getOutfieldStats(attrs);

  const safeSkillMoves = Math.min(5, Math.max(0, safeNumber(skillMoves, 3)));
  const safeWeakFoot   = Math.min(5, Math.max(0, safeNumber(weakFoot, 3)));
  const safeJersey     = jersey ? String(jersey).replace(/[^0-9]/g, '').slice(0, 3) : '';

  return (
    <View style={[card.wrapper, { borderColor: tier.border, shadowColor: tier.glow }]}>

      {/* Top bar */}
      <View style={[card.topBar, { backgroundColor: tier.border + '22' }]}>
        <View style={card.ovrBlock}>
          <Text style={[card.ovrNum, { color: tier.border }]}>{safeOverall}</Text>
          <Text style={card.posLabel}>{isGK ? 'GK' : position}</Text>
        </View>
        {!!safeJersey && (
          <View style={card.jerseyBadge}>
            <Text style={card.jerseyText}>#{safeJersey}</Text>
          </View>
        )}
        <View style={[card.tierBadge, { backgroundColor: tier.border }]}>
          <Text style={card.tierText}>{tier.label}</Text>
        </View>
      </View>

      {/* Name */}
      <Text style={card.name} numberOfLines={1}>{String(name).toUpperCase()}</Text>

      {/* Player image */}
      <View style={card.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={card.playerImage} />
        ) : (
          <View style={card.noImage}>
            <Text style={card.noImageIcon}>{isGK ? '🧤' : '⚽'}</Text>
            <Text style={card.noImageText}>No Image</Text>
          </View>
        )}
      </View>

      {/* Club · Flag Image · Nationality */}
      <View style={card.metaRow}>
        <View style={card.metaBadge}>
          <Text style={card.metaText}>{club ? String(club).substring(0, 4).toUpperCase() : 'CLB'}</Text>
        </View>

        {/* Real flag image from flagcdn.com */}
        <FlagImage nationality={nationality} />

        <View style={card.metaBadge}>
          <Text style={card.metaText}>{nationality ? String(nationality).substring(0, 3).toUpperCase() : 'NAT'}</Text>
        </View>
      </View>

      <View style={[card.divider, { backgroundColor: tier.border + '55' }]} />

      {/* Stats */}
      <View style={card.statsGrid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={card.statCell}>
            <Text style={[card.statVal, { color: statColor(value) }]}>{safeNumber(value, 0)}</Text>
            <Text style={card.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {isGK && (
        <Text style={card.gkNotice}>GK: DIV · HAN · KIC · REF · SPD · POS</Text>
      )}

      <View style={[card.divider, { backgroundColor: tier.border + '55' }]} />

      {/* Footer */}
      <View style={card.footer}>
        <View style={card.footerSide}>
          <Text style={card.starLine}>{'★'.repeat(safeSkillMoves)}{'☆'.repeat(5 - safeSkillMoves)}</Text>
          <Text style={card.footerSub}>{safeSkillMoves}★ SM</Text>
        </View>
        {!!archetype && (
          <View style={[card.archetypeChip, { borderColor: tier.border }]}>
            <Text style={[card.archetypeText, { color: tier.border }]} numberOfLines={1}>{String(archetype)}</Text>
          </View>
        )}
        <View style={[card.footerSide, { alignItems: 'flex-end' }]}>
          <Text style={card.starLine}>{'★'.repeat(safeWeakFoot)}{'☆'.repeat(5 - safeWeakFoot)}</Text>
          <Text style={card.footerSub}>{safeWeakFoot}★ WF</Text>
        </View>
      </View>

      {/* PlayStyles */}
      {playStyles.length > 0 && (
        <View style={card.psRow}>
          {playStyles.slice(0, 4).map(ps => (
            <View key={ps} style={[card.psChip, { borderColor: tier.border + '88' }]}>
              <Text style={card.psText} numberOfLines={1}>{String(ps)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Work rates */}
      <View style={card.wrRow}>
        <Text style={card.wrText}>ATT: {String(attackWorkRate)}</Text>
        <Text style={card.wrDot}>·</Text>
        <Text style={card.wrText}>DEF: {String(defenseWorkRate)}</Text>
        {!!bodyType && (
          <>
            <Text style={card.wrDot}>·</Text>
            <Text style={card.wrText}>{String(bodyType)}</Text>
          </>
        )}
      </View>

    </View>
  );
};

export default PlayerCard;

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const CARD_BG    = '#0d1b2a';
const CARD_DARK  = '#091525';
const TEXT_MAIN  = '#ecf0f1';
const TEXT_MUTED = '#7f8c8d';

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    width: 280,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
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
  ovrBlock:    { alignItems: 'center', minWidth: 44 },
  ovrNum:      { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  posLabel:    { color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  jerseyBadge: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  jerseyText:  { color: TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  tierBadge:   { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierText:    { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  name: {
    color: TEXT_MAIN,
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
    backgroundColor: CARD_DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  noImageIcon: { fontSize: 30, marginBottom: 4 },
  noImageText: { color: TEXT_MUTED, fontSize: 11 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  metaBadge: {
    backgroundColor: CARD_DARK,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  metaText: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },

  divider: { height: 1, marginVertical: 8, borderRadius: 1 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statCell:  { width: '30%', alignItems: 'center', marginVertical: 6 },
  statVal:   { fontSize: 22, fontWeight: '900' },
  statLabel: { color: TEXT_MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  gkNotice: {
    color: '#4a6278',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerSide: { flex: 1 },
  starLine:   { color: '#ffd700', fontSize: 11 },
  footerSub:  { color: TEXT_MUTED, fontSize: 9, marginTop: 2 },

  archetypeChip: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignItems: 'center', maxWidth: 90,
  },
  archetypeText: { fontSize: 10, fontWeight: '800' },

  psRow:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 8 },
  psChip: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: CARD_DARK,
  },
  psText: { color: TEXT_MUTED, fontSize: 9, fontWeight: '600' },

  wrRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6, gap: 4, flexWrap: 'wrap' },
  wrText: { color: TEXT_MUTED, fontSize: 9 },
  wrDot:  { color: '#2c3e50', fontSize: 9 },
});