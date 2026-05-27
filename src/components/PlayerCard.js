// src/components/PlayerCard.js
// ✅ Clean, error-free player card component
// ✅ GK position shows DIV/HAN/KIC/REF/SPD/POS
// ✅ Outfield shows PAC/SHO/PAS/DRI/DEF/PHY
// ✅ Tier-based border colors & badges
// ✅ NaN-safe number handling
// ✅ Smart flag lookup (handles full names, 3-letter & 2-letter codes)

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ✅ Helper: Safe number formatter (prevents NaN errors)
const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

// ✅ FIX: Properly detect GK position (handles 'GK', 'Goalkeeper', 'Goalkeeping')
const isGKPosition = (position) => {
  if (!position) return false;
  const normalized = position.toLowerCase().trim();
  return normalized === 'gk' || 
         normalized === 'goalkeeper' || 
         normalized === 'goalkeeping';
};

/** Six outfield category averages */
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

/** Six GK category values — shown only when position is GK */
const getGKStats = (attrs = {}) => {
  const v = (k) => safeNumber(attrs[k], 0);
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

/** Tier label + colours based on overall */
const getTier = (ovr) => {
  const safeOvr = safeNumber(ovr, 0);
  if (safeOvr >= 85) return { label: 'ICON',   border: '#9b59b6', glow: 'rgba(155,89,182,0.5)' };
  if (safeOvr >= 80) return { label: 'ELITE',  border: '#ffd700', glow: 'rgba(255,215,0,0.4)' };
  if (safeOvr >= 75) return { label: 'GOLD',   border: '#ffa726', glow: 'rgba(255,167,38,0.35)' };
  if (safeOvr >= 65) return { label: 'SILVER', border: '#90a4ae', glow: 'rgba(144,164,174,0.3)' };
  if (safeOvr >= 55) return { label: 'BRONZE', border: '#cd7f32', glow: 'rgba(205,127,50,0.3)' };
  if (safeOvr >= 40) return { label: 'IRON',   border: '#ef5350', glow: 'rgba(239,83,80,0.25)' };
  return { label: 'ROOKIE', border: '#78909c', glow: 'rgba(120,144,156,0.2)' };
};

/** Stat value colour: green ≥75, yellow ≥55, red below */
const statColor = (val) => {
  const safeVal = safeNumber(val, 0);
  if (safeVal >= 75) return '#4caf50';
  if (safeVal >= 55) return '#ffc107';
  return '#ef5350';
};

// ✅ Flag emoji map - ALL flags are complete 2-character regional indicators
// Includes special tag sequences for England/Scotland/Wales
const FLAG_MAP = {
  // Full country names
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷',
  'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bahrain': '🇧🇭', 'Bangladesh': '🇧🇩', 'Belarus': '🇧🇾', 'Belgium': '🇧🇪',
  'Bolivia': '🇧🇴', 'Bosnia and Herzegovina': '🇧🇦', 'Brazil': '🇧🇷',
  'Bulgaria': '🇧🇬', 'Burkina Faso': '🇧🇫', 'Cameroon': '🇨🇲', 'Canada': '🇨🇦',
  'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Costa Rica': '🇨🇷',
  'Croatia': '🇭🇷', 'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰', 'Ecuador': '🇪🇨',
  'Egypt': '🇪🇬', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Estonia': '🇪🇪', 'Ethiopia': '🇪🇹',
  'Faroe Islands': '🇫🇴', 'Finland': '🇫🇮', 'France': '🇫🇷', 'Georgia': '🇬🇪',
  'Germany': '🇩🇪', 'Ghana': '🇬🇭', 'Greece': '🇬🇷', 'Guatemala': '🇬🇹',
  'Honduras': '🇭🇳', 'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺', 'Iceland': '🇮🇸',
  'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
  'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Ivory Coast': '🇨🇮',
  'Jamaica': '🇯🇲', 'Japan': '🇯🇵', 'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿',
  'Kenya': '🇰🇪', 'Kosovo': '🇽🇰', 'Kuwait': '🇰🇼', 'Kyrgyzstan': '🇰🇬',
  'Laos': '🇱🇦', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Libya': '🇱🇾',
  'Liechtenstein': '🇱🇮', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺', 'Macau': '🇲🇴',
  'Madagascar': '🇲🇬', 'Malawi': '🇲🇼', 'Malaysia': '🇲🇾', 'Maldives': '🇲🇻',
  'Mali': '🇲🇱', 'Malta': '🇲🇹', 'Mauritania': '🇲🇷', 'Mexico': '🇲🇽',
  'Moldova': '🇲🇩', 'Mongolia': '🇲🇳', 'Montenegro': '🇲🇪', 'Morocco': '🇲🇦',
  'Mozambique': '🇲🇿', 'Myanmar': '🇲🇲', 'Namibia': '🇳🇦', 'Nepal': '🇳🇵',
  'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nicaragua': '🇳🇮', 'Niger': '🇳🇪',
  'Nigeria': '🇳🇬', 'North Macedonia': '🇲🇰', 'Northern Ireland': '🇬🇧',
  'Norway': '🇳🇴', 'Oman': '🇴🇲', 'Pakistan': '🇵🇰', 'Palestine': '🇵🇸',
  'Panama': '🇵🇦', 'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Philippines': '🇵🇭',
  'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Qatar': '🇶🇦', 'Republic of Ireland': '🇮🇪',
  'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Rwanda': '🇷🇼', 'San Marino': '🇸🇲',
  'Saudi Arabia': '🇸🇦', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Senegal': '🇸🇳', 'Serbia': '🇷🇸',
  'Singapore': '🇸🇬', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'South Africa': '🇿🇦',
  'South Korea': '🇰🇷', 'South Sudan': '🇸🇸', 'Spain': '🇪🇸', 'Sri Lanka': '🇱🇰',
  'Sudan': '🇸🇩', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Syria': '🇸🇾',
  'Tajikistan': '🇹🇯', 'Tanzania': '🇹🇿', 'Thailand': '🇹🇭', 'Togo': '🇹🇬',
  'Trinidad and Tobago': '🇹🇹', 'Tunisia': '🇹🇳', 'Turkey': '🇹🇷', 'Turkmenistan': '🇹🇲',
  'Uganda': '🇺🇬', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪',
  'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿', 'Venezuela': '🇻🇪',
  'Vietnam': '🇻🇳', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Yemen': '🇾🇪', 'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼',
  
  // 3-letter country codes (ISO 3166-1 alpha-3)
  'AFG': '🇦🇫', 'ALB': '🇦🇱', 'DZA': '🇩🇿', 'ARG': '🇦🇷',
  'ARM': '🇦🇲', 'AUS': '🇦🇺', 'AUT': '🇦🇹', 'AZE': '🇦🇿',
  'BHR': '🇧🇭', 'BGD': '🇧🇩', 'BLR': '🇧🇾', 'BEL': '🇧🇪',
  'BOL': '🇧🇴', 'BIH': '🇧🇦', 'BRA': '🇧🇷', 'BGR': '🇧🇬',
  'BFA': '🇧🇫', 'CMR': '🇨🇲', 'CAN': '🇨🇦', 'CHL': '🇨🇱',
  'CHN': '🇨🇳', 'COL': '🇨🇴', 'CRI': '🇨🇷', 'HRV': '🇭🇷',
  'CZE': '🇨🇿', 'DNK': '🇩🇰', 'ECU': '🇪🇨', 'EGY': '🇪🇬',
  'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'EST': '🇪🇪', 'ETH': '🇪🇹', 'FRO': '🇫🇴',
  'FIN': '🇫🇮', 'FRA': '🇫🇷', 'GEO': '🇬🇪', 'DEU': '🇩🇪',
  'GHA': '🇬🇭', 'GRC': '🇬🇷', 'GTM': '🇬🇹', 'HND': '🇭🇳',
  'HKG': '🇭🇰', 'HUN': '🇭🇺', 'ISL': '🇮🇸', 'IND': '🇮🇳',
  'IDN': '🇮🇩', 'IRN': '🇮🇷', 'IRQ': '🇮🇶', 'IRL': '🇮🇪',
  'ISR': '🇮🇱', 'ITA': '🇮🇹', 'CIV': '🇨🇮', 'JAM': '🇯🇲',
  'JPN': '🇯🇵', 'JOR': '🇯🇴', 'KAZ': '🇰🇿', 'KEN': '🇰🇪',
  'XKX': '🇽🇰', 'KWT': '🇰🇼', 'KGZ': '🇰🇬', 'LAO': '🇱🇦',
  'LVA': '🇱🇻', 'LBN': '🇱🇧', 'LBY': '🇱🇾', 'LIE': '🇱🇮',
  'LTU': '🇱🇹', 'LUX': '🇱🇺', 'MAC': '🇲🇴', 'MDG': '🇲🇬',
  'MWI': '🇲🇼', 'MYS': '🇲🇾', 'MDV': '🇲🇻', 'MLI': '🇲🇱',
  'MLT': '🇲🇹', 'MRT': '🇲🇷', 'MEX': '🇲🇽', 'MDA': '🇲🇩',
  'MNG': '🇲🇳', 'MNE': '🇲🇪', 'MAR': '🇲🇦', 'MOZ': '🇲🇿',
  'MMR': '🇲🇲', 'NAM': '🇳🇦', 'NPL': '🇳🇵', 'NLD': '🇳🇱',
  'NZL': '🇳🇿', 'NIC': '🇳🇮', 'NER': '🇳🇪', 'NGA': '🇳🇬',
  'MKD': '🇲🇰', 'NIR': '🇬🇧', 'NOR': '🇳🇴', 'OMN': '🇴🇲',
  'PAK': '🇵🇰', 'PSE': '🇵🇸', 'PAN': '🇵🇦', 'PRY': '🇵🇾',
  'PER': '🇵🇪', 'PHL': '🇵🇭', 'POL': '🇵🇱', 'PRT': '🇵🇹',
  'QAT': '🇶🇦', 'ROU': '🇷🇴', 'RUS': '🇷🇺', 'RWA': '🇷🇼',
  'SMR': '🇸🇲', 'SAU': '🇸🇦', 'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'SEN': '🇸🇳',
  'SRB': '🇷🇸', 'SGP': '🇸🇬', 'SVK': '🇸🇰', 'SVN': '🇸🇮',
  'ZAF': '🇿🇦', 'KOR': '🇰🇷', 'SSD': '🇸🇸', 'ESP': '🇪🇸',
  'LKA': '🇱🇰', 'SDN': '🇸🇩', 'SWE': '🇸🇪', 'CHE': '🇨🇭',
  'SYR': '🇸🇾', 'TJK': '🇹🇯', 'TZA': '🇹🇿', 'THA': '🇹🇭',
  'TGO': '🇹🇬', 'TTO': '🇹🇹', 'TUN': '🇹🇳', 'TUR': '🇹🇷',
  'TKM': '🇹🇲', 'UGA': '🇺🇬', 'UKR': '🇺🇦', 'ARE': '🇦🇪',
  'USA': '🇺🇸', 'URY': '🇺🇾', 'UZB': '🇺🇿', 'VEN': '🇻🇪',
  'VNM': '🇻🇳', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'YEM': '🇾🇪', 'ZMB': '🇿🇲',
  'ZWE': '🇿🇼',
  
  // 2-letter country codes (ISO 3166-1 alpha-2)
  'AF': '🇦🇫', 'AL': '🇦🇱', 'DZ': '🇩🇿', 'AR': '🇦🇷',
  'AM': '🇦🇲', 'AU': '🇦🇺', 'AT': '🇦🇹', 'AZ': '🇦🇿',
  'BH': '🇧🇭', 'BD': '🇧🇩', 'BY': '🇧🇾', 'BE': '🇧🇪',
  'BO': '🇧🇴', 'BA': '🇧🇦', 'BR': '🇧🇷', 'BG': '🇧🇬',
  'BF': '🇧🇫', 'CM': '🇨🇲', 'CA': '🇨🇦', 'CL': '🇨🇱',
  'CN': '🇨🇳', 'CO': '🇨🇴', 'CR': '🇨🇷', 'HR': '🇭🇷',
  'CZ': '🇨🇿', 'DK': '🇩🇰', 'EC': '🇪🇨', 'EG': '🇪🇬',
  'GB-ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'EE': '🇪🇪', 'ET': '🇪🇹', 'FO': '🇫🇴',
  'FI': '🇫🇮', 'FR': '🇫🇷', 'GE': '🇬🇪', 'DE': '🇩🇪',
  'GH': '🇬🇭', 'GR': '🇬🇷', 'GT': '🇬🇹', 'HN': '🇭🇳',
  'HK': '🇭🇰', 'HU': '🇭🇺', 'IS': '🇮🇸', 'IN': '🇮🇳',
  'ID': '🇮🇩', 'IR': '🇮🇷', 'IQ': '🇮🇶', 'IE': '🇮🇪',
  'IL': '🇮🇱', 'IT': '🇮🇹', 'CI': '🇨🇮', 'JM': '🇯🇲',
  'JP': '🇯🇵', 'JO': '🇯🇴', 'KZ': '🇰🇿', 'KE': '🇰🇪',
  'XK': '🇽🇰', 'KW': '🇰🇼', 'KG': '🇰🇬', 'LA': '🇱🇦',
  'LV': '🇱🇻', 'LB': '🇱🇧', 'LY': '🇱🇾', 'LI': '🇱🇮',
  'LT': '🇱🇹', 'LU': '🇱🇺', 'MO': '🇲🇴', 'MG': '🇲🇬',
  'MW': '🇲🇼', 'MY': '🇲🇾', 'MV': '🇲🇻', 'ML': '🇲🇱',
  'MT': '🇲🇹', 'MR': '🇲🇷', 'MX': '🇲🇽', 'MD': '🇲🇩',
  'MN': '🇲🇳', 'ME': '🇲🇪', 'MA': '🇲🇦', 'MZ': '🇲🇿',
  'MM': '🇲🇲', 'NA': '🇳🇦', 'NP': '🇳🇵', 'NL': '🇳🇱',
  'NZ': '🇳🇿', 'NI': '🇳🇮', 'NE': '🇳🇪', 'NG': '🇳🇬',
  'MK': '🇲🇰', 'GB-NIR': '🇬🇧', 'NO': '🇳🇴', 'OM': '🇴🇲',
  'PK': '🇵🇰', 'PS': '🇵🇸', 'PA': '🇵🇦', 'PY': '🇵🇾',
  'PE': '🇵🇪', 'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹',
  'QA': '🇶🇦', 'RO': '🇷🇴', 'RU': '🇷🇺', 'RW': '🇷🇼',
  'SM': '🇸🇲', 'SA': '🇸🇦', 'GB-SCT': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'SN': '🇸🇳',
  'RS': '🇷🇸', 'SG': '🇸🇬', 'SK': '🇸🇰', 'SI': '🇸🇮',
  'ZA': '🇿🇦', 'KR': '🇰🇷', 'SS': '🇸🇸', 'ES': '🇪🇸',
  'LK': '🇱🇰', 'SD': '🇸🇩', 'SE': '🇸🇪', 'CH': '🇨🇭',
  'SY': '🇸🇾', 'TJ': '🇹🇯', 'TZ': '🇹🇿', 'TH': '🇹🇭',
  'TG': '🇹🇬', 'TT': '🇹🇹', 'TN': '🇹🇳', 'TR': '🇹🇷',
  'TM': '🇹🇲', 'UG': '🇺🇬', 'UA': '🇺🇦', 'AE': '🇦🇪',
  'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VE': '🇻🇪',
  'VN': '🇻🇳', 'GB-WLS': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'YE': '🇾🇪', 'ZM': '🇿🇲',
  'ZW': '🇿🇼'
};

// ✅ Smart flag lookup helper - handles full names, 3-letter & 2-letter codes
const getFlag = (nationality) => {
  if (!nationality) return '🌍';
  
  // Try exact match first (case-sensitive)
  if (FLAG_MAP[nationality]) return FLAG_MAP[nationality];
  
  // Try uppercase match
  const upper = nationality.toUpperCase();
  if (FLAG_MAP[upper]) return FLAG_MAP[upper];
  
  // Try title case (first letter uppercase)
  const title = nationality.charAt(0).toUpperCase() + nationality.slice(1).toLowerCase();
  if (FLAG_MAP[title]) return FLAG_MAP[title];
  
  // Fallback to globe
  return '🌍';
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const PlayerCard = ({ player = {} }) => {
  const {
    name = 'Anonymous',
    position = 'ST',
    attrs = {},
    age = 20,
    height = '',
    weight = '',
    nationality = '',
    club = '',
    jersey = '',
    skillMoves = 3,
    weakFoot = 3,
    image = null,
    playStyles = [],
    attackWorkRate = 'High',
    defenseWorkRate = 'Medium',
    bodyType = 'average',
    archetype = '',
    overall = 0,
  } = player;

  // ✅ Use fixed GK detection
  const isGK = isGKPosition(position);
  
  // ✅ Safe overall for tier calculation
  const safeOverall = safeNumber(overall, 0);
  const tier = getTier(safeOverall);
  
  // ✅ Safe stats based on position
  const stats = isGK ? getGKStats(attrs) : getOutfieldStats(attrs);
  
  // ✅ Get flag with smart lookup
  const flag = getFlag(nationality);

  // ✅ Safe values for display (prevent NaN in <Text>)
  const safeSkillMoves = Math.min(5, Math.max(0, safeNumber(skillMoves, 3)));
  const safeWeakFoot = Math.min(5, Math.max(0, safeNumber(weakFoot, 3)));
  const safeJersey = jersey ? String(jersey).replace(/[^0-9]/g, '').slice(0, 3) : '';

  return (
    <View style={[card.wrapper, { borderColor: tier.border, shadowColor: tier.glow }]}>

      {/* ── Top bar: overall + position + tier ── */}
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

      {/* ── Name ── */}
      <Text style={card.name} numberOfLines={1}>{String(name).toUpperCase()}</Text>

      {/* ── Player image ── */}
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

      {/* ── Club + flag + nationality ── */}
      <View style={card.metaRow}>
        <View style={card.metaBadge}>
          <Text style={card.metaText}>{club ? String(club).substring(0, 3).toUpperCase() : 'CLB'}</Text>
        </View>
        <View style={card.metaCenter}>
          <Text style={card.flagText}>{flag}</Text>
        </View>
        <View style={card.metaBadge}>
          <Text style={card.metaText}>{nationality ? String(nationality).substring(0, 3).toUpperCase() : 'NAT'}</Text>
        </View>
      </View>

      <View style={[card.divider, { backgroundColor: tier.border + '55' }]} />

      {/* ── Stats grid ── */}
      <View style={card.statsGrid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={card.statCell}>
            <Text style={[card.statVal, { color: statColor(value) }]}>{safeNumber(value, 0)}</Text>
            <Text style={card.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── GK notice ── */}
      {isGK && (
        <Text style={card.gkNotice}>🧤 GK: DIV · HAN · KIC · REF · SPD · POS</Text>
      )}

      <View style={[card.divider, { backgroundColor: tier.border + '55' }]} />

      {/* ── Footer: skill moves + archetype + weak foot ── */}
      <View style={card.footer}>
        <View style={card.footerSide}>
          <Text style={card.starLine}>{'★'.repeat(safeSkillMoves)}{'☆'.repeat(5 - safeSkillMoves)}</Text>
          <Text style={card.footerSub}>{safeSkillMoves}★ SM</Text>
        </View>
        {!!archetype && (
          <View style={[card.archetypeChip, { borderColor: tier.border }]}>
            <Text style={[card.archetypeText, { color: tier.border }]}>{String(archetype)}</Text>
          </View>
        )}
        <View style={[card.footerSide, { alignItems: 'flex-end' }]}>
          <Text style={card.starLine}>{'★'.repeat(safeWeakFoot)}{'☆'.repeat(5 - safeWeakFoot)}</Text>
          <Text style={card.footerSub}>{safeWeakFoot}★ WF</Text>
        </View>
      </View>

      {/* ── PlayStyles ── */}
      {playStyles.length > 0 && (
        <View style={card.psRow}>
          {playStyles.slice(0, 4).map(ps => (
            <View key={ps} style={[card.psChip, { borderColor: tier.border + '88' }]}>
              <Text style={card.psText} numberOfLines={1}>{String(ps)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Work rates + body type ── */}
      <View style={card.wrRow}>
        <Text style={card.wrText}>⚔️ {String(attackWorkRate)}</Text>
        <Text style={card.wrDot}>·</Text>
        <Text style={card.wrText}>🛡️ {String(defenseWorkRate)}</Text>
        {!!bodyType && (
          <>
            <Text style={card.wrDot}>·</Text>
            <Text style={card.wrText}>
              {bodyType === 'lean' ? '🏃' : bodyType === 'stocky' ? '💪' : '⚖️'} {String(bodyType)}
            </Text>
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

const CARD_BG   = '#0d1b2a';
const CARD_DARK = '#091525';
const TEXT_MAIN = '#ecf0f1';
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
  ovrBlock: { alignItems: 'center', minWidth: 44 },
  ovrNum: { fontSize: 34, fontWeight: '900', lineHeight: 38 },
  posLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  jerseyBadge: { 
    backgroundColor: 'rgba(255,255,255,0.07)', 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 3 
  },
  jerseyText: { color: TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  tierBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tierText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  name: {
    color: TEXT_MAIN,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 10,
  },
  imageWrap: { alignItems: 'center', marginBottom: 10 },
  playerImage: { width: 120, height: 120, borderRadius: 12 },
  noImage: {
    width: 120, height: 120, borderRadius: 12,
    backgroundColor: CARD_DARK,
    justifyContent: 'center', alignItems: 'center',
  },
  noImageIcon: { fontSize: 30, marginBottom: 4 },
  noImageText: { color: TEXT_MUTED, fontSize: 11 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metaBadge: { backgroundColor: CARD_DARK, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  metaText: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  metaCenter: { flex: 1, alignItems: 'center' },
  flagText: { fontSize: 20 },
  divider: { height: 1, marginVertical: 8, borderRadius: 1 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statCell: { width: '30%', alignItems: 'center', marginVertical: 6 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: TEXT_MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  gkNotice: {
    color: '#4a6278',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerSide: { flex: 1 },
  starLine: { color: '#ffd700', fontSize: 11 },
  footerSub: { color: TEXT_MUTED, fontSize: 9, marginTop: 2 },
  archetypeChip: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignItems: 'center',
  },
  archetypeText: { fontSize: 10, fontWeight: '800' },
  psRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 8 },
  psChip: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: CARD_DARK,
  },
  psText: { color: TEXT_MUTED, fontSize: 9, fontWeight: '600' },
  wrRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6, gap: 4 },
  wrText: { color: TEXT_MUTED, fontSize: 9 },
  wrDot: { color: '#2c3e50', fontSize: 9 },
});