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
import { SecuritySettings } from "@/types/profilesettings";
import { useApp } from "@/contexts/AppContext";

export default function SecurityScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, updateSecuritySettings } = useApp();
  const [settings, setSettings] = useState<SecuritySettings>(state.securitySettings);

  // Sync with context when it changes
  React.useEffect(() => {
    setSettings(state.securitySettings);
  }, [state.securitySettings]);

  const handleToggleTwoFactor = async (value: boolean) => {
    const newSettings = { ...settings, twoFactorAuth: value };
    setSettings(newSettings);
    await updateSecuritySettings({ twoFactorAuth: value });
  };

  const handleToggleBiometric = async (value: boolean) => {
    const newSettings = { ...settings, biometricLogin: value };
    setSettings(newSettings);
    await updateSecuritySettings({ biometricLogin: value });
  };

  const handleChangePassword = () => {
    console.log("Navigate to Change Password");
    // router.push("/profile/change-password");
  };

  const handleActiveSessions = () => {
    console.log("Navigate to Active Sessions");
    // router.push("/profile/active-sessions");
  };

  const handleViewActivityLog = () => {
    console.log("Navigate to Activity Log");
    // router.push("/profile/activity-log");
  };

  const handleLogoutAllDevices = () => {
    console.log("Logout from all devices");
    // Show confirmation dialog
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Security
        </Text>

        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex flex-col gap-8 py-6">
          
          {/* Authentication Section */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Authentication
            </Text>
            
            <View
            style={{ backgroundColor: colors.card, borderWidth: isDarkColorScheme ? 0 : 1, borderColor: colors.border }}
             className="overflow-hidden rounded-xl bg-gray-500/10">
              {/* Change Password */}
              <TouchableOpacity
                onPress={handleChangePassword}
                className="flex-row items-center justify-between px-4 py-4 min-h-[56px]"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 items-center justify-center rounded-lg bg-[#0da5a5]/20">
                    <Ionicons name="lock-closed" size={22} color="#0da5a5" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-white">
                    Change Password
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />

              {/* Two-Factor Authentication */}
              <View className="flex-row items-center justify-between px-4 py-4 min-h-[56px]">
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 items-center justify-center rounded-lg bg-[#0da5a5]/20">
                    <Ionicons name="shield-checkmark" size={22} color="#0da5a5" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-white">
                    Two-Factor Authentication
                  </Text>
                </View>
                <Switch
                  value={settings.twoFactorAuth}
                  onValueChange={handleToggleTwoFactor}
                  trackColor={{ false: "#3e4e4e", true: "#0da5a5" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#3e4e4e"
                />
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />

              {/* Biometric Login */}
              <View className="flex-row items-center justify-between px-4 py-4 min-h-[56px]">
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 items-center justify-center rounded-lg bg-[#0da5a5]/20">
                    <Ionicons name="finger-print" size={22} color="#0da5a5" />
                  </View>
                  <Text className="flex-1 text-base font-medium text-white">
                    Biometric Login
                  </Text>
                </View>
                <Switch
                  value={settings.biometricLogin}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: "#3e4e4e", true: "#0da5a5" }}
                  thumbColor="#ffffff"
                  ios_backgroundColor="#3e4e4e"
                />
              </View>
            </View>
          </View>

          {/* Session Management Section */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Session Management
            </Text>
            
            <View style={{ backgroundColor: colors.card, borderWidth: isDarkColorScheme ? 0 : 1, borderColor: colors.border }} className="overflow-hidden rounded-xl">
              {/* Active Sessions */}
              <TouchableOpacity
                onPress={handleActiveSessions}
                style={{ backgroundColor: colors.card, borderWidth: isDarkColorScheme ? 0 : 1, borderColor: colors.border }}
                className="flex-row items-center justify-between px-4 py-4"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 items-center justify-center rounded-lg bg-[#0da5a5]/20">
                    <Ionicons name="phone-portrait" size={22} color="#0da5a5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-white">
                      Active Sessions
                    </Text>
                    <Text className="text-sm text-[#0da5a5]/70 mt-1">
                      iPhone 14 Pro, MacOS Sonoma
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />

              {/* Log out of all devices */}
              <TouchableOpacity
                onPress={handleLogoutAllDevices}
                className="flex-row items-center justify-center px-4 py-4 min-h-[56px]"
                activeOpacity={0.7}
              >
                <Text className="text-base font-medium text-red-500">
                  Log out of all devices
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* Activity Section */}
          <View className="flex flex-col gap-2">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider">
              Activity
            </Text>
            
            <View style={{ backgroundColor: colors.card, borderWidth: isDarkColorScheme ? 0 : 1, borderColor: colors.border }} className="overflow-hidden rounded-xl">
              {/* View Activity Log */}
              <TouchableOpacity
                onPress={handleViewActivityLog}
                className="flex-row items-center justify-between px-4 py-4"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-4 flex-1">
                  <View className="w-10 h-10 items-center justify-center rounded-lg bg-[#0da5a5]/20">
                    <Ionicons name="time" size={22} color="#0da5a5" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-white">
                      View Activity Log
                    </Text>
                    <Text className="text-sm text-[#0da5a5]/70 mt-1">
                      Last activity: Today, 10:32 AM
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}