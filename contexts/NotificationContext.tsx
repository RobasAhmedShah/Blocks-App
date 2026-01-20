import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useApp } from './AppContext';

export type NotificationType = 
  | 'investment_success'
  | 'deposit_success'
  | 'withdrawal_success'
  | 'property_milestone'
  | 'security_alert'
  | 'feature_announcement'
  | 'portfolio_milestone'
  | 'rental_payment'
  | 'property_value_increase'
  | 'transaction_complete'
  | 'reward';

export type NotificationContext = 'portfolio' | 'wallet' | 'all';

export interface Notification {
  id: string;
  type: NotificationType;
  context: NotificationContext;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
  url?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  portfolioNotifications: Notification[];
  walletNotifications: Notification[];
  recentNotifications: Notification[];
  unreadCount: number;
  portfolioUnreadCount: number;
  walletUnreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (context?: NotificationContext) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: (context?: NotificationContext) => void;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = '@blocks_notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const userId = state.userInfo.id;
  
  // Initialize with empty array - backend is source of truth
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from backend API
  const loadNotifications = useCallback(async () => {
    try {
      const { notificationsApi } = await import('@/services/api/notifications.api');
      const backendNotifications = await notificationsApi.getMyNotifications();
      
      console.log(`📬 Loaded ${backendNotifications.length} notifications from backend`);
      
      // Convert backend notifications to app format
      const convertedNotifications: Notification[] = backendNotifications.map((n) => {
        // Determine notification type from data.category or data.type
        let type: NotificationType = 'transaction_complete';
        let context: NotificationContext = 'all';
        
        // Check category first (from admin panel)
        const category = n.data?.type || n.data?.category;
        if (category === 'properties' || category === 'property-detail') {
          type = 'property_milestone';
          context = 'all';
        } else if (category === 'portfolio') {
          type = 'portfolio_milestone';
          context = 'portfolio';
        } else if (category === 'wallet') {
          type = 'transaction_complete';
          context = 'wallet';
        } else if (category === 'notifications') {
          type = 'feature_announcement';
          context = 'all';
        } else if (category === 'custom') {
          type = 'feature_announcement';
          context = 'all';
        } else if (n.data?.type === 'reward') {
          type = 'reward';
          context = 'portfolio';
        } else if (n.data?.type === 'investment') {
          type = 'investment_success';
          context = 'portfolio';
        } else if (n.data?.type === 'deposit') {
          type = 'deposit_success';
          context = 'wallet';
        } else if (n.data?.type === 'withdrawal') {
          type = 'withdrawal_success';
          context = 'wallet';
        }
        
        return {
          id: n.id,
          type,
          context,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.createdAt),
          read: n.read || false, // Use actual read status from backend
          data: n.data,
          url: n.data?.url || (context === 'portfolio' ? '/notifications?context=portfolio' : context === 'wallet' ? '/notifications?context=wallet' : '/notifications'),
        };
      });
      
      console.log(`✅ Converted ${convertedNotifications.length} notifications to app format`);
      
      // Replace all notifications with backend data (backend is source of truth)
      setNotifications(convertedNotifications);
    } catch (error) {
      // console.error('❌ Error loading notifications:', error);
      // Don't throw - allow app to continue with existing notifications
    }
  }, []);

  // Save notifications to storage (in-memory for now)
  const saveNotifications = useCallback(async (updated: Notification[]) => {
    try {
      // In-memory storage - notifications persist during session
      // In production, you would save to AsyncStorage or backend API here
      // For now, state is managed in-memory
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, []);

  // Load on mount and when app comes to foreground
  useEffect(() => {
    loadNotifications();
    
    // Reload notifications when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadNotifications();
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [loadNotifications]);

  // Computed values
  const portfolioNotifications = notifications.filter(n => n.context === 'portfolio');
  const walletNotifications = notifications.filter(n => n.context === 'wallet');
  const recentNotifications = notifications
    .filter(n => !n.read)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const portfolioUnreadCount = portfolioNotifications.filter(n => !n.read).length;
  const walletUnreadCount = walletNotifications.filter(n => !n.read).length;

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistically update UI
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
    
    // Sync with backend
    if (userId) {
      try {
        const { notificationsApi } = await import('@/services/api/notifications.api');
        await notificationsApi.markAsRead(id, userId);
      } catch (error) {
        console.error('Failed to mark notification as read on backend:', error);
        // Revert on error
        const reverted = notifications.map(n => 
          n.id === id ? { ...n, read: false } : n
        );
        setNotifications(reverted);
        saveNotifications(reverted);
      }
    }
  }, [notifications, saveNotifications, userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async (context?: NotificationContext) => {
    // Optimistically update UI
    const updated = notifications.map(n => {
      if (context && context !== 'all') {
        return n.context === context ? { ...n, read: true } : n;
      }
      return { ...n, read: true };
    });
    setNotifications(updated);
    saveNotifications(updated);
    
    // Sync with backend
    if (userId) {
      try {
        const { notificationsApi } = await import('@/services/api/notifications.api');
        await notificationsApi.markAllAsRead(userId);
      } catch (error) {
        console.error('Failed to mark all notifications as read on backend:', error);
        // Revert on error - reload from backend
        loadNotifications();
      }
    }
  }, [notifications, saveNotifications, userId, loadNotifications]);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback((context?: NotificationContext) => {
    if (context && context !== 'all') {
      const updated = notifications.filter(n => n.context !== context);
      setNotifications(updated);
      saveNotifications(updated);
    } else {
      setNotifications([]);
      saveNotifications([]);
    }
  }, [notifications, saveNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        portfolioNotifications,
        walletNotifications,
        recentNotifications,
        unreadCount,
        portfolioUnreadCount,
        walletUnreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

