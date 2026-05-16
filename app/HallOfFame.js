// app/HallOfFame.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
// ✅ Import getTopPlayers as standalone function (not as playerDatabase.getTopPlayers)
import { getTopPlayers } from "../src/utils/playerDatabase";

export default function HallOfFame() {
  const router = useRouter();
  
  // ✅ Call getTopPlayers as standalone function
  const topPlayers = getTopPlayers(10);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        {/* ✅ Fixed emoji with vector icon */}
        <View style={styles.titleContainer}>
          <MaterialIcons name="emoji-events" size={28} color="#ffd700" />
          <Text style={styles.title}>Hall of Fame</Text>
        </View>
        <Text style={styles.subtitle}>Top performing players</Text>
      </View>
      
      {topPlayers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No players yet</Text>
          <Text style={styles.emptyHint}>Complete challenges to appear here!</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/")}>
            <Text style={styles.btnText}>Start Training</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {topPlayers.map((player, index) => (
            <View key={player.id} style={styles.card}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name || "Anonymous"}</Text>
                <Text style={styles.playerPosition}>{player.position || "Unknown"}</Text>
              </View>
              <View style={styles.rating}>
                <Text style={styles.ratingValue}>{player.overallRating || 50}</Text>
                <Text style={styles.ratingLabel}>OVR</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        {/* ✅ Fixed back arrow emoji */}
        <MaterialIcons name="arrow-back" size={18} color="#a8dadc" style={styles.backIcon} />
        <Text style={styles.backBtnText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1b2a" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 30 },
  titleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    marginBottom: 8 
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#ffd700" },
  subtitle: { fontSize: 16, color: "#a8dadc" },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 20, color: "#f1faee", marginBottom: 12 },
  emptyHint: { fontSize: 14, color: "#a8dadc", marginBottom: 24, textAlign: "center" },
  btn: { backgroundColor: "#1e88e5", padding: 14, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { gap: 12 },
  card: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#1b263b", 
    padding: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rank: { width: 40, alignItems: "center" },
  rankText: { fontSize: 20, fontWeight: "bold", color: "#ffd700" },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 18, color: "#f1faee", fontWeight: "600" },
  playerPosition: { fontSize: 14, color: "#a8dadc" },
  rating: { alignItems: "flex-end" },
  ratingValue: { fontSize: 24, fontWeight: "bold", color: "#ffd700" },
  ratingLabel: { fontSize: 12, color: "#a8dadc" },
  backBtn: { 
    marginTop: 20, 
    padding: 14, 
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  backIcon: { marginBottom: 2 },
  backBtnText: { color: "#a8dadc", fontSize: 16 },
});