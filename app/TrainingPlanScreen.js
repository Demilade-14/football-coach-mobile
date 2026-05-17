import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllPlayers } from '../src/utils/playerDatabase';
const TrainingPlanScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    loadPlayers();
  }, []);
  const loadPlayers = async () => {
    try {
      const allPlayers = await getAllPlayers();
      setPlayers(allPlayers || []);
      if (allPlayers && allPlayers.length > 0) {
        setSelectedPlayer(allPlayers[0]);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };
  const generatePlan = () => {
    if (!selectedPlayer) {
      Alert.alert('No Player Selected', 'Please select a player first.');
      return;
    }
    console.log('🎯 Generating plan for:', selectedPlayer.name);
    setLoading(true);
    try {
      // Get player attributes
      const attrs = selectedPlayer.attrs || selectedPlayer;
      // Find weaknesses (attributes below 70)
      const weaknesses = [];
      const attributeNames = {
        pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
        dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical'
      };
      Object.keys(attributeNames).forEach(attr => {
        const value = attrs[attr] || 50;
        if (value < 70) {
          weaknesses.push({ key: attr, name: attributeNames[attr], value });
        }
      });
      // If no weaknesses found, use lowest 2 attributes
      if (weaknesses.length === 0) {
        const sorted = Object.keys(attrs).sort((a, b) => (attrs[a] || 0) - (attrs[b] || 0));
        sorted.slice(0, 3).forEach(attr => {
          weaknesses.push({ key: attr, name: attributeNames[attr] || attr, value: attrs[attr] || 50 });
        });
      }
      console.log('Weaknesses found:', weaknesses);
      // Generate 12-week plan
      const schedule = [];
      const position = selectedPlayer.position || 'Midfielder';
      for (let week = 1; week <= 12; week++) {
        const focusAttr = weaknesses[(week - 1) % weaknesses.length];
        const intensity = week <= 4 ? 'light' : week <= 8 ? 'moderate' : 'intense';
        const session = getTrainingSession(focusAttr.key, intensity, position, week);
        schedule.push({
          week,
          focus: focusAttr,
          intensity,
          session
        });
      }
      const trainingPlan = {
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        position,
        startDate: new Date().toISOString(),
        duration: 12,
        intensity: 'progressive',
        focus: weaknesses,
        schedule
      };
      // Save to AsyncStorage
      AsyncStorage.setItem('currentTrainingPlan', JSON.stringify(trainingPlan));
      AsyncStorage.setItem('trainingPlayerData', JSON.stringify(selectedPlayer));
      setPlan(trainingPlan);
      Alert.alert(
        '✅ Training Plan Generated!',
        `12-week plan for ${selectedPlayer.name}\n\nFocus: ${weaknesses.map(w => w.name).join(', ')}\n\nRedirecting to progress tracker...`,
        [{ 
          text: 'View Progress', 
          onPress: () => {
            router.push({
              pathname: '/ProgressScreen',
              params: {
                playerData: JSON.stringify(selectedPlayer),
                plan: JSON.stringify(trainingPlan)
              }
            });
          }
        }]
      );
    } catch (error) {
      console.error('❌ Plan generation failed:', error);
      Alert.alert('Error', 'Could not generate plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const getTrainingSession = (attribute, intensity, position, week) => {
    const sessions = {
      pace: {
        light: {
          exercises: [
            "Dynamic warm-up (10 min)",
            "Acceleration drills - 10m sprints x 10",
            "Agility ladder work (15 min)",
            "Cool down stretching (10 min)"
          ]
        },
        moderate: {
          exercises: [
            "Sprint intervals - 20m x 15 reps",
            "Shuttle runs - 5x5min sets",
            "Plyometric jumps (15 min)",
            "Resistance band sprints (10 min)"
          ]
        },
        intense: {
          exercises: [
            "Hill sprints - 10x30m",
            "Sprint endurance - 400m repeats x 5",
            "Speed agility quickness (SAQ) drills",
            "Match simulation sprints (20 min)"
          ]
        }
      },
      shooting: {
        light: {
          exercises: [
            "Wall shooting practice (15 min)",
            "Penalty box finishing x 20 shots",
            "Volleys and half-volleys (10 min)",
            "Weak foot shooting (10 min)"
          ]
        },
        moderate: {
          exercises: [
            "Moving shot practice - 30 shots",
            "First-time finishing drills",
            "Long-range shooting x 15",
            "Pressure shooting (game speed)"
          ]
        },
        intense: {
          exercises: [
            "Fatigue shooting (after sprints)",
            "1v1 finishing under pressure",
            "Cross and finish - 20 reps",
            "Free kick practice (15 min)"
          ]
        }
      },
      passing: {
        light: {
          exercises: [
            "Wall passing - both feet (15 min)",
            "Long passing accuracy x 20",
            "One-touch passing drill",
            "Passing on the move (10 min)"
          ]
        },
        moderate: {
          exercises: [
            "Pressure passing drill",
            "Switch of play - long balls x 25",
            "Through ball practice",
            "Passing under fatigue"
          ]
        },
        intense: {
          exercises: [
            "Small-sided game passing",
            "Quick combination plays",
            "Passing accuracy under pressure",
            "Vision and awareness drills"
          ]
        }
      },
      dribbling: {
        light: {
          exercises: [
            "Cone dribbling - 10 cones x 10 reps",
            "Inside-outside touches (10 min)",
            "Speed dribbling 20m x 10",
            "Weak foot dribbling (10 min)"
          ]
        },
        moderate: {
          exercises: [
            "1v1 moves practice - stepovers, scissors",
            "Tight space dribbling",
            "Change of pace dribbling",
            "Dribbling under pressure"
          ]
        },
        intense: {
          exercises: [
            "Beat the defender drills",
            "Dribbling at speed with ball",
            "Skill moves in tight spaces",
            "Match simulation dribbling"
          ]
        }
      },
      defending: {
        light: {
          exercises: [
            "Defensive stance practice (10 min)",
            "1v1 defending - 10 reps",
            "Interception drills",
            "Positioning awareness (15 min)"
          ]
        },
        moderate: {
          exercises: [
            "Tackling technique - slide & stand",
            "Defensive transitions",
            "Marking and tracking runs",
            "Clearance practice"
          ]
        },
        intense: {
          exercises: [
            "Defensive pressure scenarios",
            "2v2 defending drills",
            "Recovery runs and tracking",
            "Game-speed defending"
          ]
        }
      },
      physical: {
        light: {
          exercises: [
            "Bodyweight circuit (20 min)",
            "Core strengthening - planks, bridges",
            "Balance and stability work",
            "Light jogging (15 min)"
          ]
        },
        moderate: {
          exercises: [
            "Strength training - squats, lunges",
            "Upper body work",
            "Plyometric exercises",
            "Endurance running (20 min)"
          ]
        },
        intense: {
          exercises: [
            "Heavy strength training",
            "High-intensity interval training",
            "Power and explosiveness drills",
            "Full-body conditioning"
          ]
        }
      }
    };
    return sessions[attribute]?.[intensity] || {
      exercises: [
        "General fitness training (30 min)",
        "Technical drills (20 min)",
        "Tactical awareness (15 min)",
        "Cool down (10 min)"
      ]
    };
  };
  if (players.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>⬅️ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎯 Training Plan</Text>
        </View>
        <View style={styles.noPlayersCard}>
          <Text style={styles.noPlayersTitle}>No Players Found</Text>
          <Text style={styles.noPlayersText}>Create a player profile first to generate a training plan.</Text>
          <TouchableOpacity 
            onPress={() => router.push('/ProfileForm')} 
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>➕ Create Player</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎯 Training Plan</Text>
      </View>
      <View style={styles.content}>
        {/* Player Selection */}
        <Text style={styles.sectionTitle}>👤 Select Player</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersScroll}>
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                selectedPlayer?.id === player.id && styles.playerCardSelected
              ]}
              onPress={() => setSelectedPlayer(player)}
            >
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerPosition}>{player.position || 'N/A'}</Text>
              <Text style={styles.playerOverall}>OVR: {player.overall || 0}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedPlayer && (
          <>
            <Text style={styles.sectionTitle}>📊 Current Stats</Text>
            <View style={styles.statsGrid}>
              {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map((stat) => (
                <View key={stat} style={styles.statBox}>
                  <Text style={styles.statLabel}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</Text>
                  <Text style={styles.statValue}>{selectedPlayer.attrs?.[stat] || 50}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.generateBtn, loading && styles.btnDisabled]}
              onPress={generatePlan}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateText}>Generate 12-Week Plan</Text>
              )}
            </TouchableOpacity>
            {plan && (
              <View style={styles.planPreview}>
                <Text style={styles.planPreviewTitle}>✅ Plan Generated!</Text>
                <Text style={styles.planPreviewText}>
                  Player: {plan.playerName}{'\n'}
                  Duration: {plan.duration} weeks{'\n'}
                  Focus Areas: {plan.focus.map(f => f.name).join(', ')}
                </Text>
                <TouchableOpacity
                  style={styles.viewProgressBtn}
                  onPress={() => router.push({
                    pathname: '/ProgressScreen',
                    params: {
                      playerData: JSON.stringify(selectedPlayer),
                      plan: JSON.stringify(plan)
                    }
                  })}
                >
                  <Text style={styles.viewProgressText}>View Progress Tracker →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};
export default TrainingPlanScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1b263b' },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffd700', marginTop: 10 },
  content: { padding: 20 },
  noPlayersCard: { backgroundColor: '#1b263b', borderRadius: 12, padding: 30, alignItems: 'center', marginTop: 40 },
  noPlayersTitle: { fontSize: 20, fontWeight: 'bold', color: '#f1faee', marginBottom: 10 },
  noPlayersText: { color: '#a8dadc', textAlign: 'center', marginBottom: 20 },
  createButton: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f1faee', marginTop: 20, marginBottom: 12 },
  playersScroll: { marginBottom: 20 },
  playerCard: { backgroundColor: '#1b263b', padding: 15, borderRadius: 10, marginRight: 10, minWidth: 120, borderWidth: 2, borderColor: 'transparent' },
  playerCardSelected: { borderColor: '#ffd700', backgroundColor: '#2a3f5f' },
  playerName: { color: '#f1faee', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  playerPosition: { color: '#a8dadc', fontSize: 12, marginBottom: 4 },
  playerOverall: { color: '#ffd700', fontSize: 14, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '30%', backgroundColor: '#1b263b', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  statLabel: { color: '#a8dadc', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#ffd700', fontSize: 18, fontWeight: 'bold' },
  generateBtn: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.7 },
  generateText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  planPreview: { backgroundColor: '#1b263b', borderRadius: 12, padding: 20, marginTop: 20, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  planPreviewTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 },
  planPreviewText: { color: '#a8dadc', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  viewProgressBtn: { backgroundColor: '#1e88e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  viewProgressText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
