import '../global.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen, Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/lib/useColorScheme';
import { TourProvider } from '@/contexts/TourContext';
import { DepositSuccessProvider } from '@/contexts/DepositSuccessContext';
import { DepositSuccessDetector } from '@/components/DepositSuccessDetector';
// @ts-ignore - react-native-copilot types may not be available
import { CopilotProvider } from 'react-native-copilot';
import { CustomTooltip } from '@/components/tour/CustomTooltip';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useNotifications } from '@/services/useNotifications';
import * as NavigationBar from 'expo-navigation-bar';
import { WalletConnectProvider } from '@/src/wallet/WalletConnectProvider';
import { initGoogleSignin } from '@/src/lib/googleSignin';

const PENDING_NOTIFICATION_URL_KEY = 'pending_notification_url';

// Note: Notification handler is configured in services/useNotifications.ts
// This prevents duplicate handler configuration

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Use an empty object to maintain structure without loading specific fonts
  const [fontsLoaded, fontError] = useFonts({});

  // Initialize Google Sign-In once at app startup (Android only)
  useEffect(() => {
    if (Platform.OS === 'android') {
      initGoogleSignin();
    }
  }, []);

  // Hide system navigation bar on Android for full-screen experience
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

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
    <WalletConnectProvider>
      <AuthProvider>
        <AppProvider>
          <GuidanceProvider>
            <NotificationProvider>
              <ThemeProvider>
                <DepositSuccessProvider>
                  <TourProvider>
                  <CopilotProvider
                    tooltipComponent={CustomTooltip}
                    stepNumberComponent={() => null}
                    overlay="view"
                    animated={true}
                    backdropColor="rgba(0, 0, 0, 0.85)"
                    arrowColor="#00C896"
                    verticalOffset={10}
                    androidStatusBarVisible={true}>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <RootNavigation />
                      <DepositSuccessDetector />
                      <StatusBar style="auto" />
                    </GestureHandlerRootView>
                  </CopilotProvider>
                  </TourProvider>
                </DepositSuccessProvider>
              </ThemeProvider>
            </NotificationProvider>
          </GuidanceProvider>
        </AppProvider>
      </AuthProvider>
    </WalletConnectProvider>
  );
}

