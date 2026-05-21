import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYERS_KEY = '@football_coach_players';
const MAX_FREE_PLAYERS = 5;

/**
 * Save a player to AsyncStorage
 */
export const savePlayer = async (player) => {
  try {
    const existingPlayers = await getAllPlayers();
    const updatedPlayers = [...existingPlayers, player];
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(updatedPlayers));
    return { success: true, player };
  } catch (error) {
    console.error('Error saving player:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all players from AsyncStorage
 */
export const getAllPlayers = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PLAYERS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
};

/**
 * Get a single player by ID
 */
export const getPlayerById = async (id) => {
  try {
    const players = await getAllPlayers();
    return players.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error getting player:', error);
    return null;
  }
};

/**
 * Update a player
 */
export const updatePlayer = async (id, updates) => {
  try {
    const players = await getAllPlayers();
    const index = players.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Player not found' };
    }
    players[index] = { ...players[index], ...updates, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    return { success: true, player: players[index] };
  } catch (error) {
    console.error('Error updating player:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a player
 */
export const deletePlayer = async (id) => {
  try {
    const players = await getAllPlayers();
    const filtered = players.filter(p => p.id !== id);
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get total player count
 */
export const getTotalPlayersCount = async () => {
  try {
    const players = await getAllPlayers();
    return players.length;
  } catch (error) {
    console.error('Error counting players:', error);
    return 0;
  }
};

/**
 * Check if user can save more players (free tier limit)
 */
export const canSaveMorePlayers = async (currentCount = null) => {
  try {
    const count = currentCount !== null ? currentCount : await getTotalPlayersCount();
    return count < MAX_FREE_PLAYERS;
  } catch (error) {
    console.error('Error checking player limit:', error);
    return false;
  }
};

/**
 * Get improvement tips based on position and attributes
 */
export const getImprovementTips = (position, attrs, options = {}) => {
  const tips = [];
  const get = (key) => Number(attrs[key]) || 0;

  if (position === 'GK' || position === 'Goalkeeper' || position === 'Goalkeeping') {
    // GK-specific tips
    if (get('diving') < 60) tips.push('Improve diving to save low shots');
    if (get('handling') < 60) tips.push('Work on handling to catch crosses');
    if (get('reflexes') < 60) tips.push('Train reflexes for quick saves');
    if (get('kicking') < 60) tips.push('Practice distribution and kicking');
    if (get('positioning') < 60) tips.push('Study positioning for better angles');
  } else {
    // Outfield tips
    if (get('finishing') < 60) tips.push('Practice finishing in the box');
    if (get('shotPower') < 60) tips.push('Work on shot power');
    if (get('dribbling') < 60) tips.push('Improve ball control and dribbling');
    if (get('passing') < 60) tips.push('Focus on passing accuracy');
    if (get('pace') < 60) tips.push('Train speed and acceleration');
    if (get('defending') < 60) tips.push('Work on tackling and positioning');
  }

  // General tips
  if (get('stamina') < 60) tips.push('Build stamina for 90-minute performance');
  if (get('strength') < 60) tips.push('Increase strength for physical battles');
  if (get('composure') < 60) tips.push('Stay calm under pressure');

  // Support-specific tips
  if (options.disability) {
    tips.push('Adaptive training programs available');
  }
  if (options.mentalStress) {
    tips.push('Mental conditioning exercises recommended');
  }

  return tips.length > 0 ? tips : ['Keep training consistently!'];
};
/**
 * Determine card type/tier based on overall rating
 * Used for visual styling and filtering
 */
export const getCardType = (overall) => {
  if (!overall || overall < 40) return 'rookie';
  if (overall < 55) return 'iron';
  if (overall < 65) return 'bronze';
  if (overall < 75) return 'silver';
  if (overall < 80) return 'gold';
  if (overall < 85) return 'elite';
  return 'icon';
};

/**
 * Get card color based on type
 */
export const getCardColor = (type) => {
  const colors = {
    rookie: '#78909c',
    iron:   '#ef5350',
    bronze: '#cd7f32',
    silver: '#90a4ae',
    gold:   '#ffa726',
    elite:  '#ffd700',
    icon:   '#9b59b6',
  };
  return colors[type] || colors.rookie;
};
export default {
  savePlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  getTotalPlayersCount,
  canSaveMorePlayers,
  getImprovementTips,
};