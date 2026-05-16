import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const PositionQuiz = () => {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  const questions = [
    {
      id: 1,
      question: "What do you enjoy most on the pitch?",
      options: [
        { text: "Scoring goals", points: { striker: 3, winger: 1 } },
        { text: "Creating chances for teammates", points: { midfielder: 3, attackingMid: 2 } },
        { text: "Stopping opponents", points: { defender: 3, defensiveMid: 2 } },
        { text: "Making crucial saves", points: { goalkeeper: 3 } }
      ]
    },
    {
      id: 2,
      question: "How would you describe your speed?",
      options: [
        { text: "Lightning fast", points: { winger: 3, striker: 2, fullBack: 2 } },
        { text: "Quick enough", points: { midfielder: 2, attackingMid: 2 } },
        { text: "Average pace", points: { defender: 2, defensiveMid: 2 } },
        { text: "Speed isn't my strength", points: { goalkeeper: 2, defender: 1 } }
      ]
    },
    {
      id: 3,
      question: "What's your best physical attribute?",
      options: [
        { text: "Agility and balance", points: { winger: 3, attackingMid: 2 } },
        { text: "Strength and power", points: { defender: 3, striker: 2 } },
        { text: "Stamina and endurance", points: { boxToBox: 3, fullBack: 2 } },
        { text: "Reflexes and reactions", points: { goalkeeper: 3, winger: 1 } }
      ]
    },
    {
      id: 4,
      question: "How do you prefer to pass?",
      options: [
        { text: "Short, quick passes", points: { midfielder: 3, attackingMid: 2 } },
        { text: "Long, accurate passes", points: { deepLying: 3, defensiveMid: 2 } },
        { text: "Crosses from the wing", points: { winger: 3, fullBack: 2 } },
        { text: "I prefer shooting", points: { striker: 3 } }
      ]
    },
    {
      id: 5,
      question: "What's your defensive style?",
      options: [
        { text: "Aggressive tackling", points: { defender: 3, defensiveMid: 2 } },
        { text: "Intercepting passes", points: { defensiveMid: 3, deepLying: 2 } },
        { text: "Tracking back when needed", points: { boxToBox: 3, midfielder: 2 } },
        { text: "I focus on attacking", points: { striker: 2, winger: 2, attackingMid: 1 } }
      ]
    },
    {
      id: 6,
      question: "Where do you feel most comfortable?",
      options: [
        { text: "In the penalty box", points: { striker: 3, goalkeeper: 2 } },
        { text: "On the wings", points: { winger: 3, fullBack: 2 } },
        { text: "Center of the pitch", points: { midfielder: 3, boxToBox: 2, deepLying: 2 } },
        { text: "In my own half", points: { defender: 3, defensiveMid: 2 } }
      ]
    },
    {
      id: 7,
      question: "What's your playing style?",
      options: [
        { text: "Direct and explosive", points: { striker: 3, winger: 2 } },
        { text: "Creative and technical", points: { attackingMid: 3, deepLying: 2 } },
        { text: "Disciplined and tactical", points: { defensiveMid: 3, defender: 2 } },
        { text: "All-action, everywhere", points: { boxToBox: 3, fullBack: 2 } }
      ]
    },
    {
      id: 8,
      question: "How do you handle pressure?",
      options: [
        { text: "I thrive under pressure", points: { striker: 2, goalkeeper: 3 } },
        { text: "I stay calm and composed", points: { deepLying: 3, defender: 2 } },
        { text: "I work harder", points: { boxToBox: 3, defensiveMid: 2 } },
        { text: "I create magic moments", points: { attackingMid: 3, winger: 2 } }
      ]
    }
  ];

  const positionNames = {
    striker: "Striker",
    winger: "Winger",
    midfielder: "Midfielder",
    defender: "Defender",
    goalkeeper: "Goalkeeper",
    fullBack: "Full Back",
    defensiveMid: "Defensive Midfielder",
    attackingMid: "Attacking Midfielder",
    deepLying: "Deep-Lying Playmaker",
    boxToBox: "Box-to-Box Midfielder"
  };

  const positionDescriptions = {
    striker: "You love being in the box and have a natural instinct for goal. A natural finisher.",
    winger: "Pace, skill and directness define you. You love running at defenders with the ball.",
    midfielder: "You control the tempo and connect defense to attack with precise passing.",
    defender: "Solid, powerful and disciplined. You read the game and shut down opponents.",
    goalkeeper: "Cool under pressure with sharp reflexes. The last line of defense.",
    fullBack: "Athletic and energetic — you support attack and defend with equal quality.",
    defensiveMid: "The shield in front of defense. You break up play and recycle possession.",
    attackingMid: "The creative spark. You find pockets of space and unlock defenses.",
    deepLying: "The quarterback of the team. Your vision and passing range control games.",
    boxToBox: "The complete midfielder. You cover every blade of grass and contribute everywhere."
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResults(null);
  };

  const handleAnswer = (option) => {
    const newAnswers = { ...answers };
    Object.keys(option.points).forEach(pos => {
      newAnswers[pos] = (newAnswers[pos] || 0) + option.points[pos];
    });

    if (currentQuestion < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate results
      const sorted = Object.entries(newAnswers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setResults(sorted);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // RESULTS SCREEN
  if (results) {
    const topPosition = results[0];
    const medals = ['🥇', '🥈', '🥉'];
    const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];

    return (
      <ScrollView style={styles.container}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Your Ideal Positions!</Text>
          <Text style={styles.resultsSubtitle}>Based on your answers</Text>

          {results.map(([posKey, score], index) => {
            const name = positionNames[posKey] || posKey;
            const desc = positionDescriptions[posKey] || '';
            const maxScore = questions.length * 3;
            const pct = Math.round((score / maxScore) * 100);
            return (
              <View key={posKey} style={[styles.resultCard, { borderColor: colors[index] }]}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultMedal}>{medals[index]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultPosition, { color: colors[index] }]}>{name}</Text>
                    <Text style={styles.resultScore}>{score} pts ({pct}% match)</Text>
                  </View>
                </View>
                <View style={styles.resultBarBg}>
                  <View style={[styles.resultBarFill, { width: `${pct}%`, backgroundColor: colors[index] }]} />
                </View>
                <Text style={styles.resultDesc}>{desc}</Text>
              </View>
            );
          })}

          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/ProfileForm')}
            >
              <Text style={styles.primaryBtnText}>Create Player Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetQuiz}>
              <Text style={styles.secondaryBtnText}>Retake Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // QUIZ SCREEN
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Find My Position</Text>
        <Text style={styles.subtitle}>Discover your ideal playing position</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.question}>{questions[currentQuestion]?.question}</Text>
        {questions[currentQuestion]?.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
            activeOpacity={0.7}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentQuestion === questions.length - 1 && (
        <Text style={styles.hintText}>Last question! Your results will appear next.</Text>
      )}
    </ScrollView>
  );
};

