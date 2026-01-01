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
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';
import { Svg, Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { GlassChip } from "@/components/GlassChip";

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

// Glass Card Component
const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <BlurView intensity={10} tint="dark" style={[{ backgroundColor: 'rgba(22, 22, 22, 0.56)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }, style]}>
    {children}
  </BlurView>
);

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
    <SafeAreaView style={{ flex: 1, backgroundColor:'#020D0B' }}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

      {/* Base Linear Gradient */}
      {/* <LinearGradient
        colors={['#0B1A18', '#020D0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      /> */}
      
      {/* Radial Gradient Overlay */}
      <View style={{ position: 'absolute', top: '0%', left: 0, right: 0,
         bottom: 0}}>
        <Svg width="100%" height="50%" >
          <Defs>
            <RadialGradient id="backgroundRadial" cx="65%" cy="20%" r="80%">
              <Stop offset="50%" stopColor="rgb(226, 223, 34)" stopOpacity="0.22" />
              <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#backgroundRadial)" />
        </Svg>
      </View>

      {/* Header */}
      <View
        style={{ backgroundColor: 'transparent' }}
        className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back-outline" size={24} color="rgba(180,210,205,0.55)" />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: 'rgba(255,255,255,0.92)' }} className="text-lg font-bold">
              Profile
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
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
        {/* Profile Header - Glass Header with Radial Glow */}
        <View className="items-center py-6" style={{ backgroundColor: 'transparent' }}>
          <View className="relative" style={{ marginBottom: 12 }}>
            {/* Radial Glow Behind Avatar */}
            {/* <View style={{ position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, alignItems: 'center', justifyContent: 'center'
             }}>
              <Svg width={120} height={120}>
                <Defs>
                  <RadialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="rgba(31,182,178,0.25)" stopOpacity="1" />
                    <Stop offset="100%" stopColor="rgba(31,182,178,0)" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="60" cy="60" r="60" fill="url(#avatarGlow)" />
              </Svg>
            </View> */}
            
            {state.userInfo.profileImage ? (
              <Image
                source={{ uri: state.userInfo.profileImage }}
                style={{ 
                  width: 112, 
                  height: 112, 
                  borderRadius: 56,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
                defaultSource={require('@/assets/blank.png')}
              />
            ) : (
              <View 
                style={{ 
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  backgroundColor: 'rgba(20,45,43,0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person-outline" size={56} color="rgba(180,210,205,0.55)" />
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push('../profilesettings/personalinfo')}
              style={{ 
                backgroundColor: 'rgba(20,45,43,0.85)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                bottom: 0,
                right: 0,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="rgba(180,210,205,0.55)" />
            </TouchableOpacity>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '600', marginTop: 8 }}>
            {state.userInfo.fullName}
          </Text>
          <Text style={{ color: 'rgba(180,210,205,0.55)', fontSize: 13, marginTop: 4 }}>
            {state.userInfo.email}
          </Text>
        </View>

        {/* KYC Status Card - Glass Effect */}
        {kycStatus && (
          <View
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
              marginBottom: 16,
            }}
          >
            <BlurView
            className="px-4 py-2"
              intensity={28}
              tint="dark"
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 18,
               
              }}
            >
              {/* Subtle top highlight */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                }}
              />
              
              <TouchableOpacity
                onPress={() => router.push('../profilesettings/kyc')}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* Icon container */}
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(20,45,43,0.6)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={
                      kycStatus.status === 'verified'
                        ? 'checkmark-circle-outline'
                        : kycStatus.status === 'pending'
                        ? 'time-outline'
                        : kycStatus.status === 'rejected'
                        ? 'close-circle-outline'
                        : 'document-text-outline'
                    }
                    size={24}
                    color="rgba(180,210,205,0.55)"
                  />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.92)',
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}
                  >
                    KYC Verification
                  </Text>

                  <Text
                    style={{
                      color: 'rgba(180,210,205,0.65)',
                      fontSize: 13,
                      lineHeight: 18,
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
                      : kycStatus.hasDocuments &&
                        (kycStatus.hasDocuments.front || kycStatus.hasDocuments.selfie)
                      ? 'Documents uploaded. Submit to complete verification.'
                      : 'Complete identity verification to start investing'}
                  </Text>

                  {/* Meta date */}
                  {(kycStatus.reviewedAt || kycStatus.submittedAt) && (
                    <Text
                      style={{
                        color: 'rgba(180,210,205,0.45)',
                        fontSize: 11,
                        marginTop: 6,
                      }}
                    >
                      {kycStatus.status === 'verified' && kycStatus.reviewedAt
                        ? `Verified on ${new Date(kycStatus.reviewedAt).toLocaleDateString()}`
                        : kycStatus.status === 'pending' && kycStatus.submittedAt
                        ? `Submitted on ${new Date(kycStatus.submittedAt).toLocaleDateString()}`
                        : null}
                    </Text>
                  )}
                </View>

                {/* Chevron */}
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color="rgba(180,210,205,0.55)"
                />
              </TouchableOpacity>
            </BlurView>
          </View>
        )}


        {/* My Bookmarks Section */}
        {bookmarkedProperties.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(180,210,205,0.55)' }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
              My Bookmarks
            </Text>
            <View 
              style={{ 
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <BlurView
                intensity={28}
                tint="dark"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderRadius: 18,
                }}
              >
                {/* Subtle top highlight */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  }}
                />
                
                {bookmarkedProperties.map((property, idx) => (
                  <TouchableOpacity
                    key={property.id}
                    onPress={() => router.push(`/property/${property.id}`)}
                    style={{ 
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between p-1">
                      <View className="flex-row items-center gap-4 flex-1">
                        <View 
                          style={{ 
                            backgroundColor: 'rgba(20,45,43,0.6)',
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.18)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="bookmark-outline" size={22} color="rgba(180,210,205,0.55)" />
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '500' }}>
                            {property.title}
                          </Text>
                          <Text style={{ color: 'rgba(180,210,205,0.55)', fontSize: 13, marginTop: 2 }}>
                            {property.location}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={18} color="rgba(180,210,205,0.55)" />
                    </View>
                    {idx < bookmarkedProperties.length - 1 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', height: 1, marginTop: 14 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </BlurView>
            </View>
          </View>
        )}

        {/* Sections */}
        {sections.map((section, idx) => (
          <View key={idx} style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(180,210,205,0.55)' }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
              {section.title}
            </Text>
            
            <View 
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <BlurView
                intensity={28}
                tint="dark"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderRadius: 18,
                }}
              >
                {/* Subtle top highlight */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  }}
                />
                
                {section.items.map((item, i) => (
                  <View key={i}>
                    <TouchableOpacity 
                      onPress={() => handleItemPress((item as any).action)}
                      style={{ 
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1">
                          <View 
                            style={{ 
                              backgroundColor: 'rgba(20,45,43,0.6)',
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.18)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name={item.icon as any} size={22} color="rgba(180,210,205,0.55)" />
                          </View>
                          <View className="flex-1">
                            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '500' }}>
                              {item.label}
                            </Text>
                            {(item as any).action === 'theme' && (
                              <Text style={{ color: 'rgba(180,210,205,0.55)', fontSize: 13, marginTop: 2 }}>
                                {themeOptions.find(opt => opt.value === themePreference)?.label}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={18} color="rgba(180,210,205,0.55)" />
                      </View>
                    </TouchableOpacity>
                    {i < section.items.length - 1 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', height: 1, marginHorizontal: 16 }} />
                    )}
                  </View>
                ))}
              </BlurView>
            </View>
          </View>
        ))}


        {/* App Settings Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'rgba(180,210,205,0.55)' }} className="px-2 text-sm font-bold uppercase tracking-wider mb-2">
            App Settings
          </Text>
          <View 
            style={{ 
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <BlurView
              intensity={28}
              tint="dark"
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 18,
              }}
            >
              {/* Subtle top highlight */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                }}
              />
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
            
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', height: 1, marginHorizontal: 16 }} />
              
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
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  opacity: demoMode ? 1 : 0.5,
                }}
                activeOpacity={demoMode ? 0.7 : 1}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4 flex-1">
                    <View
                      style={{
                        backgroundColor: 'rgba(20,45,43,0.6)',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.18)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="play-circle-outline" size={22} color="rgba(180,210,205,0.55)" />
                    </View>
                    <View className="flex-1">
                      <Text
                        style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '500' }}
                      >
                        Replay App Tutorial
                      </Text>
                      <Text
                        style={{ color: 'rgba(180,210,205,0.55)', fontSize: 13, marginTop: 2 }}
                      >
                        Restart the interactive app tour
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color="rgba(180,210,205,0.55)" />
                </View>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>

        {/* Logout */}
        <View
          style={{
            borderRadius: 18,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
            marginBottom: 40,
          }}
        >
          <BlurView
            intensity={28}
            tint="dark"
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: 18,
              paddingVertical: 14,
            }}
          >
            {/* Subtle top highlight */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.35)',
              }}
            />
            
            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center justify-center gap-2"
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color="rgba(180,210,205,0.55)" />
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '500' }}>Log Out</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
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