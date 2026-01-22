import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

export default function WithdrawSuccessScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { amount, method, iban } = useLocalSearchParams<{
    amount?: string;
    method?: string;
    iban?: string;
  }>();

  const withdrawAmount = amount ? parseFloat(amount) : 0;
  const withdrawMethod = method || 'Bank Transfer';
  const withdrawDate = new Date();
  
  const formattedDate = withdrawDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = withdrawDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

     
      
      {/* Linear Gradient Background */}
      {/* <LinearGradient
        colors={isDarkColorScheme 
          ? [
            '#00C896',
            '#064E3B',
            '#032822',
            '#021917',
            ]
          : [
              '#ECFDF5',
              '#D1FAE5',
              '#A7F3D0',
              '#FFFFFF',
            ]
        }
        locations={[0, 0.4, 0.7, 1]}
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

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: 'transparent',
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/wallet')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
         {/* Check Icon */}
         <View style={{ alignItems: 'center'}}>
          {/* <Ionicons name="checkmark" size={32} color={colors.primaryForeground} /> */}
          <LottieView
            source={require("@/assets/Checked.json")}
            autoPlay
            loop={false}
            style={{ width: 220, height: 220,marginBottom: -20 }}
          />
        </View>

        {/* Title & Description */}
        <Text style={{
          color: colors.primary,
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          lineHeight: 34,
          marginBottom: 12,
        }}>
          Withdrawal Request Submitted!
        </Text>
        <Text style={{
          color: colors.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 32,
        }}>
          Your withdrawal request has been submitted successfully. Processing may take 1-3 business days. You will be notified once the funds are transferred.
        </Text>

        {/* Info Card */}
        <View style={{
          width: '100%',
          borderRadius: 16,
          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
          borderWidth: 1.5,
          borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
          padding: 24,
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Amount</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
              ${withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Method</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
              {withdrawMethod}
            </Text>
          </View>
          {iban && iban !== 'N/A' && (
            <>
              <View style={{ height: 1, backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>IBAN</Text>
                <Text style={{ 
                  color: colors.textSecondary, 
                  fontSize: 12, 
                  fontFamily: 'monospace',
                  maxWidth: '60%',
                  textAlign: 'right',
                }}>
                  {iban}
                </Text>
              </View>
            </>
          )}
          <View style={{ height: 1, backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Date & Time</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {formattedDate}, {formattedTime}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        paddingTop: 16,
      }}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/wallet')}
          style={{
            width: '100%',
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
            View Wallet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/home')}
          style={{
            width: '100%',
            paddingVertical: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.primary,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

