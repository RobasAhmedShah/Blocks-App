import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { notificationSections } from "@/data/mockProfile";
import { NotificationSettings } from "@/types/profilesettings";
import { useApp } from "@/contexts/AppContext";
import { useNotifications } from "@/services/useNotifications";
import * as Notifications from "expo-notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, updateNotificationSettings } = useApp();
  const {
    permissionStatus,
    requestPermissions,
    checkPermissions,
    scheduleDoNotDisturb,
    sendTestNotification,
    isInDoNotDisturbWindow,
  } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>(state.notificationSettings);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Sync with context when it changes
  useEffect(() => {
    setSettings(state.notificationSettings);
  }, [state.notificationSettings]);

  // Check Do Not Disturb status
  useEffect(() => {
    checkDndStatus();
  }, []);

  const checkDndStatus = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const hasDnd = scheduled.some(n => n.identifier.startsWith('dnd-'));
      setDndEnabled(hasDnd);
    } catch (error) {
      console.error('Error checking DND status:', error);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    // Security alerts cannot be disabled
    if (key === 'securityAlerts') {
      Alert.alert(
        'Required Setting',
        'Security alerts cannot be disabled for your safety.'
      );
      return;
    }

    // If enabling push notifications, check permissions first
    if (key === 'pushNotifications' && !settings.pushNotifications) {
      const hasPermission = await checkPermissions();
      if (!hasPermission.granted && hasPermission.ios?.status !== Notifications.IosAuthorizationStatus.AUTHORIZED) {
        setIsRequestingPermission(true);
        try {
          const newPermissions = await requestPermissions();
          if (!newPermissions.granted && newPermissions.ios?.status !== Notifications.IosAuthorizationStatus.AUTHORIZED) {
            Alert.alert(
              'Permissions Required',
              'Please enable notification permissions in your device settings to receive push notifications.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => {
                  if (Platform.OS === 'ios') {
                    // iOS will open settings automatically
                  }
                }},
              ]
            );
            setIsRequestingPermission(false);
            return;
          }
        } catch (error) {
          console.error('Error requesting permissions:', error);
          Alert.alert('Error', 'Failed to request notification permissions');
          setIsRequestingPermission(false);
          return;
        } finally {
          setIsRequestingPermission(false);
        }
      }
    }

    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    await updateNotificationSettings({ [key]: newValue });

    // If disabling push notifications, also disable Do Not Disturb
    if (key === 'pushNotifications' && !newValue) {
      await scheduleDoNotDisturb(false);
      setDndEnabled(false);
    }
  };

  const handleDndToggle = async () => {
    if (!settings.pushNotifications) {
      Alert.alert(
        'Push Notifications Required',
        'Please enable push notifications first to use Do Not Disturb.'
      );
      return;
    }

    const newDndValue = !dndEnabled;
    setDndEnabled(newDndValue);
    await scheduleDoNotDisturb(newDndValue);
    
    Alert.alert(
      newDndValue ? 'Do Not Disturb Enabled' : 'Do Not Disturb Disabled',
      newDndValue
        ? 'Notifications will be silenced from 10:00 PM to 8:00 AM. Security alerts will still be shown.'
        : 'All notifications will now be shown according to your preferences.'
    );
  };

  const sections = notificationSections;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

     {/* Header */}
     <View
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Notifications
            </Text>
          </View>
          <View className="w-10" />
        </View>

       
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex flex-col gap-8 py-6">
          
          {sections.map((section, sectionIdx) => (
            <View key={sectionIdx} className="flex flex-col gap-2">
              {/* Section Header */}
              <View className="px-2 mb-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                  {section.title}
                </Text>
                {section.description && (
                  <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                    {section.description}
                  </Text>
                )}
              </View>
              
              {/* Section Items */}
              <View 
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: isDarkColorScheme ? 0 : 1,
                  borderColor: colors.border 
                }}
                className="overflow-hidden rounded-xl"
              >
                {section.items.map((item, itemIdx) => (
                  <View key={item.key}>
                    <View className="flex-row items-center justify-between px-4 py-4">
                      <View className="flex-row items-center gap-4 flex-1 pr-4">
                        <View 
                          style={{ 
                            backgroundColor: isDarkColorScheme 
                              ? 'rgba(13, 165, 165, 0.15)' 
                              : 'rgba(13, 165, 165, 0.1)' 
                          }}
                          className="w-10 h-10 items-center justify-center rounded-lg"
                        >
                          <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                              {item.label}
                            </Text>
                            {item.recommended && (
                              <View 
                                style={{ 
                                  backgroundColor: isDarkColorScheme 
                                    ? 'rgba(239, 68, 68, 0.15)' 
                                    : 'rgba(239, 68, 68, 0.1)' 
                                }}
                                className="px-2 py-0.5 rounded"
                              >
                                <Text className="text-red-500 text-xs font-bold">
                                  REQUIRED
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                            {item.description}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={settings[item.key]}
                        onValueChange={() => handleToggle(item.key)}
                        trackColor={{ false: "#3e4e4e", true: colors.primary }}
                        thumbColor="#ffffff"
                        ios_backgroundColor="#3e4e4e"
                        disabled={item.recommended || isRequestingPermission}
                      />
                    </View>
                    {itemIdx < section.items.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Notification Schedule */}
          <View className="flex flex-col gap-2">
            <View className="px-2 mb-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-bold uppercase tracking-wider">
                Notification Schedule
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                Control when you receive notifications
              </Text>
            </View>
            
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl"
            >
              <View className="flex-row items-center justify-between px-4 py-4">
                <View className="flex-row items-center gap-4 flex-1">
                  <View 
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(13, 165, 165, 0.15)' 
                        : 'rgba(13, 165, 165, 0.1)' 
                    }}
                    className="w-10 h-10 items-center justify-center rounded-lg"
                  >
                    <Ionicons name="moon" size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                      Do Not Disturb
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                      {dndEnabled 
                        ? `Active: 10:00 PM - 8:00 AM${isInDoNotDisturbWindow() ? ' (Now Active)' : ''}`
                        : '10:00 PM - 8:00 AM'
                      }
                    </Text>
                  </View>
                </View>
                <Switch
                  value={dndEnabled}
                  onValueChange={handleDndToggle}
                  trackColor={{ false: "#3e4e4e", true: colors.primary }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#3e4e4e"
                  disabled={!settings.pushNotifications}
                />
              </View>
            </View>
          </View>

          {/* Permission Status */}
          {permissionStatus && (
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme 
                  ? (permissionStatus.granted ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                  : (permissionStatus.granted ? 'rgba(22, 163, 74, 0.05)' : 'rgba(239, 68, 68, 0.05)'),
                borderWidth: 1,
                borderColor: isDarkColorScheme 
                  ? (permissionStatus.granted ? 'rgba(22, 163, 74, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                  : (permissionStatus.granted ? 'rgba(22, 163, 74, 0.2)' : 'rgba(239, 68, 68, 0.2)')
              }}
              className="rounded-xl p-4 mb-4"
            >
              <View className="flex-row items-start gap-3">
                <View 
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? (permissionStatus.granted ? 'rgba(22, 163, 74, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                      : (permissionStatus.granted ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)')
                  }}
                  className="w-10 h-10 items-center justify-center rounded-full"
                >
                  <Ionicons 
                    name={permissionStatus.granted ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color={permissionStatus.granted ? "#16a34a" : "#ef4444"} 
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                    Notification Permissions
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed mb-2">
                    {permissionStatus.granted 
                      ? 'Notifications are enabled. You will receive alerts according to your preferences.'
                      : 'Notifications are disabled. Enable permissions to receive push notifications.'
                    }
                  </Text>
                  {!permissionStatus.granted && (
                    <TouchableOpacity
                      onPress={async () => {
                        setIsRequestingPermission(true);
                        await requestPermissions();
                        await checkPermissions();
                        setIsRequestingPermission(false);
                      }}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                        Enable Permissions
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Test Notification Button */}
          {permissionStatus?.granted && (
            <TouchableOpacity
              onPress={sendTestNotification}
              style={{
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
                padding: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Send Test Notification
              </Text>
            </TouchableOpacity>
          )}

          {/* Info Section */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.3)' 
                : 'rgba(13, 165, 165, 0.2)'
            }}
            className="rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-start gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-10 h-10 items-center justify-center rounded-full"
              >
                <Ionicons name="information-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  About Notifications
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  You can customize which notifications you receive. Security alerts are recommended and cannot be disabled for your safety. Do Not Disturb silences notifications from 10:00 PM to 8:00 AM, but security alerts will still be shown.
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}