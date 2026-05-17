import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function ProgressScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [completedSessions, setCompletedSessions] = useState({});
  const [progressData, setProgressData] = useState({});
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      // Load current training plan
      const savedPlan = await AsyncStorage.getItem('currentTrainingPlan');
      const savedPlayer = await AsyncStorage.getItem('trainingPlayerData');
      const savedProgress = await AsyncStorage.getItem('trainingProgress');
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        setTrainingPlan(plan);
        if (savedPlayer) {
          setPlayer(JSON.parse(savedPlayer));
        }
        // Initialize progress data from plan
        if (plan.focus && plan.focus.length > 0) {
          const initialProgress = {};
          plan.focus.forEach(f => {
            const currentValue = player?.attrs?.[f.key] || f.value || 50;
            initialProgress[f.key] = {
              initial: currentValue,
              current: currentValue,
              target: Math.min(99, currentValue + 15),
              logs: []
            };
          });
          setProgressData(initialProgress);
        }
      }
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setCompletedSessions(progress.completedSessions || {});
        setCurrentWeek(progress.currentWeek || 1);
        if (progress.progressData) {
          setProgressData(progress.progressData);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveProgress = async () => {
    try {
      const progressToSave = {
        completedSessions,
        currentWeek,
        progressData,
        lastUpdated: new Date().toISOString()
      };
      await AsyncStorage.setItem('trainingProgress', JSON.stringify(progressToSave));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };
  const completeSession = (week) => {
    if (!trainingPlan || !trainingPlan.schedule) return;
    const weekPlan = trainingPlan.schedule[week - 1];
    if (!weekPlan) return;
    // Mark session as completed
    const newCompletedSessions = { ...completedSessions, [week]: true };
    setCompletedSessions(newCompletedSessions);
    // Update progress
    const updatedProgress = { ...progressData };
    const attr = weekPlan.focus.key;
    if (updatedProgress[attr]) {
      const oldValue = updatedProgress[attr].current;
      const improvement = weekPlan.intensity === 'light' ? 1 : 
                         weekPlan.intensity === 'moderate' ? 2 : 3;
      const newValue = Math.min(99, oldValue + improvement);
      updatedProgress[attr] = {
        ...updatedProgress[attr],
        current: newValue,
        logs: [...(updatedProgress[attr].logs || []), {
          week,
          improvement,
          date: new Date().toISOString()
        }]
      };
    }
    setProgressData(updatedProgress);
    saveProgress();
    Alert.alert(
      '🎉 Week Complete!', 
      `Great job completing Week ${week}!\n\nImprovement: +${trainingPlan.schedule[week-1].intensity === 'light' ? 1 : trainingPlan.schedule[week-1].intensity === 'moderate' ? 2 : 3} points`,
      [{ text: 'Awesome!' }]
    );
  };
  const getCompletionPercentage = () => {
    if (!trainingPlan || !trainingPlan.schedule) return 0;
    const totalSessions = trainingPlan.schedule.length;
    const completed = Object.keys(completedSessions).length;
    return Math.round((completed / totalSessions) * 100);
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ffd700" size="large" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }
  if (!trainingPlan) {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
        <View style={styles.noDataCard}>
          <Text style={styles.noDataTitle}>📋 No Training Plan</Text>
          <Text style={styles.noDataText}>Generate a training plan to start tracking your progress</Text>
          <TouchableOpacity 
            onPress={() => router.push('/TrainingPlanScreen')} 
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>🎯 Create Training Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  const currentWeekPlan = trainingPlan.schedule[currentWeek - 1];
  const isWeekCompleted = completedSessions[currentWeek];
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>⬅️ Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>📊 Training Progress</Text>
      <Text style={styles.subtitle}>{player?.name || 'Player'} - Week {currentWeek}/12</Text>
      {/* Progress Overview */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completion</Text>
          <Text style={styles.statValue}>{getCompletionPercentage()}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Week</Text>
          <Text style={styles.statValue}>{currentWeek}/12</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statValue}>{Object.keys(completedSessions).length}/12</Text>
        </View>
      </View>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getCompletionPercentage()}%` }]} />
        </View>
        <Text style={styles.progressText}>{getCompletionPercentage()}% Complete</Text>
      </View>
      {/* Current Week */}
      {currentWeekPlan && (
        <View style={styles.weekSection}>
          <Text style={styles.weekTitle}>📅 Week {currentWeek} Focus</Text>
          <View style={[styles.weekCard, isWeekCompleted && styles.weekCardCompleted]}>
            <Text style={styles.focusAttr}>{currentWeekPlan.focus.name.toUpperCase()}</Text>
            <Text style={styles.focusLevel}>
              Current: {progressData[currentWeekPlan.focus.key]?.current || currentWeekPlan.focus.value}/99
            </Text>
            <Text style={styles.intensityBadge}>
              Intensity: {currentWeekPlan.intensity.toUpperCase()}
            </Text>
            <Text style={styles.exercisesTitle}>This Week's Training:</Text>
            {currentWeekPlan.session.exercises.map((exercise, idx) => (
              <Text key={idx} style={styles.exercise}>• {exercise}</Text>
            ))}
            <TouchableOpacity
              onPress={() => completeSession(currentWeek)}
              style={[styles.completeButton, isWeekCompleted && styles.completeButtonDone]}
              disabled={isWeekCompleted}
            >
              <Text style={styles.completeButtonText}>
                {isWeekCompleted ? '✓ Week Complete!' : '✓ Complete This Week'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Week Navigation */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity
              onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
              style={[styles.navButton, currentWeek === 1 && styles.navButtonDisabled]}
            >
              <Text style={styles.navButtonText}>← Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCurrentWeek(Math.min(12, currentWeek + 1))}
              disabled={currentWeek === 12}
              style={[styles.navButton, currentWeek === 12 && styles.navButtonDisabled]}
            >
              <Text style={styles.navButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Attribute Progress */}
      <View style={styles.attributesSection}>
        <Text style={styles.attributesTitle}>📈 Attribute Progress</Text>
        {trainingPlan.focus.map((weakness) => {
          const prog = progressData[weakness.key];
          if (!prog) return null;
          const improvement = prog.current - prog.initial;
          return (
            <View key={weakness.key} style={styles.attributeCard}>
              <View style={styles.attributeHeader}>
                <Text style={styles.attributeName}>{weakness.name}</Text>
                <Text style={[styles.attributeValue, improvement > 0 && styles.attributeValuePositive]}>
                  {prog.initial} → {prog.current} {improvement > 0 && `(+${improvement})`}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(prog.current / 99) * 100}%`, backgroundColor: '#4CAF50' }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b2a' },
  loadingText: { color: '#a8dadc', marginTop: 16, fontSize: 16 },
  backButton: { padding: 12, alignSelf: 'flex-start' },
  backText: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#a8dadc', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1b263b', borderRadius: 10, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  statLabel: { color: '#a8dadc', fontSize: 12, marginBottom: 6 },
  statValue: { color: '#1e88e5', fontSize: 20, fontWeight: 'bold' },
  progressSection: { marginBottom: 20 },
  progressBar: { height: 10, backgroundColor: '#1b263b', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 },
  progressText: { color: '#a8dadc', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  weekSection: { marginBottom: 20 },
  weekTitle: { fontSize: 18, fontWeight: '700', color: '#f1faee', marginBottom: 12 },
  weekCard: { backgroundColor: '#1b263b', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  weekCardCompleted: { borderLeftColor: '#4CAF50', opacity: 0.8 },
  focusAttr: { fontSize: 18, fontWeight: '700', color: '#FFD700', marginBottom: 8 },
  focusLevel: { color: '#a8dadc', fontSize: 14, marginBottom: 8 },
  intensityBadge: { color: '#1e88e5', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  exercisesTitle: { fontSize: 14, fontWeight: '600', color: '#f1faee', marginBottom: 8 },
  exercise: { color: '#a8dadc', fontSize: 13, marginBottom: 4, marginLeft: 8 },
  completeButton: { marginTop: 16, paddingVertical: 12, backgroundColor: '#1e88e5', borderRadius: 8, alignItems: 'center' },
  completeButtonDone: { backgroundColor: '#4CAF50' },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  weekNavigation: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  navButton: { flex: 1, paddingVertical: 10, marginHorizontal: 4, backgroundColor: '#1b263b', borderRadius: 8, alignItems: 'center' },
  navButtonDisabled: { opacity: 0.3 },
  navButtonText: { color: '#f1faee', fontSize: 14, fontWeight: '600' },
  attributesSection: { marginTop: 20 },
  attributesTitle: { fontSize: 18, fontWeight: '700', color: '#f1faee', marginBottom: 12 },
  attributeCard: { backgroundColor: '#1b263b', borderRadius: 10, padding: 12, marginBottom: 10 },
  attributeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  attributeName: { color: '#f1faee', fontSize: 14, fontWeight: '600' },
  attributeValue: { color: '#a8dadc', fontSize: 14 },
  attributeValuePositive: { color: '#4CAF50', fontWeight: 'bold' },
  noDataCard: { backgroundColor: '#1b263b', borderRadius: 12, padding: 30, alignItems: 'center', marginTop: 40 },
  noDataTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1faee', marginBottom: 10 },
  noDataText: { fontSize: 14, color: '#a8dadc', textAlign: 'center', marginBottom: 20 },
  createButton: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
