  return Math.min(max, Math.max(min, value));// ✅ Get improvement tips based on player stats
export const getImprovementTips = (stats, position) => {
  if (!stats || typeof stats !== "object") {
    return ["Complete your player profile to get personalized tips!"];
  }
  const tips = [];
  const { pace = 50, shooting = 50, passing = 50, defending = 50, physical = 50, dribbling = 50 } = stats;
  // Position-specific tips
  if (position === "Forward" || position === "Striker") {
    if (shooting < 70) tips.push("🎯 Practice finishing drills - shoot at different corners of the goal");
    if (pace < 70) tips.push("⚡ Work on sprint training - interval sprints improve speed");
    if (dribbling < 70) tips.push("⚽ Improve ball control - practice dribbling through cones");
  } else if (position === "Midfielder") {
    if (passing < 70) tips.push("🎯 Improve passing accuracy - practice short and long passes");
    if (dribbling < 70) tips.push("⚡ Work on ball control - keep the ball close while moving");
    if (physical < 65) tips.push("💪 Build stamina - regular cardio and strength training");
  } else if (position === "Defender") {
    if (defending < 70) tips.push("🛡️ Study positioning - watch professional defenders");
    if (physical < 70) tips.push("💪 Strength training - focus on leg and core exercises");
    if (pace < 65) tips.push("⚡ Speed drills - practice recovery runs");
  }
  // General tips for low stats
  if (pace < 60 && !tips.some(t => t.includes("Speed") || t.includes("sprint"))) {
    tips.push("🏃 General speed work - include sprint intervals in training");
  }
  if (shooting < 60 && !tips.some(t => t.includes("shooting") || t.includes("finishing"))) {
    tips.push("⚽ Shooting practice - 15 minutes daily shooting drills");
  }
  if (passing < 60 && !tips.some(t => t.includes("passing"))) {
    tips.push("🎯 Passing drills - practice with a wall or partner");
  }
  // If no specific tips, provide general advice
  if (tips.length === 0) {
    tips.push("🌟 Great stats! Keep training consistently to maintain your level");
    tips.push("📊 Focus on weak foot training to become more versatile");
    tips.push("🎮 Watch professional matches to learn positioning");
  }
  return tips.slice(0, 5); // Return max 5 tips
};
// ✅ Calculate weak areas based on stats
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
  const labels = {
    pace: "Pace",
    shooting: "Shooting",
    passing: "Passing",
    defending: "Defending",
    physical: "Physical",
    dribbling: "Dribbling",
    overall: "Overall"
  };
  return labels[statName] || statName;
};
};
