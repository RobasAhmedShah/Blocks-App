import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { notificationSections } from "@/data/mockProfile";
import { NotificationSettings } from "@/types/profilesettings";
import { useApp } from "@/contexts/AppContext";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, updateNotificationSettings } = useApp();
  const [settings, setSettings] = useState<NotificationSettings>(state.notificationSettings);

  // Sync with context when it changes
  React.useEffect(() => {
    setSettings(state.notificationSettings);
  }, [state.notificationSettings]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    await updateNotificationSettings({ [key]: newValue });
  };

  const sections = notificationSections;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Notifications
        </Text>

        <View className="w-12" />
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
                        disabled={item.recommended}
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
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                activeOpacity={0.7}
              >
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
                      10:00 PM - 8:00 AM
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

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
                  You can customize which notifications you receive. Security alerts are recommended and cannot be disabled for your safety.
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}