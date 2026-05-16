// app/DrillLibrary.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function DrillLibrary() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const drills = [
    // DRIBBLING
    {
      id: 1,
      name: "Cone Dribbling",
      category: "Dribbling",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Set up 5-10 cones in a line. Dribble through them using both feet, focusing on close ball control.",
      benefits: ["Ball control", "Agility", "Coordination"],
      equipment: ["5-10 cones", "1 football"]
    },
    {
      id: 2,
      name: "Inside/Outside Touch",
      category: "Dribbling",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Alternate tapping the ball with the inside and outside of your foot while moving forward. Keep the ball close.",
      benefits: ["Close control", "Foot speed", "Technique"],
      equipment: ["1 football"]
    },
    {
      id: 3,
      name: "Figure 8 Dribble",
      category: "Dribbling",
      difficulty: "Intermediate",
      duration: "10 min",
      description: "Place 2 cones 1 meter apart. Dribble in a figure-8 pattern around them at increasing speed.",
      benefits: ["Tight control", "Change of direction", "Agility"],
      equipment: ["2 cones", "1 football"]
    },
    {
      id: 4,
      name: "Speed Dribble",
      category: "Dribbling",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Dribble at full speed over 30 meters. Push the ball ahead and chase it. Do 8 reps with 1 min rest.",
      benefits: ["Speed with ball", "Long touch", "Explosiveness"],
      equipment: ["Open space", "1 football"]
    },
    {
      id: 5,
      name: "Cruyff Turn",
      category: "Dribbling",
      difficulty: "Advanced",
      duration: "15 min",
      description: "Fake a pass or cross, then drag the ball behind your standing leg and turn. Practice left and right 20x each.",
      benefits: ["Deception", "Change of direction", "Technique"],
      equipment: ["1 football"]
    },
    {
      id: 6,
      name: "Roulette Drill",
      category: "Dribbling",
      difficulty: "Advanced",
      duration: "15 min",
      description: "Roll the ball with one foot, pivot 360 degrees using the sole of the foot, then accelerate. 15 reps each side.",
      benefits: ["Spin moves", "Ball mastery", "Creativity"],
      equipment: ["1 football"]
    },

    // PASSING
    {
      id: 7,
      name: "Wall Passing",
      category: "Passing",
      difficulty: "Beginner",
      duration: "15 min",
      description: "Pass the ball against a wall and control the rebound. Alternate between left and right foot.",
      benefits: ["First touch", "Passing accuracy", "Weak foot"],
      equipment: ["Wall", "1 football"]
    },
    {
      id: 8,
      name: "Triangle Passing",
      category: "Passing",
      difficulty: "Beginner",
      duration: "15 min",
      description: "3 players form a triangle 10m apart. One-touch passing around the triangle, then switch direction.",
      benefits: ["Quick passing", "Communication", "Movement"],
      equipment: ["3 players", "1 football", "Cones"]
    },
    {
      id: 9,
      name: "Long Ball Accuracy",
      category: "Passing",
      difficulty: "Intermediate",
      duration: "20 min",
      description: "Hit passes over 30-40 meters aimed at a target zone. Alternate left and right foot. 20 attempts each.",
      benefits: ["Long passing", "Vision", "Technique"],
      equipment: ["Partner", "1 football", "Cones"]
    },
    {
      id: 10,
      name: "Crossing Practice",
      category: "Passing",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "From wing position, deliver 20 crosses into the box. Vary height and pace.",
      benefits: ["Crossing", "Accuracy", "Vision"],
      equipment: ["Goal", "5-10 footballs", "Cones"]
    },
    {
      id: 11,
      name: "Rondo (Keep Away)",
      category: "Passing",
      difficulty: "Advanced",
      duration: "15 min",
      description: "4v2 in small circle. Keep possession with quick passing. Switch defenders every 2 minutes.",
      benefits: ["Passing", "Movement", "Decision making"],
      equipment: ["6 players", "1 football", "Cones"]
    },
    {
      id: 12,
      name: "Switch Play Drill",
      category: "Passing",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Practice switching the ball from one side of the pitch to the other using 3-4 players. Quick, accurate long balls.",
      benefits: ["Vision", "Long range passing", "Width play"],
      equipment: ["4 players", "1 football", "Cones"]
    },

    // SHOOTING
    {
      id: 13,
      name: "Shooting Practice",
      category: "Shooting",
      difficulty: "Intermediate",
      duration: "20 min",
      description: "Place ball at edge of box. Take 10 shots with right foot, 10 with left. Aim for corners.",
      benefits: ["Shot power", "Accuracy", "Technique"],
      equipment: ["Goal", "5-10 footballs"]
    },
    {
      id: 14,
      name: "First Time Finishing",
      category: "Shooting",
      difficulty: "Intermediate",
      duration: "20 min",
      description: "Partner feeds ball into your path. Strike first time without controlling. 20 reps from different angles.",
      benefits: ["First touch shooting", "Composure", "Technique"],
      equipment: ["Goal", "Partner", "5 footballs"]
    },
    {
      id: 15,
      name: "Volley Practice",
      category: "Shooting",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Partner throws ball at waist height. Strike volley toward goal. Focus on technique over power. 15 each side.",
      benefits: ["Volleys", "Coordination", "Timing"],
      equipment: ["Goal", "Partner", "5 footballs"]
    },
    {
      id: 16,
      name: "Penalty Routine",
      category: "Shooting",
      difficulty: "Beginner",
      duration: "15 min",
      description: "Take 10 penalties. Pick a corner before you shoot. Focus on consistent run-up and technique.",
      benefits: ["Composure", "Accuracy", "Mental strength"],
      equipment: ["Goal", "5 footballs"]
    },

    // SPEED
    {
      id: 17,
      name: "Ladder Drills",
      category: "Speed",
      difficulty: "Intermediate",
      duration: "10 min",
      description: "Run through agility ladder with various footwork patterns. 5 sets of each pattern.",
      benefits: ["Footwork", "Agility", "Coordination"],
      equipment: ["Agility ladder"]
    },
    {
      id: 18,
      name: "Sprint Intervals",
      category: "Speed",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Sprint 40m at max speed, walk back. Repeat 10 times. Rest 2 minutes between sets.",
      benefits: ["Speed", "Stamina", "Explosiveness"],
      equipment: ["Cones for markers"]
    },
    {
      id: 19,
      name: "Reaction Sprints",
      category: "Speed",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Stand with back to direction of travel. On signal, turn and sprint 20m. React as fast as possible. 10 reps.",
      benefits: ["Reaction time", "Acceleration", "Awareness"],
      equipment: ["Partner for signals", "Cones"]
    },
    {
      id: 20,
      name: "Box Jumps",
      category: "Speed",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Jump explosively onto a raised platform, land softly, step down and repeat. 4 sets of 10.",
      benefits: ["Explosive power", "Jumping ability", "Strength"],
      equipment: ["Plyometric box or step"]
    },

    // DEFENDING
    {
      id: 21,
      name: "1v1 Defending",
      category: "Defending",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Practice defensive positioning and tackling with a partner. Take turns attacking and defending.",
      benefits: ["Tackling", "Positioning", "Reactions"],
      equipment: ["Partner", "1 football", "Cones"]
    },
    {
      id: 22,
      name: "Jockeying Practice",
      category: "Defending",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Face a partner who slowly dribbles toward you. Backpedal and stay low, angling to show them wide.",
      benefits: ["Defensive shape", "Balance", "Awareness"],
      equipment: ["Partner", "1 football"]
    },
    {
      id: 23,
      name: "Clearance Drill",
      category: "Defending",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Partner crosses balls into box. Head or volley clear with distance and height as priority. 20 reps.",
      benefits: ["Aerial duels", "Clearances", "Heading"],
      equipment: ["Partner", "5 footballs", "Goal area"]
    },
    {
      id: 24,
      name: "Pressing Drill",
      category: "Defending",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Press opponent immediately on receiving ball. 2 defenders press 2 attackers in small zone. Switch every 3 min.",
      benefits: ["High press", "Teamwork", "Intensity"],
      equipment: ["4 players", "1 football", "Cones"]
    },

    // BALL CONTROL
    {
      id: 25,
      name: "Juggling Challenge",
      category: "Ball Control",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Keep the ball in the air using feet, thighs, chest, and head. Try to beat your record.",
      benefits: ["Touch", "Balance", "Concentration"],
      equipment: ["1 football"]
    },
    {
      id: 26,
      name: "Chest Control",
      category: "Ball Control",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Partner throws ball at chest height. Control with chest and bring down to feet. 20 reps each.",
      benefits: ["Chest control", "First touch", "Body positioning"],
      equipment: ["Partner", "1 football"]
    },
    {
      id: 27,
      name: "Thigh Trapping",
      category: "Ball Control",
      difficulty: "Beginner",
      duration: "10 min",
      description: "Toss ball up and catch on your thigh, letting it drop to feet. Alternate legs. 30 reps each leg.",
      benefits: ["Thigh control", "Touch", "Balance"],
      equipment: ["1 football"]
    },
    {
      id: 28,
      name: "Receiving Under Pressure",
      category: "Ball Control",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Partner passes while you have a shadow defender behind you. Control and turn quickly in tight space.",
      benefits: ["Shielding", "Turning", "First touch"],
      equipment: ["2 partners", "1 football", "Cones"]
    },

    // GOALKEEPING
    {
      id: 29,
      name: "Goalkeeper Reflexes",
      category: "Goalkeeping",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Partner shoots from close range. React and save. 20 shots, alternating sides.",
      benefits: ["Reflexes", "Diving", "Positioning"],
      equipment: ["Goal", "Partner", "5-10 footballs"]
    },
    {
      id: 30,
      name: "Distribution Drill",
      category: "Goalkeeping",
      difficulty: "Beginner",
      duration: "15 min",
      description: "Practice throwing, rolling, and kicking the ball accurately to targets at different distances. 10 of each.",
      benefits: ["Distribution", "Accuracy", "Decision making"],
      equipment: ["Goal", "5 footballs", "Targets/cones"]
    },
    {
      id: 31,
      name: "Cross Claiming",
      category: "Goalkeeping",
      difficulty: "Intermediate",
      duration: "20 min",
      description: "Partner crosses from left and right. Keeper calls, comes out and claims at highest point. 20 crosses.",
      benefits: ["Aerial command", "Communication", "Positioning"],
      equipment: ["Goal", "Partner", "5 footballs"]
    },
    {
      id: 32,
      name: "Penalty Saves",
      category: "Goalkeeping",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Face 10 penalties. Try to read the shooter's body language. Dive early or wait — experiment.",
      benefits: ["Reading body language", "Diving", "Composure"],
      equipment: ["Goal", "Partner", "5 footballs"]
    },

    // FITNESS
    {
      id: 33,
      name: "Beep Test",
      category: "Fitness",
      difficulty: "Advanced",
      duration: "20 min",
      description: "Run 20m shuttles in time to increasing beeps. Used to measure aerobic endurance. Go as long as possible.",
      benefits: ["Endurance", "Mental toughness", "Fitness baseline"],
      equipment: ["20m space", "Beep test audio"]
    },
    {
      id: 34,
      name: "Shuttle Runs",
      category: "Fitness",
      difficulty: "Intermediate",
      duration: "15 min",
      description: "Sprint 5m, touch ground, sprint back. Then 10m, back. Then 15m, back. That's 1 rep. Do 6 reps with 90s rest.",
      benefits: ["Acceleration", "Stamina", "Change of direction"],
      equipment: ["Cones"]
    },
    {
      id: 35,
      name: "Circuit Training",
      category: "Fitness",
      difficulty: "Intermediate",
      duration: "25 min",
      description: "5 stations: 20 push-ups, 30s plank, 20 squats, 10 burpees, 20 lunges. Rest 1 min between stations. 3 rounds.",
      benefits: ["Strength", "Endurance", "Core stability"],
      equipment: ["None"]
    },
    {
      id: 36,
      name: "Nordic Hamstring Curls",
      category: "Fitness",
      difficulty: "Advanced",
      duration: "15 min",
      description: "Kneel with feet anchored. Lower body slowly toward ground using hamstrings. 4 sets of 6 reps.",
      benefits: ["Hamstring strength", "Injury prevention", "Eccentric strength"],
      equipment: ["Partner to hold feet", "Mat"]
    },
  ];

  const categories = ['All', 'Dribbling', 'Passing', 'Shooting', 'Speed', 'Defending', 'Ball Control', 'Goalkeeping', 'Fitness'];

  const filteredDrills = selectedCategory === 'All'
    ? drills
    : drills.filter(d => d.category === selectedCategory);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#28a745';
      case 'Intermediate': return '#ffc107';
      case 'Advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Drill Library</Text>
        <Text style={styles.subtitle}>{drills.length} Training Drills</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.countText}>
        Showing {filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''}
      </Text>

      <View style={styles.drillsContainer}>
        {filteredDrills.map(drill => (
          <View key={drill.id} style={styles.drillCard}>
            <View style={styles.drillHeader}>
              <Text style={styles.drillName}>{drill.name}</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(drill.difficulty) }]}>
                <Text style={styles.difficultyText}>{drill.difficulty}</Text>
              </View>
            </View>

            <View style={styles.drillMeta}>
              <Text style={styles.metaText}>{drill.duration}</Text>
              <Text style={styles.metaText}>{drill.category}</Text>
            </View>

            <Text style={styles.drillDescription}>{drill.description}</Text>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              <View style={styles.benefitsList}>
                {drill.benefits.map((benefit, i) => (
                  <View key={i} style={styles.benefitTag}>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.equipmentSection}>
              <Text style={styles.equipmentTitle}>Equipment:</Text>
              <Text style={styles.equipmentText}>{drill.equipment.join(', ')}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  header: { padding: 20, alignItems: 'center' },
  backButton: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a8dadc', textAlign: 'center' },
  categoryScroll: { paddingHorizontal: 20, marginVertical: 15 },
  categoryButton: { backgroundColor: '#1b263b', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  categoryButtonActive: { backgroundColor: '#ffd700' },
  categoryText: { color: '#f1faee', fontSize: 14, fontWeight: '600' },
  categoryTextActive: { color: '#0d1b2a' },
  countText: { color: '#a8dadc', fontSize: 13, paddingHorizontal: 20, marginBottom: 5 },
  drillsContainer: { padding: 20 },
  drillCard: { backgroundColor: '#1b263b', borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#415a77' },
  drillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  drillName: { fontSize: 18, fontWeight: 'bold', color: '#f1faee', flex: 1, marginRight: 10 },
  difficultyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  difficultyText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  drillMeta: { flexDirection: 'row', marginBottom: 15, gap: 15 },
  metaText: { color: '#a8dadc', fontSize: 13 },
  drillDescription: { color: '#f1faee', fontSize: 14, lineHeight: 21, marginBottom: 15 },
  benefitsSection: { marginBottom: 15 },
  benefitsTitle: { color: '#ffd700', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  benefitsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  benefitTag: { backgroundColor: '#0d1b2a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  benefitText: { color: '#28a745', fontSize: 12, fontWeight: '600' },
  equipmentSection: {},
  equipmentTitle: { color: '#ffd700', fontSize: 13, fontWeight: 'bold', marginBottom: 5 },
  equipmentText: { color: '#a8dadc', fontSize: 13 },
});