// src/utils/playerDatabase.js
// Player stats storage and position recommendation
export const playerDatabase = {
  players: [],
  addPlayer: (player) => {
    player.id = Date.now();
    player.createdAt = new Date().toISOString();
    playerDatabase.players.push(player);
    return player;
  },
  getPlayer: (id) => playerDatabase.players.find(p => p.id === id),
  updatePlayer: (id, updates) => {
    const index = playerDatabase.players.findIndex(p => p.id === id);
    if (index !== -1) {
      playerDatabase.players[index] = { ...playerDatabase.players[index], ...updates };
      return playerDatabase.players[index];
    }
    return null;
  },
  getAllPlayers: () => playerDatabase.players,
  getTopPlayers: (limit = 10) => {
    return [...playerDatabase.players]
      .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
      .slice(0, limit);
  }
};
// ✅ Position recommendation based on player stats
export const recommendPosition = (stats) => {
  if (!stats || typeof stats !== "object") return "Midfielder";
  const { 
    pace = 50, 
    shooting = 50, 
    passing = 50, 
    defending = 50, 
    physical = 50, 
    dribbling = 50 
  } = stats;
  // Defender: high defending + physical
  if (defending > 75 && physical > 70) return "Defender";
  // Forward: high pace + shooting
  if (pace > 80 && shooting > 75) return "Forward";
  // Midfielder: high passing + dribbling
  if (passing > 75 && dribbling > 70) return "Midfielder";
  // Winger: very high pace
  if (pace > 85) return "Winger";
  // Striker: very high shooting
  if (shooting > 80) return "Striker";
  // Default
  return "Midfielder";
};
// ✅ Calculate overall rating from stats
export const calculateOverallRating = (stats) => {
  if (!stats) return 50;
  const values = Object.values(stats).filter(v => typeof v === 'number');
  if (values.length === 0) return 50;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};
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

export const calculatePotential = (currentRating, age, position) => {
  if (!currentRating) return 60;
  const ageBonus = age < 23 ? 15 : age < 28 ? 8 : age < 32 ? 3 : 0;
  const positionBonus = ["Forward", "Midfielder"].includes(position) ? 2 : 0;
  return Math.min(99, currentRating + ageBonus + positionBonus);
};

export const getAgeGroup = (age) => {
  if (!age) return "Unknown";
  if (age < 16) return "Youth";
  if (age < 20) return "Junior";
  if (age < 25) return "Young Pro";
  if (age < 30) return "Prime";
  return "Veteran";
};
