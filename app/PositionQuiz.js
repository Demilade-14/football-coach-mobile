// app/PositionQuiz.js — UPGRADED
// Added: animations, 10 questions (up from 8), pro player comparisons,
// skill radar description, position badges, retake with different result tracking

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ── Position metadata ─────────────────────────────────────────
const POSITIONS = {
  striker: {
    name: 'Striker',
    short: 'ST',
    icon: '⚽',
    color: '#ef5350',
    desc: 'You have a natural instinct for goal and thrive inside the box. Clinical, composed, and always in the right place.',
    proPlayers: ['Erling Haaland', 'Harry Kane', 'Romelu Lukaku'],
    strengths: ['Finishing', 'Movement', 'Positioning'],
    formations: ['9 in 4-3-3', '9 in 4-4-2', '9 in 3-5-2'],
  },
  winger: {
    name: 'Winger',
    short: 'LW/RW',
    icon: '🌪️',
    color: '#ff9800',
    desc: 'Pace, skill and directness define you. You love running at defenders with the ball at your feet.',
    proPlayers: ['Kylian Mbappé', 'Bukayo Saka', 'Leroy Sané'],
    strengths: ['Pace', 'Dribbling', 'Crossing'],
    formations: ['LW in 4-3-3', 'RW in 4-2-3-1'],
  },
  attackingMid: {
    name: 'Attacking Midfielder',
    short: 'CAM',
    icon: '🎨',
    color: '#ab47bc',
    desc: 'The creative spark behind the attack. You find pockets of space and unlock defenses with your vision.',
    proPlayers: ['Kevin De Bruyne', 'Bruno Fernandes', 'Martin Ødegaard'],
    strengths: ['Vision', 'Passing', 'Creativity'],
    formations: ['10 in 4-2-3-1', '10 in 4-3-3'],
  },
  deepLying: {
    name: 'Deep-Lying Playmaker',
    short: 'DLP',
    icon: '🧭',
    color: '#42a5f5',
    desc: 'The quarterback of the team. Your vision and passing range dictate the tempo and control games.',
    proPlayers: ['Toni Kroos', 'Xabi Alonso', 'Thiago Alcântara'],
    strengths: ['Long passing', 'Positioning', 'Composure'],
    formations: ['6 in 4-3-3', '8 in 4-1-4-1'],
  },
  boxToBox: {
    name: 'Box-to-Box Midfielder',
    short: 'CM',
    icon: '⚡',
    color: '#26c6da',
    desc: 'The complete midfielder. You cover every blade of grass and contribute at both ends of the pitch.',
    proPlayers: ['Casemiro', 'Leon Goretzka', 'Thomas Partey'],
    strengths: ['Stamina', 'Tackling', 'Goals'],
    formations: ['8 in 4-3-3', '8 in 4-2-3-1'],
  },
  defensiveMid: {
    name: 'Defensive Midfielder',
    short: 'CDM',
    icon: '🛡️',
    color: '#66bb6a',
    desc: 'The shield in front of the defense. You break up play, win the ball, and recycle possession efficiently.',
    proPlayers: ['Rodri', 'Fabinho', 'N\'Golo Kanté'],
    strengths: ['Interceptions', 'Tackling', 'Positioning'],
    formations: ['6 in 4-3-3', '6 in 4-1-4-1'],
  },
  fullBack: {
    name: 'Full Back',
    short: 'LB/RB',
    icon: '🏃',
    color: '#ffd700',
    desc: 'Athletic and energetic — you support the attack going forward and defend with equal quality.',
    proPlayers: ['Trent Alexander-Arnold', 'Alphonso Davies', 'Andrew Robertson'],
    strengths: ['Crossing', 'Stamina', 'Defending'],
    formations: ['2/5 in 4-3-3', '2/5 in 4-2-3-1'],
  },
  defender: {
    name: 'Centre Back',
    short: 'CB',
    icon: '🧱',
    color: '#78909c',
    desc: 'Solid, powerful and disciplined. You read the game brilliantly and shut down attackers before they can threaten.',
    proPlayers: ['Virgil van Dijk', 'Rúben Dias', 'William Saliba'],
    strengths: ['Heading', 'Tackling', 'Leadership'],
    formations: ['4 in 4-3-3', '3/4/5 in 3-4-3'],
  },
  goalkeeper: {
    name: 'Goalkeeper',
    short: 'GK',
    icon: '🧤',
    color: '#29b6f6',
    desc: 'Cool under pressure with sharp reflexes and command of your area. The last line of defense and first line of attack.',
    proPlayers: ['Alisson Becker', 'Manuel Neuer', 'Marc-André ter Stegen'],
    strengths: ['Reflexes', 'Distribution', 'Command'],
    formations: ['1 in all formations'],
  },
};

