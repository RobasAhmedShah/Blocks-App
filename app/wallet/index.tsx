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

export default function DepositScreen() {
  const router = useRouter();
  const { amount } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const depositMethods = [
    {
      id: 'card',
      title: 'Debit/Credit Card',
      description: 'Instantly add funds from your card',
      icon: 'credit-card',
      color: '#0fa0bd',
      route: '/wallet/deposit/card',
    },
    {
      id: 'onchain',
      title: 'On-Chain Transfer',
      description: 'Deposit crypto from another wallet',
      icon: 'account-balance-wallet',
      color: '#0fa0bd',
      route: '/wallet/deposit/onchain',
    },
    {
      id: 'binance',
      title: 'Binance Pay',
      description: 'Fast and convenient payment',
      icon: 'paid',
      color: '#F0B90B',
      route: '/wallet/deposit/binance',
    },
  ];

  return (
    <View className={`flex-1 ${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className={`px-4 pt-12 pb-4 ${isDark ? 'bg-blocks-bg-dark/80' : 'bg-blocks-bg-light/80'}`}
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between ">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center  ${
              isDark ? 'bg-blocks-card-dark/60' : 'bg-gray-200'
            }`}
          >
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#E0E0E0' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Deposit Funds
          </Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {amount && (
          <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-teal/10 border border-teal/20' : 'bg-teal/10'}`}>
            <Text className={`text-sm mb-1 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              Required Amount
            </Text>
            <Text className="text-2xl font-bold text-teal">${amount} USDC</Text>
          </View>
        )}

        <Text className={`text-center mb-6 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
          Choose a deposit method to add funds to your wallet
        </Text>

        {/* Deposit Methods */}
        <View className="gap-4">
          {depositMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => router.push(method.route as any)}
              className={`p-4 rounded-2xl shadow-sm ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${method.color}20` }}
                >
                  <MaterialIcons name={method.icon as any} size={24} color={method.color} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className={`text-base font-bold mb-1 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                    {method.title}
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    {method.description}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={isDark ? '#A9A9A9' : '#6B7280'}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View className={`mt-8 p-4 rounded-2xl ${isDark ? 'bg-blocks-card-dark/40' : 'bg-gray-100'}`}>
          <View className="flex-row items-start">
            <MaterialIcons name="info-outline" size={20} color={isDark ? '#A9A9A9' : '#6B7280'} />
            <Text className={`flex-1 ml-3 text-xs leading-relaxed ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              Deposit times and fees may vary depending on the chosen method and network congestion. Please ensure you are sending assets on the correct network to avoid loss of funds.
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>
    </View>
  );
}

