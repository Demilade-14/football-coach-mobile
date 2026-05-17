// app/ProfileForm.js
import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity,
  Alert, Image, Modal, FlatList, Platform, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import DraggableSlider from '../src/components/DraggableSlider';
import PlayerCardFC26 from '../src/components/PlayerCardFC26';
import {
  calculateOverall,
  getImprovementTips,
  recommendPosition,
  getMaxStatByAge,
  getMinStatByAge,
  savePlayer,
  getTotalPlayersCount,
  canSaveMorePlayers,
} from '../src/utils/playerDatabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

// ─────────────────────────────────────────────────────────────
// FC26 DATA — Archetypes, PlayStyles, Positions, Work Rates
// ─────────────────────────────────────────────────────────────

const FC26_ARCHETYPES = {
  Attacker: {
    icon: '⚽',
    color: '#e74c3c',
    roles: {
      Finisher:  { icon: '🎯', sig: ['Low Driven Shot', 'First Touch'],   desc: 'Clinical striker, killer instinct in the box.' },
      Magician:  { icon: '🪄', sig: ['Technical', 'Finesse Shot'],        desc: 'Creative forward, dribbling & vision.' },
      Target:    { icon: '💪', sig: ['Aerial+', 'Hold Up Play'],          desc: 'Physical presence, aerial duels & hold-up.' },
      Spark:     { icon: '⚡', sig: ['Quick Step', 'Whipped Pass'],       desc: 'Burst pace, wing-based creativity.' },
    },
  },
  Midfielder: {
    icon: '🎮',
    color: '#3498db',
    roles: {
      Maestro:   { icon: '🎼', sig: ['Tiki Taka', 'Technical'],           desc: 'Controls pitch, precise distribution.' },
      Creator:   { icon: '🔑', sig: ['Incisive Pass', 'Flair'],           desc: 'Inventive passes to break defences.' },
      Recycler:  { icon: '♻️', sig: ['Press Proven', 'Intercept'],        desc: 'Recycles possession efficiently.' },
    },
  },
  Defender: {
    icon: '🛡️',
    color: '#27ae60',
    roles: {
      Boss:       { icon: '🦁', sig: ['Bruiser', 'Aerial'],               desc: 'Big tackles, strong headers, dominance.' },
      Engine:     { icon: '🔋', sig: ['Jockey', 'Relentless'],            desc: 'Relentless stamina across 90 minutes.' },
      Progressor: { icon: '📈', sig: ['Long Ball+', 'Anticipate'],        desc: 'CB who pushes into midfield.' },
      Marauder:   { icon: '🏃', sig: ['Whipped Pass', 'Quick Step'],      desc: 'Attacking fullback, pace & delivery.' },
    },
  },
  Goalkeeper: {
    icon: '🧤',
    color: '#9b59b6',
    roles: {
      'Shot Stopper': { icon: '🧱', sig: ['Footwork', 'Deflector'],       desc: 'Standard GK, stops low shots.' },
      'Sweeper Keeper':{ icon: '🌊', sig: ['Rush Out', 'Far Throw'],      desc: 'Aggressive GK, sweeps behind defence.' },
    },
  },
};

const ALL_PLAYSTYLES = [
  // Shooting
  'Finesse Shot', 'Low Driven Shot', 'Power Shot', 'Chip Shot',
  // Passing
  'Incisive Pass', 'Tiki Taka', 'Long Ball+', 'Whipped Pass', 'Flair',
  // Dribbling
  'Technical', 'Quick Step', 'First Touch', 'Rapid',
  // Defending
  'Intercept', 'Anticipate', 'Jockey', 'Bruiser', 'Aerial',
  // Physical
  'Relentless', 'Hold Up Play', 'Press Proven',
  // GK
  'Footwork', 'Deflector', 'Rush Out', 'Far Throw',
];

const POSITIONS = {
  GK:  { x: 50, y: 88, label: 'GK' },
  CB:  { x: 50, y: 72, label: 'CB' },
  LB:  { x: 20, y: 72, label: 'LB' },
  RB:  { x: 80, y: 72, label: 'RB' },
  CDM: { x: 50, y: 58, label: 'CDM' },
  LM:  { x: 15, y: 45, label: 'LM' },
  CM:  { x: 50, y: 45, label: 'CM' },
  RM:  { x: 85, y: 45, label: 'RM' },
  CAM: { x: 50, y: 32, label: 'CAM' },
  LW:  { x: 15, y: 20, label: 'LW' },
  RW:  { x: 85, y: 20, label: 'RW' },
  ST:  { x: 50, y: 10, label: 'ST' },
};

const WORK_RATE_OPTIONS = ['High', 'Medium', 'Low'];

