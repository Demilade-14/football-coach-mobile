// app/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseInitialized, firebaseInitError } from '../src/utils/firebaseConfig';
const AuthScreen = () => {
  const router = useRouter();
  // State declarations
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Auth handler with ACTUAL Firebase logic
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        // LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Save user info to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || name,
        }));
        Alert.alert('Success', `Welcome back, ${user.displayName || user.email}!`);
        router.replace('/');
      } else {
        // SIGNUP
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Update profile with name
        if (name) {
          await updateProfile(user, {
            displayName: name
          });
        }
        // Save user info to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: name,
        }));
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = 'Authentication failed';
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered. Please login.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection';
      }
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // Display an error if Firebase initialization failed
  if (!isFirebaseInitialized) {
    return (
      <View style={styles.center}>
        {firebaseInitError ? (
          <>
            <Text style={styles.errorTitle}>? Firebase initialization failed</Text>
            <Text style={styles.errorText}>{firebaseInitError.message}</Text>
            <Text style={styles.errorHint}>Check your .env file and GitHub Secrets</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => Platform.OS === 'web' && window.location.reload()}
            >
              <Text style={styles.retryText}>?? Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#ffd700" />
            <Text style={styles.loadingText}>Initializing Firebase...</Text>
          </>
        )}
      </View>
    );
  }
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* ? Emoji logo */}
      <Text style={styles.logo}>?</Text>
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
          autoComplete="email"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password (min 6 characters)"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeText}>{showPassword ? '???' : '??'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? '?? Login' : '?? Sign Up'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
export default AuthScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b2a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logo: { 
    fontSize: 80, 
    marginBottom: 20, 
    alignSelf: 'center',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#f1faee', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#a8dadc', textAlign: 'center', marginBottom: 40 },
  form: { gap: 16 },
  input: { backgroundColor: '#1b263b', color: '#f1faee', padding: 16, borderRadius: 8, fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  passwordInput: { flex: 1, paddingRight: 50 },
  eyeIcon: { position: 'absolute', right: 12, padding: 8 },
  eyeText: { fontSize: 20 },
  button: { backgroundColor: '#1e88e5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#5a7a9c' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  switchText: { color: '#a8dadc', textAlign: 'center', marginTop: 16, fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b2a', padding: 24 },
  loadingText: { color: '#a8dadc', marginTop: 12, fontSize: 16, textAlign: 'center' },
  errorTitle: { color: '#ff6b6b', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  errorText: { color: '#f1faee', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  errorHint: { color: '#a8dadc', fontSize: 13, textAlign: 'center' },
  retryButton: { backgroundColor: '#1e88e5', padding: 12, borderRadius: 8, marginTop: 16 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
