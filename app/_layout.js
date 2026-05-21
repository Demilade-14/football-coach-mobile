// app/_layout.js
import { Stack } from "expo-router";
import { SubscriptionProvider } from "../src/context/SubscriptionContext";

export default function RootLayout() {
  return (
    // ✅ MUST wrap with SubscriptionProvider for useSubscription to work
    <SubscriptionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        {/* Your existing screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        
        {/* ✅ Add new screens */}
        <Stack.Screen
          name="VIPSubscription"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AICoach"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </SubscriptionProvider>
  );
}