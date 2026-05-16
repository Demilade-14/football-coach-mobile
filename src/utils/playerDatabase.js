// In-memory player storage
const _players = [];
// FC 26 Accurate Overall Rating Calculation
export const calculateOverall = (attrs, age = 15, position = 'ST') => {
  if (!attrs) return 50;
  // FC 26 uses weighted stats based on position
  const positionWeights = {
    'GK': { diving: 0.25, handling: 0.25, kicking: 0.15, positioning: 0.20, reflexes: 0.15 },
    'CB': { defending: 0.35, physical: 0.25, pace: 0.15, passing: 0.15, shooting: 0.10 },
    'LB': { defending: 0.30, pace: 0.25, physical: 0.15, passing: 0.20, shooting: 0.10 },
    'RB': { defending: 0.30, pace: 0.25, physical: 0.15, passing: 0.20, shooting: 0.10 },
    'CDM': { defending: 0.30, passing: 0.30, physical: 0.20, pace: 0.10, shooting: 0.10 },
    'CM': { passing: 0.30, defending: 0.25, physical: 0.20, pace: 0.15, shooting: 0.10 },
    'CAM': { passing: 0.35, shooting: 0.25, dribbling: 0.20, physical: 0.10, pace: 0.10 },
    'LW': { pace: 0.30, dribbling: 0.25, shooting: 0.25, passing: 0.15, physical: 0.05 },
    'RW': { pace: 0.30, dribbling: 0.25, shooting: 0.25, passing: 0.15, physical: 0.05 },
    'LM': { pace: 0.25, passing: 0.25, dribbling: 0.20, defending: 0.15, physical: 0.15 },
    'RM': { pace: 0.25, passing: 0.25, dribbling: 0.20, defending: 0.15, physical: 0.15 },
    'ST': { shooting: 0.35, pace: 0.25, dribbling: 0.20, physical: 0.15, passing: 0.05 },
    'CF': { shooting: 0.30, pace: 0.25, dribbling: 0.20, passing: 0.15, physical: 0.10 },
  };
  const weights = positionWeights[position] || positionWeights['ST'];
  // Calculate category ratings (0-99 scale)
  const pace = Math.min(99, Math.max(1, 
    (attrs.acceleration + attrs.sprintSpeed) / 2
  ));
  const shooting = Math.min(99, Math.max(1,
    (attrs.finishing + attrs.shotPower + attrs.longShots + attrs.volleys + attrs.penalties) / 5
  ));
  const passing = Math.min(99, Math.max(1,
    (attrs.vision + attrs.crossing + attrs.shortPassing + attrs.longPassing + attrs.curve) / 5
  ));
  const dribbling = Math.min(99, Math.max(1,
    (attrs.agility + attrs.balance + attrs.reactions + attrs.ballControl + attrs.dribbling + attrs.composure) / 6
  ));
  const defending = Math.min(99, Math.max(1,
    (attrs.interceptions + attrs.headingAccuracy + attrs.marking + attrs.standingTackle + attrs.slidingTackle) / 5
  ));
  const physical = Math.min(99, Math.max(1,
    (attrs.jumping + attrs.stamina + attrs.strength + attrs.aggression) / 4
  ));
  // Calculate overall based on position weights
  let overall = 0;
  if (position === 'GK') {
    overall = (
      attrs.diving * 0.25 +
      attrs.handling * 0.25 +
      attrs.kicking * 0.15 +
      attrs.positioning * 0.20 +
      attrs.reflexes * 0.15
    );
  } else {
    overall = (
      pace * (weights.pace || 0) +
      shooting * (weights.shooting || 0) +
      passing * (weights.passing || 0) +
      dribbling * (weights.dribbling || 0) +
      defending * (weights.defending || 0) +
      physical * (weights.physical || 0)
    );
  }
  // Apply age modifier (FC 26 style)
  let ageModifier = 1.0;
  if (age < 18) ageModifier = 0.85 + (age - 14) * 0.025;
  else if (age > 32) ageModifier = 1.0 - (age - 32) * 0.015;
  overall = Math.round(overall * ageModifier);
  return Math.min(99, Math.max(40, overall));
};
// Get position based on stats (FC 26 logic)
export const recommendPosition = (attrs, age = 15, preferredFoot = 'Right') => {
  if (!attrs) return 'ST';
  const pace = (attrs.acceleration + attrs.sprintSpeed) / 2;
  const shooting = (attrs.finishing + attrs.shotPower) / 2;
  const passing = (attrs.shortPassing + attrs.longPassing + attrs.vision) / 3;
  const dribbling = (attrs.dribbling + attrs.ballControl + attrs.agility) / 3;
  const defending = (attrs.marking + attrs.standingTackle + attrs.interceptions) / 3;
  const physical = (attrs.strength + attrs.stamina + attrs.aggression) / 3;
  // Goalkeeper check
  if (attrs.diving > 70 && attrs.handling > 70 && attrs.reflexes > 70) {
    return 'GK';
  }
  // Defender check
  if (defending > 70 && physical > 65) {
    if (pace > 75) return 'LB';
    if (pace > 70) return 'CB';
    return 'CB';
  }
  // Midfielder check
  if (passing > 70 && defending > 60) {
    if (pace > 75 && dribbling > 70) return 'CAM';
    if (defending > 70) return 'CDM';
    return 'CM';
  }
  // Attacker check
  if (shooting > 70 || pace > 75) {
    if (pace > 80 && dribbling > 75) return 'LW';
    if (shooting > 75 && physical > 70) return 'ST';
    if (pace > 75 && passing > 65) return 'RW';
    return 'ST';
  }
  return 'CM';
};
// Get card type based on rating (FC 26 style)
export const getCardType = (overall) => {
  if (overall >= 90) return { type: 'TOTY', color: '#0066CC', glow: '#00CCFF' };
  if (overall >= 87) return { type: 'TOTS', color: '#FF6600', glow: '#FF9900' };
  if (overall >= 85) return { type: 'TOTW', color: '#CC9900', glow: '#FFCC00' };
  if (overall >= 80) return { type: 'Gold Rare', color: '#D4AF37', glow: '#FFD700' };
  if (overall >= 75) return { type: 'Gold', color: '#B8860B', glow: '#DAA520' };
  if (overall >= 70) return { type: 'Silver Rare', color: '#C0C0C0', glow: '#E8E8E8' };
  return { type: 'Bronze', color: '#CD7F32', glow: '#D2691E' };
};
// Save player
export const savePlayer = async (playerData) => {
  try {
    if (!playerData.id) {
      playerData.id = Date.now().toString();
    }
    playerData.createdAt = new Date().toISOString();
    _players.push(playerData);
    return { success: true, data: playerData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
// Get all players
export const getAllPlayers = () => [..._players];
// Get top players
export const getTopPlayers = (limit = 10) => {
  return [..._players]
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, limit);
};
// Delete player
export const deletePlayer = (id) => {
  const index = _players.findIndex(p => p.id === id);
  if (index !== -1) {
    return _players.splice(index, 1)[0];
  }
  return null;
};
// Get total count
export const getTotalPlayersCount = () => _players.length;
// Check if can save more (free tier: 5 max)
export const canSaveMorePlayers = (currentCount) => currentCount < 5;
