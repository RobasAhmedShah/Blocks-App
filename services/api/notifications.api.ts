import { apiClient } from './apiClient';

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  data?: any;
  platform: 'expo' | 'web';
  status: 'sent' | 'failed';
  read: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationResponse[];
}

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  getMyNotifications: async (): Promise<NotificationResponse[]> => {
    const response = await apiClient.get<NotificationsListResponse>('/api/notifications');
    return response.notifications;
  },

  /**
   * Register Expo push token with backend
   */
  registerExpoToken: async (token: string): Promise<void> => {
    await apiClient.post('/api/notifications/register-expo-token', { token });
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string, userId: string): Promise<void> => {
    await apiClient.patch(`/api/notifications/mark-read/${notificationId}/user/${userId}`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    await apiClient.patch(`/api/notifications/mark-all-read/user/${userId}`);
  },
};

