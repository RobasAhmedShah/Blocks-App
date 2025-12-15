import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/lib/useColorScheme';

export default function KycApprovedScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <View className="w-12" />
        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          KYC Verification
        </Text>
        <View className="w-12" />
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* Success Icon */}
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: isDarkColorScheme 
              ? 'rgba(16, 185, 129, 0.2)' 
              : 'rgba(16, 185, 129, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>

        {/* Success Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          KYC Approved
        </Text>

        {/* Success Message */}
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 48,
            paddingHorizontal: 16,
          }}
        >
          Congratulations! Your KYC verification has been successfully approved. You can now access all features of the app.
        </Text>

        {/* Back to Home Button */}
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.8}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={['#0da5a5', '#0a8a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
              Back to Home
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}