const BODY_TYPES = [
  { id: 'lean',    label: 'Lean',    icon: '🏃', desc: 'Fast & agile' },
  { id: 'average', label: 'Average', icon: '⚽', desc: 'Balanced' },
  { id: 'stocky',  label: 'Stocky',  icon: '💪', desc: 'Strong & powerful' },
];

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────

const INITIAL_ATTRS = {
  acceleration: 0, sprintSpeed: 0, finishing: 0, shotPower: 0, longShots: 0,
  volleys: 0, penalties: 0, vision: 0, crossing: 0, shortPassing: 0,
  longPassing: 0, curve: 0, agility: 0, balance: 0, reactions: 0,
  ballControl: 0, dribbling: 0, composure: 0, interceptions: 0,
  headingAccuracy: 0, marking: 0, standingTackle: 0, slidingTackle: 0,
  jumping: 0, stamina: 0, strength: 0, aggression: 0, diving: 0,
  handling: 0, kicking: 0, positioning: 0, reflexes: 0,
};

const ATTR_CATEGORIES = [
  {
    key: 'pace', label: '⚡ Pace', color: '#e74c3c',
    attrs: ['acceleration', 'sprintSpeed'],
  },
  {
    key: 'shooting', label: '🎯 Shooting', color: '#e67e22',
    attrs: ['finishing', 'shotPower', 'longShots', 'volleys', 'penalties'],
  },
  {
    key: 'passing', label: '🔵 Passing', color: '#3498db',
    attrs: ['vision', 'crossing', 'shortPassing', 'longPassing', 'curve'],
  },
  {
    key: 'dribbling', label: '🟢 Dribbling', color: '#27ae60',
    attrs: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'],
  },
  {
    key: 'defending', label: '🛡️ Defending', color: '#8e44ad',
    attrs: ['interceptions', 'headingAccuracy', 'marking', 'standingTackle', 'slidingTackle'],
  },
  {
    key: 'physical', label: '💪 Physical', color: '#c0392b',
    attrs: ['jumping', 'stamina', 'strength', 'aggression'],
  },
  {
    key: 'goalkeeping', label: '🧤 Goalkeeping', color: '#7f8c8d',
    attrs: ['diving', 'handling', 'kicking', 'positioning', 'reflexes'],
  },
];

const ATTR_LABELS = {
  acceleration: 'Acceleration', sprintSpeed: 'Sprint Speed',
  finishing: 'Finishing', shotPower: 'Shot Power', longShots: 'Long Shots',
  volleys: 'Volleys', penalties: 'Penalties',
  vision: 'Vision', crossing: 'Crossing', shortPassing: 'Short Passing',
  longPassing: 'Long Passing', curve: 'Curve',
  agility: 'Agility', balance: 'Balance', reactions: 'Reactions',
  ballControl: 'Ball Control', dribbling: 'Dribbling', composure: 'Composure',
  interceptions: 'Interceptions', headingAccuracy: 'Heading Accuracy',
  marking: 'Marking', standingTackle: 'Standing Tackle', slidingTackle: 'Sliding Tackle',
  jumping: 'Jumping', stamina: 'Stamina', strength: 'Strength', aggression: 'Aggression',
  diving: 'Diving', handling: 'Handling', kicking: 'Kicking',
  positioning: 'Positioning', reflexes: 'Reflexes',
};

