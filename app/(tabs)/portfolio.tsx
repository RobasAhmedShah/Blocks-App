import React from 'react';
import { FlatList, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePortfolio } from '@/services/usePortfolio';
import { PropertyCardStack } from '@/components/PropertyCard';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNotificationContext } from '@/contexts/NotificationContext';
import ArcLoader from '@/components/EmeraldLoader';
import { SavedPlansSection } from '@/components/portfolio/SavedPlansSection';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const { investments, totalValue, totalROI, monthlyRentalIncome, loading, loadInvestments } =
    usePortfolio();
  const { portfolioUnreadCount } = useNotificationContext();

  // Refresh investments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadInvestments && !isGuest && isAuthenticated) {
        loadInvestments();
      }
    }, [loadInvestments, isGuest, isAuthenticated])
  );

  // Show SignInGate if in guest mode - render conditionally but call all hooks first
  // if (isGuest || !isAuthenticated) {
  //   return <SignInGate />;
  // }

  // Loading state - must be after all hooks
  if (loading || !investments) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}>
        <ArcLoader size={46} color={colors.primary} />
      </View>
    );
  }

  // Calculate stats
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalEarnings = totalValue - totalInvested;
  const averageMonthly = monthlyRentalIncome;
  const thisMonthEarnings = monthlyRentalIncome * 1.12; // Simulated 12% growth
  const nextPayoutDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Find best performing property
  const bestProperty = investments.reduce(
    (best, current) => (current.roi > (best?.roi || 0) ? current : best),
    investments[0]
  );

  const renderHeader = () => (
    <>
      {/* Header */}
      <View
        style={{
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : colors.background,
          borderBottomWidth: isDarkColorScheme ? 0 : 1,
          borderBottomColor: colors.border,
        }}
        className="px-4 pb-4 pt-12">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
              Total Portfolio Value
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/notifications',
                params: { context: 'portfolio' },
              } as any);
            }}
            className="p-2"
            style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {portfolioUnreadCount > 0 && (
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
                  borderColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : colors.background,
                }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {portfolioUnreadCount > 99 ? '99+' : portfolioUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
            $
            {totalValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <View
            style={{
              backgroundColor: isDarkColorScheme
                ? 'rgba(22, 163, 74, 0.2)'
                : 'rgba(22, 163, 74, 0.1)',
            }}
            className="flex-row items-center rounded-full px-3 py-1.5">
            <Ionicons name="arrow-up" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="ml-1 text-sm font-semibold">
              +{totalROI.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-right text-xs">
          ${monthlyRentalIncome.toFixed(2)} Monthly Rental Income
        </Text>
      </View>

      {/* Stats Overview Cards */}
      <View className="mt-6 px-4">
        <Text style={{ color: colors.textPrimary }} className="mb-3 text-lg font-bold">
          Overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {/* Total Earnings Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              // borderWidth: 1,
              // borderColor: colors.card,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Ionicons name="calendar" size={20} color={colors.card} />
              <View
                style={{
                  // backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  backgroundColor: colors.card,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                  All Time
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.background, fontSize: 11, marginBottom: 4 }}>
              Total Earnings
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              $
              {totalEarnings.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* This Month Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              // borderWidth: 1,
              // borderColor: colors.card,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Ionicons name="calendar" size={20} color={colors.card} />
              <View
                style={{
                  // backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  backgroundColor: colors.card,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}>
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>+12%</Text>
              </View>
            </View>
            <Text style={{ color: colors.background, fontSize: 11, marginBottom: 4 }}>
              This Month
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${thisMonthEarnings.toFixed(2)}
            </Text>
          </View>

          {/* Total Invested Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              // borderWidth: 1,
              // borderColor: colors.border,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Ionicons name="wallet" size={20} color={colors.card} />
            </View>
            <Text style={{ color: colors.background, fontSize: 11, marginBottom: 4 }}>
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              $
              {totalInvested.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* Next Payout Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.primary,
              borderRadius: 16,
              padding: 16,
              // borderWidth: 1,
              // borderColor: colors.border,
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <Ionicons name="time" size={20} color={colors.card} />
            </View>
            <Text style={{ color: colors.background, fontSize: 11, marginBottom: 4 }}>
              Next Payout
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
              {nextPayoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={{ color: colors.background, fontSize: 10, marginTop: 2 }}>
              ~${averageMonthly.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/*MY Asset Section*/}
      <View className="left-0 right-0 z-10 mb-4 mt-6 px-4">
        <View
          style={{
            backgroundColor: isDarkColorScheme ? colors.card : '#FFFFFF',
            borderWidth: isDarkColorScheme ? 0 : 1,
            borderColor: colors.border,
            shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
            shadowOffset: { width: 0, height: isDarkColorScheme ? 10 : 8 },
            shadowOpacity: isDarkColorScheme ? 0.25 : 0.08,
            shadowRadius: isDarkColorScheme ? 20 : 24,
            elevation: isDarkColorScheme ? 20 : 8,
          }}
          className="flex-row items-center justify-around gap-2 rounded-2xl px-3 py-2">
          <TouchableOpacity
            onPress={() => router.push('../wallet')}
            className="flex-1 flex-col items-center justify-center rounded-2xl p-2"
            style={
              {
                // backgroundColor: colors.primary,
              }
            }>
            <Ionicons name="add" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="mt-0.5 text-xs font-medium">
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/portfolio/myassets/assets-first')}
            className="flex-1 flex-col items-center justify-center rounded-2xl p-2"
            style={
              {
                // backgroundColor: colors.primary,
              }
            }>
            <Ionicons name="cube" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="mt-0.5 text-xs font-medium">
              My Assets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('../portfolio/guidance/guidance-one')}
            className="flex-1 flex-col items-center justify-center rounded-2xl p-2"
            style={
              {
                // backgroundColor: colors.primary,
              }
            }>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="mt-0.5 text-xs font-medium">
              Guidance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Performance Summary */}
      <View className="mt-0 px-4">
        <Text style={{ color: colors.textPrimary }} className="mb-3 text-lg font-bold">
          Performance Summary
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            // borderWidth: 0.5,
            // borderColor: isDarkColorScheme ? 'rgba(189, 189, 189, 0.3)' : 'rgba(139, 92, 246, 0.2)',
          }}>
          <View className="mb-3 flex-row items-center">
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text
              style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
              Monthly Highlights
            </Text>
          </View>

          <View className="mb-2 flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Average Monthly Return
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              ${averageMonthly.toFixed(2)}
            </Text>
          </View>

          <View className="mb-2 flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Best Performer</Text>
            <Text
              style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}
              numberOfLines={1}>
              {bestProperty?.property.title || 'N/A'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Active Properties</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              {investments.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Properties Header */}
      <View className="mb-2 mt-6 px-4">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
          Your Properties
        </Text>
      </View>

      {/* Overlapping Property Cards */}
      <View className="mb-6 px-4">
        <PropertyCardStack data={investments} />
      </View>

      {/* Saved Plans Section */}
      <SavedPlansSection />
    </>
  );

  // const renderFooter = () => (
  //   <>
  //     {/* Income Timeline */}
  //     <View className="px-4 mt-8 mb-20">
  //       <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
  //         Income Timeline
  //       </Text>
  //       <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
  //         Total visible income:{" "}
  //         <Text style={{ color: colors.textPrimary }} className="font-semibold">
  //           ${monthlyRentalIncome.toFixed(2)}
  //         </Text>
  //       </Text>
  //       <View className="flex-row items-end " style={{ marginLeft: -2 }}>
  //         {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug",].map(
  //           (month, index) => (
  //             <View
  //               key={month}
  //               className="items-center p-1 justify-end"
  //               style={{
  //                 flex: 1,
  //                 marginHorizontal: -1,
  //                 zIndex: 10 - index,
  //               }}
  //             >
  //               <View
  //                 style={{
  //                   backgroundColor: colors.primary,
  //                   width: "100%",
  //                   height: 60,
  //                   borderRadius: 8,
  //                   marginBottom: 8,
  //                   shadowColor: isDarkColorScheme ? "#000" : "rgba(22, 163, 74, 0.3)",
  //                   shadowOffset: { width: 0, height: 2 },
  //                   shadowOpacity: isDarkColorScheme ? 0.3 : 0.2,
  //                   shadowRadius: 4,
  //                   elevation: 3,
  //                 }}
  //               />
  //               <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
  //                 {month}
  //               </Text>
  //             </View>
  //           )
  //         )}
  //       </View>
  //     </View>
  //   </>
  // );

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      <FlatList
        data={[]}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCardStack data={[item]} />}
        ListHeaderComponent={renderHeader}
        // ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: 100 }}
        nestedScrollEnabled={true}
      />

      {/* Bottom Actions */}
      {/* <View className="left-0 right-0 z-10 mb-16 px-4 pb-6">
        <View
          style={{
            backgroundColor: isDarkColorScheme ? 'rgba(11, 61, 54, 0.95)' : '#FFFFFF',
            borderWidth: isDarkColorScheme ? 0 : 1,
            borderColor: colors.border,
            shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
            shadowOffset: { width: 0, height: isDarkColorScheme ? 10 : 8 },
            shadowOpacity: isDarkColorScheme ? 0.25 : 0.08,
            shadowRadius: isDarkColorScheme ? 20 : 24,
            elevation: isDarkColorScheme ? 20 : 8,
          }}
          className="flex-row items-center justify-around rounded-full px-3 py-1">
          <TouchableOpacity
            onPress={() => router.push('../wallet')}
            className="flex-1 flex-col items-center justify-center p-2">
            <Ionicons name="add" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="mt-0.5 text-xs font-medium">
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/portfolio/myassets/assets-first')}
            className="flex-1 flex-col items-center justify-center p-2">
            <Ionicons name="cube" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="mt-0.5 text-xs font-medium">
              My Assets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('../portfolio/guidance/guidance-one')}
            className="flex-1 flex-col items-center justify-center p-2">
            <Ionicons name="document-text-outline" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="mt-0.5 text-xs font-medium">
              Guidance
            </Text>
          </TouchableOpacity>
        </View>
      </View> */}
    </View>
  );
}
