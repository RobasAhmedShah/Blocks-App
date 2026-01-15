import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { depositMethods } from '@/data/mockWallet';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '@/services/useWallet';
import { AccountRestrictedScreen } from '@/components/restrictions/AccountRestrictedScreen';

export default function DepositScreen() {
  const router = useRouter();
  const { amount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance } = useWallet();

  // Check complianceStatus - only show full blocking screen if restricted
  // Under review allows navigation but blocks actions via modals
  const complianceStatus = balance?.complianceStatus;
  const isFullyRestricted = complianceStatus === 'restricted';

  if (isFullyRestricted) {
    return (
      <AccountRestrictedScreen
        title="Deposits Blocked"
        message="Your deposits have been blocked kindly contact blocks team"
        restrictionType="deposits"
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Linear Gradient Background - Same as BlocksHomeScreen & WalletScreen */}
      <LinearGradient
        colors={
          isDarkColorScheme
            ? [
                '#021917',
                '#032822',
                '#064E3B', // Deep emerald (40% mark)
                '#00C896', // Teal green (top)
              ]
            : [
                '#ECFDF5', // Light green (top)
                '#D1FAE5', // Pale green
                '#A7F3D0', // Soft green
                '#FFFFFF', // White (bottom)
              ]
        }
        locations={[0, 0.4, 0.7, 1]} // 40% green, then transition to black
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

      {/* Header - Transparent to show gradient */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: 'transparent',
        }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme
                ? 'rgba(0, 0, 0, 0.4)'
                : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Deposit Funds
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}>
        {/* Required Amount Card */}
        {amount && (
          <View
            style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: isDarkColorScheme
                ? 'rgba(0, 0, 0, 0.5)'
                : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1.5,
              borderColor: `${colors.primary}66`,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>
              Required Amount
            </Text>
            <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>
              ${amount} USDC
            </Text>
          </View>
        )}

        <Text
          style={{
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            fontSize: 15,
            lineHeight: 22,
          }}>
          Choose a deposit method to add funds to your wallet
        </Text>

        {/* Deposit Methods - Enhanced Glassmorphism Cards */}
        <View style={{ gap: 16 }}>
          {depositMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => router.push(method.route as any)}
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme
                  ? 'rgba(34, 197, 94, 0.4)'
                  : 'rgba(34, 197, 94, 0.2)',
                // shadowColor: isDarkColorScheme ? '#22C55E' : '#000000',
                // shadowOffset: { width: 0, height: 4 },
                // shadowOpacity: isDarkColorScheme ? 0.3 : 0.15,
                // shadowRadius: 8,
                // elevation: 5,
              }}
              activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Icon - No background color, just icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                  }}>
                  <MaterialIcons name={method.icon as any} size={28} color={colors.primary} />
                </View>

                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 4,
                    }}>
                    {method.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      lineHeight: 20,
                    }}>
                    {method.description}
                  </Text>
                </View>

                {/* Chevron with subtle background */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(34, 197, 94, 0.1)',
                  }}>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note - Enhanced Glass Card */}
        <View
          style={{
            marginTop: 32,
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
            borderWidth: 1.5,
            borderColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.3)',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Warning icon with background */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDarkColorScheme
                  ? 'rgba(234, 179, 8, 0.2)'
                  : 'rgba(234, 179, 8, 0.15)',
              }}>
              <MaterialIcons name="info-outline" size={22} color={colors.warning} />
            </View>
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 13,
                lineHeight: 20,
                color: colors.textSecondary,
              }}>
              Deposit times and fees may vary depending on the chosen method and network congestion.
              Please ensure you are sending assets on the correct network to avoid loss of funds.
            </Text>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}
