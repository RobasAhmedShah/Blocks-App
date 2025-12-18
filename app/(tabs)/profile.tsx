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
  Switch,
  Animated,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { profileSections } from "@/data/mockProfile";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/contexts/TourContext";
import { SignInGate } from "@/components/common/SignInGate";
import { useCopilot } from "react-native-copilot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKycCheck } from "@/hooks/useKycCheck";
import { useFocusEffect } from "expo-router";

// Custom Alert Component
interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'default' | 'success' | 'error' | 'warning';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'default',
  buttons = [],
  onClose,
}) => {
  const { colors, isDarkColorScheme } = useColorScheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'error':
        return { name: 'close-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'warning':
        return { name: 'warning', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { name: 'information-circle', color: colors.primary, bg: isDarkColorScheme ? 'rgba(0, 200, 150, 0.15)' : 'rgba(0, 200, 150, 0.1)' };
    }
  };

  const iconConfig = getIconConfig();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          opacity: opacityAnim,
        }}
      >
        <Pressable 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={onClose}
        />
        
        <Animated.View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 12,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: iconConfig.bg,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name={iconConfig.name as any} size={36} color={iconConfig.color} />
          </View>

          {/* Title */}
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {message}
          </Text>

          {/* Buttons */}
          <View style={{ gap: 10 }}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    button.onPress?.();
                    onClose();
                  }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: isDestructive
                      ? isDarkColorScheme ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'
                      : isCancel
                      ? isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                      : colors.primary,
                    borderWidth: isCancel ? 1 : 0,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isDestructive
                        ? '#EF4444'
                        : isCancel
                        ? colors.textSecondary
                        : '#FFFFFF',
                      fontSize: 16,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function BlocksProfileScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference, toggleColorScheme, colors, isDarkColorScheme } = useColorScheme();
  const { state, getBookmarkedProperties } = useApp();
  const { signOut, enableBiometrics, disableBiometrics, isBiometricSupported, isBiometricEnrolled, isAuthenticated, isGuest } = useAuth();
  const { resetAllTours, setShouldStartTour, setIsTourActive, resetTour } = useTour();
  const { kycStatus, kycLoading, loadKycStatus } = useKycCheck();
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom Alert States - MUST be declared before any early returns
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'success' | 'error' | 'warning';
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
    buttons: [],
  });

  // Load demo mode state
  useEffect(() => {
    const loadDemoMode = async () => {
      const value = await AsyncStorage.getItem('@demo_mode');
      setDemoMode(value === 'true');
    };
    loadDemoMode();
  }, []);

  // Load KYC status when screen comes into focus (refresh in background, cached data shows immediately)
  useFocusEffect(
    React.useCallback(() => {
      if (!isGuest && isAuthenticated) {
        loadKycStatus(false);
      }
    }, [loadKycStatus, isGuest, isAuthenticated])
  );

  // Show SignInGate if in guest mode (after ALL hooks are called)
  if (isGuest && !isAuthenticated) {
    return <SignInGate />;
  }

  // Save demo mode state
  const handleDemoModeToggle = async (value: boolean) => {
    setDemoMode(value);
    await AsyncStorage.setItem('@demo_mode', value ? 'true' : 'false');
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'default' | 'success' | 'error' | 'warning' = 'default',
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [{ text: 'OK', style: 'default' }]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };
  
  const bookmarkedProperties = getBookmarkedProperties();

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
      case 'paymentmethods':
        router.push('../profilesettings/paymentmethods');
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
    showAlert(
      "Log Out",
      "Are you sure you want to log out?",
      'warning',
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              // AuthContext will automatically redirect to /onboarding/signin
            } catch (error) {
              console.error('Logout error:', error);
              showAlert(
                "Error",
                "Failed to log out. Please try again.",
                'error'
              );
            }
          }
        }
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      let success = false;
      if (value) {
        // Enabling biometrics
        success = await enableBiometrics();
        // No success alert - visual feedback (toggle state) is sufficient
        if (!success) {
          showAlert(
            "Failed",
            "Could not enable biometric login. Please try again.",
            'error'
          );
        }
      } else {
        // Disabling biometrics
        success = await disableBiometrics();
        // No success alert - visual feedback (toggle state) is sufficient
        if (!success) {
          showAlert(
            "Failed",
            "Could not disable biometric login. Please try again.",
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      showAlert(
        "Error",
        "An error occurred while updating biometric settings.",
        'error'
      );
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

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
              Profile
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadKycStatus(true);
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View className="items-center py-6">
          <View className="relative">
            {state.userInfo.profileImage ? (
              <Image
                source={{ uri: state.userInfo.profileImage }}
                className="h-28 w-28 rounded-full"
                defaultSource={require('@/assets/blank.png')}
              />
            ) : (
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
                }}
                className="h-28 w-28 rounded-full items-center justify-center"
              >
                <Ionicons name="person" size={56} color={colors.primary} />
              </View>
            )}
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

        {/* KYC Status Card - shows immediately if cached, updates in background */}
        {kycStatus && (
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => router.push('../profilesettings/kyc')}
              style={{
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor:
                    kycStatus.status === 'verified'
                      ? isDarkColorScheme
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(16, 185, 129, 0.15)'
                      : kycStatus.status === 'pending'
                      ? isDarkColorScheme
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(245, 158, 11, 0.15)'
                      : kycStatus.status === 'rejected'
                      ? isDarkColorScheme
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(239, 68, 68, 0.15)'
                      : isDarkColorScheme
                      ? 'rgba(107, 114, 128, 0.2)'
                      : 'rgba(107, 114, 128, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={
                    kycStatus.status === 'verified'
                      ? 'checkmark-circle'
                      : kycStatus.status === 'pending'
                      ? 'time-outline'
                      : kycStatus.status === 'rejected'
                      ? 'close-circle'
                      : 'document-text-outline'
                  }
                  size={24}
                  color={
                    kycStatus.status === 'verified'
                      ? colors.primary
                      : kycStatus.status === 'pending'
                      ? colors.warning
                      : kycStatus.status === 'rejected'
                      ? colors.destructive
                      : colors.textMuted
                  }
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
                  KYC Verification
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                  }}
                >
                  {kycStatus.status === 'verified'
                    ? 'Your identity has been verified'
                    : kycStatus.status === 'pending'
                    ? 'Your documents are under review'
                    : kycStatus.status === 'rejected'
                    ? kycStatus.rejectionReason
                      ? `Rejected: ${kycStatus.rejectionReason}`
                      : 'Your verification was rejected'
                    : kycStatus.hasDocuments && (kycStatus.hasDocuments.front || kycStatus.hasDocuments.selfie)
                    ? 'Documents uploaded. Submit for verification to complete KYC.'
                    : 'Complete your identity verification to start investing'}
                </Text>
                {kycStatus.status === 'verified' && kycStatus.reviewedAt && (
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Verified on {new Date(kycStatus.reviewedAt).toLocaleDateString()}
                  </Text>
                )}
                {kycStatus.status === 'pending' && kycStatus.submittedAt && (
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Submitted on {new Date(kycStatus.submittedAt).toLocaleDateString()}
                  </Text>
                )}
                {kycStatus.status === 'not_submitted' && kycStatus.hasDocuments && (kycStatus.hasDocuments.front || kycStatus.hasDocuments.selfie) && (
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Tap to submit your documents
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* My Bookmarks Section */}
        {bookmarkedProperties.length > 0 && (
          <View className="mb-8">
            <Text style={{ color: colors.textMuted }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
              My Bookmarks
            </Text>
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
              className="rounded-xl shadow-sm overflow-hidden"
            >
              {bookmarkedProperties.map((property, idx) => (
                <TouchableOpacity
                  key={property.id}
                  onPress={() => router.push(`/property/${property.id}`)}
                  style={{ backgroundColor: colors.card }}
                  className="flex-row items-center justify-between px-4 py-4"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-4 flex-1">
                    <View 
                      style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)' 
                      }}
                      className="w-10 h-10 rounded-lg items-center justify-center"
                    >
                      <Ionicons name="bookmark" size={22} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                        {property.title}
                      </Text>
                      <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                        {property.location}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
                    <Ionicons 
                    style={{ marginLeft: -20}}
                    name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View style={{ backgroundColor: colors.border }} className="h-px mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Biometric Login Toggle */}
        {isBiometricSupported && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
            className="rounded-xl shadow-sm overflow-hidden"
          >
            <View
              style={{
                backgroundColor: colors.card,
              }}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(22, 163, 74, 0.15)'
                      : 'rgba(22, 163, 74, 0.1)',
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                >
                  <Ionicons name="finger-print" size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="text-base font-medium"
                  >
                    Biometric Login
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="text-xs mt-0.5"
                  >
                    {isBiometricEnrolled
                      ? 'Face ID / Touch ID enabled'
                      : 'Use Face ID or Touch ID to sign in'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isBiometricEnrolled}
                onValueChange={handleBiometricToggle}
                trackColor={{
                  false: isDarkColorScheme ? '#374151' : '#d1d5db',
                  true: colors.primary,
                }}
                thumbColor="#ffffff"
                ios_backgroundColor={isDarkColorScheme ? '#374151' : '#d1d5db'}
              />
            </View>
          </View>
        )}

        {/* App Settings Section */}
        <View className="mb-8">
          <Text style={{ color: colors.textMuted }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
            App Settings
          </Text>
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl shadow-sm overflow-hidden"
          >
            {/* Demo Mode Toggle */}
          {/*  <View
              style={{
                backgroundColor: colors.card,
              }}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(22, 163, 74, 0.15)'
                      : 'rgba(22, 163, 74, 0.1)',
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                >
                  <Ionicons 
                    name="play-circle" 
                    size={22} 
                    color={colors.primary} 
                  />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="text-base font-medium"
                  >
                    Demo Mode
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="text-xs mt-0.5"
                  >
                    {demoMode ? 'Interactive tutorial enabled' : 'Enable app tour guidance'}
                  </Text>
                </View>
              </View>
              <Switch
                value={demoMode}
                onValueChange={handleDemoModeToggle}
                trackColor={{
                  false: isDarkColorScheme ? '#374151' : '#d1d5db',
                  true: colors.primary,
                }}
                thumbColor="#ffffff"
                ios_backgroundColor={isDarkColorScheme ? '#374151' : '#d1d5db'}
              />
            </View>
            */}
            
            <View style={{ backgroundColor: colors.border }} className="h-px mx-4" />
            
            {/* Replay App Tutorial Button */}
            <TouchableOpacity
              onPress={async () => {
                if (!demoMode) {
                  showAlert(
                    'Demo Mode Required',
                    'Please enable Demo Mode first to use the app tutorial.',
                    'warning',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                
                console.log('[Profile] Replay tutorial button pressed');
                
                // Step 1: Reset tour state
                await resetTour('home'); // Clear home tour completion
                setIsTourActive(false); // Ensure tour is not marked as active
                console.log('[Profile] Tour state reset');
                
                // Step 2: Set flag to start tour
                setShouldStartTour(true);
                console.log('[Profile] Set shouldStartTour to true');
                
                // Step 3: Navigate to home screen
                router.push('/(tabs)/home' as any); // Navigate to home tab
                console.log('[Profile] Navigated to home, tour should start');
              }}
              disabled={!demoMode}
              style={{ 
                backgroundColor: colors.card,
                opacity: demoMode ? 1 : 0.5,
              }}
              className="flex-row items-center justify-between px-4 py-4"
              activeOpacity={demoMode ? 0.7 : 1}
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(22, 163, 74, 0.15)'
                      : 'rgba(22, 163, 74, 0.1)',
                  }}
                  className="w-10 h-10 rounded-lg items-center justify-center"
                >
                  <Ionicons name="play-circle-outline" size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="text-base font-medium"
                  >
                    Replay App Tutorial
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="text-xs mt-0.5"
                  >
                    Restart the interactive app tour
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

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