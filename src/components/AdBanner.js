// app/components/AdBanner.js
// ✅ Simplified - Shows ads to ALL users (no VIP logic)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdBanner = ({ visible = true }) => {
  // If not visible, don't render anything
  if (!visible) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🪧 Ad Banner</Text>
      {/* TODO: Replace with actual Google Mobile Ads component when ready */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#1b263b',
    alignItems: 'center',
    minHeight: 50,
  },
  text: {
    color: '#a8dadc',
    fontSize: 12,
  },
});

export default AdBanner;