// New component to handle navigation logic inside the AuthContext
function RootNavigation() {
  const { isLoading } = useAuth();

  // Initialize push notifications - this will get the token and register it with backend
  // This hook must be called here to ensure it runs when the app starts
  useNotifications();

  // Helper function to parse and navigate to URL from notification
  const handleNotificationNavigation = (url: string | undefined) => {
    if (!url || typeof url !== 'string') {
      console.log('No URL found in notification data');
      return;
    }

    try {
      console.log('🔔 Navigating to notification URL:', url);

      // Check if it's a custom URL (external website)
      // First, check if it already has a protocol
      if (url.startsWith('http://') || url.startsWith('https://')) {
        console.log('🔔 Opening external URL in browser:', url);
        Linking.openURL(url).catch((err) => {
          console.error('❌ Failed to open URL:', err);
        });
        return;
      }

      // Check if it looks like an external website (domain-like)
      // If it contains a dot and doesn't start with /, it's likely an external URL
      // Also check if it doesn't match known internal routes
      const knownInternalRoutes = ['properties', 'wallet', 'portfolio', 'notifications'];
      const urlWithoutSlash = url.startsWith('/') ? url.slice(1) : url;
      const firstPart = urlWithoutSlash.split('/')[0].split('?')[0];

      // If it looks like a domain (contains dot, has TLD-like pattern) and isn't a known internal route
      if (
        url.includes('.') &&
        !url.startsWith('/') &&
        !knownInternalRoutes.includes(firstPart) &&
        !firstPart.startsWith('property') // Not /property/{id}
      ) {
        // It's likely an external URL without protocol - add https://
        const externalUrl = url.startsWith('http') ? url : `https://${url}`;
        console.log('🔔 Detected external URL, opening in browser:', externalUrl);
        Linking.openURL(externalUrl).catch((err) => {
          console.error('❌ Failed to open URL:', err);
        });
        return;
      }

      // Remove leading slash if present for consistency
      const cleanUrl = url.startsWith('/') ? url.slice(1) : url;

      // Parse URL with query parameters
      if (cleanUrl.includes('?')) {
        const [pathname, queryString] = cleanUrl.split('?');
        const params: Record<string, string> = {};

        queryString.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });

        console.log('🔔 Parsed URL - pathname:', pathname, 'params:', params);

        // Handle routes based on backend category mapping
        if (pathname.startsWith('properties/')) {
          // Property detail: /properties/{propertyId}
          const propertyId = pathname.split('/')[1];
          router.push(`/property/${propertyId}` as any);
        } else if (pathname === 'properties') {
          // Properties list
          router.push('/(tabs)/property' as any);
        } else if (pathname.startsWith('notifications')) {
          // Notifications page with context
          router.push({
            pathname: '/notifications' as any,
            params,
          } as any);
        } else if (
          pathname === 'profilesettings/kyc-approved' ||
          pathname.startsWith('profilesettings/kyc-approved')
        ) {
          // KYC Approved success page
          router.push('/profilesettings/kyc-approved' as any);
        } else if (pathname === 'wallet' || pathname.startsWith('wallet')) {
          // Wallet screen
          router.push('/(tabs)/wallet' as any);
        } else if (pathname === 'portfolio' || pathname.startsWith('portfolio')) {
          // Portfolio screen
          router.push('/(tabs)/portfolio' as any);
        } else {
          // Try to navigate to the pathname
          router.push({
            pathname: pathname as any,
            params,
          } as any);
        }
      } else {
        // Simple path without query params
        console.log('🔔 Navigating to simple path:', cleanUrl);

        if (cleanUrl.startsWith('properties/')) {
          // Property detail: /properties/{propertyId}
          const propertyId = cleanUrl.split('/')[1];
          router.push(`/property/${propertyId}` as any);
        } else if (cleanUrl === 'properties') {
          // Properties list
          router.push('/(tabs)/property' as any);
        } else if (cleanUrl === 'wallet') {
          // Wallet screen
          router.push('/(tabs)/wallet' as any);
        } else if (cleanUrl === 'portfolio') {
          // Portfolio screen
          router.push('/(tabs)/portfolio' as any);
        } else if (cleanUrl === 'notifications') {
          // Notifications page
          router.push('/notifications' as any);
        } else if (
          cleanUrl === 'profilesettings/kyc-approved' ||
          cleanUrl.startsWith('profilesettings/kyc-approved')
        ) {
          // KYC Approved success page
          router.push('/profilesettings/kyc-approved' as any);
        } else {
          // Try to navigate to the path
          router.push(`/${cleanUrl}` as any);
        }
      }
    } catch (error) {
      console.error('❌ Error navigating from notification:', error);
      // Fallback to notifications page
      router.push('/notifications' as any);
    }
  };

  // Set up notification listeners for deep linking
  useEffect(() => {
    // Handle notification received while app is running (foreground)
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification received (foreground):', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    // Handle notification tap/response (when app is in background or foreground)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 Notification tapped:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });

      const url = response.notification.request.content.data?.url;
      if (url) {
        // Store for potential cold start scenario
        SecureStore.setItemAsync(PENDING_NOTIFICATION_URL_KEY, url).catch((err) => {
          console.error('Failed to store pending notification URL:', err);
        });
        handleNotificationNavigation(url);
      }
    });

    // Handle initial notification (app opened from notification - COLD START)
    // This works on both iOS and Android in standalone builds
    const handleColdStart = async () => {
      try {
        // getLastNotificationResponseAsync is available on iOS and Android in standalone builds
        // But may not be available in Expo Go or during development
        if (Platform.OS === 'ios' || (Platform.OS === 'android' && __DEV__ === false)) {
          // Only call on iOS or in production Android builds
          // In development, this might not be available
          try {
            const response = await Notifications.getLastNotificationResponseAsync();
            if (response?.notification) {
              console.log('🔔 App opened from notification (cold start):', {
                title: response.notification.request.content.title,
                data: response.notification.request.content.data,
              });

              // Store the notification URL for navigation after biometric auth
              const url = response.notification.request.content.data?.url;
              if (url) {
                console.log('🔔 Storing pending notification URL for post-auth navigation:', url);
                // Store in SecureStore so it persists through auth flow
                SecureStore.setItemAsync(PENDING_NOTIFICATION_URL_KEY, url).catch((err) => {
                  console.error('Failed to store pending notification URL:', err);
                });

                // Try to navigate immediately if already authenticated
                // If not authenticated, it will be handled after biometric auth
                setTimeout(() => {
                  handleNotificationNavigation(url);
                }, 1000);
              }
            }
          } catch (methodError: any) {
            // Method might not be available in all scenarios (e.g., Expo Go, development)
            if (methodError?.message?.includes('not available')) {
              console.log(
                'ℹ️ getLastNotificationResponseAsync not available (this is normal in Expo Go):',
                methodError.message
              );
            } else {
              console.log('ℹ️ getLastNotificationResponseAsync error:', methodError);
            }
          }
        } else {
          // In development Android, skip this method
          console.log('ℹ️ Skipping getLastNotificationResponseAsync in development Android');
        }
      } catch (error) {
        // General error handling
        console.log('ℹ️ Cold start notification handling error:', error);
      }
    };

    // Handle cold start for both platforms
    handleColdStart();

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
      }}>
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
      <Stack.Screen name="wallet/send" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wallet/receive" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invest/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invest/[id]/crypto-payment" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />

      {/* Profile Settings screens */}
      <Stack.Screen name="profilesettings/personalinfo" />
      <Stack.Screen name="profilesettings/security" />
      <Stack.Screen name="profilesettings/paymentmethods" />
      <Stack.Screen name="profilesettings/addcard" />
      <Stack.Screen name="profilesettings/linkedbank" />
      <Stack.Screen name="profilesettings/notification" />
      <Stack.Screen name="profilesettings/language" />
      <Stack.Screen name="profilesettings/faqs" />
      <Stack.Screen name="profilesettings/contactsupport" />
      <Stack.Screen name="profilesettings/privacypolicy" />
      <Stack.Screen name="profilesettings/termsandcondition" />
      <Stack.Screen name="profilesettings/kyc" />
      <Stack.Screen name="profilesettings/kyc-upload" />
      <Stack.Screen name="profilesettings/kyc-details" />
      <Stack.Screen name="profilesettings/kyc-approved" />
    </Stack>
  );
}
