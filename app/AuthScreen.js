import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
let firebaseAuth = null;
let signInFn = null;
let createUserFn = null;
let updateProfileFn = null;
try {
  const firebaseModule = require("../src/utils/firebaseConfig");
  const authModule = require("firebase/auth");
  firebaseAuth = firebaseModule.auth;
  signInFn = authModule.signInWithEmailAndPassword;
  createUserFn = authModule.createUserWithEmailAndPassword;
  updateProfileFn = authModule.updateProfile;
} catch (e) {
  console.log("Firebase not available:", e.message);
}
const AuthScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleSkip = async () => {
    await AsyncStorage.setItem("user", JSON.stringify({
      uid: "guest-" + Date.now(),
      email: "guest@local.com",
      displayName: "Guest Player",
      isGuest: true,
    }));
    router.replace("/");
  };
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (!firebaseAuth || !signInFn) {
      Alert.alert("Error", "Authentication not available. Please use guest mode.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInFn(firebaseAuth, email, password);
        const user = userCredential.user;
        await AsyncStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email,
        }));
        router.replace("/");
      } else {
        const userCredential = await createUserFn(firebaseAuth, email, password);
        const user = userCredential.user;
        if (name && updateProfileFn) {
          await updateProfileFn(user, { displayName: name });
        }
        await AsyncStorage.setItem("user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: name,
        }));
        Alert.alert("Success", "Account created successfully!");
        router.replace("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      let errorMessage = "Invalid email or password. Please check and try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already registered. Please login instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password too weak. Use at least 6 characters.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "No internet connection. Please check your network.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check and try again.";
      }
      Alert.alert("Authentication Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.logo}>⚽</Text>
      <Text style={styles.title}>Football Coach</Text>
      <Text style={styles.subtitle}>Your Personal Training Assistant</Text>
      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? "👁" : "🙈"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? "Login" : "Sign Up"}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} disabled={loading}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>
        <TouchableOpacity style={styles.guestButton} onPress={handleSkip}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
export default AuthScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d1b2a" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  logo: { fontSize: 80, marginBottom: 20, alignSelf: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: "#f1faee", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#a8dadc", textAlign: "center", marginBottom: 40 },
  form: { gap: 16 },
  input: { backgroundColor: "#1b263b", color: "#f1faee", padding: 16, borderRadius: 8, fontSize: 16 },
  passwordContainer: { flexDirection: "row", alignItems: "center", position: "relative" },
  passwordInput: { flex: 1, paddingRight: 50 },
  eyeIcon: { position: "absolute", right: 12, padding: 8 },
  eyeText: { fontSize: 20 },
  button: { backgroundColor: "#1e88e5", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
  buttonDisabled: { backgroundColor: "#5a7a9c" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchText: { color: "#a8dadc", textAlign: "center", marginTop: 4, fontSize: 14 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  divider: { flex: 1, height: 1, backgroundColor: "#1b263b" },
  dividerText: { color: "#666", marginHorizontal: 12, fontSize: 13 },
  guestButton: { backgroundColor: "#1b263b", padding: 16, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#415a77" },
  guestButtonText: { color: "#a8dadc", fontSize: 16, fontWeight: "600" },
});
