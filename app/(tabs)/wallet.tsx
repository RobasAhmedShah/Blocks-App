import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWallet } from '@/services/useWallet';

export default function WalletScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance, transactions, loading } = useWallet();
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = transactions.filter((tx) =>
    activeTab === 'all' ? true : tx.type === activeTab
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'add-circle';
      case 'withdraw':
        return 'remove-circle';
      case 'investment':
        return 'trending-up';
      case 'rental':
        return 'payments';
      case 'transfer':
        return 'swap-horiz';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'rental':
        return colors.primary;
      case 'withdraw':
        return colors.destructive;
      case 'investment':
        return colors.primary;
      case 'transfer':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{ 
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.8)' : 'rgba(248, 247, 245, 0.8)',
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        }}
        className="px-4 pb-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
            Total USDC
          </Text>
          <TouchableOpacity className="p-2">
            <MaterialIcons name="more-horiz" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
            ${balance.usdc.toFixed(2)}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
            USDC
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              ${(balance.totalInvested || 0).toFixed(2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
              Total Earnings
            </Text>
            <Text style={{ color: colors.primary }} className="text-lg font-bold">
              +${(balance.totalEarnings || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('../wallet')}
              style={{ backgroundColor: colors.card }}
              className="flex-1 p-4 rounded-2xl items-center"
            >
              <View 
                style={{ backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.15)' }}
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
              >
                <MaterialIcons name="add" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Deposit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/wallet/withdraw' as any)}
              style={{ backgroundColor: colors.card }}
              className="flex-1 p-4 rounded-2xl items-center"
            >
              <View 
                style={{ backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)' }}
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
              >
                <MaterialIcons name="remove" size={28} color={colors.destructive} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Withdraw
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/wallet/transfer' as any)}
              style={{ backgroundColor: colors.card }}
              className="flex-1 p-4 rounded-2xl items-center"
            >
              <View 
                style={{ backgroundColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)' }}
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
              >
                <MaterialIcons name="swap-horiz" size={28} color={colors.warning} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Filters */}
        <View className="px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['all', 'deposit', 'withdraw', 'investment', 'rental'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveTab(filter)}
                style={{
                  backgroundColor: activeTab === filter ? colors.primary : colors.card,
                  borderWidth: activeTab === filter ? 0 : 1,
                  borderColor: colors.border,
                }}
                className="px-4 py-2 rounded-full"
              >
                <Text
                  style={{
                    color: activeTab === filter ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: activeTab === filter ? '600' : '400',
                  }}
                  className="text-sm capitalize"
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions */}
        <View className="px-4 pb-20">
          <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-3">
            Recent Transactions
          </Text>
          {filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={{ backgroundColor: colors.card }}
              className="flex-row items-center p-4 rounded-2xl mb-3"
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                
              >
                <MaterialIcons
                  name={getTransactionIcon(transaction.type)}
                  size={24}
                  color={getTransactionColor(transaction.type)}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text style={{ color: colors.textPrimary }} className="font-semibold mb-0.5">
                  {transaction.description}
                </Text>
                {transaction.propertyTitle && (
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    {transaction.propertyTitle}
                  </Text>
                )}
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className="text-lg font-bold"
                  style={{
                    color:
                      transaction.type === 'deposit' || transaction.type === 'rental'
                        ? colors.primary
                        : transaction.type === 'withdraw'
                        ? colors.destructive
                        : colors.textPrimary,
                  }}
                >
                  {transaction.type === 'deposit' || transaction.type === 'rental' ? '+' : '-'}$
                  {transaction.amount.toFixed(2)}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  {transaction.currency}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

