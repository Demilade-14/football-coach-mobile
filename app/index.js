import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  useEffect(() => { checkAuth(); }, []);
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        try {
          const sessions = await AsyncStorage.getItem("training_sessions");
          if (sessions) {
            const parsed = JSON.parse(sessions);
            const today = new Date();
            let currentStreak = 0;
            for (let i = 0; i < 30; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(checkDate.getDate() - i);
              const dateStr = checkDate.toISOString().split("T")[0];
              const hasSession = parsed.some(s => s.date === dateStr);
              if (hasSession) { currentStreak++; } else if (i > 0) { break; }
            }
            setStreak(currentStreak);
          }
        } catch (error) { console.error("Error refreshing:", error); }
      };
      refresh();
    }, [])
  );
  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const onboarded = await AsyncStorage.getItem("onboarding_completed");
      if (!userData) { router.replace("/AuthScreen"); return; }
      setUser(JSON.parse(userData));
      if (!onboarded) { router.replace("/OnboardingScreen"); return; }
    } catch (error) {
      router.replace("/AuthScreen");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["user", "isVIP"]);
      router.replace("/AuthScreen");
    } catch (error) { console.log("Logout error:", error); }
  };
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>⚽ Football Coach</Text>
            <Text style={styles.subtitle}>Welcome, {user?.displayName || user?.name || "Coach"}!</Text>
            {streak > 0 && <Text style={styles.streakText}>🔥 {streak} day streak</Text>}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
        {/* Player */}
        <Text style={styles.sectionTitle}>🎴 Player</Text>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/ProfileForm")}>
          <Text style={styles.buttonIcon}>🎴</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Create Player Card</Text>
            <Text style={styles.buttonDesc}>Build your FC26-style card</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/HallOfFame")}>
          <Text style={styles.buttonIcon}>🏆</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Hall of Fame</Text>
            <Text style={styles.buttonDesc}>View all your saved players</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/PositionQuiz")}>
          <Text style={styles.buttonIcon}>🎯</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Find My Position</Text>
            <Text style={styles.buttonDesc}>Discover your ideal playing position</Text>
          </View>
        </TouchableOpacity>
        {/* Training */}
        <Text style={styles.sectionTitle}>💪 Training</Text>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/DrillLibrary")}>
          <Text style={styles.buttonIcon}>📚</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Drill Library</Text>
            <Text style={styles.buttonDesc}>36 drills across 9 categories</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/ChallengesScreen")}>
          <Text style={styles.buttonIcon}>🎯</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Weekly Challenges</Text>
            <Text style={styles.buttonDesc}>Complete challenges, earn rewards</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.blueButton} onPress={() => router.push("/ProgressScreen")}>
          <Text style={styles.buttonIcon}>📈</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Progress Tracker</Text>
            <Text style={styles.buttonDesc}>Track your training sessions</Text>
          </View>
        </TouchableOpacity>
        {/* Inspiration */}
        <Text style={styles.sectionTitle}>🌟 Inspiration</Text>
        <TouchableOpacity style={styles.goldButton} onPress={() => router.push("/AICoachScreen")}>
          <Text style={styles.buttonIcon}>🌟</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Inspirations</Text>
            <Text style={styles.buttonDesc}>Motivational quotes from legends</Text>
          </View>
        </TouchableOpacity>
        {/* Analytics */}
        <Text style={styles.sectionTitle}>📊 Analytics</Text>
        <TouchableOpacity style={styles.purpleButton} onPress={() => router.push("/PerformanceGraphsScreen")}>
          <Text style={styles.buttonIcon}>📊</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Analytics Dashboard</Text>
            <Text style={styles.buttonDesc}>Monitor your improvement</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.purpleButton} onPress={() => router.push("/AnalyticsFeedbackScreen")}>
          <Text style={styles.buttonIcon}>📝</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Analytics & Feedback</Text>
            <Text style={styles.buttonDesc}>Share your experience</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.purpleButton} onPress={() => router.push("/NotificationScreen")}>
          <Text style={styles.buttonIcon}>🔔</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Notifications</Text>
            <Text style={styles.buttonDesc}>Reminders and achievements</Text>
          </View>
        </TouchableOpacity>
        {/* Settings */}
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>
        <TouchableOpacity style={styles.greenButton} onPress={() => router.push("/PlayerCardScreen")}>
          <Text style={styles.buttonIcon}>🃏</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>My Player Cards</Text>
            <Text style={styles.buttonDesc}>View and share your cards</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.greenButton} onPress={() => router.push("/SettingsScreen")}>
          <Text style={styles.buttonIcon}>⚙️</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Settings</Text>
            <Text style={styles.buttonDesc}>Preferences and data export</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.greenButton} onPress={handleLogout}>
          <Text style={styles.buttonIcon}>🚪</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Logout</Text>
            <Text style={styles.buttonDesc}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>Made with ❤️ for young footballers worldwide</Text>
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1b2a" },
  content: { alignItems: "center", padding: 20, paddingTop: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "bold", color: "#f1faee" },
  subtitle: { fontSize: 14, color: "#a8dadc", marginTop: 4 },
  streakText: { fontSize: 13, color: "#FFD700", marginTop: 4, fontWeight: "bold" },
  logoutButton: { backgroundColor: "#1b263b", padding: 10, borderRadius: 8 },
  logoutText: { fontSize: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#a8dadc", marginBottom: 10, marginTop: 16, alignSelf: "flex-start" },
  blueButton: { backgroundColor: "#1a2332", borderLeftWidth: 4, borderLeftColor: "#1e88e5", borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", width: "100%" },
  goldButton: { backgroundColor: "#1a2332", borderLeftWidth: 4, borderLeftColor: "#FFD700", borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", width: "100%" },
  purpleButton: { backgroundColor: "#1a2332", borderLeftWidth: 4, borderLeftColor: "#9b59b6", borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", width: "100%" },
  greenButton: { backgroundColor: "#1a2332", borderLeftWidth: 4, borderLeftColor: "#4CAF50", borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", width: "100%" },
  buttonIcon: { fontSize: 24, marginRight: 12 },
  buttonContent: { flex: 1 },
  buttonTitle: { fontSize: 15, fontWeight: "600", color: "#f1faee" },
  buttonDesc: { fontSize: 12, color: "#a8dadc", marginTop: 2 },
  infoBox: { backgroundColor: "#1a2332", borderRadius: 10, padding: 16, alignItems: "center", width: "100%", marginTop: 16, marginBottom: 20 },
  infoText: { color: "#a8dadc", fontSize: 13, marginVertical: 2 },
});
