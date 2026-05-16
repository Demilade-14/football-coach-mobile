import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Linking, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Your backend URL - update to your deployed backend
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.172.152:3000';
const PLANS = {
  monthly: {
    id: 'price_monthly_vip',
    name: 'Monthly VIP',
    price: '$9.99',
    period: '/month',
    features: ['Unlimited AI coaching', 'Priority responses', 'Advanced analytics', 'Video analysis', 'Custom training plans'],
    popular: false
  },
  yearly: {
    id: 'price_yearly_vip',
    name: 'Yearly VIP',
    price: '$99.99',
    period: '/year',
    savings: 'Save 17%',
    features: ['Everything in Monthly', '2 months FREE', 'VIP community', 'Early features', 'Dedicated support'],
    popular: true
  }
};
export default function VIPSubscription() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [checkingStatus, setCheckingStatus] = useState(true);
  useEffect(() => {
    checkVIPStatus();
    if (params.success === 'true') handleSuccessfulPayment();
    else if (params.canceled === 'true') Alert.alert('Cancelled', 'You can upgrade anytime.');
  }, [params]);
  const checkVIPStatus = async () => {
    try {
      const isVIP = await AsyncStorage.getItem('isVIP');
      const vipExpiry = await AsyncStorage.getItem('vipExpiry');
      if (isVIP === 'true' && (!vipExpiry || new Date(vipExpiry) > new Date())) {
        router.replace('/VIPChat');
        return;
      }
    } catch (e) { console.error(e); }
    finally { setCheckingStatus(false); }
  };
  const handleSuccessfulPayment = async () => {
    try {
      console.log('✅ Activating VIP subscription...');
      await AsyncStorage.setItem('isVIP', 'true');
      await AsyncStorage.setItem('vipExpiry', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
      await AsyncStorage.setItem('vipPlan', selectedPlan);
      console.log('✅ VIP activated successfully!');
      Alert.alert('🎉 Welcome to VIP!', 'Your subscription is active.', [
        { text: 'Start Coaching', onPress: () => router.replace('/VIPChat') }
      ]);
    } catch (e) {
      console.error('❌ Error activating VIP:', e);
      Alert.alert('Error', 'Could not activate VIP.');
    }
  };
  const initiateStripeCheckout = async (planKey) => {
    setLoading(true);
    try {
      console.log('🔄 Initiating Stripe checkout for plan:', planKey);
      const userId = await AsyncStorage.getItem('userId') || 'current-user-id';
      const plan = PLANS[planKey];
      const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          returnUrl: `${Linking.makeUrl('/VIPSubscription')}?success=true`,
          cancelUrl: `${Linking.makeUrl('/VIPSubscription')}?canceled=true`
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const { url } = await response.json();
      console.log('🔗 Checkout URL received:', url);
      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          throw new Error('Cannot open payment URL');
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Try again', [
        { text: 'Retry', onPress: () => initiateStripeCheckout(planKey) },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally { 
      setLoading(false); 
    }
  };
  const handleSubscribe = (planKey) => {
    console.log('📱 Subscribe button clicked for plan:', planKey);
    setSelectedPlan(planKey);
    if (__DEV__) {
      // Dev mode: simulate payment
      console.log('🧪 DEV MODE: Simulating payment...');
      Alert.alert(
        '🧪 Dev Mode', 
        `Simulating ${PLANS[planKey].name} payment...\n\nIn production, this will open Stripe Checkout.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Simulate Payment', 
            onPress: async () => {
              setLoading(true);
              console.log('⏳ Simulating payment delay...');
              await new Promise(r => setTimeout(r, 1500));
              console.log('✅ Payment simulated!');
              await handleSuccessfulPayment();
              setLoading(false);
            }
          }
        ]
      );
    } else {
      // Production: real Stripe
      console.log('💳 Production mode: Opening Stripe Checkout');
      initiateStripeCheckout(planKey);
    }
  };
  if (checkingStatus) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#ffd700" size="large" />
        <Text style={styles.loadingText}>Checking subscription...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚽ VIP Coaching</Text>
        <Text style={styles.subtitle}>Unlock unlimited AI coaching</Text>
      </View>
      <View style={styles.plansContainer}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <TouchableOpacity 
            key={key} 
            style={[
              styles.planCard, 
              selectedPlan === key && styles.planCardSelected,
              plan.popular && styles.planCardPopular
            ]} 
            onPress={() => {
              console.log('📋 Plan card tapped:', key);
              setSelectedPlan(key);
            }}
            activeOpacity={0.7}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>
            {plan.savings && <Text style={styles.savings}>{plan.savings}</Text>}
            {plan.features.map((feature, i) => (
              <Text key={i} style={styles.feature}>✓ {feature}</Text>
            ))}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
        onPress={() => {
          console.log('💰 Subscribe button pressed! Plan:', selectedPlan);
          handleSubscribe(selectedPlan);
        }}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.subscribeText}>
            Subscribe {PLANS[selectedPlan].price}{PLANS[selectedPlan].period}
          </Text>
        )}
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.secure}>🔒 Secure payment via Stripe</Text>
        <Text style={styles.terms}>Cancel anytime. Terms & Privacy apply.</Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  loadingText: { color: '#a8dadc', marginTop: 16, fontSize: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  backText: { color: '#1e88e5', fontSize: 16, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffd700', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#a8dadc', marginTop: 4 },
  plansContainer: { gap: 16, marginBottom: 24 },
  planCard: {
    backgroundColor: '#1b263b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#2a3f5f'
  },
  planCardSelected: { borderColor: '#ffd700' },
  planCardPopular: { borderColor: '#ffd700', backgroundColor: '#1a2a4a' },
  popularBadge: {
    backgroundColor: '#ffd700',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12
  },
  popularText: { color: '#0d1b2a', fontSize: 10, fontWeight: 'bold' },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#f1faee', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#ffd700' },
  period: { fontSize: 16, color: '#a8dadc', marginLeft: 4 },
  savings: { color: '#4CAF50', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  feature: { fontSize: 14, color: '#a8dadc', marginVertical: 4 },
  subscribeBtn: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  subscribeBtnDisabled: { opacity: 0.7 },
  subscribeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { alignItems: 'center', gap: 8, paddingBottom: 20 },
  secure: { color: '#4CAF50', fontSize: 14 },
  terms: { color: '#666', fontSize: 12, textAlign: 'center' }
});
