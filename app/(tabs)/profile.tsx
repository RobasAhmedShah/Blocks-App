import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Add this import
import { useColorScheme } from "@/lib/useColorScheme";
import { profileSections } from "@/data/mockProfile";
import { useApp } from "@/contexts/AppContext";

export default function BlocksProfileScreen() {
  const router = useRouter(); // Add this hook
  const { themePreference, setThemePreference, colors, isDarkColorScheme } = useColorScheme();
  const { state } = useApp();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: 'sunny-outline' },
    { value: 'dark' as const, label: 'Dark', icon: 'moon-outline' },
    { value: 'system' as const, label: 'System Default', icon: 'phone-portrait-outline' },
  ];

  const sections = profileSections;

  const handleItemPress = (action?: string) => {
    switch (action) {
      case 'personalinfo':
        router.push('../profilesettings/personalinfo');
        break;
      case 'security':
        router.push('../profilesettings/security');
        break;
      case 'linkedbankaccounts':
        router.push('../profilesettings/linkedbank');
        break;
      case 'notifications':
        router.push('../profilesettings/notification');
        break;
      case 'theme':
        setThemeModalVisible(true);
        break;
      case 'language':
        router.push('../profilesettings/language');
        break;
      case 'helpfaq':
        router.push('../profilesettings/faqs');
        break;
      case 'contactsupport':
        router.push('../profilesettings/contactsupport');
        break;
      case 'privacypolicy':
        router.push('../profilesettings/privacypolicy');
        break;
      case 'termsofservice':
        router.push('../profilesettings/termsandcondition');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    // You might want to show a confirmation dialog before logging out
    // router.replace('/login');
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View 
        style={{ 
          borderBottomWidth: 1, 
          borderBottomColor: colors.border 
        }}
        className="flex-row items-center p-4"
      >
        <TouchableOpacity 
          className="w-12 items-start"
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Profile
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-4"
      >
        {/* Profile Header */}
        <View className="items-center py-6">
          <View className="relative">
            <Image
              source={{
                uri: state.userInfo.profileImage,
              }}
              className="h-28 w-28 rounded-full"
            />
            <TouchableOpacity
              onPress={() => router.push('../profilesettings/personalinfo')}
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
                borderColor: colors.card 
              }}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textPrimary }} className="text-[22px] font-bold mt-3">
            {state.userInfo.fullName}
          </Text>
          <Text style={{ color: colors.textMuted }} className="text-base">
            {state.userInfo.email}
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, idx) => (
          <View key={idx} className="mb-8">
            <Text style={{ color: colors.textMuted }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
              {section.title}
            </Text>
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
              className="rounded-xl shadow-sm overflow-hidden"
            >
              {section.items.map((item, i) => (
                <View key={i}>
                  <TouchableOpacity 
                    onPress={() => handleItemPress((item as any).action)}
                    style={{ 
                      backgroundColor: colors.card 
                    }}
                    className="flex-row items-center justify-between px-4 py-4"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-4">
                      <View 
                        style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)' 
                        }}
                        className="w-10 h-10 rounded-lg items-center justify-center"
                      >
                        <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                          {item.label}
                        </Text>
                        {(item as any).action === 'theme' && (
                          <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                            {themeOptions.find(opt => opt.value === themePreference)?.label}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View style={{ backgroundColor: colors.border }} className="h-px mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity 
          onPress={handleLogout}
          style={{ 
            backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.1)' : 'rgb(254, 242, 242)',
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.3)' : 'rgb(254, 226, 226)',
          }}
          className="flex-row items-center justify-center gap-2 h-12 mb-16 rounded-xl"
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <Pressable 
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Pressable 
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                width: '100%',
                maxWidth: 400,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Choose Theme
              </Text>
              
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setThemePreference(option.value);
                    setThemeModalVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    backgroundColor: themePreference === option.value 
                      ? (isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)')
                      : 'transparent',
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View 
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons 
                        name={option.icon as any} 
                        size={22} 
                        color={themePreference === option.value ? colors.primary : colors.textSecondary} 
                      />
                    </View>
                    <Text 
                      style={{ 
                        color: themePreference === option.value ? colors.primary : colors.textPrimary,
                        fontSize: 16,
                        fontWeight: themePreference === option.value ? '600' : '500',
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {themePreference === option.value && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setThemeModalVisible(false)}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 12,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      
    </SafeAreaView>
  );
}