// app/ProfileForm.js
// ✅ Position-aware overall calculation
// ✅ Expanded attributes (Pro Clubs style)
// ✅ NaN-safe number handling
// ✅ Auto-position detection

import React, { useState, useEffect } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity,
  Alert, Image, Modal, FlatList, Platform, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import DraggableSlider from '../src/components/DraggableSlider';
import PlayerCard from '../src/components/PlayerCard';
import {
  getImprovementTips,
  savePlayer,
  getTotalPlayersCount,
  canSaveMorePlayers,
} from '../src/utils/playerDatabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

// ─────────────────────────────────────────────────────────────
// Helper: Safe number formatter
// ─────────────────────────────────────────────────────────────
const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

// ─────────────────────────────────────────────────────────────
// POSITION-AWARE calculateOverall
// ─────────────────────────────────────────────────────────────

const isGKPosition = (pos) => {
  const normalized = pos?.toLowerCase() || '';
  return normalized === 'gk' || 
         normalized === 'goalkeeper' || 
         normalized === 'goalkeeping';
};

/**
 * Weights used for GK overall.
 * High weight on reflexes, diving, handling, positioning.
 */
const GK_WEIGHTS = {
  reflexes:    1.8,
  diving:      1.6,
  handling:    1.5,
  positioning: 1.4,
  kicking:     0.8,
  acceleration: 0.3,
  sprintSpeed:  0.3,
  reactions:    0.5,
};

/**
 * Weights used for all outfield positions.
 * GK-specific attrs are intentionally omitted.
 */
const OUTFIELD_WEIGHTS = {
  acceleration: 0.8,  sprintSpeed:  0.8,
  finishing:    1.2,  shotPower:    1.0,  longShots:  0.7,
  volleys:      0.5,  penalties:    0.5,
  vision:       1.1,  crossing:     0.8,  shortPassing: 1.2,
  longPassing:  0.9,  curve:        0.5,
  agility:      0.9,  balance:      0.7,  reactions:    1.0,
  ballControl:  1.1,  dribbling:    1.1,  composure:    1.0,
  interceptions: 0.9, headingAccuracy: 0.8, marking: 0.9,
  standingTackle: 1.0, slidingTackle: 0.8,
  jumping:      0.6,  stamina:      1.0,  strength:    0.8,
  aggression:   0.6,
};

const calculateOverall = (attrs, age, options = {}, position = 'ST') => {
  const weights = isGKPosition(position) ? GK_WEIGHTS : OUTFIELD_WEIGHTS;

  let total = 0, maxPossible = 0;
  Object.entries(weights).forEach(([key, w]) => {
    total       += (Number(attrs[key]) || 0) * w;
    maxPossible += 99 * w;
  });

  if (maxPossible === 0) return 1;

  let raw = Math.round((total / maxPossible) * 99);

  // Age bonus
  const numAge = parseInt(age) || 15;
  if (numAge <= 16 && raw >= 50) raw = Math.min(99, raw + 2);
  if (numAge <= 14 && raw >= 40) raw = Math.min(99, raw + 3);

  // Support boosts
  if (options.disability   && raw < 60) raw = Math.min(raw + 5, 60);
  if (options.mentalStress && raw < 60) raw = Math.min(raw + 3, 60);

  return Math.max(1, Math.min(99, raw));
};

// ─────────────────────────────────────────────────────────────
// Auto position detector based on stat distribution
// ─────────────────────────────────────────────────────────────
const detectPosition = (attrs) => {
  const get = (keys) => keys.reduce((s, k) => s + (Number(attrs[k]) || 0), 0) / keys.length;
  const scores = {
    GK:  get(['diving', 'handling', 'reflexes', 'kicking', 'positioning']),
    CB:  get(['standingTackle', 'slidingTackle', 'headingAccuracy', 'marking', 'strength', 'jumping']),
    LB:  get(['standingTackle', 'sprintSpeed', 'crossing', 'stamina', 'acceleration']),
    RB:  get(['standingTackle', 'sprintSpeed', 'crossing', 'stamina', 'acceleration']),
    LWB: get(['acceleration', 'sprintSpeed', 'crossing', 'stamina', 'dribbling']),
    RWB: get(['acceleration', 'sprintSpeed', 'crossing', 'stamina', 'dribbling']),
    CDM: get(['interceptions', 'marking', 'shortPassing', 'stamina', 'strength', 'standingTackle']),
    CM:  get(['shortPassing', 'vision', 'stamina', 'ballControl', 'reactions', 'longPassing']),
    LM:  get(['acceleration', 'crossing', 'dribbling', 'stamina', 'shortPassing']),
    RM:  get(['acceleration', 'crossing', 'dribbling', 'stamina', 'shortPassing']),
    CAM: get(['vision', 'shortPassing', 'dribbling', 'finishing', 'ballControl', 'composure']),
    LW:  get(['acceleration', 'sprintSpeed', 'dribbling', 'finishing', 'agility', 'ballControl']),
    RW:  get(['acceleration', 'sprintSpeed', 'dribbling', 'finishing', 'agility', 'ballControl']),
    SS:  get(['finishing', 'dribbling', 'agility', 'reactions', 'composure', 'acceleration']),
    CF:  get(['finishing', 'vision', 'shortPassing', 'dribbling', 'reactions', 'composure']),
    ST:  get(['finishing', 'shotPower', 'headingAccuracy', 'reactions', 'composure', 'acceleration']),
  };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestPos, bestScore] = sorted[0];
  const totalFilled = Object.values(attrs).filter(v => v > 0).length;
  if (totalFilled < 5) return { position: null, confidence: 'too few stats' };
  const confidence = bestScore >= 70 ? 'High' : bestScore >= 50 ? 'Medium' : 'Low';
  return { position: bestPos, confidence, alternatives: sorted.slice(0, 3).map(([p]) => p) };
};

