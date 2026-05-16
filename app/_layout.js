import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0d1b2a',
          },
          headerTintColor: '#ffd700',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: '⚽ Football Coach',
            headerLeft: () => (
              <MaterialIcons name="sports-soccer" size={24} color="#ffd700" style={{ marginLeft: 15 }} />
            ),
          }} 
        />
        <Stack.Screen name="AuthScreen" options={{ title: 'Authentication', headerShown: false }} />
        <Stack.Screen name="ProfileForm" options={{ title: 'Create Player Card', headerBackTitle: 'Back' }} />
        <Stack.Screen name="PlayerCardScreen" options={{ title: 'Player Card', headerBackTitle: 'Back' }} />
        <Stack.Screen name="HallOfFame" options={{ title: 'Hall of Fame', headerBackTitle: 'Back' }} />
      </Stack>
    </>
  );
}