// Preset attrs per archetype role
const ARCHETYPE_ATTRS = {
  Finisher:        { finishing: 82, shotPower: 80, positioning: 75, reactions: 72, composure: 78 },
  Magician:        { dribbling: 84, agility: 82, ballControl: 80, vision: 75, curve: 70 },
  Target:          { headingAccuracy: 82, strength: 84, jumping: 80, shotPower: 75, aggression: 72 },
  Spark:           { acceleration: 86, sprintSpeed: 84, dribbling: 78, crossing: 74, agility: 80 },
  Maestro:         { shortPassing: 84, vision: 82, longPassing: 78, ballControl: 76, stamina: 74 },
  Creator:         { vision: 82, shortPassing: 80, longPassing: 76, dribbling: 74, curve: 72 },
  Recycler:        { interceptions: 80, shortPassing: 78, stamina: 82, marking: 74, aggression: 70 },
  Boss:            { standingTackle: 84, headingAccuracy: 82, strength: 84, marking: 78, jumping: 76 },
  Engine:          { stamina: 88, interceptions: 76, aggression: 72, slidingTackle: 74, marking: 70 },
  Progressor:      { longPassing: 78, strength: 76, acceleration: 70, standingTackle: 76, headingAccuracy: 74 },
  Marauder:        { acceleration: 82, sprintSpeed: 80, crossing: 78, longPassing: 72, stamina: 76 },
  'Shot Stopper':  { reflexes: 86, diving: 82, handling: 78, positioning: 76, kicking: 65 },
  'Sweeper Keeper':{ reflexes: 80, diving: 78, handling: 80, positioning: 82, kicking: 76 },
  Custom:          {},
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Compact stat pill: label + numeric badge coloured by value */
const StatPill = ({ label, value, color }) => {
  const bg = value >= 75 ? color : value >= 50 ? '#34495e' : '#2c3e50';
  return (
    <View style={statPillStyles.row}>
      <Text style={statPillStyles.label}>{label}</Text>
      <View style={[statPillStyles.badge, { backgroundColor: bg }]}>
        <Text style={statPillStyles.value}>{value || '—'}</Text>
      </View>
    </View>
  );
};
const statPillStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  label: { color: '#bdc3c7', fontSize: 12, flex: 1 },
  badge: { minWidth: 36, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignItems: 'center' },
  value: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

/** Category score bar (average of its attrs) */
const CategoryScoreBar = ({ category, attrs }) => {
  const vals = category.attrs.map(k => attrs[k] || 0);
  const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const pct  = avg;
  return (
    <View style={csBarStyles.container}>
      <Text style={csBarStyles.label}>{category.label}</Text>
      <View style={csBarStyles.track}>
        <View style={[csBarStyles.fill, { width: `${pct}%`, backgroundColor: category.color }]} />
      </View>
      <Text style={[csBarStyles.score, { color: category.color }]}>{avg || 0}</Text>
    </View>
  );
};
const csBarStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  label:     { color: '#ecf0f1', fontSize: 11, width: 90 },
  track:     { flex: 1, height: 6, backgroundColor: '#1a2636', borderRadius: 3, overflow: 'hidden', marginHorizontal: 6 },
  fill:      { height: '100%', borderRadius: 3 },
  score:     { fontSize: 13, fontWeight: 'bold', width: 28, textAlign: 'right' },
});