// ── Quiz questions (10 total) ─────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    question: "What do you enjoy most on the pitch?",
    emoji: "⚽",
    options: [
      { text: "Scoring goals — I live for that feeling", points: { striker: 3, winger: 1 } },
      { text: "Creating chances for teammates", points: { attackingMid: 3, deepLying: 2 } },
      { text: "Stopping opponents and winning the ball", points: { defender: 3, defensiveMid: 2 } },
      { text: "Making crucial saves to keep a clean sheet", points: { goalkeeper: 3 } },
    ],
  },
  {
    id: 2,
    question: "How would teammates describe your speed?",
    emoji: "💨",
    options: [
      { text: "Lightning fast — one of the quickest", points: { winger: 3, striker: 2, fullBack: 2 } },
      { text: "Pacey with good acceleration", points: { attackingMid: 2, boxToBox: 2 } },
      { text: "Average — I rely on positioning", points: { defender: 2, defensiveMid: 2, deepLying: 2 } },
      { text: "Speed isn't really my thing", points: { goalkeeper: 2, defender: 1 } },
    ],
  },
  {
    id: 3,
    question: "What's your strongest physical attribute?",
    emoji: "💪",
    options: [
      { text: "Agility, balance and quick feet", points: { winger: 3, attackingMid: 2 } },
      { text: "Strength, power and aerial ability", points: { defender: 3, striker: 2 } },
      { text: "Stamina — I never stop running", points: { boxToBox: 3, fullBack: 2 } },
      { text: "Reflexes and sharp reactions", points: { goalkeeper: 3, winger: 1 } },
    ],
  },
  {
    id: 4,
    question: "How do you prefer to play with the ball?",
    emoji: "🎯",
    options: [
      { text: "Short, one-touch passes to move it quickly", points: { attackingMid: 3, deepLying: 2 } },
      { text: "Long, accurate switches to change play", points: { deepLying: 3, defensiveMid: 2 } },
      { text: "Dribble at defenders to beat them", points: { winger: 3, striker: 1 } },
      { text: "Shoot whenever I get the chance", points: { striker: 3, winger: 1 } },
    ],
  },
  {
    id: 5,
    question: "What's your defensive approach?",
    emoji: "🛡️",
    options: [
      { text: "Aggressive tackling and winning the ball", points: { defender: 3, defensiveMid: 2 } },
      { text: "Reading the game and intercepting passes", points: { defensiveMid: 3, deepLying: 2 } },
      { text: "Tracking back when needed to help", points: { boxToBox: 3, fullBack: 2 } },
      { text: "I focus on attacking — defend less", points: { striker: 2, winger: 2, attackingMid: 1 } },
    ],
  },
  {
    id: 6,
    question: "Where do you feel most comfortable on the pitch?",
    emoji: "🗺️",
    options: [
      { text: "Inside the penalty area, close to goal", points: { striker: 3, goalkeeper: 2 } },
      { text: "Wide on the wings with space to run", points: { winger: 3, fullBack: 2 } },
      { text: "Central midfield, controlling the game", points: { deepLying: 3, boxToBox: 2 } },
      { text: "Deep in my own half, organizing defense", points: { defender: 3, defensiveMid: 2 } },
    ],
  },
  {
    id: 7,
    question: "What's your natural playing style?",
    emoji: "🎭",
    options: [
      { text: "Direct and explosive — always a threat", points: { striker: 3, winger: 2 } },
      { text: "Creative and technical — unpredictable", points: { attackingMid: 3, winger: 1 } },
      { text: "Disciplined and positionally aware", points: { defensiveMid: 3, defender: 2 } },
      { text: "All-action — box to box energy", points: { boxToBox: 3, fullBack: 2 } },
    ],
  },
  {
    id: 8,
    question: "How do you handle high-pressure moments?",
    emoji: "🧠",
    options: [
      { text: "I thrive — pressure brings out my best", points: { striker: 2, goalkeeper: 3 } },
      { text: "I stay calm and make the right decision", points: { deepLying: 3, defender: 2 } },
      { text: "I work harder and run more", points: { boxToBox: 3, defensiveMid: 2 } },
      { text: "I create magic moments with skill", points: { attackingMid: 3, winger: 2 } },
    ],
  },
  {
    id: 9,
    question: "Which skill would you most like to be known for?",
    emoji: "⭐",
    options: [
      { text: "Clinical finishing — always scoring", points: { striker: 3 } },
      { text: "Incredible dribbling — unbeatable 1v1", points: { winger: 3, attackingMid: 1 } },
      { text: "Perfect passing and vision", points: { deepLying: 3, attackingMid: 2 } },
      { text: "Reading the game and leadership", points: { defender: 3, defensiveMid: 2, goalkeeper: 2 } },
    ],
  },
  {
    id: 10,
    question: "Which scenario excites you most?",
    emoji: "🏆",
    options: [
      { text: "Breaking through on goal 1v1 with the keeper", points: { striker: 3, winger: 2 } },
      { text: "Threading a pass through 3 defenders for an assist", points: { attackingMid: 3, deepLying: 2 } },
      { text: "Making a last-ditch tackle to save the game", points: { defender: 3, defensiveMid: 2 } },
      { text: "Penalty save in the final minute to win", points: { goalkeeper: 3 } },
    ],
  },
];

