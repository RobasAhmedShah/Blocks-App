import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNotificationContext, NotificationContext as NotificationContextType } from '@/contexts/NotificationContext';
import { Notification } from '@/contexts/NotificationContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const params = useLocalSearchParams<{ context?: string }>();
  const context = (params.context as NotificationContextType) || 'portfolio';

  const {
    notifications,
    portfolioNotifications,
    walletNotifications,
    markAsRead,
    deleteNotification,
    loadNotifications,
  } = useNotificationContext();
  
  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reload notifications when screen comes into focus
      loadNotifications();
    }, [loadNotifications])
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag gesture animation
  const translateY = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // Pan responder for drag gesture (swipe down to close)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        
        // Close if dragged down more than 150px or fast swipe (velocity > 0.5)
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          // Animate out and close with background fade
          Animated.parallel([
            Animated.timing(backgroundOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(() => {
            setModalVisible(false);
            setSelectedNotification(null);
            setTimeout(() => {
              translateY.setValue(0);
            }, 100);
          });
        } else {
          // Spring back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  // Get notifications based on context
  // For "All" tab, show all notifications regardless of context
  // For "Recent" tab, filter by context
  const contextNotifications = useMemo(() => {
    // Always use all notifications - context filtering happens in the tab logic
    return notifications;
  }, [notifications]);

  // Filter and organize notifications
  const processedNotifications = useMemo(() => {
    let filtered = contextNotifications;

    // Apply context filter for "Recent" tab only
    // "All" tab shows everything regardless of context
    if (context === 'portfolio') {
      // For portfolio context, filter by portfolio context in Recent tab
      // But show all in All tab
      filtered = filtered; // Keep all for now, will filter in return
    } else if (context === 'wallet') {
      // For wallet context, filter by wallet context in Recent tab
      // But show all in All tab
      filtered = filtered; // Keep all for now, will filter in return
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by timestamp
    const sorted = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply context filter only to "Recent" tab
    // "All" tab shows everything
    let recentFiltered = sorted.filter(n => !n.read);
    if (context === 'portfolio') {
      recentFiltered = recentFiltered.filter(n => n.context === 'portfolio');
    } else if (context === 'wallet') {
      recentFiltered = recentFiltered.filter(n => n.context === 'wallet');
    }

    return {
      recent: recentFiltered, // Unread notifications filtered by context
      all: sorted, // All notifications (both read and unread, no context filter)
    };
  }, [contextNotifications, searchQuery, context]);

  const displayedNotifications = activeTab === 'recent' 
    ? processedNotifications.recent 
    : processedNotifications.all;

  // Calculate unread count based on context for the header
  const unreadCount = useMemo(() => {
    if (context === 'portfolio') {
      return portfolioNotifications.filter(n => !n.read).length;
    } else if (context === 'wallet') {
      return walletNotifications.filter(n => !n.read).length;
    }
    return notifications.filter(n => !n.read).length;
  }, [context, notifications, portfolioNotifications, walletNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    translateY.setValue(0); // Reset animation
    
    // Fade in background
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleCloseModal = () => {
    // Fade out background and animate out modal
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setModalVisible(false);
      setSelectedNotification(null);
      // Reset animation value after modal is hidden
      setTimeout(() => {
        translateY.setValue(0);
      }, 100);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'investment_success':
      case 'portfolio_milestone':
        return 'trending-up';
      case 'deposit_success':
        return 'add-circle';
      case 'withdrawal_success':
        return 'remove-circle';
      case 'rental_payment':
      case 'reward':
        return 'cash';
      case 'property_value_increase':
      case 'property_milestone':
        return 'home';
      case 'security_alert':
        return 'shield-checkmark';
      case 'transaction_complete':
        return 'checkmark-circle';
      case 'feature_announcement':
        return 'sparkles';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'investment_success':
      case 'portfolio_milestone':
      case 'rental_payment':
        return `${colors.primary}/20`;
      case 'deposit_success':
        return '#10B981';
      case 'withdrawal_success':
        return colors.destructive;
      case 'property_value_increase':
      case 'property_milestone':
        return '#3B82F6';
      case 'security_alert':
        return '#EF4444';
      case 'transaction_complete':
        return '#10B981';
      case 'feature_announcement':
        return '#8B5CF6';
      default:
        return colors.textMuted;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getContextTitle = () => {
    switch (context) {
      case 'portfolio':
        return 'Portfolio Notifications';
      case 'wallet':
        return 'Wallet Notifications';
      default:
        return 'All Notifications';
    }
  };

  const renderNotificationCard = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
      style={{
        backgroundColor: notification.read
          ? isDarkColorScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'
          : isDarkColorScheme ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: notification.read ? 1 : 1.5,
        borderColor: notification.read
          ? isDarkColorScheme ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 0, 0, 0.04)'
          : isDarkColorScheme ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.3)',
        flexDirection: 'row',
        gap: 10,
      }}
    >
      {/* Icon Container */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 25,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons
          name={getNotificationIcon(notification.type) as any}
          size={18}
          color={colors.primary}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 13,
              fontWeight: notification.read ? '600' : '700',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && (
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.primary,
                marginLeft: 8,
              }}
            />
          )}
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            lineHeight: 16,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {notification.message}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
          {formatTimeAgo(notification.timestamp)}
        </Text>
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          deleteNotification(notification.id);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Gradient Background */}
      <LinearGradient
        colors={isDarkColorScheme
          ? ['#00C896', '#064E3B', '#032822', '#021917']
          : ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#FFFFFF']
        }
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44,
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
        >
          {/* Top Navigation Bar */}
          <View 
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 20 
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.85)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'center',
              }}
            >
              {getContextTitle()}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 40,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.06)',
              marginBottom: 20,
            }}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search notifications..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                marginLeft: 8,
                color: colors.textPrimary,
                fontSize: 14,
              }}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setActiveTab('recent')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: activeTab === 'recent' 
                  ? colors.primary 
                  : isDarkColorScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)',
                borderWidth: activeTab === 'recent' ? 0 : 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'recent' ? '#FFFFFF' : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: activeTab === 'recent' ? '700' : '600',
                }}
              >
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: activeTab === 'all' 
                  ? colors.primary 
                  : isDarkColorScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)',
                borderWidth: activeTab === 'all' ? 0 : 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: activeTab === 'all' ? '#FFFFFF' : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: activeTab === 'all' ? '700' : '600',
                }}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Tab Label */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {activeTab === 'recent' ? `Recent (${displayedNotifications.length})` : `All (${displayedNotifications.length})`}
            </Text>
          </View>

          {/* Notifications List */}
          {displayedNotifications.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.27)' : 'rgba(255, 255, 255, 0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 6 }}>
                {activeTab === 'recent' ? 'No recent notifications' : 'No notifications found'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {activeTab === 'recent'
                  ? 'You have no unread notifications'
                  : searchQuery
                  ? 'Try adjusting your search'
                  : 'No read notifications yet'}
              </Text>
            </View>
          ) : (
            <View style={{ padding: 5 }}>
              {displayedNotifications.map((notification) => renderNotificationCard(notification))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notification Detail Modal with Drag Gesture */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Animated.View 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backgroundOpacity,
          }}
        >
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: 30,
              maxHeight: SCREEN_HEIGHT * 0.85,
              transform: [{ translateY }],
            }}
          >
            {/* Drag Handle with Pan Responder */}
            <View 
              style={{ alignItems: 'center', marginBottom: 12 }}
              {...panResponder.panHandlers}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isDragging ? colors.primary : colors.textMuted,
                  opacity: isDragging ? 0.8 : 1,
                }}
              />
              {/* Optional: Swipe hint text */}
              {!isDragging && (
                <Text style={{ 
                  color: colors.textMuted, 
                  fontSize: 10, 
                  marginTop: 4,
                  opacity: 0.6,
                }}>
                  Swipe down to close
                </Text>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {selectedNotification && (
                <>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 25,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={getNotificationIcon(selectedNotification.type) as any}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: '700',
                          marginBottom: 4,
                        }}
                      >
                        {selectedNotification.title}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {formatFullDate(selectedNotification.timestamp)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        // Animate out before closing
                        Animated.timing(translateY, {
                          toValue: SCREEN_HEIGHT,
                          duration: 250,
                          useNativeDriver: true,
                        }).start(() => {
                          handleCloseModal();
                        });
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: isDarkColorScheme
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="close" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <View
                    style={{
                      backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {selectedNotification.message}
                    </Text>
                  </View>

                  {/* Status Info */}
                  <View
                    style={{
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.5)',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        Status
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: selectedNotification.read ? colors.textMuted : colors.primary,
                          }}
                        />
                        <Text
                          style={{
                            color: selectedNotification.read ? colors.textMuted : colors.primary,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {selectedNotification.read ? 'Read' : 'Unread'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={() => {
                      // Animate out before closing
                      Animated.timing(translateY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 200,
                        useNativeDriver: true,
                      }).start(() => {
                        deleteNotification(selectedNotification.id);
                        setModalVisible(false);
                        setSelectedNotification(null);
                        setTimeout(() => {
                          translateY.setValue(0);
                        }, 100);
                      });
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 10,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    <Text
                      style={{
                        color: colors.destructive,
                        fontSize: 13,
                        fontWeight: '600',
                        marginLeft: 6,
                      }}>
                      Delete Notification
                    </Text>
                  </TouchableOpacity>

                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => {
                      // Animate out before closing
                      Animated.timing(translateY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 250,
                        useNativeDriver: true,
                      }).start(() => {
                        handleCloseModal();
                      });
                    }}
                    style={{
                      marginTop: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}