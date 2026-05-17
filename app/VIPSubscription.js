// app/VIPSubscription.js — FIXED
// FIX: Payment is now properly enforced via Stripe Checkout (opens browser to card form)
// DEV mode simulation is removed from production flow
// The backend creates a real Stripe session — user must enter card details on Stripe's hosted page

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Linking, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) return process.env.EXPO_PUBLIC_BACKEND_URL;
  if (Platform.OS === 'web') return 'http://localhost:3000';
  return 'http://192.168.172.152:3000';
};
const BACKEND_URL = getBackendUrl();

// ─────────────────────────────────────────────────────────────
// STRIPE PUBLISHABLE KEY  (add to .env as EXPO_PUBLIC_STRIPE_KEY)
// This is only used to display — actual charging is done server-side
// ─────────────────────────────────────────────────────────────
const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_KEY || '';

const VIPSubscription = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly'); // default to best value
  const [userId, setUserId] = useState('guest-user');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [alreadyVIP, setAlreadyVIP] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Load user ID
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.uid || u.id) setUserId(u.uid || u.id);
      }
    } catch (e) {}

    // Check if already VIP
    try {
      const vip = await AsyncStorage.getItem('isVIP');
      if (vip === 'true') setAlreadyVIP(true);
    } catch (e) {}

    // Backend health
    checkBackendHealth();

    // Deep link listener (Stripe redirects back after payment)
    const handleDeepLink = ({ url }) => {
      console.log('🔗 Deep link received:', url);
      if (url?.includes('vip-success')) {
        handlePaymentSuccess();
      } else if (url?.includes('vip-cancel')) {
        Alert.alert('Payment Cancelled', 'You can try again whenever you are ready.');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);

    // Handle cold start deep link (app was closed)
    Linking.getInitialURL().then(url => {
      if (url?.includes('vip-success')) handlePaymentSuccess();
    });

    return () => sub?.remove();
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  // Called ONLY after Stripe redirects back with success
  const handlePaymentSuccess = async () => {
    try {
      await AsyncStorage.setItem('isVIP', 'true');
      await AsyncStorage.setItem('vipSince', new Date().toISOString());
      await AsyncStorage.setItem('vipPlan', selectedPlan);
      Alert.alert(
        '🎉 Welcome to VIP!',
        'Your payment was successful. Enjoy unlimited AI coaching!',
        [{ text: 'Start Coaching!', onPress: () => router.replace('/VIPChat') }]
      );
    } catch (e) {
      router.replace('/VIPChat');
    }
  };

  // ── Main subscribe handler ──────────────────────────────────
  const handleSubscribe = async () => {
    if (loading || !selectedPlan) return;

    setLoading(true);

    try {
      if (backendStatus === 'offline') {
        // Backend is down — show clear instructions, no auto-grant
        Alert.alert(
          '⚠️ Payment Server Unavailable',
          `Cannot reach payment server at:\n${BACKEND_URL}\n\nPlease:\n1. Start your backend server\n2. Ensure you are on the same WiFi\n3. Try again`,
          [
            { text: 'Retry', onPress: () => { checkBackendHealth(); setLoading(false); } },
            { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          ]
        );
        return;
      }

      // Call your backend to create a Stripe Checkout Session
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          userId,
          // Stripe will redirect to these URLs after payment
          successUrl: 'footballcoach://vip-success',
          cancelUrl: 'footballcoach://vip-cancel',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.url) {
        throw new Error('No checkout URL returned from server');
      }

      // Open Stripe's hosted checkout page — user enters card details there
      console.log('💳 Opening Stripe Checkout:', data.url);
      const canOpen = await Linking.canOpenURL(data.url);
      if (canOpen) {
        await Linking.openURL(data.url);
        // App will receive deep link callback when Stripe redirects back
      } else {
        throw new Error('Cannot open Stripe checkout URL');
      }

    } catch (error) {
      console.error('Subscribe error:', error);
      Alert.alert(
        'Payment Error',
        `Could not start payment:\n${error.message}\n\nPlease check your connection and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Already VIP screen ──────────────────────────────────────
  if (alreadyVIP) {
    return (
      <View style={styles.container}>
        <View style={styles.alreadyVipScreen}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.alreadyVipTitle}>You're Already VIP!</Text>
          <Text style={styles.alreadyVipSub}>You have full access to all premium features.</Text>
          <TouchableOpacity style={styles.goCoachBtn} onPress={() => router.replace('/VIPChat')}>
            <Text style={styles.goCoachText}>Go to Coach AI</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const benefits = [
    { icon: '🤖', text: 'Unlimited AI coaching with Claude Sonnet' },
    { icon: '📊', text: 'Advanced analytics & performance tracking' },
    { icon: '🎯', text: 'Personalised weekly training plans' },
    { icon: '💬', text: 'Priority VIP support' },
    { icon: '🏆', text: 'Exclusive drills & tactical sessions' },
    { icon: '🚫', text: 'Ad-free experience' },
  ];

  const monthlyPrice = 4.99;
  const yearlyPrice = 39.99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Go VIP</Text>
        <Text style={styles.subtitle}>Unlock your full coaching potential</Text>
      </View>

      {/* Backend status */}
      {backendStatus === 'offline' && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>⚠️ Payment server offline</Text>
          <Text style={styles.warningSub}>Start your backend to enable payments</Text>
          <TouchableOpacity onPress={checkBackendHealth} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}
      {backendStatus === 'online' && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✅ Secure payment server connected</Text>
        </View>
      )}
      {backendStatus === 'checking' && (
        <View style={styles.checkingBanner}>
          <ActivityIndicator size="small" color="#4fc3f7" />
          <Text style={styles.checkingText}>  Connecting to payment server...</Text>
        </View>
      )}

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's Included</Text>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <Text style={styles.benefitText}>{b.text}</Text>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ))}
      </View>

      {/* Plan selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {/* Monthly */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planSelected]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.8}
        >
          <View style={styles.radioOuter}>
            {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.planLeft}>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planDesc}>Flexible — cancel anytime</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>${monthlyPrice}</Text>
            <Text style={styles.planPer}>/month</Text>
          </View>
        </TouchableOpacity>

        {/* Yearly — recommended */}
        <TouchableOpacity
          style={[styles.planCard, styles.planCardYearly, selectedPlan === 'yearly' && styles.planSelected]}
          onPress={() => setSelectedPlan('yearly')}
          activeOpacity={0.8}
        >
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>BEST VALUE — SAVE 33%</Text>
          </View>
          <View style={styles.radioOuter}>
            {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.planLeft}>
            <Text style={styles.planName}>Yearly</Text>
            <Text style={styles.planSavings}>Just ${yearlyMonthly}/month</Text>
            <Text style={styles.planDesc}>Billed as ${yearlyPrice}/year</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPriceStrike}>${(monthlyPrice * 12).toFixed(2)}</Text>
            <Text style={styles.planPrice}>${yearlyPrice}</Text>
            <Text style={styles.planPer}>/year</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Subscribe CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            selectedPlan === 'yearly' ? styles.subscribeBtnYearly : styles.subscribeBtnMonthly,
            (loading || backendStatus === 'offline') && styles.subscribeBtnDisabled,
          ]}
          onPress={handleSubscribe}
          disabled={loading || backendStatus === 'offline'}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.subscribeBtnText}>
                {selectedPlan === 'yearly'
                  ? `🔒 Subscribe Yearly — $${yearlyPrice}/yr`
                  : `🔒 Subscribe Monthly — $${monthlyPrice}/mo`}
              </Text>
              <Text style={styles.subscribeBtnSub}>Secure payment via Stripe</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          <Text style={styles.trustItem}>🔐 256-bit SSL</Text>
          <Text style={styles.trustItem}>💳 Card required</Text>
          <Text style={styles.trustItem}>❌ Cancel anytime</Text>
        </View>

        <Text style={styles.stripeNote}>
          You will be redirected to Stripe's secure checkout page to enter your payment details. We never store your card information.
        </Text>
      </View>

      {/* Terms */}
      <Text style={styles.terms}>
        By subscribing you agree to our Terms of Service and Privacy Policy. Subscriptions auto-renew unless cancelled 24 hours before the renewal date.
      </Text>
    </ScrollView>
  );
};

export default VIPSubscription;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080f1a' },
  content: { paddingBottom: 60 },

  // Already VIP
  alreadyVipScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, paddingTop: 120 },
  alreadyVipTitle: { fontSize: 26, fontWeight: '800', color: '#ffd700', marginTop: 16, marginBottom: 8 },
  alreadyVipSub: { color: '#a8dadc', fontSize: 15, textAlign: 'center', marginBottom: 30 },
  goCoachBtn: { backgroundColor: '#1246a0', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14, marginBottom: 20 },
  goCoachText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { color: '#3a6186', fontSize: 14 },

  // Header
  header: { padding: 24, alignItems: 'center', backgroundColor: '#0b1220', borderBottomWidth: 2, borderBottomColor: '#1a2f46', paddingTop: 50 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#1e88e5', fontSize: 15, fontWeight: '700' },
  crown: { fontSize: 52, marginBottom: 10 },
  title: { fontSize: 30, fontWeight: '900', color: '#ffd700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#a8dadc', textAlign: 'center' },

  // Banners
  warningBanner: { backgroundColor: '#7f3800', marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 14, gap: 4 },
  warningText: { color: '#ff9800', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  warningSub: { color: '#ffcc80', fontSize: 12, textAlign: 'center' },
  retryBtn: { backgroundColor: '#ff9800', marginTop: 8, padding: 8, borderRadius: 8, alignItems: 'center' },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  successBanner: { backgroundColor: '#0a3320', marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 12 },
  successText: { color: '#66bb6a', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  checkingBanner: { flexDirection: 'row', justifyContent: 'center', marginHorizontal: 20, marginTop: 16, padding: 12, backgroundColor: '#111d2e', borderRadius: 12 },
  checkingText: { color: '#4fc3f7', fontSize: 13 },

  // Section
  section: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#dce8f8', marginBottom: 16, letterSpacing: 0.3 },

  // Benefits
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  benefitIcon: { fontSize: 22, width: 32 },
  benefitText: { flex: 1, fontSize: 14, color: '#a8dadc' },
  checkmark: { color: '#66bb6a', fontSize: 16, fontWeight: '800' },

  // Plans
  planCard: {
    backgroundColor: '#111d2e', borderRadius: 16, padding: 20,
    marginBottom: 14, borderWidth: 2, borderColor: '#1a2f46',
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  planCardYearly: { paddingTop: 32 },
  planSelected: { borderColor: '#ffd700', backgroundColor: '#161f30' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#3a6186', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ffd700' },
  bestValueBadge: { position: 'absolute', top: -1, left: 16, backgroundColor: '#28a745', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  bestValueText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planLeft: { flex: 1 },
  planName: { color: '#dce8f8', fontSize: 18, fontWeight: '800', marginBottom: 3 },
  planSavings: { color: '#66bb6a', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  planDesc: { color: '#3a6186', fontSize: 12 },
  planRight: { alignItems: 'flex-end' },
  planPrice: { color: '#ffd700', fontSize: 26, fontWeight: '900' },
  planPriceStrike: { color: '#3a6186', fontSize: 13, textDecorationLine: 'line-through', marginBottom: -2 },
  planPer: { color: '#3a6186', fontSize: 12 },

  // Subscribe button
  subscribeBtn: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, gap: 4 },
  subscribeBtnYearly: { backgroundColor: '#28a745' },
  subscribeBtnMonthly: { backgroundColor: '#1246a0' },
  subscribeBtnDisabled: { opacity: 0.5 },
  subscribeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subscribeBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  // Trust
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  trustItem: { color: '#3a6186', fontSize: 11, fontWeight: '600' },
  stripeNote: { color: '#3a6186', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  terms: { color: '#1a2f46', fontSize: 11, textAlign: 'center', paddingHorizontal: 20, lineHeight: 17 },
});