// ─────────────────────────────────────────────────────────────
// FC26 DATA
// ─────────────────────────────────────────────────────────────
const FC26_ARCHETYPES = {
  Attacker: {
    icon: '⚽', color: '#e74c3c',
    roles: {
      Finisher: { icon: '🎯', sig: ['Low Driven Shot', 'First Touch'],  desc: 'Clinical striker, killer instinct in the box.' },
      Magician: { icon: '🪄', sig: ['Technical', 'Finesse Shot'],       desc: 'Creative forward, dribbling & vision.' },
      Target:   { icon: '💪', sig: ['Aerial+', 'Hold Up Play'],         desc: 'Physical presence, aerial duels & hold-up.' },
      Spark:    { icon: '⚡', sig: ['Quick Step', 'Whipped Pass'],      desc: 'Burst pace, wing-based creativity.' },
    },
  },
  Midfielder: {
    icon: '🎮', color: '#3498db',
    roles: {
      Maestro:  { icon: '🎼', sig: ['Tiki Taka', 'Technical'],          desc: 'Controls pitch, precise distribution.' },
      Creator:  { icon: '🔑', sig: ['Incisive Pass', 'Flair'],          desc: 'Inventive passes to break defences.' },
      Recycler: { icon: '♻️', sig: ['Press Proven', 'Intercept'],       desc: 'Recycles possession efficiently.' },
    },
  },
  Defender: {
    icon: '🛡️', color: '#27ae60',
    roles: {
      Boss:       { icon: '🦁', sig: ['Bruiser', 'Aerial'],              desc: 'Big tackles, strong headers, dominance.' },
      Engine:     { icon: '🔋', sig: ['Jockey', 'Relentless'],           desc: 'Relentless stamina across 90 minutes.' },
      Progressor: { icon: '📈', sig: ['Long Ball+', 'Anticipate'],       desc: 'CB who pushes into midfield.' },
      Marauder:   { icon: '🏃', sig: ['Whipped Pass', 'Quick Step'],     desc: 'Attacking fullback, pace & delivery.' },
    },
  },
  Goalkeeper: {
    icon: '🧤', color: '#9b59b6',
    roles: {
      'Shot Stopper':   { icon: '🧱', sig: ['Footwork', 'Deflector'],   desc: 'Standard GK, stops low shots.' },
      'Sweeper Keeper': { icon: '🌊', sig: ['Rush Out', 'Far Throw'],   desc: 'Aggressive GK, sweeps behind defence.' },
    },
  },
};

const ALL_PLAYSTYLES = [
  'Finesse Shot', 'Low Driven Shot', 'Power Shot', 'Chip Shot',
  'Incisive Pass', 'Tiki Taka', 'Long Ball+', 'Whipped Pass', 'Flair',
  'Technical', 'Quick Step', 'First Touch', 'Rapid',
  'Intercept', 'Anticipate', 'Jockey', 'Bruiser', 'Aerial',
  'Relentless', 'Hold Up Play', 'Press Proven',
  'Footwork', 'Deflector', 'Rush Out', 'Far Throw',
];

const POSITIONS = {
  GK:  { x: 50, y: 90, label: 'GK' },
  CB:  { x: 50, y: 74, label: 'CB' },
  LB:  { x: 18, y: 74, label: 'LB' },
  RB:  { x: 82, y: 74, label: 'RB' },
  LWB: { x: 10, y: 62, label: 'LWB' },
  RWB: { x: 90, y: 62, label: 'RWB' },
  CDM: { x: 50, y: 60, label: 'CDM' },
  LM:  { x: 12, y: 46, label: 'LM' },
  CM:  { x: 50, y: 48, label: 'CM' },
  RM:  { x: 88, y: 46, label: 'RM' },
  CAM: { x: 50, y: 34, label: 'CAM' },
  LW:  { x: 12, y: 20, label: 'LW' },
  RW:  { x: 88, y: 20, label: 'RW' },
  CF:  { x: 50, y: 22, label: 'CF' },
  SS:  { x: 33, y: 12, label: 'SS' },
  ST:  { x: 65, y: 10, label: 'ST' },
};

const WORK_RATE_OPTIONS = ['High', 'Medium', 'Low'];
const BODY_TYPES = [
  { id: 'lean',    label: 'Lean',    icon: '🏃', desc: 'Fast & agile' },
  { id: 'average', label: 'Average', icon: '⚽', desc: 'Balanced' },
  { id: 'stocky',  label: 'Stocky',  icon: '💪', desc: 'Strong & powerful' },
];

// ─────────────────────────────────────────────────────────────
// EXPANDED ATTRIBUTES (Pro Clubs Style)
// ─────────────────────────────────────────────────────────────

const INITIAL_ATTRS = {
  // Pace
  acceleration: 0,
  sprintSpeed: 0,
  
  // Shooting
  attackingPosition: 0,
  finishing: 0,
  shotPower: 0,
  longShots: 0,
  volleys: 0,
  penalties: 0,
  
  // Passing
  vision: 0,
  crossing: 0,
  fkAccuracy: 0,
  shortPassing: 0,
  longPassing: 0,
  curve: 0,
  
  // Dribbling
  agility: 0,
  balance: 0,
  reactions: 0,
  ballControl: 0,
  dribbling: 0,
  composure: 0,
  
  // Defending
  interceptions: 0,
  headingAccuracy: 0,
  defensiveAwareness: 0,
  standingTackle: 0,
  slidingTackle: 0,
  
  // Physical
  jumping: 0,
  stamina: 0,
  strength: 0,
  aggression: 0,
  
  // Goalkeeping
  diving: 0,
  handling: 0,
  kicking: 0,
  positioning: 0,
  reflexes: 0,
};

