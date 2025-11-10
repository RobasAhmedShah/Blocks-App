import '../global.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import { ThemeProvider } from '@/lib/useColorScheme';
import { StatusBar } from 'expo-status-bar';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Use an empty object to maintain structure without loading specific fonts
  const [fontsLoaded, fontError] = useFonts({});

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after fonts are loaded or an error occurs
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    // Show nothing while fonts are loading (Splash screen is visible)
    return null;
  }

  // Wrap everything in the required providers
  return (
    <AuthProvider>
      <AppProvider>
        <GuidanceProvider>
          <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootNavigation />
              <StatusBar style="auto" />
            </GestureHandlerRootView>
          </ThemeProvider>
        </GuidanceProvider>
      </AppProvider>
    </AuthProvider>
  );
}

// New component to handle navigation logic inside the AuthContext
function RootNavigation() {
  const { isLoading } = useAuth();

  if (isLoading) {
    // We're returning null because the splash screen is already visible
    // while we check the auth status.
    return null;
  }

  // The redirection logic is handled by the useEffect in AuthContext.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {/* Define the granular onboarding screens as they exist */}
      <Stack.Screen name="onboarding/splash" />
      <Stack.Screen name="onboarding/onboard-one" />
      <Stack.Screen name="onboarding/welcome" />
      <Stack.Screen name="onboarding/signin" />
      <Stack.Screen name="onboarding/signup" />

      {/* Define the protected (tabs) group */}
      <Stack.Screen name="(tabs)" />

      {/* Define the root index (which will be redirected) */}
      <Stack.Screen name="index" />

      {/* Other screens */}
      <Stack.Screen name="property/[id]" />
      <Stack.Screen name="wallet" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invest/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
