import '../global.css';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SplashScreen, Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/contexts/AppContext';
import { GuidanceProvider } from '@/contexts/GuidanceContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/lib/useColorScheme';
import { TourProvider } from '@/contexts/TourContext';
// @ts-ignore - react-native-copilot types may not be available
import { CopilotProvider } from 'react-native-copilot';
import { CustomTooltip } from '@/components/tour/CustomTooltip';
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
          <NotificationProvider>
            <ThemeProvider>
              <TourProvider>
                <CopilotProvider
                  tooltipComponent={CustomTooltip}
                  stepNumberComponent={() => null}
                  overlay="view"
                  animated={true}
                  backdropColor="rgba(0, 0, 0, 0.85)"
                  arrowColor="#00C896"
                  verticalOffset={10}
                  androidStatusBarVisible={true}
                >
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootNavigation />
                    <StatusBar style="auto" />
                  </GestureHandlerRootView>
                </CopilotProvider>
              </TourProvider>
            </ThemeProvider>
          </NotificationProvider>
        </GuidanceProvider>
      </AppProvider>
    </AuthProvider>
  );
}

// New component to handle navigation logic inside the AuthContext
function RootNavigation() {
  const { isLoading } = useAuth();

  // Helper function to parse and navigate to URL from notification
  const handleNotificationNavigation = (url: string | undefined) => {
    if (!url || typeof url !== 'string') {
      console.log('No URL found in notification data');
      return;
    }

    try {
      console.log('🔔 Navigating to notification URL:', url);
      
      // Remove leading slash if present for consistency
      const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
      
      // Parse URL with query parameters
      if (cleanUrl.includes('?')) {
        const [pathname, queryString] = cleanUrl.split('?');
        const params: Record<string, string> = {};
        
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
        
        console.log('🔔 Parsed URL - pathname:', pathname, 'params:', params);
        
        // Handle special routes
        if (pathname.startsWith('property/')) {
          const propertyId = pathname.split('/')[1];
          router.push(`/property/${propertyId}` as any);
        } else if (pathname.startsWith('notifications')) {
          router.push({
            pathname: '/notifications' as any,
            params,
          } as any);
        } else {
          router.push({
            pathname: pathname as any,
            params,
          } as any);
        }
      } else {
        // Simple path without query params
        console.log('🔔 Navigating to simple path:', cleanUrl);
        
        if (cleanUrl.startsWith('property/')) {
          const propertyId = cleanUrl.split('/')[1];
          router.push(`/property/${propertyId}` as any);
        } else {
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
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received (foreground):', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    // Handle notification tap/response (when app is in background or foreground)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapped:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });
      
      const url = response.notification.request.content.data?.url;
      handleNotificationNavigation(url);
    });

    // Handle initial notification (app opened from notification - COLD START)
    // This works on both iOS and Android in standalone builds
    const handleColdStart = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response?.notification) {
          console.log('🔔 App opened from notification (cold start):', {
            title: response.notification.request.content.title,
            data: response.notification.request.content.data,
          });
          
          // Wait a bit for app to fully initialize before navigating
          setTimeout(() => {
            const url = response.notification.request.content.data?.url;
            handleNotificationNavigation(url);
          }, 1000);
        }
      } catch (error) {
        // getLastNotificationResponseAsync might not be available in all scenarios
        console.log('ℹ️ getLastNotificationResponseAsync:', error);
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
    </Stack>
  );
}
