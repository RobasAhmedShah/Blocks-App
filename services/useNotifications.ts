import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { NotificationSettings } from '@/types/profilesettings';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/services/api/notifications.api';

// Configure notification handler
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
        console.log('⏳ Waiting for push token to be generated...');
      }
      if (!isAuthenticated) {
        console.log('⏳ Waiting for user authentication before registering token...');
      }
    }
  }, [expoPushToken, isAuthenticated]);

  // Initialize notification channels and permissions
  useEffect(() => {
    initializeNotifications();

    // Listen for token changes (e.g., when app is reinstalled or token refreshes)
    const tokenSubscription = Notifications.addPushTokenListener(async (tokenData) => {
      console.log('🔄 Push token changed:', tokenData.data);
      setExpoPushToken(tokenData.data);
    });

    return () => {
      tokenSubscription.remove();
    };
  }, []);

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

            // In standalone Android builds, the most reliable approach is to use the device FCM token
            // and send notifications via Firebase Admin SDK from the backend.
            // Expo Go uses Expo push tokens, so we keep that path for dev.
            const isExpoGo = (Constants as any)?.appOwnership === 'expo';

            if (Platform.OS === 'android' && !isExpoGo) {
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

              // Store device token in expoToken field (backend treats it as FCM and sends via Firebase Admin)
              setExpoPushToken(token);
              return;
            }

            // Expo Go / iOS / fallback: use Expo push token
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
              console.warn('⚠️ No projectId found in Constants. Token generation may fail in standalone builds.');
              // Try without projectId as fallback (works in Expo Go)
              const tokenData = await Notifications.getExpoPushTokenAsync();
              console.log('✅ Expo push token obtained (fallback):', tokenData.data);
              setExpoPushToken(tokenData.data);
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
          console.warn('⚠️ Not running on a physical device. Push tokens only work on real devices.');
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
        lightColor: '#16a34a',
      });

      // Property channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.PROPERTY, {
        name: 'Property Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
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
        name: 'Marketing & Offers',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0, 250],
        lightColor: '#16a34a',
      });
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  };

  const requestPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    const permissions = await Notifications.getPermissionsAsync();
    return permissions;
  };

  const checkPermissions = async () => {
    const permissions = await Notifications.getPermissionsAsync();
    setPermissionStatus(permissions);
    return permissions;
  };

  const scheduleDoNotDisturb = useCallback(async (enabled: boolean) => {
    try {
      // Cancel existing DND notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const dndNotifications = scheduled.filter(n => 
        n.identifier.startsWith('dnd-')
      );
      
      for (const notification of dndNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      if (!enabled) return;

      // Schedule DND start (10 PM daily) - using daily trigger
      await Notifications.scheduleNotificationAsync({
        identifier: 'dnd-start',
        content: {
          title: 'Do Not Disturb Active',
          body: 'Notifications will be silenced until 8:00 AM',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: DND_START_HOUR,
          minute: 0,
          repeats: true,
        },
      });

      // Schedule DND end (8 AM daily) - using daily trigger
      await Notifications.scheduleNotificationAsync({
        identifier: 'dnd-end',
        content: {
          title: 'Do Not Disturb Ended',
          body: 'Notifications are now active',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: DND_END_HOUR,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling Do Not Disturb:', error);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const permissions = await checkPermissions();
      if (!permissions.granted && permissions.ios?.status !== Notifications.IosAuthorizationStatus.AUTHORIZED) {
        Alert.alert(
          'Permissions Required',
          'Please enable notification permissions in your device settings.'
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from Blocks',
          sound: true,
          data: { type: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  }, []);

  const isInDoNotDisturbWindow = useCallback((): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= DND_START_HOUR || currentHour < DND_END_HOUR;
  }, []);

  const shouldShowNotification = useCallback((settings: NotificationSettings, type: keyof NotificationSettings): boolean => {
    // Always show security alerts
    if (type === 'securityAlerts' as keyof NotificationSettings) {
      return true;
    }

    // Check if notification type is enabled
    if (!settings[type]) {
      return false;
    }

    // Check Do Not Disturb (if push notifications are enabled)
    if (settings.pushNotifications && isInDoNotDisturbWindow()) {
      // Still allow security alerts during DND
      return type === ('securityAlerts' as keyof NotificationSettings);
    }

    return true;
  }, [isInDoNotDisturbWindow]);

  return {
    expoPushToken,
    permissionStatus,
    isLoading,
    requestPermissions,
    checkPermissions,
    scheduleDoNotDisturb,
    sendTestNotification,
    isInDoNotDisturbWindow,
    shouldShowNotification,
    NOTIFICATION_CHANNELS,
  };
}

