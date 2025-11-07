import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import { ThemeProvider } from '@/lib/useColorScheme';
import { AppProvider } from '@/contexts/AppContext';
import '../global.css';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <GuidanceProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            {/* <Stack.Screen name="index" /> */}
            <Stack.Screen name="onboarding/splash" />
            <Stack.Screen name="onboarding/onboard-one" />
            <Stack.Screen name="onboarding/welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="property/[id]" />
            <Stack.Screen name="wallet" options={{ presentation: 'modal' }} />
            <Stack.Screen name="invest/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </GuidanceProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
