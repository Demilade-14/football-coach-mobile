import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    loadNotifications();
  }, []);
  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) setNotifications(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>
      <ScrollView style={styles.list}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>We will notify you about achievements and reminders</Text>
          </View>
        ) : (
          notifications.map((n, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.message}>{n.message}</Text>
              <Text style={styles.time}>{new Date(n.timestamp).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  header: { padding: 20, alignItems: 'center' },
  backButton: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700' },
  list: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, color: '#a8dadc', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6c757d', textAlign: 'center' },
  card: { backgroundColor: '#1b263b', borderRadius: 12, padding: 15, marginBottom: 12 },
  message: { fontSize: 16, color: '#f1faee', marginBottom: 5 },
  time: { fontSize: 12, color: '#a8dadc' },
});
