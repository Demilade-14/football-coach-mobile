// src/utils/playerDatabase.js
// Complete player stats storage and utility functions
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
  const { pace = 50, shooting = 50, passing = 50, defending = 50, physical = 50, dribbling = 50 } = stats;
  if (defending > 75 && physical > 70) return "Defender";
  if (pace > 80 && shooting > 75) return "Forward";
  if (passing > 75 && dribbling > 70) return "Midfielder";
  if (pace > 85) return "Winger";
  if (shooting > 80) return "Striker";
  return "Midfielder";
};
// ✅ Calculate overall rating from stats
export const calculateOverall = (stats) => {
  if (!stats || typeof stats !== "object") return 50;
  const values = Object.values(stats).filter(v => typeof v === 'number');
  if (values.length === 0) return 50;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};
// ✅ Get maximum expected stat value for a given age
export const getMaxStatByAge = (age, statName) => {
  if (!age || age < 13) age = 13;
  if (age > 35) age = 35;
  const ageFactor = age <= 28 ? 0.5 + (age - 13) * 0.035 : 1.0 - (age - 28) * 0.015;
  const statCeilings = { pace: 95, shooting: 92, passing: 94, defending: 93, physical: 90, dribbling: 94, overall: 99 };
  const baseMax = statCeilings[statName] || 90;
  return Math.round(baseMax * ageFactor);
};
// ✅ Get minimum expected stat value for a given age
export const getMinStatByAge = (age, statName) => {
  if (!age || age < 13) age = 13;
  if (age > 35) age = 35;
  const minBase = age <= 18 ? 30 + (age - 13) * 4 : 50 + (age - 18) * 1;
  return Math.min(85, Math.max(25, minBase));
};
// ✅ Validate stat value within age-appropriate range
export const validateStat = (value, age, statName) => {
  const min = getMinStatByAge(age, statName);
  const max = getMaxStatByAge(age, statName);
  return Math.min(max, Math.max(min, value));
};
// ✅ Get age group label
export const getAgeGroup = (age) => {
  if (!age) return "Unknown";
  if (age < 16) return "Youth";
  if (age < 20) return "Junior";
  if (age < 25) return "Young Pro";
  if (age < 30) return "Prime";
  return "Veteran";
};
// ✅ Calculate potential rating
export const calculatePotential = (currentRating, age, position) => {
  if (!currentRating) return 60;
  const ageBonus = age < 23 ? 15 : age < 28 ? 8 : age < 32 ? 3 : 0;
  const positionBonus = ["Forward", "Midfielder"].includes(position) ? 2 : 0;
  return Math.min(99, currentRating + ageBonus + positionBonus);
};
// ✅ Get improvement tips based on player stats
export const getImprovementTips = (stats, position) => {
  if (!stats || typeof stats !== "object") {
    return ["Complete your player profile to get personalized tips!"];
  }
  const tips = [];
  const { pace = 50, shooting = 50, passing = 50, defending = 50, physical = 50, dribbling = 50 } = stats;
  if (position === "Forward" || position === "Striker") {
    if (shooting < 70) tips.push("🎯 Practice finishing drills");
    if (pace < 70) tips.push("⚡ Work on sprint training");
    if (dribbling < 70) tips.push("⚽ Improve ball control");
  } else if (position === "Midfielder") {
    if (passing < 70) tips.push("🎯 Improve passing accuracy");
    if (dribbling < 70) tips.push("⚡ Work on ball control");
    if (physical < 65) tips.push("💪 Build stamina");
  } else if (position === "Defender") {
    if (defending < 70) tips.push("🛡️ Study positioning");
    if (physical < 70) tips.push("💪 Strength training");
    if (pace < 65) tips.push("⚡ Speed drills");
  }
  if (tips.length === 0) {
    tips.push("🌟 Great stats! Keep training consistently");
    tips.push("📊 Focus on weak foot training");
  }
  return tips.slice(0, 5);
};
// ✅ Get weak areas based on stats
export const getWeakAreas = (stats) => {
  if (!stats) return [];
  const weakAreas = [];
  const { pace = 50, shooting = 50, passing = 50, defending = 50, physical = 50, dribbling = 50 } = stats;
  if (pace < 60) weakAreas.push("Pace");
  if (shooting < 60) weakAreas.push("Shooting");
  if (passing < 60) weakAreas.push("Passing");
  if (defending < 60) weakAreas.push("Defending");
  if (physical < 60) weakAreas.push("Physical");
  if (dribbling < 60) weakAreas.push("Dribbling");
  return weakAreas.length > 0 ? weakAreas : ["None - well rounded!"];
};
// ✅ Get stat category label
export const getStatLabel = (statName) => {
  const labels = { pace: "Pace", shooting: "Shooting", passing: "Passing", defending: "Defending", physical: "Physical", dribbling: "Dribbling", overall: "Overall" };
  return labels[statName] || statName;
};
