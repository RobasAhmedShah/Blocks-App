import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { depositMethods } from '@/data/mockWallet';

export default function DepositScreen() {
  const router = useRouter();
  const { amount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: isDarkColorScheme ? `${colors.background}CC` : `${colors.background}CC`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme ? `${colors.card}99` : colors.muted,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Deposit Funds
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {amount && (
          <View style={{
            padding: 16,
            borderRadius: 16,
            marginBottom: 24,
            backgroundColor: `${colors.primary}1A`,
            borderWidth: 1,
            borderColor: `${colors.primary}33`,
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>
              Required Amount
            </Text>
            <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>
              ${amount} USDC
            </Text>
          </View>
        )}

        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          Choose a deposit method to add funds to your wallet
        </Text>

        {/* Deposit Methods */}
        <View style={{ gap: 16 }}>
          {depositMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => router.push(method.route as any)}
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.card,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 9999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${method.color}20`,
                  }}
                >
                  <MaterialIcons name={method.icon as any} size={24} color={method.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    {method.title}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {method.description}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 16,
          backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <MaterialIcons name="info-outline" size={20} color={colors.textMuted} />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 12,
              lineHeight: 18,
              color: colors.textSecondary,
            }}>
              Deposit times and fees may vary depending on the chosen method and network congestion. Please ensure you are sending assets on the correct network to avoid loss of funds.
            </Text>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>
    </View>
  );
}

