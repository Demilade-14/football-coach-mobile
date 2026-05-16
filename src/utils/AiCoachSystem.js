// src/utils/AiCoachSystem.js
// AI Coach functionality
export const AICoachSystem = {
  initialized: false,
  playerData: null,
  // ✅ Initialize the AI coach with player data
  initialize: (playerData) => {
    console.log("🤖 AICoachSystem initialized", playerData?.name || 'Unknown');
    AICoachSystem.playerData = playerData;
    AICoachSystem.initialized = true;
    return true;
  },
  // ✅ Get personalized training advice
  getAdvice: (stats) => {
    if (!stats) return "Complete your profile to get personalized advice!";
    const advice = [];
    if (stats.pace < 60) advice.push("🏃 Work on sprint drills to improve your pace");
    if (stats.shooting < 60) advice.push("⚽ Practice finishing drills in the box");
    if (stats.passing < 60) advice.push("🎯 Focus on short passing accuracy");
    if (stats.defending < 60) advice.push("🛡️ Study positioning and tackling techniques");
    if (stats.physical < 60) advice.push("💪 Add strength training to your routine");
    if (stats.dribbling < 60) advice.push("⚡ Practice cone dribbling exercises");
    if (advice.length === 0) {
      return "🎉 Great stats! Keep maintaining your skills with regular practice.";
    }
    return advice.slice(0, 3).join("\n\n");
  },
  // ✅ Analyze performance and return score + feedback
  analyzePerformance: (data) => {
    const { goals = 0, assists = 0, tackles = 0, saves = 0, matches = 1 } = data || {};
    const avgGoals = goals / matches;
    const avgAssists = assists / matches;
    const avgTackles = tackles / matches;
    let score = 50;
    let feedback = "Keep training consistently!";
    if (avgGoals > 0.5) score += 15;
    if (avgAssists > 0.3) score += 10;
    if (avgTackles > 2) score += 10;
    if (matches >= 5) score += 5;
    score = Math.min(100, Math.max(0, score));
    if (score >= 90) feedback = "🏆 Elite performance! You're ready for the next level.";
    else if (score >= 75) feedback = "⭐ Excellent progress! Keep pushing forward.";
    else if (score >= 60) feedback = "👍 Good effort! Focus on your weak areas.";
    else if (score >= 40) feedback = "📈 Room for improvement. Try the recommended drills.";
    else feedback = "💪 Don't give up! Every pro started somewhere.";
    return { score, feedback, breakdown: { goals: avgGoals, assists: avgAssists, tackles: avgTackles } };
  },
  // ✅ Generate weekly training plan
  generateTrainingPlan: (position, weakAreas = []) => {
    const plans = {
      Forward: [
        "Monday: Finishing drills (30 min)",
        "Wednesday: Sprint intervals (20 min)",
        "Friday: 1v1 attacking scenarios (25 min)",
        "Weekend: Match simulation"
      ],
      Midfielder: [
        "Monday: Passing accuracy drills (30 min)",
        "Wednesday: Vision & awareness exercises (25 min)",
        "Friday: Endurance running (30 min)",
        "Weekend: Small-sided games"
      ],
      Defender: [
        "Monday: Tackling technique (30 min)",
        "Wednesday: Positioning drills (25 min)",
        "Friday: Aerial duels practice (20 min)",
        "Weekend: Defensive shape exercises"
      ],
      Default: [
        "Monday: Technical skills (30 min)",
        "Wednesday: Physical conditioning (25 min)",
        "Friday: Tactical awareness (20 min)",
        "Weekend: Rest or light activity"
      ]
    };
    return plans[position] || plans.Default;
  }
};
// ✅ Helper: Check if coach is ready
export const isCoachReady = () => AICoachSystem.initialized && AICoachSystem.playerData !== null;
