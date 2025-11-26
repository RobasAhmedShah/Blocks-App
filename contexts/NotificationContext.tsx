import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';

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
  // Initialize with sample notifications
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Initialize with some sample notifications
    const sampleNotifications: Notification[] = [
          {
            id: '1',
            type: 'rental_payment',
            context: 'portfolio',
            title: 'Rental Payment Received',
            message: 'You received $125.50 from Downtown Apartment Complex',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            data: { amount: 125.50, propertyId: '1' },
            url: '/portfolio',
          },
          {
            id: '2',
            type: 'property_value_increase',
            context: 'portfolio',
            title: 'Property Value Increased',
            message: 'Luxury Condo value increased by 2.5%',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            read: false,
            data: { propertyId: '2', increase: 2.5 },
            url: '/portfolio',
          },
          {
            id: '3',
            type: 'deposit_success',
            context: 'wallet',
            title: 'Deposit Successful',
            message: '$500.00 has been added to your wallet via Card',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            read: false,
            data: { amount: 500, method: 'Card' },
            url: '/wallet',
          },
          {
            id: '4',
            type: 'investment_success',
            context: 'portfolio',
            title: 'Investment Successful',
            message: 'You invested $1,000.00 in Beachfront Villa. 50.00 tokens purchased.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            read: true,
            data: { amount: 1000, tokenCount: 50, propertyId: '3' },
            url: '/portfolio',
          },
          {
            id: '5',
            type: 'transaction_complete',
            context: 'wallet',
            title: 'Transaction Complete',
            message: 'Your withdrawal of $200.00 has been processed',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            read: true,
            data: { amount: 200, type: 'withdrawal' },
            url: '/wallet',
          },
          {
            id: '6',
            type: 'portfolio_milestone',
            context: 'portfolio',
            title: 'Portfolio Milestone',
            message: 'Your portfolio is now worth $10,000.00',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            read: true,
            data: { value: 10000 },
          url: '/portfolio',
        },
      ];
    return sampleNotifications;
  });

  // Load notifications from backend API
  const loadNotifications = useCallback(async () => {
    try {
      const { notificationsApi } = await import('@/services/api/notifications.api');
      const backendNotifications = await notificationsApi.getMyNotifications();
      
      // Convert backend notifications to app format
      const convertedNotifications: Notification[] = backendNotifications.map((n) => {
        // Determine notification type from data
        let type: NotificationType = 'transaction_complete';
        let context: NotificationContext = 'all';
        
        if (n.data?.type === 'reward') {
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
          read: false, // Start as unread - user can mark as read
          data: n.data,
          url: n.data?.url || (context === 'portfolio' ? '/notifications?context=portfolio' : '/notifications?context=wallet'),
        };
      });
      
      // Replace all notifications with backend data (backend is source of truth)
      setNotifications(convertedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
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
  const markAsRead = useCallback((id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback((context?: NotificationContext) => {
    const updated = notifications.map(n => {
      if (context && context !== 'all') {
        return n.context === context ? { ...n, read: true } : n;
      }
      return { ...n, read: true };
    });
    setNotifications(updated);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

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

