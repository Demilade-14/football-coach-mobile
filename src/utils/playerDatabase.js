// app/utils/playerDatabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYERS_KEY = 'football_coach_players';

/**
 * Save a player to local database
 */
export const savePlayer = async (playerData) => {
  try {
    const existingPlayers = await getAllPlayers();
    const playerId = Date.now().toString(); // Unique ID based on timestamp
    
    const newPlayer = {
      id: playerId,
      ...playerData,
      createdAt: new Date().toISOString(),
    };
    
    existingPlayers.push(newPlayer);
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(existingPlayers));
    
    return { success: true, id: playerId, message: 'Player saved successfully!' };
  } catch (error) {
    console.error('Error saving player:', error);
    return { success: false, message: 'Failed to save player' };
  }
};

/**
 * Get all saved players
 */
export const getAllPlayers = async () => {
  try {
    const data = await AsyncStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
};

/**
 * Get a specific player by ID
 */
export const getPlayerById = async (playerId) => {
  try {
    const players = await getAllPlayers();
    return players.find(p => p.id === playerId);
  } catch (error) {
    console.error('Error getting player by ID:', error);
    return null;
  }
};

/**
 * Delete a player
 */
export const deletePlayer = async (playerId) => {
  try {
    const players = await getAllPlayers();
    const filtered = players.filter(p => p.id !== playerId);
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(filtered));
    
    return { success: true, message: 'Player deleted' };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { success: false, message: 'Failed to delete player' };
  }
};

/**
 * Update a player
 */
export const updatePlayer = async (playerId, updatedData) => {
  try {
    const players = await getAllPlayers();
    const index = players.findIndex(p => p.id === playerId);
    
    if (index !== -1) {
      players[index] = {
        ...players[index],
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      return { success: true, message: 'Player updated' };
    }
    
    return { success: false, message: 'Player not found' };
  } catch (error) {
    console.error('Error updating player:', error);
    return { success: false, message: 'Failed to update player' };
  }
};

/**
 * Search players by name
 */
export const searchPlayersByName = async (query) => {
  try {
    const players = await getAllPlayers();
    return players.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching players:', error);
    return [];
  }
};

/**
 * Filter players by position
 */
export const filterPlayersByPosition = async (position) => {
  try {
    const players = await getAllPlayers();
    return players.filter(p => Array.isArray(p.positions) && p.positions[0] === position);
  } catch (error) {
    console.error('Error filtering players:', error);
    return [];
  }
};

/**
 * Sort players by rating (descending)
 */
export const sortPlayersByRating = async () => {
  try {
    const players = await getAllPlayers();
    return [...players].sort((a, b) => b.overall - a.overall);
  } catch (error) {
    console.error('Error sorting players:', error);
    return [];
  }
};

/**
 * Get total players count
 */
export const getTotalPlayersCount = async () => {
  try {
    const players = await getAllPlayers();
    return players.length;
  } catch (error) {
    console.error('Error getting count:', error);
    return 0;
  }
};

/**
 * Clear all players (USE WITH CAUTION)
 */
export const clearAllPlayers = async () => {
  try {
    await AsyncStorage.removeItem(PLAYERS_KEY);
    return { success: true, message: 'All players cleared' };
  } catch (error) {
    console.error('Error clearing players:', error);
    return { success: false, message: 'Failed to clear players' };
  }
};
// Returns max stat value based on player age
export const getMaxStatByAge = (age) => {
  if (age <= 14) return 60;
  if (age <= 16) return 70;
  if (age <= 18) return 80;
  if (age <= 21) return 88;
  if (age <= 25) return 95;
  if (age <= 29) return 99;
  if (age <= 33) return 92;
  if (age <= 37) return 85;
  return 75;
};
export const calculateOverall = (stats) => {
  if (!stats || typeof stats !== "object") return 50;
  const values = Object.values(stats).filter(v => typeof v === "number");
  if (values.length === 0) return 50;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(Math.min(99, Math.max(1, avg)));
};
