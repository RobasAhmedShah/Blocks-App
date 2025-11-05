import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import '../global.css';

export default function RootLayout() {
  return (
    <GuidanceProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0B14' },
        }}
      >
        {/* <Stack.Screen name="index" /> */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="property/[id]" />
        <Stack.Screen name="wallet" options={{ presentation: 'modal' }} />
        <Stack.Screen name="invest/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </GuidanceProvider>
  );
}
