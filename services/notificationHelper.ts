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
 * Check if notification should be shown based on user settings
 * Note: DND check is handled separately and only when DND is explicitly enabled
 */
function shouldShowNotification(
  settings: NotificationSettings,
  type?: keyof NotificationSettings,
  isDndEnabled: boolean = false
): boolean {
  // Always show security alerts
  if (type === 'securityAlerts') {
    return true;
  }

  // If no type specified, check push notifications setting
  if (!type) {
    return settings.pushNotifications === true;
  }

  // Check if notification type is enabled
  if (settings[type] !== true) {
    return false;
  }

  // Only check DND if it's explicitly enabled AND push notifications are enabled
  // DND check is done by checking if DND notifications are scheduled (handled externally)
  if (isDndEnabled && settings.pushNotifications) {
    // Check if we're in DND window (10 PM - 8 AM)
    const now = new Date();
    const currentHour = now.getHours();
    const isInDndWindow = currentHour >= DND_START_HOUR || currentHour < DND_END_HOUR;
    
    if (isInDndWindow) {
      // Security alerts always go through, even during DND
      return type === 'securityAlerts';
    }
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

    // Check if DND is enabled by checking scheduled DND notifications
    let isDndEnabled = false;
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      isDndEnabled = scheduled.some(n => n.identifier.startsWith('dnd-'));
    } catch (error) {
      // If we can't check, assume DND is not enabled
      console.log('Could not check DND status, assuming disabled');
    }

    // Check user settings if provided
    if (settings && notificationType) {
      if (!shouldShowNotification(settings, notificationType, isDndEnabled)) {
        console.log(`Notification type ${notificationType} is disabled${isDndEnabled ? ' or in DND window' : ''}`);
        return;
      }
    }

    // Determine if we should play sound (respect DND only if enabled)
    let shouldPlaySound = true;
    if (isDndEnabled && settings?.pushNotifications && notificationType !== 'securityAlerts') {
      const now = new Date();
      const currentHour = now.getHours();
      const isInDndWindow = currentHour >= DND_START_HOUR || currentHour < DND_END_HOUR;
      shouldPlaySound = !isInDndWindow;
    }

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

