import { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { NotificationSettings } from '@/types/profilesettings';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notification channels and permissions
  useEffect(() => {
    initializeNotifications();
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

      // Note: Push token retrieval is disabled since we're only using local notifications.
      // If you need push notifications in the future, uncomment the code below and configure Firebase.
      // if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
      //   // Get push token if on a physical device
      //   if (Device.isDevice) {
      //     try {
      //       const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      //       if (projectId) {
      //         const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      //         setExpoPushToken(tokenData.data);
      //       }
      //     } catch (error) {
      //       console.error('Error getting push token:', error);
      //     }
      //   }
      // }
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

      // Schedule DND start (10 PM daily) - using daily trigger (automatically repeats daily)
      await Notifications.scheduleNotificationAsync({
        identifier: 'dnd-start',
        content: {
          title: 'Do Not Disturb Active',
          body: 'Notifications will be silenced until 8:00 AM',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: DND_START_HOUR,
          minute: 0,
        },
      });

      // Schedule DND end (8 AM daily) - using daily trigger (automatically repeats daily)
      await Notifications.scheduleNotificationAsync({
        identifier: 'dnd-end',
        content: {
          title: 'Do Not Disturb Ended',
          body: 'Notifications are now active',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: DND_END_HOUR,
          minute: 0,
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

  const shouldShowNotification = useCallback((settings: NotificationSettings, type: keyof NotificationSettings, isDndEnabled: boolean = false): boolean => {
    // Always show security alerts
    if (type === 'securityAlerts' as keyof NotificationSettings) {
      return true;
    }

    // Check if notification type is enabled
    if (settings[type] !== true) {
      return false;
    }

    // Only check Do Not Disturb if it's explicitly enabled
    // Note: This function is used for UI display, actual blocking is handled in notificationHelper
    if (isDndEnabled && settings.pushNotifications) {
      const isInDndWindow = isInDoNotDisturbWindow();
      if (isInDndWindow) {
        // Still allow security alerts during DND
        return (type as string) === 'securityAlerts';
      }
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

