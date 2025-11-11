import '../global.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen, Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import { ThemeProvider } from '@/lib/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  // Set up notification listeners for deep linking
  useEffect(() => {
    // Handle notification received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle foreground notifications here
    });

    // Handle notification tap/response
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        // Parse URL with query parameters
        if (url.includes('?')) {
          const [pathname, queryString] = url.split('?');
          const params: Record<string, string> = {};
          queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });
          router.push({
            pathname: pathname as any,
            params,
          } as any);
        } else {
          router.push(url as any);
        }
      }
    });

    // Handle initial notification (app opened from notification)
    // Note: getLastNotificationResponseAsync is iOS-only, so we check platform
    if (Platform.OS === 'ios') {
      Notifications.getLastNotificationResponseAsync()
        .then(response => {
          if (response?.notification) {
            const url = response.notification.request.content.data?.url;
            if (typeof url === 'string') {
              // Parse URL with query parameters
              if (url.includes('?')) {
                const [pathname, queryString] = url.split('?');
                const params: Record<string, string> = {};
                queryString.split('&').forEach(param => {
                  const [key, value] = param.split('=');
                  if (key && value) {
                    params[key] = decodeURIComponent(value);
                  }
                });
                router.push({
                  pathname: pathname as any,
                  params,
                } as any);
              } else {
                router.push(url as any);
              }
            }
          }
        })
        .catch(error => {
          // Silently handle if method is not available
          console.log('getLastNotificationResponseAsync not available:', error);
        });
    }

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

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
