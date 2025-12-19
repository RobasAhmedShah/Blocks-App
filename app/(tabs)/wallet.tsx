import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
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
  // if (isGuest || !isAuthenticated) {
  //   return <SignInGate />;
  // }

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
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
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
        colors={
          isDarkColorScheme
            ? [
                '#00C896', // Teal green (top)
                '#064E3B', // Deep emerald (40% mark)
                '#032822',
                '#021917',
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

      {/* Header */}
      <View
        style={{
          backgroundColor: 'transparent', // Transparent to show gradient
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        }}
        className="px-4 pb-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary }} className="text-sm font-medium">
            Total Balance
          </Text>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/notifications',
                params: { context: 'wallet' },
              } as any);
            }}
            className="p-2"
            style={{ position: 'relative' }}>
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
                }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {walletUnreadCount > 99 ? '99+' : walletUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View
          style={{
            backgroundColor: isDarkColorScheme ? colors.background : 'rgba(255, 255, 255, 0.8)',
            // borderWidth: 1,
            // borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          }}
          className="rounded-2xl p-4 pb-2">
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255, 255, 255, 0.52)',
            }}>
            <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
              ${balance.usdc.toFixed(2)}
            </Text>
            <Text style={{ color: colors.textPrimary }} className="mb-2 mt-1 text-sm">
              USDC
            </Text>
          </View>

          <View
            className="flex-row justify-between rounded-2xl px-8 pt-2"
            // style={{
            //   backgroundColor: isDarkColorScheme
            //     ? 'rgba(0, 0, 0, 0.24)'
            //     : 'rgba(255, 255, 255, 0.8)',
            //   borderWidth: 1,
            //   borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            // }}
          >
            <View
              // style={{
              //   backgroundColor: isDarkColorScheme
              //     ? 'rgba(0, 0, 0, 0.24)'
              //     : 'rgba(255, 255, 255, 0.8)',
              //   borderWidth: 1,
              //   borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              // }}
              className="items-center rounded-2xl py-4">
              <TouchableOpacity
                onPress={() => router.push('../wallet')}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(22, 163, 74, 0.15)',
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="add" size={28} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Deposit
              </Text>
            </View>

            <View
              // style={{
              //   backgroundColor: isDarkColorScheme
              //     ? 'rgba(0, 0, 0, 0.3)'
              //     : 'rgba(255, 255, 255, 0.8)',
              //   borderWidth: 1,
              //   borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              // }}
              className=" items-center rounded-2xl py-4">
              <TouchableOpacity
                onPress={() => router.push('/wallet/withdraw' as any)}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(239, 68, 68, 0.15)',
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="remove" size={28} color={colors.destructive} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Withdraw
              </Text>
            </View>

            <View
              // style={{
              //   backgroundColor: isDarkColorScheme
              //     ? 'rgba(0, 0, 0, 0.3)'
              //     : 'rgba(255, 255, 255, 0.8)',
              //   borderWidth: 1,
              //   borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
              // }}
              className="items-center rounded-2xl py-4">
              <TouchableOpacity
                onPress={() => router.push('/wallet/transfer' as any)}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(234, 179, 8, 0.15)',
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="swap-horiz" size={28} color={colors.warning} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Transfer
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pending Deposits Notification */}
        {(() => {
          // Calculate pending deposits from transactions to ensure it's always accurate
          // This includes both backend and frontend-only pending deposits
          const pendingDepositsFromTransactions = transactions
            .filter(tx => tx.type === 'deposit' && tx.status === 'pending')
            .reduce((sum, tx) => sum + tx.amount, 0);
          
          // Use balance.pendingDeposits if available, otherwise calculate from transactions
          const totalPending = balance.pendingDeposits || pendingDepositsFromTransactions;
          
          return totalPending > 0 ? (
            <View className="px-4 mb-4 mt-4">
              <View style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.3)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="pending" size={24} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                      Pending Deposit Verification
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                      ${totalPending.toFixed(2)} is pending verification. This may take up to 24 hours.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null;
        })()}

        {/* Pending Withdrawals Notification */}
        {(() => {
          // Calculate pending withdrawals from transactions
          const pendingWithdrawals = transactions
            .filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
          return pendingWithdrawals > 0 ? (
            <View className="px-4 mb-4">
              <View style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.3)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="schedule" size={24} color={colors.destructive} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                      Pending Withdrawal Processing
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                      ${pendingWithdrawals.toFixed(2)} is being processed. This may take 2-3 business days.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null;
        })()}

        {/* Quick Actions */}

        {/* Transaction Filters */}
        <View className="mb-4 px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}>
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
                  backgroundColor:
                    activeTab === filter.value
                      ? colors.primary
                      : isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.3)'
                        : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeTab === filter.value ? 0 : 1,
                  borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : colors.border,
                }}
                className="rounded-full px-4 py-2">
                <Text
                  style={{
                    color: activeTab === filter.value ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: activeTab === filter.value ? '600' : '400',
                  }}
                  className="text-sm">
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions */}
        <View className="px-4 pb-20">
          <Text style={{ color: colors.textPrimary }} className="mb-3 text-base font-bold">
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
                  backgroundColor: isDarkColorScheme
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: 1,
                  borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                }}
                className="mb-3 flex-row items-center rounded-2xl p-4">
                <View
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(34, 197, 94, 0.1)',
                  }}>
                  <MaterialIcons
                    name={getTransactionIcon(transaction.type)}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text style={{ color: colors.textPrimary }} className="mb-0.5 font-semibold">
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
                        transaction.type === 'deposit' ||
                        transaction.type === 'rental' ||
                        transaction.type === 'rental_income'
                          ? colors.primary
                          : transaction.type === 'withdraw'
                            ? colors.destructive
                            : colors.textPrimary,
                    }}>
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
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