/** Mini pitch with selectable position dots */
const PositionPicker = ({ selected, onSelect }) => {
  const PITCH_H = 200;
  const PITCH_W = SCREEN_WIDTH - (isSmallScreen ? 44 : 60);
  return (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <View style={[pitchStyles.pitch, { width: PITCH_W, height: PITCH_H }]}>
        {/* pitch markings */}
        <View style={pitchStyles.centerLine} />
        <View style={pitchStyles.centerCircle} />
        <View style={pitchStyles.penAreaTop} />
        <View style={pitchStyles.penAreaBottom} />
        {Object.entries(POSITIONS).map(([pos, { x, y, label }]) => {
          const left = (x / 100) * PITCH_W - 18;
          const top  = (y / 100) * PITCH_H - 14;
          const active = selected === pos;
          return (
            <TouchableOpacity
              key={pos}
              style={[pitchStyles.dot, { left, top }, active && pitchStyles.dotActive]}
              onPress={() => onSelect(pos)}
            >
              <Text style={[pitchStyles.dotLabel, active && pitchStyles.dotLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
const pitchStyles = StyleSheet.create({
  pitch:         { backgroundColor: '#1a6b2f', borderRadius: 8, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: '#27ae60' },
  centerLine:    { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  centerCircle:  { position: 'absolute', top: '50%', left: '50%', width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginLeft: -25, marginTop: -25 },
  penAreaTop:    { position: 'absolute', top: 0, left: '25%', width: '50%', height: '18%', borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  penAreaBottom: { position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '18%', borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dot:           { position: 'absolute', width: 36, height: 24, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  dotActive:     { backgroundColor: '#f39c12', borderColor: '#f1c40f' },
  dotLabel:      { color: '#ecf0f1', fontSize: 9, fontWeight: 'bold' },
  dotLabelActive:{ color: '#1a1a1a' },
});

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const ProfileForm = () => {
  const router = useRouter();

  // Basic info
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('15');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [nationality, setNationality] = useState('');
  const [club, setClub] = useState('');
  const [jersey, setJersey] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [skillMoves, setSkillMoves] = useState(3);
  const [weakFoot, setWeakFoot] = useState(3);
  const [image, setImage] = useState(null);

  // FC26 new fields
  const [selectedPosition, setSelectedPosition] = useState('ST');
  const [archetypeGroup, setArchetypeGroup] = useState('Attacker');
  const [archetypeRole, setArchetypeRole] = useState('Finisher');
  const [selectedPlayStyles, setSelectedPlayStyles] = useState([]);
  const [attackWorkRate, setAttackWorkRate] = useState('High');
  const [defenseWorkRate, setDefenseWorkRate] = useState('Medium');
  const [bodyType, setBodyType] = useState('average');

  // Conditions / misc
  const [disability, setDisability] = useState(false);
  const [mentalStress, setMentalStress] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [cardData, setCardData] = useState(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({ pace: true });

  const [attrs, setAttrs] = useState(INITIAL_ATTRS);

  // ── Helpers ──────────────────────────────────────────────

  const calculateAgeFromDOB = (dob) => {
    if (!dob) return '15';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '15';
    const today = new Date();
    let y = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) y--;
    return Math.max(4, Math.min(56, y)).toString();
  };

  const getMaxStarsByAge = (ageStr) => {
    const n = parseInt(ageStr) || 15;
    if (n < 12) return 3;
    if (n < 16) return 4;
    return 5;
  };

  const handleAgeChange = (text) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (digits === '') { setAge(''); return; }
    const n = parseInt(digits, 10);
    if (n >= 4 && n <= 56) setAge(digits);
  };

  const handleSetSkillMoves = (s) => setSkillMoves(Math.min(s, getMaxStarsByAge(age)));
  const handleSetWeakFoot   = (s) => setWeakFoot(Math.min(s, getMaxStarsByAge(age)));

  const togglePlayStyle = (ps) => {
    const sig = FC26_ARCHETYPES[archetypeGroup]?.roles[archetypeRole]?.sig ?? [];
    if (sig.includes(ps)) return; // signature styles are locked
    setSelectedPlayStyles(prev =>
      prev.includes(ps) ? prev.filter(x => x !== ps) : prev.length < 5 ? [...prev, ps] : prev
    );
  };

  const toggleCategory = (key) =>
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));

  // Apply archetype — load preset attrs, lock signature PlayStyles
  const applyArchetype = (group, role) => {
    setArchetypeGroup(group);
    setArchetypeRole(role);
    const numAge = parseInt(age) || 15;
    const maxStat = typeof getMaxStatByAge === 'function' ? getMaxStatByAge(numAge, 'pace') : 99;
    const base = { ...INITIAL_ATTRS };
    const preset = ARCHETYPE_ATTRS[role] ?? {};
    Object.keys(preset).forEach(k => { if (k in base) base[k] = Math.min(maxStat, preset[k]); });
    setAttrs(base);
    // Pre-select signature PlayStyles
    const sigs = FC26_ARCHETYPES[group]?.roles[role]?.sig ?? [];
    setSelectedPlayStyles(sigs.slice(0, 2));
  };

  const buildCardData = (overrides = {}) => {
    const numAge = parseInt(age) || 15;
    const opts   = { disability, mentalStress };
    const curAttrs = overrides.attrs ?? attrs;
    const overall   = typeof calculateOverall  === 'function' ? calculateOverall(curAttrs, numAge, opts) : 50;
    const positions = typeof recommendPosition === 'function' ? recommendPosition(curAttrs, numAge, preferredFoot) : selectedPosition;
    const tips      = typeof getImprovementTips === 'function' ? getImprovementTips(positions, curAttrs, opts) : ['Complete your profile for tips'];
    return {
      name: name || 'Anonymous', age: numAge, height, weight, preferredFoot,
      nationality, club, jersey, skillMoves, weakFoot, image, attrs: curAttrs,
      overall, positions, tips,
      archetype: archetypeRole, archetypeGroup,
      playStyles: selectedPlayStyles,
      position: selectedPosition,
      attackWorkRate, defenseWorkRate, bodyType,
      ...overrides,
    };
  };

  // Live preview effect
  useEffect(() => {
    setCardData(buildCardData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, age, height, weight, preferredFoot, nationality, club, jersey, skillMoves,
      weakFoot, image, attrs, disability, mentalStress, selectedPosition, archetypeRole,
      selectedPlayStyles, attackWorkRate, defenseWorkRate, bodyType]);

  // Form progress
  useEffect(() => {
    const fields = [name, age, height, nationality, club];
    const attrCount = Object.values(attrs).filter(v => v > 0).length;
    const basic = fields.filter(f => f && f.toString().trim()).length / fields.length;
    const attrP = attrCount / Object.keys(attrs).length;
    setFormProgress(Math.round((basic * 0.3 + attrP * 0.7) * 100));
  }, [name, age, height, nationality, club, attrs]);

  // Permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission needed', 'Allow access to photos to add your face!');
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
        Alert.alert('Player Limit Reached', 'Up to 5 players on FREE. Upgrade to VIP for unlimited!', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to VIP', onPress: () => router.push('/VIPSubscription') },
        ]);
        return;
      }
      const res = typeof savePlayer === 'function' ? await savePlayer(data) : { success: true };
      if (res?.success) {
        Alert.alert('Success!', 'Player card generated!', [
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

  // ── Render ────────────────────────────────────────────────

  const currentArchData = FC26_ARCHETYPES[archetypeGroup]?.roles[archetypeRole];
  const sigPlayStyles   = currentArchData?.sig ?? [];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.title}>⚽ FC26 Player Creator</Text>
        <Text style={styles.subtitle}>Build your Virtual Pro</Text>
      </View>

      {/* ── PROGRESS ── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>Profile Completion</Text>
          <Text style={styles.progressPct}>{formProgress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${formProgress}%` }]} />
        </View>
      </View>

      {/* ── PHOTO ── */}
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

      {/* ── BASIC INFO ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>👤 Basic Info</Text>
        <TextInput style={styles.input} placeholder="Player Name (optional)" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input} placeholder="Date of Birth (YYYY-MM-DD)" placeholderTextColor="#666"
          value={dateOfBirth} keyboardType="default" autoCorrect={false}
          onChangeText={text => { setDateOfBirth(text); const c = calculateAgeFromDOB(text); if (c !== '15') setAge(c); }}
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

      {/* ── BODY TYPE ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🏋️ Body Type</Text>
        <Text style={styles.cardHint}>Affects physical attribute caps and player feel</Text>
        <View style={styles.bodyTypeRow}>
          {BODY_TYPES.map(bt => (
            <TouchableOpacity
              key={bt.id}
              style={[styles.bodyTypeBtn, bodyType === bt.id && styles.bodyTypeBtnActive]}
              onPress={() => setBodyType(bt.id)}
            >
              <Text style={styles.bodyTypeIcon}>{bt.icon}</Text>
              <Text style={[styles.bodyTypeLabel, bodyType === bt.id && styles.bodyTypeLabelActive]}>{bt.label}</Text>
              <Text style={styles.bodyTypeDesc}>{bt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── POSITION PICKER ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>📍 Primary Position</Text>
        <Text style={styles.cardHint}>Tap your position on the pitch</Text>
        <PositionPicker selected={selectedPosition} onSelect={setSelectedPosition} />
        <View style={styles.positionBadgeRow}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionBadgeText}>{selectedPosition}</Text>
          </View>
          <Text style={styles.positionBadgeLabel}>Selected Position</Text>
        </View>
      </View>

      {/* ── PREFERRED FOOT ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>👟 Preferred Foot</Text>
        <View style={styles.footOptions}>
          {['Right', 'Left', 'Both'].map(foot => (
            <TouchableOpacity
              key={foot}
              style={[styles.footBtn, preferredFoot === foot && styles.footBtnActive]}
              onPress={() => setPreferredFoot(foot)}
            >
              <Text style={[styles.footText, preferredFoot === foot && styles.footTextActive]}>{foot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── WORK RATES ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>⚡ Work Rates</Text>
        <Text style={styles.cardHint}>How hard your player presses in attack and defence</Text>
        <View style={styles.workRateSection}>
          <View style={styles.workRateCol}>
            <Text style={styles.workRateLabel}>⚔️ Attack</Text>
            <View style={styles.workRateOptions}>
              {WORK_RATE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.workRateBtn, attackWorkRate === opt && styles.workRateBtnActive]}
                  onPress={() => setAttackWorkRate(opt)}
                >
                  <Text style={[styles.workRateText, attackWorkRate === opt && styles.workRateTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.workRateCol}>
            <Text style={styles.workRateLabel}>🛡️ Defence</Text>
            <View style={styles.workRateOptions}>
              {WORK_RATE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.workRateBtn, defenseWorkRate === opt && styles.workRateBtnActive]}
                  onPress={() => setDefenseWorkRate(opt)}
                >
                  <Text style={[styles.workRateText, defenseWorkRate === opt && styles.workRateTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── SKILL / WEAK FOOT ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>⭐ Skill Moves & Weak Foot</Text>
        <View style={styles.skillRow}>
          <View style={styles.skillCol}>
            <Text style={styles.skillLabel}>Skill Moves</Text>
            <View style={styles.starRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity key={i} onPress={() => handleSetSkillMoves(i + 1)}>
                  <Text style={[styles.star, i < skillMoves ? styles.starOn : styles.starOff]}>
                    {i < skillMoves ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starHint}>Max {getMaxStarsByAge(age)}★ for age {age}</Text>
          </View>
          <View style={styles.skillCol}>
            <Text style={styles.skillLabel}>Weak Foot</Text>
            <View style={styles.starRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity key={i} onPress={() => handleSetWeakFoot(i + 1)}>
                  <Text style={[styles.star, i < weakFoot ? styles.starOn : styles.starOff]}>
                    {i < weakFoot ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starHint}>Max {getMaxStarsByAge(age)}★ for age {age}</Text>
          </View>
        </View>
      </View>

      {/* ── FC26 ARCHETYPES ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🏆 Archetype</Text>
        <Text style={styles.cardHint}>Inspired by FC26 Clubs — defines your playing style</Text>

        {/* Group tabs */}
        <View style={styles.archetypeGroupRow}>
          {Object.entries(FC26_ARCHETYPES).map(([group, { icon, color }]) => (
            <TouchableOpacity
              key={group}
              style={[styles.groupTab, archetypeGroup === group && { backgroundColor: color }]}
              onPress={() => {
                setArchetypeGroup(group);
                const firstRole = Object.keys(FC26_ARCHETYPES[group].roles)[0];
                applyArchetype(group, firstRole);
              }}
            >
              <Text style={styles.groupTabIcon}>{icon}</Text>
              <Text style={[styles.groupTabLabel, archetypeGroup === group && styles.groupTabLabelActive]}>
                {group}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Role cards */}
        <View style={styles.roleGrid}>
          {Object.entries(FC26_ARCHETYPES[archetypeGroup]?.roles ?? {}).map(([role, data]) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleCard, archetypeRole === role && styles.roleCardActive]}
              onPress={() => applyArchetype(archetypeGroup, role)}
            >
              <Text style={styles.roleIcon}>{data.icon}</Text>
              <Text style={[styles.roleLabel, archetypeRole === role && styles.roleLabelActive]}>{role}</Text>
              <Text style={styles.roleDesc} numberOfLines={2}>{data.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Signature PlayStyles chip strip */}
        {currentArchData && (
          <View style={styles.sigRow}>
            <Text style={styles.sigTitle}>Signature PlayStyles:</Text>
            {sigPlayStyles.map(ps => (
              <View key={ps} style={styles.sigChip}>
                <Text style={styles.sigChipText}>{ps}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── PLAYSTYLES ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🎮 PlayStyles</Text>
        <Text style={styles.cardHint}>
          Gold = Signature (locked). Select up to 5 total.{'  '}
          <Text style={styles.psCount}>{selectedPlayStyles.length}/5 selected</Text>
        </Text>
        <View style={styles.psGrid}>
          {ALL_PLAYSTYLES.map(ps => {
            const isSig  = sigPlayStyles.includes(ps);
            const isPick = selectedPlayStyles.includes(ps);
            return (
              <TouchableOpacity
                key={ps}
                style={[styles.psChip, isSig && styles.psChipSig, isPick && !isSig && styles.psChipPicked]}
                onPress={() => togglePlayStyle(ps)}
                disabled={isSig}
              >
                <Text style={[styles.psChipText, (isSig || isPick) && styles.psChipTextActive]}>
                  {isSig ? '✦ ' : ''}{ps}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── SUPPORT TOGGLES ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>❤️ Support Settings</Text>
        <TouchableOpacity
          style={[styles.conditionBtn, disability && styles.conditionBtnActive]}
          onPress={() => setDisability(!disability)}
        >
          <Text style={[styles.conditionText, disability && styles.conditionTextActive]}>♿ Disability Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.conditionBtn, mentalStress && styles.conditionBtnActive]}
          onPress={() => setMentalStress(!mentalStress)}
        >
          <Text style={[styles.conditionText, mentalStress && styles.conditionTextActive]}>🧠 Mental Health Support</Text>
        </TouchableOpacity>
      </View>

      {/* ── ATTRIBUTE OVERVIEW ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>📊 Attribute Overview</Text>
        {ATTR_CATEGORIES.map(cat => (
          <CategoryScoreBar key={cat.key} category={cat} attrs={attrs} />
        ))}
      </View>

      {/* ── DETAILED ATTRIBUTES (collapsible) ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>🎛️ Player Attributes</Text>
        <Text style={styles.cardHint}>Tap a category to expand / collapse</Text>

        {ATTR_CATEGORIES.map(cat => (
          <View key={cat.key} style={styles.attrCategory}>
            <TouchableOpacity
              style={[styles.attrCatHeader, { borderLeftColor: cat.color }]}
              onPress={() => toggleCategory(cat.key)}
            >
              <Text style={styles.attrCatLabel}>{cat.label}</Text>
              <View style={styles.attrCatRight}>
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
                    age={parseInt(age)}
                    statName={attrKey}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* ── LIVE PREVIEW ── */}
      {cardData && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>👀 Live Card Preview</Text>
          <View style={styles.previewInner}>
            <PlayerCardFC26 player={cardData} />
          </View>
        </View>
      )}

      {/* ── GENERATE ── */}
      <TouchableOpacity style={styles.generateBtn} onPress={handleSubmit}>
        <Text style={styles.generateText}>🎴 Generate Player Card</Text>
      </TouchableOpacity>

      {/* ── COUNTRY PICKER MODAL ── */}
      <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌍 Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput} placeholder="🔍 Search..." placeholderTextColor="#999"
              value={countrySearch} onChangeText={setCountrySearch} autoFocus
            />
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

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria',
  'Belgium','Brazil','Canada','China','Denmark','Egypt','England',
  'France','Germany','India','Italy','Japan','Mexico','Netherlands',
  'Nigeria','Norway','Poland','Portugal','Russia','Saudi Arabia',
  'Scotland','South Africa','South Korea','Spain','Sweden','Switzerland',
  'Turkey','Ukraine','United States','Wales',
];

// ─────────────────────────────────────────────────────────────
// STYLES — dark FC26 palette
// ─────────────────────────────────────────────────────────────

const FC_DARK   = '#0d1b2a';
const FC_CARD   = '#132338';
const FC_BORDER = '#1e3a5f';
const FC_ACCENT = '#1e88e5';
const FC_GOLD   = '#f39c12';
const FC_TEXT   = '#ecf0f1';
const FC_MUTED  = '#7f8c8d';

const styles = StyleSheet.create({
  container: { backgroundColor: FC_DARK, flexGrow: 1, paddingBottom: 50, paddingHorizontal: isSmallScreen ? 10 : 16 },

  // Header
  header:    { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  title:     { fontSize: isSmallScreen ? 22 : 26, fontWeight: '900', color: FC_TEXT, letterSpacing: 1 },
  subtitle:  { fontSize: 12, color: FC_MUTED, marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' },

  // Progress
  progressContainer: { marginBottom: 16 },
  progressLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText:      { color: FC_MUTED, fontSize: 12 },
  progressPct:       { color: FC_ACCENT, fontSize: 12, fontWeight: 'bold' },
  progressBar:       { height: 4, backgroundColor: FC_BORDER, borderRadius: 2, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: FC_ACCENT, borderRadius: 2 },

  // Cards
  card:        { backgroundColor: FC_CARD, borderRadius: 12, padding: isSmallScreen ? 12 : 16, marginBottom: 12, borderWidth: 1, borderColor: FC_BORDER },
  sectionLabel:{ color: FC_TEXT, fontSize: 14, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  cardHint:    { color: FC_MUTED, fontSize: 11, marginBottom: 10 },

  // Photo
  photoRow:        { flexDirection: 'row', alignItems: 'center' },
  imageButton:     { width: 72, height: 72, borderRadius: 36, backgroundColor: FC_BORDER, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: FC_ACCENT, marginRight: 14 },
  playerImage:     { width: 72, height: 72, borderRadius: 36 },
  imageButtonText: { color: FC_ACCENT, fontWeight: 'bold', fontSize: 11 },
  photoHint:       { flex: 1 },
  hintText:        { color: FC_MUTED, fontSize: 12 },
  hintSub:         { color: '#4a6278', fontSize: 11, marginTop: 4 },

  // Inputs
  input:       { backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER, borderRadius: 8, padding: isSmallScreen ? 11 : 13, marginBottom: 8, color: FC_TEXT, fontSize: isSmallScreen ? 13 : 14 },
  inputRow:    { flexDirection: 'row', gap: 8 },
  inputHalf:   { flex: 1 },
  inputText:   { color: FC_TEXT, fontSize: isSmallScreen ? 13 : 14 },
  placeholderText: { color: '#4a6278', fontSize: isSmallScreen ? 13 : 14 },

  // Body type
  bodyTypeRow:        { flexDirection: 'row', gap: 8 },
  bodyTypeBtn:        { flex: 1, alignItems: 'center', backgroundColor: '#0a1520', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: FC_BORDER },
  bodyTypeBtnActive:  { borderColor: FC_GOLD, backgroundColor: 'rgba(243,156,18,0.1)' },
  bodyTypeIcon:       { fontSize: 22, marginBottom: 4 },
  bodyTypeLabel:      { color: FC_MUTED, fontSize: 12, fontWeight: 'bold' },
  bodyTypeLabelActive:{ color: FC_GOLD },
  bodyTypeDesc:       { color: '#4a6278', fontSize: 9, marginTop: 2, textAlign: 'center' },

  // Position badge
  positionBadgeRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  positionBadge:      { backgroundColor: FC_ACCENT, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginRight: 10 },
  positionBadgeText:  { color: '#fff', fontWeight: '900', fontSize: 14 },
  positionBadgeLabel: { color: FC_MUTED, fontSize: 12 },

  // Foot
  footOptions:  { flexDirection: 'row', gap: 8 },
  footBtn:      { flex: 1, backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER, borderRadius: 8, padding: 10, alignItems: 'center' },
  footBtnActive:{ backgroundColor: '#27ae60', borderColor: '#219653' },
  footText:     { color: FC_MUTED, fontWeight: 'bold', fontSize: 13 },
  footTextActive:{ color: '#fff' },

  // Work rates
  workRateSection: { flexDirection: 'row', gap: 12 },
  workRateCol:     { flex: 1 },
  workRateLabel:   { color: FC_MUTED, fontSize: 12, marginBottom: 6 },
  workRateOptions: { flexDirection: 'row', gap: 4 },
  workRateBtn:     { flex: 1, backgroundColor: '#0a1520', borderRadius: 6, paddingVertical: 7, alignItems: 'center', borderWidth: 1, borderColor: FC_BORDER },
  workRateBtnActive:{ backgroundColor: FC_ACCENT, borderColor: FC_ACCENT },
  workRateText:    { color: FC_MUTED, fontSize: 10, fontWeight: 'bold' },
  workRateTextActive:{ color: '#fff' },

  // Stars
  skillRow:  { flexDirection: 'row', gap: 12 },
  skillCol:  { flex: 1, alignItems: 'center' },
  skillLabel:{ color: FC_MUTED, fontSize: 12, marginBottom: 6 },
  starRow:   { flexDirection: 'row' },
  star:      { fontSize: 22, marginHorizontal: 2 },
  starOn:    { color: FC_GOLD },
  starOff:   { color: '#2c3e50' },
  starHint:  { color: '#4a6278', fontSize: 10, marginTop: 4, textAlign: 'center' },

  // Archetypes
  archetypeGroupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  groupTab:          { flex: 1, minWidth: 70, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: '#0a1520', borderWidth: 1, borderColor: FC_BORDER },
  groupTabIcon:      { fontSize: 16 },
  groupTabLabel:     { color: FC_MUTED, fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  groupTabLabelActive:{ color: '#fff' },
  roleGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  roleCard:          { width: (SCREEN_WIDTH - (isSmallScreen ? 60 : 80)) / 2, backgroundColor: '#0a1520', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: FC_BORDER },
  roleCardActive:    { borderColor: FC_GOLD, backgroundColor: 'rgba(243,156,18,0.08)' },
  roleIcon:          { fontSize: 20, marginBottom: 4 },
  roleLabel:         { color: FC_MUTED, fontWeight: 'bold', fontSize: 12, marginBottom: 3 },
  roleLabelActive:   { color: FC_GOLD },
  roleDesc:          { color: '#4a6278', fontSize: 10 },
  sigRow:            { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sigTitle:          { color: FC_MUTED, fontSize: 11 },
  sigChip:           { backgroundColor: FC_GOLD, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  sigChipText:       { color: '#1a1a1a', fontSize: 10, fontWeight: 'bold' },

  // PlayStyles
  psGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  psChip:          { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: FC_BORDER, backgroundColor: '#0a1520' },
  psChipSig:       { backgroundColor: FC_GOLD, borderColor: FC_GOLD },
  psChipPicked:    { backgroundColor: FC_ACCENT, borderColor: FC_ACCENT },
  psChipText:      { color: FC_MUTED, fontSize: 11 },
  psChipTextActive:{ color: '#fff', fontWeight: 'bold' },
  psCount:         { color: FC_ACCENT, fontWeight: 'bold' },

  // Conditions
  conditionBtn:       { backgroundColor: '#0a1520', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: FC_BORDER },
  conditionBtnActive: { backgroundColor: '#c0392b', borderColor: '#922b21' },
  conditionText:      { color: FC_MUTED, fontWeight: 'bold', fontSize: 13 },
  conditionTextActive:{ color: '#fff' },

  // Attribute categories
  attrCategory:    { marginBottom: 8 },
  attrCatHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1520', padding: 10, borderRadius: 8, borderLeftWidth: 4 },
  attrCatLabel:    { color: FC_TEXT, fontWeight: 'bold', fontSize: 13 },
  attrCatRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attrCatScore:    { fontSize: 16, fontWeight: '900' },
  attrCatChevron:  { color: FC_MUTED, fontSize: 10 },
  attrSliders:     { backgroundColor: '#091525', borderRadius: 8, padding: 10, marginTop: 4, borderWidth: 1, borderColor: FC_BORDER },

  // Preview
  previewInner:    { alignItems: 'center' },

  // Generate button
  generateBtn:  { backgroundColor: FC_ACCENT, padding: isSmallScreen ? 16 : 18, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20, ...Platform.select({ web: { boxShadow: '0 4px 16px rgba(30,136,229,0.4)' } }) },
  generateText: { color: '#fff', fontSize: isSmallScreen ? 15 : 17, fontWeight: '900', letterSpacing: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: FC_CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 24 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: FC_BORDER },
  modalTitle:   { fontSize: 18, fontWeight: 'bold', color: FC_TEXT },
  modalClose:   { color: FC_MUTED, fontSize: 22, fontWeight: 'bold' },
  searchInput:  { backgroundColor: '#0a1520', padding: 13, margin: 14, borderRadius: 10, color: FC_TEXT, fontSize: 14, borderWidth: 1, borderColor: FC_BORDER },
  countryItem:  { padding: 14, borderBottomWidth: 1, borderBottomColor: FC_BORDER },
  countryText:  { color: FC_TEXT, fontSize: 14 },
});