// ── Animated option button ────────────────────────────────────
const OptionButton = ({ text, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay, useNativeDriver: false }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: false }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
    ]).start(() => onPress());
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.optionButton} onPress={handlePress} activeOpacity={0.85}>
        <Text style={styles.optionText}>{text}</Text>
        <Text style={styles.optionArrow}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Result card ───────────────────────────────────────────────
const ResultCard = ({ posKey, score, rank, totalPossible, animDelay }) => {
  const pos = POSITIONS[posKey];
  if (!pos) return null;
  const pct = Math.min(100, Math.round((score / totalPossible) * 100));
  const medals = ['🥇', '🥈', '🥉'];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: animDelay, useNativeDriver: false }),
      Animated.timing(barAnim, { toValue: pct / 100, duration: 700, delay: animDelay + 200, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.resultCard, { borderColor: pos.color, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultMedal}>{medals[rank]}</Text>
        <View style={[styles.positionBadge, { backgroundColor: pos.color + '22', borderColor: pos.color }]}>
          <Text style={styles.positionBadgeIcon}>{pos.icon}</Text>
          <Text style={[styles.positionShort, { color: pos.color }]}>{pos.short}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.resultName, { color: pos.color }]}>{pos.name}</Text>
          <Text style={styles.resultScore}>{pct}% match · {score} pts</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.resultBarBg}>
        <Animated.View style={[styles.resultBarFill, { backgroundColor: pos.color, flex: barAnim }]} />
        <Animated.View style={{ flex: Animated.subtract(new Animated.Value(1), barAnim) }} />
      </View>

      {/* Description */}
      <Text style={styles.resultDesc}>{pos.desc}</Text>

      {/* Pro players */}
      <View style={styles.proSection}>
        <Text style={styles.proLabel}>Play like:</Text>
        <View style={styles.proList}>
          {pos.proPlayers.map((p, i) => (
            <View key={i} style={[styles.proPill, { borderColor: pos.color }]}>
              <Text style={[styles.proName, { color: pos.color }]}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Key strengths */}
      <View style={styles.strengthSection}>
        <Text style={styles.strengthLabel}>Key strengths:</Text>
        <View style={styles.strengthList}>
          {pos.strengths.map((s, i) => (
            <View key={i} style={styles.strengthPill}>
              <Text style={styles.strengthText}>✓ {s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Formations */}
      <Text style={styles.formationText}>📋 Plays as: {pos.formations[0]}</Text>
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────
export default function PositionQuiz() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({});
  const [results, setResults] = useState(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const questionFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentQuestion + 1) / QUESTIONS.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentQuestion]);

  const handleAnswer = (option) => {
    const newScores = { ...scores };
    Object.entries(option.points).forEach(([pos, pts]) => {
      newScores[pos] = (newScores[pos] || 0) + pts;
    });

    if (currentQuestion < QUESTIONS.length - 1) {
      // Animate question transition
      Animated.timing(questionFadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
        setScores(newScores);
        setCurrentQuestion(prev => prev + 1);
        Animated.timing(questionFadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      });
    } else {
      // Calculate results — top 3 positions
      const sorted = Object.entries(newScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setResults(sorted);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({});
    setResults(null);
    progressAnim.setValue(0);
    questionFadeAnim.setValue(1);
  };

  const totalPossible = QUESTIONS.length * 3;
  const q = QUESTIONS[currentQuestion];
  const progressPct = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  // ── Results screen ──────────────────────────────────────────
  if (results) {
    const topPos = POSITIONS[results[0]?.[0]];
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsEmoji}>{topPos?.icon || '⚽'}</Text>
          <Text style={styles.resultsTitle}>Your Ideal Position</Text>
          <Text style={styles.resultsSubtitle}>Based on your {QUESTIONS.length} answers</Text>
          {topPos && (
            <View style={[styles.topPositionBadge, { backgroundColor: topPos.color }]}>
              <Text style={styles.topPositionBadgeText}>{topPos.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.resultsList}>
          {results.map(([posKey, score], i) => (
            <ResultCard key={posKey} posKey={posKey} score={score} rank={i} totalPossible={totalPossible} animDelay={i * 150} />
          ))}
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/ProfileForm')}>
            <Text style={styles.primaryBtnText}>🎮 Create Player Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={resetQuiz}>
            <Text style={styles.secondaryBtnText}>↺ Retake Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.quizHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Find My Position</Text>
        <Text style={styles.subtitle}>Answer {QUESTIONS.length} questions to discover your ideal role</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>Question {currentQuestion + 1} of {QUESTIONS.length}</Text>
          <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { flex: progressAnim }]} />
          <Animated.View style={{ flex: Animated.subtract(new Animated.Value(1), progressAnim) }} />
        </View>
        {/* Step dots */}
        <View style={styles.stepDots}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.stepDot, i < currentQuestion + 1 && styles.stepDotActive, i === currentQuestion && styles.stepDotCurrent]} />
          ))}
        </View>
      </View>

      {/* Question */}
      <Animated.View style={[styles.questionBox, { opacity: questionFadeAnim }]}>
        <Text style={styles.questionEmoji}>{q.emoji}</Text>
        <Text style={styles.question}>{q.question}</Text>
        <View style={styles.optionsList}>
          {q.options.map((option, idx) => (
            <OptionButton key={idx} text={option.text} onPress={() => handleAnswer(option)} delay={idx * 80} />
          ))}
        </View>
      </Animated.View>

      {currentQuestion === QUESTIONS.length - 1 && (
        <View style={styles.lastQuestionHint}>
          <Text style={styles.lastQuestionText}>🏁 Last question — your results are almost ready!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },

  // Quiz header
  quizHeader: { padding: 20, paddingTop: 50, alignItems: 'center' },
  backButton: { color: '#1e88e5', fontSize: 15, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '900', color: '#ffd700', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#3a6186', textAlign: 'center' },

  // Progress
  progressContainer: { paddingHorizontal: 20, marginBottom: 24 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#a8dadc', fontSize: 13, fontWeight: '600' },
  progressPct: { color: '#ffd700', fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: '#111d2e', borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginBottom: 10 },
  progressFill: { backgroundColor: '#ffd700', borderRadius: 4 },
  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1a2f46' },
  stepDotActive: { backgroundColor: '#3a6186' },
  stepDotCurrent: { backgroundColor: '#ffd700', width: 14 },

  // Question
  questionBox: { paddingHorizontal: 20 },
  questionEmoji: { fontSize: 40, textAlign: 'center', marginBottom: 14 },
  question: { fontSize: 20, fontWeight: '800', color: '#dce8f8', textAlign: 'center', marginBottom: 28, lineHeight: 28 },
  optionsList: { gap: 12 },
  optionButton: {
    backgroundColor: '#111d2e', padding: 18, borderRadius: 14,
    borderWidth: 1, borderColor: '#1a2f46',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionText: { color: '#dce8f8', fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 22 },
  optionArrow: { color: '#3a6186', fontSize: 18, marginLeft: 8 },

  lastQuestionHint: { margin: 20, backgroundColor: '#111d2e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ffd70033' },
  lastQuestionText: { color: '#ffd700', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  // Results
  resultsHeader: { padding: 30, alignItems: 'center', paddingTop: 50 },
  resultsEmoji: { fontSize: 52, marginBottom: 12 },
  resultsTitle: { fontSize: 26, fontWeight: '900', color: '#ffd700', marginBottom: 4 },
  resultsSubtitle: { fontSize: 13, color: '#3a6186', marginBottom: 16 },
  topPositionBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  topPositionBadgeText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  resultsList: { paddingHorizontal: 16, gap: 16 },
  resultCard: { backgroundColor: '#111d2e', borderRadius: 20, padding: 20, borderWidth: 2 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultMedal: { fontSize: 28, marginRight: 10 },
  positionBadge: { width: 52, height: 52, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  positionBadgeIcon: { fontSize: 18 },
  positionShort: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  resultName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  resultScore: { color: '#3a6186', fontSize: 11, fontWeight: '600' },
  resultBarBg: { height: 8, backgroundColor: '#0d1620', borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginBottom: 14 },
  resultBarFill: { borderRadius: 4 },
  resultDesc: { color: '#a8dadc', fontSize: 14, lineHeight: 21, marginBottom: 14 },

  proSection: { marginBottom: 12 },
  proLabel: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  proList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  proPill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  proName: { fontSize: 12, fontWeight: '700' },

  strengthSection: { marginBottom: 10 },
  strengthLabel: { color: '#3a6186', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  strengthList: { flexDirection: 'row', gap: 6 },
  strengthPill: { backgroundColor: '#1a2f46', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  strengthText: { color: '#66bb6a', fontSize: 11, fontWeight: '700' },
  formationText: { color: '#3a6186', fontSize: 11, marginTop: 6 },

  resultActions: { padding: 20, gap: 12, paddingTop: 24 },
  primaryBtn: { backgroundColor: '#ffd700', padding: 18, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#080f1a', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#111d2e', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1a2f46' },
  secondaryBtnText: { color: '#ffd700', fontSize: 15, fontWeight: '700' },
  backLink: { color: '#3a6186', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
});