const ATTR_CATEGORIES = [
  { 
    key: 'dribbling', 
    label: '⚽ Dribbling', 
    color: '#e74c3c', 
    attrs: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'] 
  },
  { 
    key: 'shooting', 
    label: '🎯 Shooting', 
    color: '#e67e22', 
    attrs: ['attackingPosition', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties'] 
  },
  { 
    key: 'passing', 
    label: '🔵 Passing', 
    color: '#3498db', 
    attrs: ['vision', 'crossing', 'fkAccuracy', 'shortPassing', 'longPassing', 'curve'] 
  },
  { 
    key: 'defending', 
    label: '🛡️ Defending', 
    color: '#8e44ad', 
    attrs: ['interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle'] 
  },
  { 
    key: 'pace', 
    label: '⚡ Pace', 
    color: '#2ecc71', 
    attrs: ['acceleration', 'sprintSpeed'] 
  },
  { 
    key: 'physical', 
    label: '💪 Physical', 
    color: '#c0392b', 
    attrs: ['jumping', 'stamina', 'strength', 'aggression'] 
  },
  { 
    key: 'goalkeeping', 
    label: '🧤 Goalkeeping', 
    color: '#7f8c8d', 
    attrs: ['diving', 'handling', 'kicking', 'positioning', 'reflexes'] 
  },
];

const ATTR_LABELS = {
  // Pace
  acceleration: 'Acceleration',
  sprintSpeed: 'Sprint Speed',
  
  // Shooting
  attackingPosition: 'Att. Position',
  finishing: 'Finishing',
  shotPower: 'Shot Power',
  longShots: 'Long Shots',
  volleys: 'Volleys',
  penalties: 'Penalties',
  
  // Passing
  vision: 'Vision',
  crossing: 'Crossing',
  fkAccuracy: 'FK Accuracy',
  shortPassing: 'Short Passing',
  longPassing: 'Long Passing',
  curve: 'Curve',
  
  // Dribbling
  agility: 'Agility',
  balance: 'Balance',
  reactions: 'Reactions',
  ballControl: 'Ball Control',
  dribbling: 'Dribbling',
  composure: 'Composure',
  
  // Defending
  interceptions: 'Interceptions',
  headingAccuracy: 'Heading Accuracy',
  defensiveAwareness: 'Def. Awareness',
  standingTackle: 'Standing Tackle',
  slidingTackle: 'Sliding Tackle',
  
  // Physical
  jumping: 'Jumping',
  stamina: 'Stamina',
  strength: 'Strength',
  aggression: 'Aggression',
  
  // Goalkeeping
  diving: 'Diving',
  handling: 'Handling',
  kicking: 'Kicking',
  positioning: 'Positioning',
  reflexes: 'Reflexes',
};

const ARCHETYPE_ATTRS = {
  Finisher:         { finishing: 82, shotPower: 80, positioning: 75, reactions: 72, composure: 78 },
  Magician:         { dribbling: 84, agility: 82, ballControl: 80, vision: 75, curve: 70 },
  Target:           { headingAccuracy: 82, strength: 84, jumping: 80, shotPower: 75, aggression: 72 },
  Spark:            { acceleration: 86, sprintSpeed: 84, dribbling: 78, crossing: 74, agility: 80 },
  Maestro:          { shortPassing: 84, vision: 82, longPassing: 78, ballControl: 76, stamina: 74 },
  Creator:          { vision: 82, shortPassing: 80, longPassing: 76, dribbling: 74, curve: 72 },
  Recycler:         { interceptions: 80, shortPassing: 78, stamina: 82, marking: 74, aggression: 70 },
  Boss:             { standingTackle: 84, headingAccuracy: 82, strength: 84, marking: 78, jumping: 76 },
  Engine:           { stamina: 88, interceptions: 76, aggression: 72, slidingTackle: 74, marking: 70 },
  Progressor:       { longPassing: 78, strength: 76, acceleration: 70, standingTackle: 76, headingAccuracy: 74 },
  Marauder:         { acceleration: 82, sprintSpeed: 80, crossing: 78, longPassing: 72, stamina: 76 },
  'Shot Stopper':   { reflexes: 86, diving: 82, handling: 78, positioning: 76, kicking: 65 },
  'Sweeper Keeper': { reflexes: 80, diving: 78, handling: 80, positioning: 82, kicking: 76 },
  Custom:           {},
};

// ── Sub-components ────────────────────────────────────────────

const CategoryScoreBar = ({ category, attrs }) => {
  const vals = category.attrs.map(k => attrs[k] || 0);
  const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
      <Text style={{ color: '#ecf0f1', fontSize: 11, width: 90 }}>{category.label}</Text>
      <View style={{ flex: 1, height: 6, backgroundColor: '#1a2636', borderRadius: 3, overflow: 'hidden', marginHorizontal: 6 }}>
        <View style={{ height: '100%', width: `${avg}%`, backgroundColor: category.color, borderRadius: 3 }} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color: category.color, width: 28, textAlign: 'right' }}>{avg}</Text>
    </View>
  );
};

