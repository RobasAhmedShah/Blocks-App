import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationSettings } from '@/types/profilesettings';

// Notification channel IDs (must match useNotifications.ts)
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  INVESTMENT: 'investment',
  PROPERTY: 'property',
  SECURITY: 'security',
  MARKETING: 'marketing',
} as const;

// Do Not Disturb schedule (10 PM - 8 AM)
const DND_START_HOUR = 22;
const DND_END_HOUR = 8;

/**
 * Check if current time is within Do Not Disturb window
 */
function isInDoNotDisturbWindow(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= DND_START_HOUR || currentHour < DND_END_HOUR;
}

/**
 * Check if notification should be shown based on user settings
 */
function shouldShowNotification(
  settings: NotificationSettings,
  type?: keyof NotificationSettings
): boolean {
  // Always show security alerts
  if (type === 'securityAlerts' as keyof NotificationSettings) {
    return true;
  }

  // If no type specified, check push notifications setting
  if (!type) {
    return settings.pushNotifications && !(settings.pushNotifications && isInDoNotDisturbWindow());
  }

  // Check if notification type is enabled
  if (!settings[type]) {
    return false;
  }

  // Check Do Not Disturb (if push notifications are enabled)
  if (settings.pushNotifications && isInDoNotDisturbWindow()) {
    // Still allow security alerts during DND
    if (type === 'securityAlerts' as keyof NotificationSettings) {
      return true;
    }
    return false;
  }

  return true;
}

/**
 * Send a local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId: string = NOTIFICATION_CHANNELS.DEFAULT,
  settings?: NotificationSettings,
  notificationType?: keyof NotificationSettings
): Promise<void> {
  try {
    // Check permissions
    const permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted && permissions.ios?.status !== Notifications.IosAuthorizationStatus.AUTHORIZED) {
      console.log('Notification permissions not granted');
      return;
    }

    // Check user settings if provided
    if (settings && notificationType) {
      if (!shouldShowNotification(settings, notificationType)) {
        console.log(`Notification type ${notificationType} is disabled or in DND window`);
        return;
      }
    }

    // Determine if we should play sound (respect DND)
    const shouldPlaySound = !(settings?.pushNotifications && isInDoNotDisturbWindow() && notificationType !== 'securityAlerts');

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: shouldPlaySound,
        data: {
          ...data,
          channelId,
          timestamp: new Date().toISOString(),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1, // Show immediately
      },
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

/**
 * Notification helper functions for common app events
 */
export const NotificationHelper = {
  /**
   * Send notification when investment is successful
   */
  async investmentSuccess(
    propertyTitle: string,
    amount: number,
    tokenCount: number,
    propertyId: string,
    settings?: NotificationSettings
  ): Promise<void> {
      await sendLocalNotification(
        'Investment Successful! 🎉',
        `You've invested $${amount.toFixed(2)} in ${propertyTitle}. ${tokenCount.toFixed(2)} tokens purchased.`,
        {
          type: 'investment_success',
          propertyTitle,
          amount,
          tokenCount,
          propertyId,
          url: `/portfolio/ownproperty/propertydetails?id=${propertyId}`,
        },
      NOTIFICATION_CHANNELS.INVESTMENT,
      settings,
      'investmentUpdates'
    );
  },

  /**
   * Send notification when deposit is successful
   */
  async depositSuccess(
    amount: number,
    method: string,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      'Deposit Successful! 💰',
      `$${amount.toFixed(2)} has been added to your wallet via ${method}.`,
      {
        type: 'deposit_success',
        amount,
        method,
        url: '/wallet',
      },
      NOTIFICATION_CHANNELS.DEFAULT,
      settings,
      'paymentReminders'
    );
  },

  /**
   * Send notification when withdrawal is successful
   */
  async withdrawalSuccess(
    amount: number,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      'Withdrawal Successful! ✅',
      `$${amount.toFixed(2)} has been withdrawn from your wallet.`,
      {
        type: 'withdrawal_success',
        amount,
        url: '/wallet',
      },
      NOTIFICATION_CHANNELS.DEFAULT,
      settings,
      'paymentReminders'
    );
  },

  /**
   * Send notification when property reaches funding milestone
   */
  async propertyMilestone(
    propertyTitle: string,
    milestone: string,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      'Property Update 🏠',
      `${propertyTitle}: ${milestone}`,
      {
        type: 'property_milestone',
        propertyTitle,
        milestone,
        url: '/portfolio/property/[id]',
      },
      NOTIFICATION_CHANNELS.PROPERTY,
      settings,
      'propertyAlerts'
    );
  },

  /**
   * Send notification for security alerts
   */
  async securityAlert(
    title: string,
    message: string,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      `Security Alert: ${title} 🔒`,
      message,
      {
        type: 'security_alert',
        title,
        message,
        url: '/profilesettings/security',
      },
      NOTIFICATION_CHANNELS.SECURITY,
      settings,
      'securityAlerts'
    );
  },

  /**
   * Send notification for new feature announcements
   */
  async featureAnnouncement(
    featureName: string,
    description: string,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      `New Feature: ${featureName} ✨`,
      description,
      {
        type: 'feature_announcement',
        featureName,
        description,
        url: '/home',
      },
      NOTIFICATION_CHANNELS.MARKETING,
      settings,
      'marketingOffers'
    );
  },

  /**
   * Send notification for portfolio milestone
   */
  async portfolioMilestone(
    milestone: string,
    value: number,
    settings?: NotificationSettings
  ): Promise<void> {
    await sendLocalNotification(
      'Portfolio Milestone! 🎯',
      `${milestone}: Your portfolio is now worth $${value.toFixed(2)}`,
      {
        type: 'portfolio_milestone',
        milestone,
        value,
        url: '/portfolio',
      },
      NOTIFICATION_CHANNELS.INVESTMENT,
      settings,
      'investmentUpdates'
    );
  },
};

