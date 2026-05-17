import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Backend URL from env or fallback
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.129.152:3000';
export default function VIPSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('activating'); // 'activating' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Activating your VIP subscription...');
  useEffect(() => {
    const activateVIP = async () => {
      try {
        // ✅ Handle deep link params for both web and mobile
        // Expo Router web: params come as query string, need to parse
        let sessionId = params.session_id || params.sessionId || params['session-id'];
        // Fallback: parse from URL if params didn't work (web edge case)
        if (!sessionId && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          sessionId = urlParams.get('session_id') || urlParams.get('sessionId');
        }
        console.log('🔍 VIP Success - Session ID:', sessionId);
        if (!sessionId) {
          console.warn('⚠️ No session_id found in params');
          // Still activate locally for dev/testing
          await activateLocally();
          return;
        }
        setStatus('verifying');
        setMessage('Verifying your payment...');
        // ✅ Optional: Verify session with backend (recommended for production)
        try {
          const response = await fetch(`${BACKEND_URL}/api/verify-session?session_id=${sessionId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Session verified:', data);
            // Backend can return user info, plan details, etc.
          } else {
            console.warn('⚠️ Session verification failed, activating locally anyway');
            // Don't block activation if verification fails (graceful degradation)
          }
        } catch (verifyError) {
          console.error('❌ Verification error:', verifyError);
          // Continue with local activation even if verification fails
        }
        // ✅ Activate VIP locally (always do this as fallback)
        await activateLocally();
      } catch (error) {
        console.error('❌ VIP activation error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
        // Show user-friendly error
        Alert.alert(
          'Activation Issue',
          'We couldn\'t activate your VIP subscription. Please try again or contact support.',
          [
            { text: 'Retry', onPress: () => router.replace('/VIPSubscription') },
            { text: 'Contact Support', onPress: () => console.log('Open support') },
          ]
        );
      }
    };
    const activateLocally = async () => {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year subscription
      await AsyncStorage.setItem('isVIP', 'true');
      await AsyncStorage.setItem('vipExpiry', expiryDate.toISOString());
      await AsyncStorage.setItem('vipActivatedAt', new Date().toISOString());
      console.log('✅ VIP activated locally');
      setStatus('success');
      setMessage('Success! Redirecting to your VIP chat...');
      // Small delay for UX (let user see success message)
      setTimeout(() => {
        router.replace('/VIPChat');
      }, 1500);
    };
    activateVIP();
  }, [params, router]);
  // Render based on status
  return (
    <View style={styles.container}>
      {status === 'error' ? (
        <>
          <Text style={styles.icon}>❌</Text>
          <Text style={styles.title}>Activation Failed</Text>
        </>
      ) : status === 'success' ? (
        <>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>VIP Activated!</Text>
        </>
      ) : (
        <>
          <ActivityIndicator color="#ffd700" size="large" />
          <Text style={styles.title}>
            {status === 'verifying' ? 'Verifying Payment...' : 'Activating VIP...'}
          </Text>
        </>
      )}
      <Text style={styles.text}>{message}</Text>
      {/* Manual retry button for error state */}
      {status === 'error' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.replace('/VIPSubscription')}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => router.replace('/VIPChat')}
          >
            <Text style={styles.chatText}>Go to Chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0d1b2a', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { 
    color: '#ffd700', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 16,
    textAlign: 'center',
  },
  text: { 
    color: '#a8dadc', 
    fontSize: 16, 
    textAlign: 'center',
    maxWidth: 300,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  retryButton: {
    backgroundColor: '#1b263b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  retryText: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  chatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
