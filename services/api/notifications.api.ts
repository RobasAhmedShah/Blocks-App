import { apiClient } from './apiClient';

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  data?: any;
  platform: 'expo' | 'web';
  status: 'sent' | 'failed';
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
};

