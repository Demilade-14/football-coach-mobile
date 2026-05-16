import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getAllPlayers, deletePlayer } from '../src/utils/playerDatabase';
export default function HallOfFame() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    loadPlayers();
  }, []);
  const loadPlayers = async () => {
    const data = await getAllPlayers();
    setPlayers(data || []);
  };
  const handleShare = async (player) => {
    try {
      await Share.share({
        message: `Check out my player ${player.name}! Overall: ${player.overall}`,
        title: `${player.name} - Football Coach`,
      });
    } catch (error) {
      console.log('Share cancelled');
    }
  };
  const handleDelete = async (player) => {
    Alert.alert(
      'Delete Player',
      `Delete ${player.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlayer(player.id);
            await loadPlayers();
          }
        }
      ]
    );
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Hall of Fame</Text>
        <Text style={styles.subtitle}>Top Players</Text>
      </View>
      {players.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No players yet</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/ProfileForm')}
          >
            <Text style={styles.createButtonText}>Create Player</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {players.map((player, index) => (
            <View key={player.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerPosition}>{player.position || 'N/A'}</Text>
                </View>
                <Text style={styles.rating}>{player.overall}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleShare(player)}
                >
                  <Text style={styles.actionText}>📤 Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(player)}
                >
                  <Text style={styles.actionText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1b263b' },
  backButton: { alignSelf: 'flex-start', padding: 8 },
  backText: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#a8dadc', marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, color: '#a8dadc', marginBottom: 20 },
  createButton: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { padding: 15, gap: 12 },
  card: { backgroundColor: '#1b263b', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rank: { fontSize: 24, fontWeight: 'bold', color: '#ffd700', marginRight: 15, width: 40 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 18, fontWeight: 'bold', color: '#f1faee' },
  playerPosition: { fontSize: 14, color: '#a8dadc' },
  rating: { fontSize: 28, fontWeight: 'bold', color: '#ffd700' },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#2a3f5f', paddingTop: 12 },
  actionButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#2a3f5f' },
  deleteButton: { backgroundColor: '#dc3545' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
