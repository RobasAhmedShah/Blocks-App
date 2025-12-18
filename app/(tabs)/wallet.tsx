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
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWallet } from '@/services/useWallet';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';

export default function WalletScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance, transactions, loading, loadWallet, loadTransactions } = useWallet();
  const { walletUnreadCount } = useNotificationContext();
  const { isAuthenticated, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  // Refresh wallet balance and transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadWallet && loadTransactions && !isGuest && isAuthenticated) {
        loadWallet();
        loadTransactions();
      }
    }, [loadWallet, loadTransactions, isGuest, isAuthenticated])
  );

  // Show SignInGate if in guest mode (after all hooks)
  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'rental_income') {
      // Show both 'rental' and 'rental_income' when filtering by rental_income
      return tx.type === 'rental' || tx.type === 'rental_income';
    }
    return tx.type === activeTab;
  });

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
      case 'rental_income':
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
      case 'rental_income':
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
      {/* Linear Gradient Background - Same as BlocksHomeScreen */}
      <LinearGradient
        colors={isDarkColorScheme 
          ? [
            '#00C896',           // Teal green (top)
              '#064E3B',           // Deep emerald (40% mark)
              '#032822',
              '#021917',
            ]
          : [
              '#ECFDF5',           // Light green (top)
              '#D1FAE5',           // Pale green
              '#A7F3D0',           // Soft green
              '#FFFFFF',           // White (bottom)
            ]
        }
        locations={[0, 0.4, 0.7, 1]}  // 40% green, then transition to black
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

      {/* Header */}
      <View
        style={{ 
          backgroundColor: 'transparent',  // Transparent to show gradient
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        }}
        className="px-4 pb-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ color: colors.textPrimary }} className="text-sm font-medium">
            Total USDC
          </Text>
          <TouchableOpacity 
            onPress={() => {
              router.push({
                pathname: '/notifications',
                params: { context: 'wallet' },
              } as any);
            }}
            className="p-2"
            style={{ position: 'relative' }}
          >
            <MaterialIcons name="notifications-none" size={24} color={colors.textPrimary} />
            {walletUnreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: colors.destructive,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  borderWidth: 2,
                  borderColor: 'transparent',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {walletUnreadCount > 99 ? '99+' : walletUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
            ${balance.usdc.toFixed(2)}
          </Text>
          <Text style={{ color: colors.textPrimary }} className="text-sm mt-1">
            USDC
          </Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text style={{ color: colors.textPrimary }} className="text-xs mb-1">
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              ${(balance.totalInvested || 0).toFixed(2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.textPrimary }} className="text-xs mb-1">
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
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.24)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              }}
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
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              }}
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
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              }}
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
            {[
              { value: 'all', label: 'All' },
              { value: 'deposit', label: 'Deposit' },
              { value: 'withdraw', label: 'Withdraw' },
              { value: 'investment', label: 'Investment' },
              { value: 'rental_income', label: 'Rental' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setActiveTab(filter.value)}
                style={{
                  backgroundColor: activeTab === filter.value 
                    ? colors.primary 
                    : isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeTab === filter.value ? 0 : 1,
                  borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : colors.border,
                }}
                className="px-4 py-2 rounded-full"
              >
                <Text
                  style={{
                    color: activeTab === filter.value ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: activeTab === filter.value ? '600' : '400',
                  }}
                  className="text-sm"
                >
                  {filter.label}
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
          {filteredTransactions.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                No transactions found
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => (
            <View
              key={transaction.id}
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              }}
              className="flex-row items-center p-4 rounded-2xl mb-3"
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                }}
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
                      transaction.type === 'deposit' || transaction.type === 'rental' || transaction.type === 'rental_income'
                        ? colors.primary
                        : transaction.type === 'withdraw'
                        ? colors.destructive
                        : colors.textPrimary,
                  }}
                >
                  {transaction.amount >= 0 ? '+' : ''}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  {transaction.currency || 'USDC'}
                </Text>
              </View>
            </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}