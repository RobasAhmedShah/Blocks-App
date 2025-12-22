import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from '@/services/api/notifications.api';
import { useAuth } from '@/contexts/AuthContext';

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification channel IDs
const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  INVESTMENT: 'investment',
  PROPERTY: 'property',
  SECURITY: 'security',
  MARKETING: 'marketing',
} as const;

// Do Not Disturb schedule (10 PM - 8 AM)
const DND_START_HOUR = 22; // 10 PM
const DND_END_HOUR = 8; // 8 AM

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register token with backend when it changes and user is authenticated
  useEffect(() => {
    if (expoPushToken && isAuthenticated) {
      const registerToken = async () => {
        try {
          const isExpoToken = expoPushToken.startsWith('ExponentPushToken[');
          // FCM registration tokens can include ':' (common) plus '.' '-' '_' chars
          const isFCMToken = !isExpoToken && expoPushToken.length > 100 && /^[A-Za-z0-9:._-]+$/.test(expoPushToken);
          
          console.log('📤 Registering push token with backend...', {
            tokenType: isExpoToken ? 'Expo' : isFCMToken ? 'FCM' : 'Unknown',
            tokenLength: expoPushToken.length,
            tokenPreview: expoPushToken.substring(0, 30) + '...',
            fullToken: expoPushToken, // Log full token for debugging
            isAuthenticated,
          });
          
          await notificationsApi.registerExpoToken(expoPushToken);
          console.log('✅ Push token registered successfully with backend');
        } catch (error: any) {
          console.error('❌ Failed to register push token:', {
            error: error?.message || error,
            stack: error?.stack,
            tokenLength: expoPushToken.length,
            tokenPreview: expoPushToken.substring(0, 30) + '...',
          });
        }
      };
      registerToken();
    } else {
      if (!expoPushToken) {
        console.log('⏳ Waiting for push token...');
      }
      if (!isAuthenticated) {
        console.log('⏳ Waiting for user authentication...');
      }
    }
  }, [expoPushToken, isAuthenticated]);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);

      // Set up Android notification channels
      if (Platform.OS === 'android') {
        await setupNotificationChannels();
      }

      // Request permissions
      const permissions = await requestPermissions();
      setPermissionStatus(permissions);

      if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
        // Get push token if on a physical device
        if (Device.isDevice) {
          try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            console.log('📱 Getting push token - Device.isDevice:', Device.isDevice, 'ProjectId:', projectId);

            // In standalone Android builds, try FCM token first (for production APKs)
            // If FCM fails, fall back to Expo token (works for Expo Go and as fallback)
            // This allows notifications to work in both Expo Go AND standalone APK builds
            const isExpoGo = (Constants as any)?.appOwnership === 'expo';

            if (Platform.OS === 'android' && !isExpoGo) {
              // Try FCM token first for standalone Android builds
              try {
                const deviceToken = await Notifications.getDevicePushTokenAsync();
                const token = String(deviceToken.data);
                const isExpoToken = token.startsWith('ExponentPushToken[');
                const isFCMToken = !isExpoToken && token.length > 100 && /^[A-Za-z0-9:._-]+$/.test(token);

                console.log('✅ Device push token obtained (standalone Android):', {
                  type: deviceToken.type,
                  tokenType: isExpoToken ? 'Expo' : isFCMToken ? 'FCM' : 'Unknown',
                  tokenLength: token.length,
                  tokenPreview: token.substring(0, 30) + '...',
                });

                // Store device token (backend will handle both Expo and FCM)
                setExpoPushToken(token);
                return;
              } catch (error: any) {
                console.warn('⚠️ Failed to get FCM token (standalone Android). Falling back to Expo token...', {
                  message: error?.message || String(error),
                });
                // Fall through to Expo token generation below
              }
            }

            // Expo Go / iOS / fallback: use Expo push token
            try {
              if (projectId) {
                const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
                const token = tokenData.data;
                const isExpoToken = token.startsWith('ExponentPushToken[');
                const isFCMToken = !isExpoToken && token.length > 100 && /^[A-Za-z0-9:._-]+$/.test(token);

                console.log('✅ Expo push token obtained:', {
                  tokenType: isExpoToken ? 'Expo' : isFCMToken ? 'FCM' : 'Unknown',
                  tokenLength: token.length,
                  tokenPreview: token.substring(0, 30) + '...',
                });

                setExpoPushToken(token);
              } else {
                console.warn('⚠️ No projectId found in Constants. Trying getExpoPushTokenAsync() without projectId...');
                const tokenData = await Notifications.getExpoPushTokenAsync();
                console.log('✅ Expo push token obtained (no projectId):', tokenData.data);
                setExpoPushToken(tokenData.data);
              }
            } catch (error: any) {
              console.error('❌ Failed to get Expo push token:', {
                message: error?.message || String(error),
              });
              throw error;
            }
          } catch (error: any) {
            console.error('❌ Error getting push token:', error);
            if (error.message?.includes('FCM')) {
              console.error('💡 FCM credentials may not be configured. For standalone APK builds, you need to:');
              console.error('   1. Run: eas credentials');
              console.error('   2. Select: Android > Push Notifications: Manage your FCM Api Key');
              console.error('   3. Upload your FCM server key from Firebase Console');
            }
          }
        } else {
          console.warn('⚠️ Not running on a physical device. Push tokens only work on real devices (not emulators/simulators).');
        }
      } else {
        console.warn('⚠️ Notification permissions not granted:', permissions);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupNotificationChannels = async () => {
    try {
      // Default channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
      });

      // Investment channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.INVESTMENT, {
        name: 'Investment Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      // Property channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.PROPERTY, {
        name: 'Property Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
      });

      // Security channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SECURITY, {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#ef4444',
      });

      // Marketing channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.MARKETING, {
        name: 'Marketing & Promotions',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 250],
        lightColor: '#f59e0b',
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  };

  const requestPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        const existingPermissions = await Notifications.getPermissionsAsync();
        if (existingPermissions.status !== Notifications.PermissionStatus.GRANTED) {
          const permissions = await Notifications.requestPermissionsAsync();
          return permissions;
        }
        return existingPermissions;
      } else {
        // iOS
        const permissions = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        return permissions;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      // Return a valid NotificationPermissionsStatus object
      return {
        granted: false,
        status: Notifications.PermissionStatus.UNDETERMINED,
        canAskAgain: true,
        expires: 'never',
      };
    }
  };

  const checkPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      setPermissionStatus(permissions);
      return permissions;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      // Return a valid NotificationPermissionsStatus object
      return {
        granted: false,
        status: Notifications.PermissionStatus.UNDETERMINED,
        canAskAgain: true,
        expires: 'never',
      };
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Listen for notifications received while app is foregrounded
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📬 Notification received (foreground):', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    return () => subscription.remove();
  }, []);

  // Listen for notification responses (user taps notification)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', {
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data,
      });

      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.url) {
        // Navigate to the URL specified in notification
        // This would be handled by your navigation system
        console.log('🔗 Navigate to:', data.url);
      }
    });

    return () => subscription.remove();
  }, []);

  return {
    expoPushToken,
    permissionStatus,
    isLoading,
    requestPermissions,
    checkPermissions,
  };
}