export default PositionQuiz;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  header: { padding: 20, alignItems: 'center' },
  backButton: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a8dadc', textAlign: 'center' },
  progressContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  progressText: { color: '#f1faee', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: '#1b263b', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#ffd700', borderRadius: 4 },
  questionContainer: { padding: 20 },
  question: { fontSize: 22, fontWeight: 'bold', color: '#f1faee', marginBottom: 30, textAlign: 'center' },
  optionButton: {
    backgroundColor: '#1b263b',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#415a77',
  },
  optionText: { color: '#f1faee', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  hintText: { color: '#ffd700', fontSize: 13, textAlign: 'center', padding: 20, fontStyle: 'italic' },

  // Results styles
  resultsContainer: { padding: 20 },
  resultsTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', textAlign: 'center', marginBottom: 8, marginTop: 20 },
  resultsSubtitle: { fontSize: 16, color: '#a8dadc', textAlign: 'center', marginBottom: 30 },
  resultCard: {
    backgroundColor: '#1b263b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultMedal: { fontSize: 36, marginRight: 15 },
  resultPosition: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  resultScore: { color: '#a8dadc', fontSize: 13 },
  resultBarBg: { height: 8, backgroundColor: '#0d1b2a', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  resultBarFill: { height: '100%', borderRadius: 4 },
  resultDesc: { color: '#f1faee', fontSize: 14, lineHeight: 20 },
  resultButtons: { marginTop: 10, gap: 12 },
  primaryBtn: { backgroundColor: '#ffd700', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: '#0d1b2a', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: '#1b263b', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#415a77' },
  secondaryBtnText: { color: '#ffd700', fontSize: 16, fontWeight: '600' },
  backBtn: { padding: 16, alignItems: 'center' },
  backBtnText: { color: '#a8dadc', fontSize: 15 },
});