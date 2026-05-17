import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Linking, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.100:3000';

const VIPSubscription = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userId, setUserId] = useState('guest-user');

  useEffect(() => {
    // Get user ID from storage
    AsyncStorage.getItem('user').then(stored => {
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.uid || u.id) setUserId(u.uid || u.id);
        } catch (e) {}
      }
    });

    // Listen for deep link return from Stripe
    const handleDeepLink = ({ url }) => {
      if (url?.includes('vip-success')) {
        handlePaymentSuccess();
      } else if (url?.includes('vip-cancel')) {
        Alert.alert('Cancelled', 'Payment was cancelled. Try again anytime!');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened from a Stripe redirect
    Linking.getInitialURL().then(url => {
      if (url?.includes('vip-success')) handlePaymentSuccess();
    });

    return () => sub?.remove();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      await AsyncStorage.setItem('isVIP', 'true');
      await AsyncStorage.setItem('vipSince', new Date().toISOString());
      Alert.alert(
        'Welcome to VIP!',
        'Your subscription is active. Enjoy unlimited AI coaching!',
        [{ text: 'Start Coaching!', onPress: () => router.replace('/VIPChat') }]
      );
    } catch (e) {
      router.replace('/VIPChat');
    }
  };

  const handleSubscribe = async (plan) => {
    if (loading) return;
    setSelectedPlan(plan);
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.toLowerCase(),
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Open Stripe hosted checkout in browser
        await Linking.openURL(data.url);
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      console.error('Subscription error:', error);

      // DEV MODE: simulate payment if backend not running
      if (__DEV__) {
        Alert.alert(
          'Dev Mode',
          'Backend not reachable. Simulate successful payment?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Simulate Payment', onPress: handlePaymentSuccess },
          ]
        );
      } else {
        Alert.alert(
          'Connection Error',
          `Could not connect to payment server.\n\nMake sure your backend is running at:\n${BACKEND_URL}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const benefits = [
    { icon: '🤖', text: 'Unlimited AI coaching sessions with Claude' },
    { icon: '📊', text: 'Advanced analytics & progress tracking' },
    { icon: '🎯', text: 'Personalised training plans & drills' },
    { icon: '💬', text: 'Priority VIP coach chat support' },
    { icon: '🚫', text: 'No ads — uninterrupted experience' },
    { icon: '⭐', text: 'Exclusive VIP drills & content' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>VIP Subscription</Text>
        <Text style={styles.subtitle}>Unlock your full potential with AI coaching</Text>
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What You Get:</Text>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* Plan Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Plan:</Text>

        {/* Monthly */}
        <View style={styles.planCard}>
          <View style={styles.planLeft}>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planDesc}>Billed monthly. Cancel anytime.</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>$4.99</Text>
            <Text style={styles.planPer}>/month</Text>
          </View>
        </View>

        {/* Yearly */}
        <View style={[styles.planCard, styles.popularCard]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>BEST VALUE</Text>
          </View>
          <View style={styles.planLeft}>
            <Text style={styles.planName}>Yearly</Text>
            <Text style={styles.savingsText}>Save 33% vs monthly</Text>
            <Text style={styles.planDesc}>Billed annually.</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>$39.99</Text>
            <Text style={styles.planPer}>/year</Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.btn, styles.monthlyBtn, loading && styles.btnDisabled]}
          onPress={() => handleSubscribe('monthly')}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading && selectedPlan === 'monthly'
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Subscribe Monthly — $4.99/mo</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.yearlyBtn, loading && styles.btnDisabled]}
          onPress={() => handleSubscribe('yearly')}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading && selectedPlan === 'yearly'
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Subscribe Yearly — $39.99/yr (Save 33%)</Text>
          }
        </TouchableOpacity>

        <Text style={styles.secureNote}>
          🔒 Secure payment via Stripe. Cancel anytime in Settings.
        </Text>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={handlePaymentSuccess}
          >
            <Text style={styles.devBtnText}>DEV: Skip to VIP (Testing Only)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works:</Text>
        <Text style={styles.howText}>1. Tap Subscribe — you'll be taken to Stripe's secure payment page</Text>
        <Text style={styles.howText}>2. Enter your card details on Stripe's encrypted form</Text>
        <Text style={styles.howText}>3. After payment, you're redirected back to the app</Text>
        <Text style={styles.howText}>4. VIP is instantly activated — start chatting with Coach AI!</Text>
      </View>

    </ScrollView>
  );
};

export default VIPSubscription;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  content: { paddingBottom: 50 },

  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1a2332',
    borderBottomWidth: 2,
    borderBottomColor: '#ffd700',
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: '#1e88e5', fontSize: 16, fontWeight: 'bold' },
  crown: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#a8dadc', textAlign: 'center' },

  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f1faee', marginBottom: 16 },

  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  benefitIcon: { fontSize: 22, marginRight: 14, width: 32 },
  benefitText: { fontSize: 15, color: '#a8dadc', flex: 1 },

  planCard: {
    backgroundColor: '#1a2332',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#2d3f55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popularCard: {
    borderColor: '#ffd700',
    position: 'relative',
    paddingTop: 28,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: { color: '#0d1b2a', fontSize: 10, fontWeight: '800' },
  planLeft: { flex: 1 },
  planRight: { alignItems: 'flex-end' },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#f1faee', marginBottom: 4 },
  planDesc: { fontSize: 13, color: '#6b8a9a' },
  savingsText: { fontSize: 13, color: '#28a745', fontWeight: '600', marginBottom: 2 },
  planPrice: { fontSize: 26, fontWeight: 'bold', color: '#ffd700' },
  planPer: { fontSize: 12, color: '#a8dadc' },

  btn: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  monthlyBtn: { backgroundColor: '#1e88e5' },
  yearlyBtn: { backgroundColor: '#28a745' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  secureNote: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 4 },

  devBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2d1b00',
    borderWidth: 1,
    borderColor: '#ffd700',
    alignItems: 'center',
  },
  devBtnText: { color: '#ffd700', fontSize: 13, fontWeight: '600' },

  howText: { color: '#a8dadc', fontSize: 14, lineHeight: 24, marginBottom: 4 },
});