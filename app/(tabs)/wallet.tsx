import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { mockWalletBalance, mockTransactions } from '@/data/mockProperties';

export default function WalletScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('all');

  const filteredTransactions = mockTransactions.filter((tx) =>
    activeTab === 'all' ? true : tx.type === activeTab
  );

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
        return '#10B981';
      case 'withdraw':
        return '#EF4444';
      case 'investment':
        return '#0fa0bd';
      case 'transfer':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className={`px-4 pt-12 pb-6 ${isDark ? 'bg-blocks-bg-dark/80' : 'bg-blocks-bg-light/80'}`}
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text className={`text-sm font-medium ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
            Total USDC
          </Text>
          <TouchableOpacity className="p-2">
            <MaterialIcons name="more-horiz" size={24} color={isDark ? '#E0E0E0' : '#1F2937'} />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className={`text-4xl font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            ${mockWalletBalance.usdc.toFixed(2)}
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
            USDC
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className={`text-xs mb-1 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              Total Invested
            </Text>
            <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
              ${mockWalletBalance.totalInvested.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xs mb-1 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              Total Earnings
            </Text>
            <Text className="text-lg font-bold text-green-500">
              +${mockWalletBalance.totalEarnings.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <Text className={`text-base font-bold mb-4 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('../wallet')}
              className={`flex-1 p-4 rounded-2xl items-center ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
            >
              <View className="w-12 h-12 rounded-full bg-teal/20 items-center justify-center mb-2">
                <MaterialIcons name="add" size={28} color="#0fa0bd" />
              </View>
              <Text className={`text-sm font-semibold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Deposit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/wallet/withdraw')}
              className={`flex-1 p-4 rounded-2xl items-center ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
            >
              <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-2">
                <MaterialIcons name="remove" size={28} color="#EF4444" />
              </View>
              <Text className={`text-sm font-semibold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Withdraw
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/wallet/transfer')}
              className={`flex-1 p-4 rounded-2xl items-center ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
            >
              <View className="w-12 h-12 rounded-full bg-orange-500/20 items-center justify-center mb-2">
                <MaterialIcons name="swap-horiz" size={28} color="#F59E0B" />
              </View>
              <Text className={`text-sm font-semibold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
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
                className={`px-4 py-2 rounded-full ${
                  activeTab === filter
                    ? 'bg-teal'
                    : isDark
                    ? 'bg-blocks-card-dark'
                    : 'bg-white'
                }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${
                    activeTab === filter
                      ? 'text-white'
                      : isDark
                      ? 'text-blocks-text-dark'
                      : 'text-blocks-text-light'
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions */}
        <View className="px-4 pb-20">
          <Text className={`text-base font-bold mb-3 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Recent Transactions
          </Text>
          {filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              className={`flex-row items-center p-4 rounded-2xl mb-3 ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: `${getTransactionColor(transaction.type)}20` }}
              >
                <MaterialIcons
                  name={getTransactionIcon(transaction.type)}
                  size={24}
                  color={getTransactionColor(transaction.type)}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text className={`font-semibold mb-0.5 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                  {transaction.description}
                </Text>
                {transaction.propertyTitle && (
                  <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    {transaction.propertyTitle}
                  </Text>
                )}
                <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className="text-lg font-bold"
                  style={{
                    color:
                      transaction.type === 'deposit' || transaction.type === 'rental'
                        ? '#10B981'
                        : transaction.type === 'withdraw'
                        ? '#EF4444'
                        : isDark
                        ? '#E0E0E0'
                        : '#1F2937',
                  }}
                >
                  {transaction.type === 'deposit' || transaction.type === 'rental' ? '+' : '-'}$
                  {transaction.amount.toFixed(2)}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
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