const PositionPicker = ({ selected, onSelect, detectedPosition }) => {
  const PITCH_H = 240;
  const PITCH_W = SCREEN_WIDTH - (isSmallScreen ? 44 : 60);
  return (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <View style={[ps.pitch, { width: PITCH_W, height: PITCH_H }]}>
        <View style={ps.centerLine} />
        <View style={ps.centerCircle} />
        <View style={ps.penTop} />
        <View style={ps.penBottom} />
        {Object.entries(POSITIONS).map(([pos, { x, y, label }]) => {
          const left       = (x / 100) * PITCH_W - 20;
          const top        = (y / 100) * PITCH_H - 14;
          const active     = selected === pos;
          const isDetected = detectedPosition === pos && !active;
          return (
            <TouchableOpacity
              key={pos}
              style={[ps.dot, { left, top }, active && ps.dotActive, isDetected && ps.dotDetected]}
              onPress={() => onSelect(pos)}
            >
              <Text style={[ps.dotLabel, active && ps.dotLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ color: '#4a6278', fontSize: 10, marginTop: 6 }}>
        🔵 = AI suggested  |  🟡 = selected
      </Text>
    </View>
  );
};

const ps = StyleSheet.create({
  pitch:         { backgroundColor: '#1a6b2f', borderRadius: 8, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#27ae60' },
  centerLine:    { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  centerCircle:  { position: 'absolute', top: '50%', left: '50%', width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginLeft: -22, marginTop: -22 },
  penTop:        { position: 'absolute', top: 0, left: '25%', width: '50%', height: '16%', borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  penBottom:     { position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '16%', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  dot:           { position: 'absolute', width: 40, height: 22, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  dotActive:     { backgroundColor: '#f39c12', borderColor: '#f1c40f' },
  dotDetected:   { backgroundColor: '#1e88e5', borderColor: '#4fc3f7' },
  dotLabel:      { color: '#ecf0f1', fontSize: 8, fontWeight: 'bold' },
  dotLabelActive:{ color: '#1a1a1a' },
});

// ── Main component ─────────────────────────────────────────────

const ProfileForm = () => {
  const router = useRouter();

  const [name, setName]                     = useState('');
  const [dateOfBirth, setDateOfBirth]       = useState('');
  const [age, setAge]                       = useState('15');
  const [height, setHeight]                 = useState('');
  const [weight, setWeight]                 = useState('');
  const [nationality, setNationality]       = useState('');
  const [club, setClub]                     = useState('');
  const [jersey, setJersey]                 = useState('');
  const [preferredFoot, setPreferredFoot]   = useState('Right');
  const [skillMoves, setSkillMoves]         = useState(3);
  const [weakFoot, setWeakFoot]             = useState(3);
  const [image, setImage]                   = useState(null);
  const [selectedPosition, setSelectedPosition] = useState('ST');
  const [archetypeGroup, setArchetypeGroup] = useState('Attacker');
  const [archetypeRole, setArchetypeRole]   = useState('Finisher');
  const [selectedPlayStyles, setSelectedPlayStyles] = useState([]);
  const [attackWorkRate, setAttackWorkRate]  = useState('High');
  const [defenseWorkRate, setDefenseWorkRate] = useState('Medium');
  const [bodyType, setBodyType]             = useState('average');
  const [disability, setDisability]         = useState(false);
  const [mentalStress, setMentalStress]     = useState(false);
  const [formProgress, setFormProgress]     = useState(0);
  const [cardData, setCardData]             = useState(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch]   = useState('');
  const [expandedCategories, setExpandedCategories] = useState({ pace: true });
  const [attrs, setAttrs]                   = useState(INITIAL_ATTRS);
  const [detectedPosition, setDetectedPosition]     = useState(null);
  const [detectedConfidence, setDetectedConfidence] = useState(null);
  const [detectedAlternatives, setDetectedAlternatives] = useState([]);

  // ── Helpers ──────────────────────────────────────────────

  const calcAgeFromDOB = (dob) => {
    if (!dob) return '15';
    const d = new Date(dob);
    if (isNaN(d)) return '15';
    const today = new Date();
    let y = today.getFullYear() - d.getFullYear();
    if (today.getMonth() - d.getMonth() < 0 ||
       (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) y--;
    return Math.max(4, Math.min(56, y)).toString();
  };

  const maxStars = (ageStr) => {
    const n = parseInt(ageStr) || 15;
    if (n < 12) return 3;
    if (n < 16) return 4;
    return 5;
  };

  const handleAgeChange = (t) => {
    const d = t.replace(/[^0-9]/g, '');
    if (!d) { setAge(''); return; }
    const n = parseInt(d);
    if (n >= 4 && n <= 56) setAge(d);
  };

  const togglePlayStyle = (p) => {
    const sig = FC26_ARCHETYPES[archetypeGroup]?.roles[archetypeRole]?.sig ?? [];
    if (sig.includes(p)) return;
    setSelectedPlayStyles(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : prev.length < 5 ? [...prev, p] : prev
    );
  };

  const toggleCategory = (key) =>
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));

  const applyArchetype = (group, role) => {
    setArchetypeGroup(group);
    setArchetypeRole(role);
    const base   = { ...INITIAL_ATTRS };
    const preset = ARCHETYPE_ATTRS[role] ?? {};
    Object.keys(preset).forEach(k => { if (k in base) base[k] = Math.min(99, preset[k]); });
    setAttrs(base);
    // When Goalkeeper archetype selected — auto-switch position to GK
    if (group === 'Goalkeeper') setSelectedPosition('GK');
    const sigs = FC26_ARCHETYPES[group]?.roles[role]?.sig ?? [];
    setSelectedPlayStyles(sigs.slice(0, 2));
  };

  /**
   * KEY FIX: Normalize position and sanitize numbers
   */
  const buildCardData = (overrides = {}) => {
    const numAge    = parseInt(age) || 15;
    const opts      = { disability, mentalStress };
    const curAttrs  = overrides.attrs ?? attrs;
    
    // ✅ Normalize position for consistent GK detection
    const rawPos    = overrides.position ?? selectedPosition;
    const pos       = rawPos?.toLowerCase() === 'goalkeeping' ? 'GK' : rawPos;
    
    // Position-aware overall
    const overall   = calculateOverall(curAttrs, numAge, opts, pos);
    
    // Sanitize numeric values to prevent NaN
    const sanitizeNumbers = (obj) => {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'number' && Number.isNaN(value)) {
          result[key] = 0;
        } else {
          result[key] = value;
        }
      }
      return result;
    };
    
    const tips = typeof getImprovementTips === 'function'
      ? getImprovementTips(pos, curAttrs, opts)
      : ['Keep training and improving your weakest stats!'];
      
    return {
      name: name || 'Anonymous', 
      age: numAge, 
      height, 
      weight, 
      preferredFoot,
      nationality, 
      club, 
      jersey, 
      skillMoves, 
      weakFoot, 
      image,
      attrs: sanitizeNumbers(curAttrs), 
      overall: safeNumber(overall, 0), 
      tips,
      archetype: archetypeRole, 
      archetypeGroup,
      playStyles: selectedPlayStyles,
      position: pos,
      attackWorkRate, 
      defenseWorkRate, 
      bodyType,
      disability, 
      mentalStress,
      ...overrides,
    };
  };

  // Live preview
  useEffect(() => {
    setCardData(buildCardData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, age, height, weight, preferredFoot, nationality, club, jersey, skillMoves,
      weakFoot, image, attrs, disability, mentalStress, selectedPosition, archetypeRole,
      selectedPlayStyles, attackWorkRate, defenseWorkRate, bodyType]);

  // Auto detect position from attrs
  useEffect(() => {
    const result = detectPosition(attrs);
    if (result.position) {
      setDetectedPosition(result.position);
      setDetectedConfidence(result.confidence);
      setDetectedAlternatives(result.alternatives || []);
    } else {
      setDetectedPosition(null);
    }
  }, [attrs]);

  // Form progress
  useEffect(() => {
    const fields  = [name, age, height, nationality, club];
    const attrCnt = Object.values(attrs).filter(v => v > 0).length;
    const basic   = fields.filter(f => f?.toString().trim()).length / fields.length;
    const attrP   = attrCnt / Object.keys(attrs).length;
    setFormProgress(Math.round((basic * 0.3 + attrP * 0.7) * 100));
  }, [name, age, height, nationality, club, attrs]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission needed', 'Allow photo access!');
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const setAttr = (key, val) => setAttrs(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    const numAge = parseInt(age) || 0;
    if (numAge < 4 || numAge > 56) { Alert.alert('Invalid Age', 'Enter an age between 4 and 56.'); return; }
    const data = { id: Date.now().toString(), ...buildCardData(), createdAt: new Date().toISOString() };
    setCardData(data);
    try {
      const total   = typeof getTotalPlayersCount === 'function' ? await getTotalPlayersCount() : 0;
      const canSave = typeof canSaveMorePlayers   === 'function' ? await canSaveMorePlayers(total) : total < 5;
      if (!canSave) {
        Alert.alert('Player Limit Reached', 'Upgrade to VIP for unlimited players!', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/VIPSubscription') },
        ]);
        return;
      }
      const res = typeof savePlayer === 'function' ? await savePlayer(data) : { success: true };
      if (res?.success) {
        Alert.alert('Card Created! 🎉', 'Your player card has been saved.', [
          { text: 'View Card', onPress: () => router.push('/PlayerCardScreen') },
        ]);
      } else {
        Alert.alert('Error', res?.error || 'Failed to save player');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const currentArchData = FC26_ARCHETYPES[archetypeGroup]?.roles[archetypeRole];
  const sigPlayStyles   = currentArchData?.sig ?? [];
  const numAge          = parseInt(age) || 15;
  // Live overall shown in header banner — also position-aware
  const liveOverall     = calculateOverall(attrs, numAge, { disability, mentalStress }, selectedPosition);

  // ── Render ────────────────────────────────────────────────

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚽ Player Creator</Text>
        <Text style={styles.subtitle}>Build your Virtual Pro</Text>
      </View>

      {/* Live OVR banner */}
      <View style={styles.ovrPreviewCard}>
        <View>
          <Text style={styles.ovrPreviewNum}>{liveOverall}</Text>
          <Text style={styles.ovrPreviewLabel}>
            {isGKPosition(selectedPosition) ? 'GK OVR' : 'CURRENT OVR'}
          </Text>
        </View>
        <View style={styles.ovrPreviewRight}>
          <Text style={[styles.ovrTier, { color: liveOverall >= 85 ? '#ffd700' : liveOverall >= 75 ? '#ffa726' : liveOverall >= 65 ? '#90a4ae' : liveOverall >= 55 ? '#a1887f' : liveOverall >= 40 ? '#ef5350' : '#9e9e9e' }]}>
            {liveOverall >= 85 ? '⭐ ELITE' : liveOverall >= 75 ? '🥇 GOLD' : liveOverall >= 65 ? '🥈 SILVER' : liveOverall >= 55 ? '🥉 BRONZE' : liveOverall >= 40 ? '🔴 IRON' : '⚪ ROOKIE'}
          </Text>
          {isGKPosition(selectedPosition) && (
            <Text style={styles.gkHint}>🧤 Using GK formula: DIV · HAN · KIC · REF · POS</Text>
          )}
          <Text style={styles.ovrNote}>Updates live as you fill stats</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>Profile Completion</Text>
          <Text style={styles.progressPct}>{formProgress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${formProgress}%` }]} />
        </View>
      </View>

      {/* Photo */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>📸 Player Photo</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
            {image
              ? <Image source={{ uri: image }} style={styles.playerImage} />
              : <Text style={styles.imageButtonText}>+ Photo</Text>}
          </TouchableOpacity>
          <View style={styles.photoHint}>
            <Text style={styles.hintText}>Optional — used on your player card</Text>
            <Text style={styles.hintSub}>Square crop recommended</Text>
          </View>
        </View>
      </View>

      {/* Basic info */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>👤 Basic Info</Text>
        <TextInput style={styles.input} placeholder="Player Name (optional)" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" placeholderTextColor="#666"
          value={dateOfBirth}
          onChangeText={t => { setDateOfBirth(t); const c = calcAgeFromDOB(t); if (c !== '15') setAge(c); }}
        />
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Age (4–56)" placeholderTextColor="#666" value={age} onChangeText={handleAgeChange} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Height (cm)" placeholderTextColor="#666" value={height} onChangeText={setHeight} keyboardType="numeric" />
        </View>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Weight (kg)" placeholderTextColor="#666" value={weight} onChangeText={setWeight} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.inputHalf]} placeholder="Jersey #" placeholderTextColor="#666" value={jersey} onChangeText={setJersey} keyboardType="numeric" />
        </View>
        <TouchableOpacity style={styles.input} onPress={() => setShowCountryPicker(true)}>
          <Text style={nationality ? styles.inputText : styles.placeholderText}>
            {nationality || '🌍 Select Nationality'}
          </Text>
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="Club / Team" placeholderTextColor="#666" value={club} onChangeText={setClub} />
      </View>

      {/* Body type */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🏋️ Body Type</Text>
        <View style={styles.bodyTypeRow}>
          {BODY_TYPES.map(bt => (
            <TouchableOpacity key={bt.id} style={[styles.bodyTypeBtn, bodyType === bt.id && styles.bodyTypeBtnActive]} onPress={() => setBodyType(bt.id)}>
              <Text style={styles.bodyTypeIcon}>{bt.icon}</Text>
              <Text style={[styles.bodyTypeLabel, bodyType === bt.id && styles.bodyTypeLabelActive]}>{bt.label}</Text>
              <Text style={styles.bodyTypeDesc}>{bt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Position picker */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>📍 Primary Position</Text>
        <Text style={styles.cardHint}>Tap your position. 🔵 = AI-recommended based on your stats.</Text>
        {detectedPosition && (
          <View style={styles.detectionBanner}>
            <Text style={styles.detectionTitle}>🤖 AI Position Suggestion</Text>
            <Text style={styles.detectionMain}>
              Best fit: <Text style={styles.detectionPos}>{detectedPosition}</Text>
              {'  '}<Text style={styles.detectionConf}>({detectedConfidence} confidence)</Text>
            </Text>
            {detectedAlternatives.length > 1 && (
              <Text style={styles.detectionAlt}>Also suits: {detectedAlternatives.slice(1).join(', ')}</Text>
            )}
            <TouchableOpacity style={styles.applyDetectionBtn} onPress={() => setSelectedPosition(detectedPosition)}>
              <Text style={styles.applyDetectionBtnText}>Apply Suggestion</Text>
            </TouchableOpacity>
          </View>
        )}
        <PositionPicker selected={selectedPosition} onSelect={setSelectedPosition} detectedPosition={detectedPosition} />
        <View style={styles.positionBadgeRow}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionBadgeText}>{selectedPosition}</Text>
          </View>
          <Text style={styles.positionBadgeLabel}>
            {isGKPosition(selectedPosition) ? '🧤 Goalkeeper — GK rating active' : 'Selected Position'}
          </Text>
        </View>
      </View>

      {/* Preferred foot */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>👟 Preferred Foot</Text>
        <View style={styles.footOptions}>
          {['Right', 'Left', 'Both'].map(foot => (
            <TouchableOpacity key={foot} style={[styles.footBtn, preferredFoot === foot && styles.footBtnActive]} onPress={() => setPreferredFoot(foot)}>
              <Text style={[styles.footText, preferredFoot === foot && styles.footTextActive]}>{foot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Work rates */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>⚡ Work Rates</Text>
        <View style={styles.workRateSection}>
          {[['⚔️ Attack', attackWorkRate, setAttackWorkRate], ['🛡️ Defence', defenseWorkRate, setDefenseWorkRate]].map(([label, val, setter]) => (
            <View key={label} style={styles.workRateCol}>
              <Text style={styles.workRateLabel}>{label}</Text>
              <View style={styles.workRateOptions}>
                {WORK_RATE_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} style={[styles.workRateBtn, val === opt && styles.workRateBtnActive]} onPress={() => setter(opt)}>
                    <Text style={[styles.workRateText, val === opt && styles.workRateTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Skill moves + weak foot */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>⭐ Skill Moves & Weak Foot</Text>
        <View style={styles.skillRow}>
          {[['Skill Moves', skillMoves, v => setSkillMoves(Math.min(v, maxStars(age)))],
            ['Weak Foot',   weakFoot,   v => setWeakFoot(Math.min(v, maxStars(age)))]].map(([label, val, setter]) => (
            <View key={label} style={styles.skillCol}>
              <Text style={styles.skillLabel}>{label}</Text>
              <View style={styles.starRow}>
                {[1,2,3,4,5].map(i => (
                  <TouchableOpacity key={i} onPress={() => setter(i)}>
                    <Text style={[styles.star, i <= val ? styles.starOn : styles.starOff]}>{i <= val ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starHint}>Max {maxStars(age)}★ for age {age}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Archetypes */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🏆 Archetype</Text>
        <Text style={styles.cardHint}>Defines your playing style — selecting Goalkeeper auto-sets position to GK</Text>
        <View style={styles.archetypeGroupRow}>
          {Object.entries(FC26_ARCHETYPES).map(([group, { icon, color }]) => (
            <TouchableOpacity key={group}
              style={[styles.groupTab, archetypeGroup === group && { backgroundColor: color }]}
              onPress={() => { const r = Object.keys(FC26_ARCHETYPES[group].roles)[0]; applyArchetype(group, r); }}>
              <Text style={styles.groupTabIcon}>{icon}</Text>
              <Text style={[styles.groupTabLabel, archetypeGroup === group && styles.groupTabLabelActive]}>{group}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.roleGrid}>
          {Object.entries(FC26_ARCHETYPES[archetypeGroup]?.roles ?? {}).map(([role, data]) => (
            <TouchableOpacity key={role}
              style={[styles.roleCard, archetypeRole === role && styles.roleCardActive]}
              onPress={() => applyArchetype(archetypeGroup, role)}>
              <Text style={styles.roleIcon}>{data.icon}</Text>
              <Text style={[styles.roleLabel, archetypeRole === role && styles.roleLabelActive]}>{role}</Text>
              <Text style={styles.roleDesc} numberOfLines={2}>{data.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {currentArchData && (
          <View style={styles.sigRow}>
            <Text style={styles.sigTitle}>Signature: </Text>
            {sigPlayStyles.map(p => (
              <View key={p} style={styles.sigChip}><Text style={styles.sigChipText}>{p}</Text></View>
            ))}
          </View>
        )}
      </View>

      {/* PlayStyles */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🎮 PlayStyles</Text>
        <Text style={styles.cardHint}>Gold = Signature (locked). Up to 5 total. {selectedPlayStyles.length}/5 selected</Text>
        <View style={styles.psGrid}>
          {ALL_PLAYSTYLES.map(p => {
            const isSig  = sigPlayStyles.includes(p);
            const isPick = selectedPlayStyles.includes(p);
            return (
              <TouchableOpacity key={p}
                style={[styles.psChip, isSig && styles.psChipSig, isPick && !isSig && styles.psChipPicked]}
                onPress={() => togglePlayStyle(p)} disabled={isSig}>
                <Text style={[styles.psChipText, (isSig || isPick) && styles.psChipTextActive]}>
                  {isSig ? '✦ ' : ''}{p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Support */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>❤️ Support Settings</Text>
        {[[disability, setDisability, '♿ Disability Support'],
          [mentalStress, setMentalStress, '🧠 Mental Health Support']].map(([val, setter, label]) => (
          <TouchableOpacity key={label}
            style={[styles.conditionBtn, val && styles.conditionBtnActive]}
            onPress={() => setter(!val)}>
            <Text style={[styles.conditionText, val && styles.conditionTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attribute overview */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>📊 Attribute Overview</Text>
        {/* Show GK-focused hint when GK selected */}
        {isGKPosition(selectedPosition) && (
          <Text style={styles.gkAttrHint}>
            🧤 GK selected — fill Goalkeeping stats for an accurate rating
          </Text>
        )}
        {ATTR_CATEGORIES.map(cat => (
          <CategoryScoreBar key={cat.key} category={cat} attrs={attrs} />
        ))}
      </View>

      {/* Detailed attributes */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🎛️ Player Attributes</Text>
        <Text style={styles.cardHint}>All stats start at 0 — your true rating reflects your real inputs</Text>
        {ATTR_CATEGORIES.map(cat => (
          <View key={cat.key} style={styles.attrCategory}>
            <TouchableOpacity
              style={[styles.attrCatHeader, { borderLeftColor: cat.color }]}
              onPress={() => toggleCategory(cat.key)}>
              <Text style={styles.attrCatLabel}>{cat.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.attrCatScore, { color: cat.color }]}>
                  {Math.round(cat.attrs.reduce((s, k) => s + (attrs[k] || 0), 0) / cat.attrs.length)}
                </Text>
                <Text style={styles.attrCatChevron}>{expandedCategories[cat.key] ? '▲' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {expandedCategories[cat.key] && (
              <View style={styles.attrSliders}>
                {cat.attrs.map(attrKey => (
                  <DraggableSlider
                    key={attrKey}
                    label={ATTR_LABELS[attrKey]}
                    value={attrs[attrKey]}
                    onChange={v => setAttr(attrKey, v)}
                    age={numAge}
                    statName={attrKey}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Live preview */}
      {cardData && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>👀 Live Card Preview</Text>
          <View style={{ alignItems: 'center' }}>
            <PlayerCard player={cardData} />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.generateBtn} onPress={handleSubmit}>
        <Text style={styles.generateText}>🎴 Generate Player Card</Text>
      </TouchableOpacity>

      {/* Country picker modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌍 Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchInput} placeholder="🔍 Search..." placeholderTextColor="#999" value={countrySearch} onChangeText={setCountrySearch} autoFocus />
            <FlatList
              data={COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => { setNationality(item); setShowCountryPicker(false); setCountrySearch(''); }}>
                  <Text style={styles.countryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProfileForm;

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria',
  'Belgium','Brazil','Canada','China','Denmark','Egypt','England',
  'France','Germany','Ghana','India','Italy','Japan','Mexico','Netherlands',
  'Nigeria','Norway','Poland','Portugal','Russia','Saudi Arabia',
  'Scotland','Senegal','South Africa','South Korea','Spain','Sweden',
  'Switzerland','Turkey','Ukraine','United States','Wales',
];

const FC_DARK   = '#0d1b2a', FC_CARD = '#132338', FC_BORDER = '#1e3a5f';
const FC_ACCENT = '#1e88e5', FC_GOLD = '#f39c12', FC_TEXT = '#ecf0f1', FC_MUTED = '#7f8c8d';

const styles = StyleSheet.create({
  container:     { backgroundColor: FC_DARK, flexGrow: 1, paddingBottom: 50, paddingHorizontal: isSmallScreen ? 10 : 16 },
  header:        { paddingTop: 50, paddingBottom: 12 },
  backBtn:       { color: FC_ACCENT, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  title:         { fontSize: isSmallScreen ? 22 : 26, fontWeight: '900', color: FC_TEXT, textAlign: 'center' },
  subtitle:      { fontSize: 12, color: FC_MUTED, textAlign: 'center', marginTop: 2, letterSpacing: 2 },

  ovrPreviewCard:  { backgroundColor: FC_CARD, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: FC_BORDER },
  ovrPreviewNum:   { fontSize: 48, fontWeight: '900', color: FC_GOLD },
  ovrPreviewLabel: { color: FC_MUTED, fontSize: 10, letterSpacing: 1 },
  ovrPreviewRight: { flex: 1, paddingLeft: 16 },
  ovrTier:         { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  gkHint:          { color: '#4fc3f7', fontSize: 10, marginBottom: 4, fontWeight: '600' },
  gkAttrHint:      { color: '#4fc3f7', fontSize: 11, marginBottom: 8, fontStyle: 'italic' },
  ovrNote:         { color: FC_MUTED, fontSize: 11 },

  progressContainer: { marginBottom: 16 },
  progressLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText:  { color: FC_MUTED, fontSize: 12 },
  progressPct:   { color: FC_ACCENT, fontSize: 12, fontWeight: 'bold' },
  progressBar:   { height: 4, backgroundColor: FC_BORDER, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: FC_ACCENT, borderRadius: 2 },

  card:         { backgroundColor: FC_CARD, borderRadius: 12, padding: isSmallScreen ? 12 : 16, marginBottom: 12, borderWidth: 1, borderColor: FC_BORDER },
  sectionLabel: { color: FC_TEXT, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  cardHint:     { color: FC_MUTED, fontSize: 11, marginBottom: 10 },

  photoRow:        { flexDirection: 'row', alignItems: 'center' },
  imageButton:     { width: 72, height: 72, borderRadius: 36, backgroundColor: FC_BORDER, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: FC_ACCENT, marginRight: 14 },
  playerImage:     { width: 72, height: 72, borderRadius: 36 },
  imageButtonText: { color: FC_ACCENT, fontWeight: 'bold', fontSize: 11 },
  photoHint:       { flex: 1 },
  hintText:        { color: FC_MUTED, fontSize: 12 },
  hintSub:         { color: '#4a6278', fontSize: 11, marginTop: 4 },

  input:          { backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER, borderRadius: 8, padding: isSmallScreen ? 11 : 13, marginBottom: 8, color: FC_TEXT, fontSize: 14 },
  inputRow:       { flexDirection: 'row', gap: 8 },
  inputHalf:      { flex: 1 },
  inputText:      { color: FC_TEXT, fontSize: 14 },
  placeholderText:{ color: '#4a6278', fontSize: 14 },

  bodyTypeRow:        { flexDirection: 'row', gap: 8 },
  bodyTypeBtn:        { flex: 1, alignItems: 'center', backgroundColor: '#0a1520', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: FC_BORDER },
  bodyTypeBtnActive:  { borderColor: FC_GOLD, backgroundColor: 'rgba(243,156,18,0.1)' },
  bodyTypeIcon:       { fontSize: 22, marginBottom: 4 },
  bodyTypeLabel:      { color: FC_MUTED, fontSize: 12, fontWeight: 'bold' },
  bodyTypeLabelActive:{ color: FC_GOLD },
  bodyTypeDesc:       { color: '#4a6278', fontSize: 9, marginTop: 2, textAlign: 'center' },

  detectionBanner:    { backgroundColor: '#0d2040', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e88e5' },
  detectionTitle:     { color: '#4fc3f7', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  detectionMain:      { color: '#dce8f8', fontSize: 14, marginBottom: 4 },
  detectionPos:       { color: '#ffd700', fontWeight: '900', fontSize: 16 },
  detectionConf:      { color: '#3a6186', fontSize: 11 },
  detectionAlt:       { color: '#3a6186', fontSize: 12, marginBottom: 8 },
  applyDetectionBtn:  { backgroundColor: '#1e88e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  applyDetectionBtnText:{ color: '#fff', fontSize: 12, fontWeight: '700' },

  positionBadgeRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  positionBadge:     { backgroundColor: FC_ACCENT, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginRight: 10 },
  positionBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  positionBadgeLabel:{ color: FC_MUTED, fontSize: 12 },

  footOptions:  { flexDirection: 'row', gap: 8 },
  footBtn:      { flex: 1, backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER, borderRadius: 8, padding: 10, alignItems: 'center' },
  footBtnActive:{ backgroundColor: '#27ae60', borderColor: '#219653' },
  footText:     { color: FC_MUTED, fontWeight: 'bold', fontSize: 13 },
  footTextActive:{ color: '#fff' },

  workRateSection:    { flexDirection: 'row', gap: 12 },
  workRateCol:        { flex: 1 },
  workRateLabel:      { color: FC_MUTED, fontSize: 12, marginBottom: 6 },
  workRateOptions:    { flexDirection: 'row', gap: 4 },
  workRateBtn:        { flex: 1, backgroundColor: '#0a1520', borderRadius: 6, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: FC_BORDER },
  workRateBtnActive:  { backgroundColor: FC_ACCENT, borderColor: FC_ACCENT },
  workRateText:       { color: FC_MUTED, fontSize: 10, fontWeight: 'bold' },
  workRateTextActive: { color: '#fff' },

  skillRow:  { flexDirection: 'row', gap: 12 },
  skillCol:  { flex: 1, alignItems: 'center' },
  skillLabel:{ color: FC_MUTED, fontSize: 12, marginBottom: 6 },
  starRow:   { flexDirection: 'row' },
  star:      { fontSize: 22, marginHorizontal: 2 },
  starOn:    { color: FC_GOLD },
  starOff:   { color: '#2c3e50' },
  starHint:  { color: '#4a6278', fontSize: 10, marginTop: 4, textAlign: 'center' },

  archetypeGroupRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  groupTab:            { flex: 1, minWidth: 70, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER },
  groupTabIcon:        { fontSize: 16 },
  groupTabLabel:       { color: FC_MUTED, fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  groupTabLabelActive: { color: '#fff' },
  roleGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  roleCard:            { width: (SCREEN_WIDTH - (isSmallScreen ? 60 : 80)) / 2, backgroundColor: '#0a1520', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: FC_BORDER },
  roleCardActive:      { borderColor: FC_GOLD, backgroundColor: 'rgba(243,156,18,0.08)' },
  roleIcon:            { fontSize: 20, marginBottom: 4 },
  roleLabel:           { color: FC_MUTED, fontWeight: 'bold', fontSize: 12, marginBottom: 3 },
  roleLabelActive:     { color: FC_GOLD },
  roleDesc:            { color: '#4a6278', fontSize: 10 },
  sigRow:              { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sigTitle:            { color: FC_MUTED, fontSize: 11 },
  sigChip:             { backgroundColor: FC_GOLD, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  sigChipText:         { color: '#1a1a1a', fontSize: 10, fontWeight: 'bold' },

  psGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  psChip:            { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: FC_BORDER, backgroundColor: '#0a1520' },
  psChipSig:         { backgroundColor: FC_GOLD, borderColor: FC_GOLD },
  psChipPicked:      { backgroundColor: FC_ACCENT, borderColor: FC_ACCENT },
  psChipText:        { color: FC_MUTED, fontSize: 11 },
  psChipTextActive:  { color: '#fff', fontWeight: 'bold' },

  conditionBtn:       { backgroundColor: '#0a1520', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: FC_BORDER },
  conditionBtnActive: { backgroundColor: '#c0392b', borderColor: '#922b21' },
  conditionText:      { color: FC_MUTED, fontWeight: 'bold', fontSize: 13 },
  conditionTextActive:{ color: '#fff' },

  attrCategory:   { marginBottom: 8 },
  attrCatHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1520', padding: 10, borderRadius: 8, borderLeftWidth: 4 },
  attrCatLabel:   { color: FC_TEXT, fontWeight: 'bold', fontSize: 13 },
  attrCatScore:   { fontSize: 16, fontWeight: '900' },
  attrCatChevron: { color: FC_MUTED, fontSize: 10 },
  attrSliders:    { backgroundColor: '#091525', borderRadius: 8, padding: 10, marginTop: 4, borderWidth: 1, borderColor: FC_BORDER },

  generateBtn:  { backgroundColor: FC_ACCENT, padding: isSmallScreen ? 16 : 18, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  generateText: { color: '#fff', fontSize: isSmallScreen ? 15 : 17, fontWeight: '900', letterSpacing: 1 },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent:  { backgroundColor: FC_CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 24 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: FC_BORDER },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: FC_TEXT },
  modalClose:    { color: FC_MUTED, fontSize: 22, fontWeight: 'bold' },
  searchInput:   { backgroundColor: '#0a1520', padding: 13, margin: 14, borderRadius: 10, color: FC_TEXT, fontSize: 14, borderWidth: 1, borderColor: FC_BORDER },
  countryItem:   { padding: 14, borderBottomWidth: 1, borderBottomColor: FC_BORDER },
  countryText:   { color: FC_TEXT, fontSize: 14 },
});