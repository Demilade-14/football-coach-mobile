import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
export default function VIPSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  useEffect(() => {
    const activateVIP = async () => {
      try {
        const { session_id } = params;
        // Optional: Verify session with backend
        // await fetch(`${BACKEND_URL}/api/verify-session?session_id=${session_id}`);
        // Activate VIP locally
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        await AsyncStorage.setItem('isVIP', 'true');
        await AsyncStorage.setItem('vipExpiry', expiryDate.toISOString());
        // Navigate to VIP chat
        router.replace('/VIPChat');
      } catch (error) {
        console.error('VIP activation error:', error);
        router.replace('/VIPSubscription?error=true');
      }
    };
    activateVIP();
  }, [params]);
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#ffd700" size="large" />
      <Text style={styles.text}>Activating your VIP subscription...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#a8dadc', marginTop: 20, fontSize: 16 }
});
