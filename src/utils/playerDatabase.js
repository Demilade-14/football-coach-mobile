// src/utils/playerDatabase.js
// Complete player stats storage with age-based rating limits
// In-memory player storage
const _players = [];
export const playerDatabase = {
  addPlayer: (player) => {
    const newPlayer = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...player
    };
    _players.push(newPlayer);
    return newPlayer;
  },
  getPlayer: (id) => _players.find(p => p.id === id),
  updatePlayer: (id, updates) => {
    const index = _players.findIndex(p => p.id === id);
    if (index !== -1) {
      _players[index] = { ..._players[index], ...updates };
      return _players[index];
    }
    return null;
  },
  deletePlayer: (id) => {
    const index = _players.findIndex(p => p.id === id);
    if (index !== -1) {
      return _players.splice(index, 1)[0];
    }
    return null;
  }
};
// ✅ EXPORT: Get all players
export const getAllPlayers = () => [..._players];
// ✅ EXPORT: Get top players by rating
export const getTopPlayers = (limit = 10) => {
  return [..._players]
    .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
    .slice(0, limit);
};
// ✅ EXPORT: Get total player count
export const getTotalPlayersCount = () => _players.length;
// ✅ EXPORT: Check if user can save more players (free tier: 5 max)
export const canSaveMorePlayers = (currentCount) => currentCount < 5;
// ✅ EXPORT: Save player with validation
export const savePlayer = async (playerData) => {
  try {
    if (!playerData.name) {
      return { success: false, error: 'Player name is required' };
    }
    const saved = playerDatabase.addPlayer(playerData);
    return { success: true, data: saved };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
// ✅ EXPORT: Calculate overall rating from stats
export const calculateOverall = (stats, age = 15, options = {}) => {
  if (!stats || typeof stats !== 'object') return 50;
  const values = Object.values(stats).filter(v => typeof v === 'number');
  if (values.length === 0) return 50;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // Apply age-based modifier
  const ageModifier = getAgeRatingModifier(age);
  const finalRating = Math.round(avg * ageModifier);
  return Math.min(99, Math.max(1, finalRating));
};
// ✅ EXPORT: Recommend position based on stats
export const recommendPosition = (stats, age = 15, preferredFoot = 'Right') => {
  if (!stats || typeof stats !== 'object') return 'Midfielder';
  const { 
    pace = 50, shooting = 50, passing = 50, 
    defending = 50, physical = 50, dribbling = 50 
  } = stats;
  // Age affects position suitability
  const maxRating = getMaxStatByAge(age, 'overall');
  if (defending > 70 && physical > 65 && maxRating >= 70) return 'Defender';
  if (pace > 75 && shooting > 70 && maxRating >= 70) return 'Forward';
  if (passing > 70 && dribbling > 65 && maxRating >= 70) return 'Midfielder';
  if (pace > 80 && maxRating >= 75) return 'Winger';
  if (shooting > 75 && maxRating >= 75) return 'Striker';
  return 'Midfielder';
};
// ✅ EXPORT: Get improvement tips based on position and stats
export const getImprovementTips = (position, stats, options = {}) => {
  if (!stats || typeof stats !== 'object') {
    return ['Complete your profile to get personalized training tips!'];
  }
  const tips = [];
  const { 
    pace = 50, shooting = 50, passing = 50, 
    defending = 50, physical = 50, dribbling = 50 
  } = stats;
  // Position-specific tips
  if (position === 'Forward' || position === 'Striker') {
    if (shooting < 65) tips.push('🎯 Practice finishing: shoot at different corners');
    if (pace < 65) tips.push('⚡ Sprint intervals: 10x 30m sprints with 30s rest');
    if (dribbling < 60) tips.push('⚽ Cone drills: weave through cones at speed');
  } else if (position === 'Midfielder') {
    if (passing < 65) tips.push('🎯 Wall passes: 50 passes each foot against wall');
    if (dribbling < 60) tips.push('⚡ Close control: dribble in tight spaces');
    if (physical < 60) tips.push('💪 Core strength: planks, Russian twists');
  } else if (position === 'Defender') {
    if (defending < 65) tips.push('🛡️ Positioning: watch pro defenders, study angles');
    if (physical < 65) tips.push('💪 Leg strength: squats, lunges, calf raises');
    if (pace < 60) tips.push('⚡ Recovery runs: practice backpedaling + sprinting');
  } else if (position === 'Goalkeeper') {
    if (reflexes < 65) tips.push('🧤 Reaction drills: tennis ball catches');
    if (handling < 65) tips.push('🧤 Catching practice: various ball trajectories');
    if (positioning < 60) tips.push('🧤 Angle work: practice cutting down shooter angles');
  }
  // General tips for low stats
  if (pace < 55 && !tips.some(t => t.includes('sprint'))) {
    tips.push('🏃 General fitness: include sprint work in training');
  }
  if (shooting < 55 && !tips.some(t => t.includes('finishing'))) {
    tips.push('⚽ Shooting practice: 15 mins daily, both feet');
  }
  if (passing < 55 && !tips.some(t => t.includes('pass'))) {
    tips.push('🎯 Passing drills: short/long passes with partner');
  }
  // If no specific tips, provide encouragement
  if (tips.length === 0) {
    tips.push('🌟 Great foundation! Keep training consistently');
    tips.push('📊 Track progress: update stats after each session');
    tips.push('🎮 Watch matches: learn positioning from pros');
  }
  return tips.slice(0, 5); // Return max 5 tips
};
// ✅ EXPORT: Get MAX stat value based on age (CRITICAL for age limits)
export const getMaxStatByAge = (age, statName = 'overall') => {
  // Ensure age is valid
  const validAge = Math.max(4, Math.min(56, age || 15));
  // Different stats have different peak values
  const statPeaks = {
    pace: 95,
    shooting: 92,
    passing: 94,
    defending: 93,
    physical: 90,
    dribbling: 94,
    reflexes: 93,
    handling: 91,
    positioning: 94,
    overall: 99
  };
  const peakValue = statPeaks[statName] || 90;
  // Age-based progression curve
  let ageFactor;
  if (validAge < 13) {
    // Youth development phase: rapid growth
    ageFactor = 0.4 + (validAge - 4) * 0.03; // 0.4 to ~0.67 at age 12
  } else if (validAge < 18) {
    // Teen development: steady improvement
    ageFactor = 0.67 + (validAge - 13) * 0.04; // 0.67 to ~0.87 at age 17
  } else if (validAge < 24) {
    // Young adult: approaching peak
    ageFactor = 0.87 + (validAge - 18) * 0.02; // 0.87 to ~0.99 at age 23
  } else if (validAge <= 28) {
    // Peak years: maximum potential
    ageFactor = 1.0;
  } else if (validAge <= 32) {
    // Early decline: slight reduction
    ageFactor = 1.0 - (validAge - 28) * 0.015; // 1.0 to ~0.94 at age 32
  } else {
    // Veteran phase: gradual decline
    ageFactor = Math.max(0.7, 0.94 - (validAge - 32) * 0.02);
  }
  return Math.round(peakValue * ageFactor);
};
// ✅ EXPORT: Get MIN stat value based on age
export const getMinStatByAge = (age, statName = 'overall') => {
  const validAge = Math.max(4, Math.min(56, age || 15));
  // Minimum stats increase with age/experience
  if (validAge < 13) return 10; // Very young: basics
  if (validAge < 18) return 25; // Teens: developing
  if (validAge < 24) return 40; // Young adults: competent
  if (validAge <= 28) return 50; // Peak: solid foundation
  return 45; // Veterans: experience compensates
};
// ✅ EXPORT: Validate stat is within age-appropriate range
export const validateStat = (value, age, statName = 'overall') => {
  const min = getMinStatByAge(age, statName);
  const max = getMaxStatByAge(age, statName);
  return Math.min(max, Math.max(min, value || min));
};
// ✅ EXPORT: Get age-based rating modifier for overall calculation
export const getAgeRatingModifier = (age) => {
  const validAge = Math.max(4, Math.min(56, age || 15));
  if (validAge < 13) return 0.7; // Youth: stats count less toward overall
  if (validAge < 18) return 0.85; // Teens: developing
  if (validAge < 24) return 0.95; // Young adults: near peak
  if (validAge <= 28) return 1.0; // Peak: full value
  if (validAge <= 32) return 0.98; // Early decline
  return 0.95; // Veterans: experience matters
};
// ✅ EXPORT: Get age group label
export const getAgeGroup = (age) => {
  if (!age) return 'Unknown';
  if (age < 13) return 'Youth';
  if (age < 18) return 'Junior';
  if (age < 24) return 'Young Pro';
  if (age <= 28) return 'Prime';
  if (age <= 32) return 'Veteran';
  return 'Legend';
};
// ✅ EXPORT: Calculate potential rating based on age and current stats
export const calculatePotential = (currentRating, age, position) => {
  if (!currentRating) return 60;
  const validAge = Math.max(4, Math.min(56, age || 15));
  // Age-based potential bonus
  let ageBonus;
  if (validAge < 18) ageBonus = 20; // High growth potential
  else if (validAge < 24) ageBonus = 12; // Still improving
  else if (validAge <= 28) ageBonus = 5; // Near peak
  else if (validAge <= 32) ageBonus = 2; // Maintaining
  else ageBonus = 0; // Declining
  // Position-based bonus
  const positionBonus = ['Forward', 'Midfielder', 'Winger'].includes(position) ? 2 : 0;
  const potential = currentRating + ageBonus + positionBonus;
  return Math.min(99, potential);
};
// ✅ EXPORT: Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
// ✅ EXPORT: Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
// ✅ EXPORT: Debounce helper for input handling
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
