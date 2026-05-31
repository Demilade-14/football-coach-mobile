// app/_layout.js
// ✅ Simplified - NO VIP/SUBSCRIPTION

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
      }}
    >
      {/* Your screens */}
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      
      {/* Keep AICoach if you want it */}
      <Stack.Screen
        name="AICoach"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}