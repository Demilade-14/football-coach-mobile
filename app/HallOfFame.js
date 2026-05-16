import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
export default function HallOfFame() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hall of Fame</Text>
      <Text style={styles.subtitle}>Top players will appear here</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1b2a", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#ffd700", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#a8dadc", marginBottom: 30 },
  btn: { backgroundColor: "#1e88e5", padding: 14, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
