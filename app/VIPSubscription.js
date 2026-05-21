// =============================================================
// FILE: /app/VIPSubscription.js
// PURPOSE: VIP upgrade screen with plan comparison & checkout
// =============================================================

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSubscription } from "../src/context/SubscriptionContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// ── Plan data ─────────────────────────────────────────────────
const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$4.99",
    period: "/ month",
    badge: null,
    color: "#2563EB",
    description: "Billed monthly. Cancel anytime.",
  },
  {
    id: "yearly",
    label: "Annual",
    price: "$39.99",
    period: "/ year",
    badge: "BEST VALUE",
    color: "#059669",
    description: "Save 33% vs monthly. ~$3.33/mo.",
  },
];

const BENEFITS = [
  { icon: "👥", free: "5 players max", vip: "Unlimited players" },
  { icon: "🤖", free: "30 AI chats/hour", vip: "Unlimited AI coaching" },
  { icon: "☁️", free: "Local storage only", vip: "Cloud sync & backup" },
  { icon: "📊", free: "Basic stats", vip: "Advanced analytics" },
  { icon: "🚫", free: "Ads shown", vip: "Ad-free experience" },
  { icon: "🎨", free: "Standard cards", vip: "Premium card designs" },
];

// ── Main Component ────────────────────────────────────────────
export default function VIPSubscription() {
  const router = useRouter();
  const { isVip, plan: currentPlan, expiresAt, userId, refreshStatus } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Already VIP view ─────────────────────────────────────────
  if (isVip) {
    const expDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : "N/A";
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.vipActiveContainer}>
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.vipActiveTitle}>You're VIP!</Text>
          <Text style={styles.vipActiveSubtitle}>
            {currentPlan === "yearly" ? "Annual" : "Monthly"} plan active
          </Text>
          <Text style={styles.vipExpiry}>Renews: {expDate}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Handle checkout ──────────────────────────────────────────
  const handleSubscribe = useCallback(async () => {
    if (!userId) {
      Alert.alert("Error", "Unable to identify user. Please restart the app.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          userId,
          // Deep link back to app after payment
          successUrl: "footballcoach://vip-success",
          cancelUrl: "footballcoach://vip-cancel",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to start checkout");
      }

      const { url } = await response.json();

      // Open Stripe Checkout in browser
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        // After user returns, refresh subscription status
        setTimeout(() => refreshStatus(), 3000);
      } else {
        throw new Error("Cannot open payment page");
      }
    } catch (err) {
      console.error("[VIPSubscription] Checkout error:", err.message);
      setError(err.message);
      Alert.alert(
        "Payment Error",
        err.message || "Could not start checkout. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, userId, refreshStatus]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.headerTitle}>Football Coach VIP</Text>
          <Text style={styles.headerSubtitle}>
            Unlock your full coaching potential
          </Text>
        </View>

        {/* Plan Selector */}
        <View style={styles.plansRow}>
          {PLANS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.planCard,
                selectedPlan === p.id && { borderColor: p.color, borderWidth: 2 },
              ]}
              onPress={() => setSelectedPlan(p.id)}
              activeOpacity={0.8}
            >
              {p.badge && (
                <View style={[styles.badge, { backgroundColor: p.color }]}>
                  <Text style={styles.badgeText}>{p.badge}</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{p.label}</Text>
              <Text style={[styles.planPrice, { color: p.color }]}>{p.price}</Text>
              <Text style={styles.planPeriod}>{p.period}</Text>
              <Text style={styles.planDescription}>{p.description}</Text>
              {selectedPlan === p.id && (
                <View style={[styles.selectedDot, { backgroundColor: p.color }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits Comparison */}
        <View style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonHeaderFree}>Free</Text>
            <Text style={styles.comparisonHeaderVip}>VIP 👑</Text>
          </View>
          {BENEFITS.map((b, i) => (
            <View key={i} style={[styles.benefitRow, i % 2 === 0 && styles.benefitRowAlt]}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitFree}>{b.free}</Text>
              <Text style={styles.benefitVip}>{b.vip}</Text>
            </View>
          ))}
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              🔒 Start{" "}
              {selectedPlan === "yearly" ? "Annual" : "Monthly"} VIP —{" "}
              {selectedPlan === "yearly" ? "$39.99/yr" : "$4.99/mo"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Secure payment via Stripe. Cancel anytime. By subscribing, you agree to our Terms of Service.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  // VIP Active
  vipActiveContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  crownEmoji: { fontSize: 64, marginBottom: 16 },
  vipActiveTitle: { fontSize: 32, fontWeight: "800", color: "#FCD34D", marginBottom: 8 },
  vipActiveSubtitle: { fontSize: 18, color: "#94A3B8", marginBottom: 8 },
  vipExpiry: { fontSize: 14, color: "#64748B", marginBottom: 32 },
  backButton: { backgroundColor: "#1E293B", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  backButtonText: { color: "#E2E8F0", fontSize: 16, fontWeight: "600" },
  // Header
  header: { alignItems: "center", marginBottom: 32, paddingTop: 8 },
  closeBtn: { position: "absolute", right: 0, top: 0, padding: 8 },
  closeBtnText: { color: "#64748B", fontSize: 20 },
  crown: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#F1F5F9", marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: "#94A3B8", textAlign: "center" },
  // Plans
  plansRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  planCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    transform: [{ rotate: "0deg" }],
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  planLabel: { fontSize: 13, fontWeight: "700", color: "#94A3B8", marginBottom: 8, marginTop: 4 },
  planPrice: { fontSize: 28, fontWeight: "900", marginBottom: 2 },
  planPeriod: { fontSize: 12, color: "#64748B", marginBottom: 8 },
  planDescription: { fontSize: 11, color: "#475569", textAlign: "center" },
  selectedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 12 },
  // Comparison
  comparisonCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 0,
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  comparisonHeaderFree: {
    flex: 1,
    textAlign: "right",
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
    paddingRight: 24,
  },
  comparisonHeaderVip: {
    width: 130,
    textAlign: "center",
    color: "#FCD34D",
    fontWeight: "700",
    fontSize: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  benefitRowAlt: { backgroundColor: "#172033" },
  benefitIcon: { fontSize: 16, width: 24 },
  benefitFree: { flex: 1, color: "#64748B", fontSize: 12 },
  benefitVip: { width: 130, color: "#34D399", fontSize: 12, fontWeight: "600", textAlign: "center" },
  // Error
  errorBox: {
    backgroundColor: "#7F1D1D",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#FCA5A5", fontSize: 13 },
  // CTA
  ctaButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  disclaimer: { color: "#475569", fontSize: 11, textAlign: "center", lineHeight: 16 },
});