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
import { PortfolioWeeklyChart } from '@/components/portfolio/PortfolioWeeklyChart';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';



export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const { investments, totalValue, totalInvested: totalInvestedFromHook, totalROI, monthlyRentalIncome, loading, loadInvestments } =
    usePortfolio();
  const { portfolioUnreadCount } = useNotificationContext();
  const { state, loadTransactions } = useApp();
  const transactions = state.transactions || [];

  // Refresh investments and transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!isGuest && isAuthenticated) {
        if (loadInvestments) {
          loadInvestments();
        }
        if (loadTransactions) {
          loadTransactions();
        }
      }
    }, [loadInvestments, loadTransactions, isGuest, isAuthenticated])
  );

  // Show SignInGate if in guest mode - render conditionally but call all hooks first
  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

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

  // Calculate stats - use totalInvested from hook for consistency with totalValue calculation
  const totalInvested = totalInvestedFromHook;
  
  // Calculate total earnings from rental income and rewards only (not from property appreciation)
  // This ensures earnings persist even if tokens are sold
  const totalEarnings = transactions
    .filter(tx => 
      (tx.type === 'rental_income' || tx.type === 'rental') && 
      tx.status === 'completed'
    )
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  // Calculate this month's earnings from actual rental income and rewards transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const thisMonthEarnings = transactions
    .filter(tx => {
      if ((tx.type !== 'rental_income' && tx.type !== 'rental') || tx.status !== 'completed') {
        return false;
      }
      try {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  // Calculate last month's earnings for comparison
  const lastMonthEarnings = transactions
    .filter(tx => {
      if ((tx.type !== 'rental_income' && tx.type !== 'rental') || tx.status !== 'completed') {
        return false;
      }
      try {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === lastMonth && 
               txDate.getFullYear() === lastMonthYear;
      } catch {
        return false;
      }
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  // Calculate percentage change from last month
  const earningsGrowthPercent = lastMonthEarnings > 0
    ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
    : 0;
  
  const averageMonthly = monthlyRentalIncome;
  
  // Debug logs for portfolio calculations
  console.log('=== Portfolio Calculation Debug ===');
  console.log('Number of investments:', investments.length);
  console.log('Raw totalValue (from getTotalValue):', totalValue);
  console.log('Raw totalInvested (from getTotalInvested):', totalInvested);
  
  // Log individual investment details for verification
  console.log('Individual Investment Details:');
  investments.forEach((inv, index) => {
    console.log(`Investment ${index + 1}:`, {
      property: inv.property?.title,
      tokens: inv.tokens,
      tokenPrice: inv.property?.tokenPrice,
      currentValue: inv.currentValue,
      investedAmount: inv.investedAmount,
      manualCurrentValue: inv.tokens * (inv.property?.tokenPrice || 0),
      difference: inv.currentValue - (inv.tokens * (inv.property?.tokenPrice || 0))
    });
  });
  
  // Manual calculation verification
  const manualTotalValue = investments.reduce((sum, inv) => {
    const manualValue = inv.tokens * (inv.property?.tokenPrice || 0);
    return sum + manualValue;
  }, 0);
  const manualTotalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  
  console.log('Manual Calculation:');
  console.log('Manual totalValue (sum of tokens × tokenPrice):', manualTotalValue);
  console.log('Manual totalInvested (sum of investedAmount):', manualTotalInvested);
  console.log('Difference (manualTotalValue - totalValue):', manualTotalValue - totalValue);
  console.log('Difference (manualTotalInvested - totalInvested):', manualTotalInvested - totalInvested);
  
  // Calculate total loss/gain from invested amount
  // Calculate loss from raw values first, then round only the final result
  // This prevents rounding errors from accumulating
  // Loss = totalInvested - totalValue (positive means loss, negative means gain)
  const totalLoss = totalInvested - totalValue;
  const hasLoss = totalLoss > 0;
  
  console.log('Loss Calculation:');
  console.log('Raw totalValue:', totalValue);
  console.log('Raw totalInvested:', totalInvested);
  console.log('Calculated totalLoss (raw):', totalLoss);
  console.log('Rounded totalLoss (for display):', Math.round(totalLoss * 100) / 100);
  console.log('Verification: totalInvested - totalLoss =', totalInvested - totalLoss);
  console.log('Expected totalValue:', totalValue);
  console.log('Difference (should be 0):', (totalInvested - totalLoss) - totalValue);
  console.log('Rounded totalValue:', Math.round(totalValue * 100) / 100);
  console.log('Rounded totalInvested:', Math.round(totalInvested * 100) / 100);
  console.log('Rounded totalLoss:', Math.round(totalLoss * 100) / 100);
  console.log('Verification with rounded values: (rounded totalInvested - rounded totalLoss) =', (Math.round(totalInvested * 100) / 100) - (Math.round(totalLoss * 100) / 100));
  console.log('Expected rounded totalValue:', Math.round(totalValue * 100) / 100);
  
  // Find best performing property
  const bestProperty = investments.reduce(
    (best, current) => (current.roi > (best?.roi || 0) ? current : best),
    investments[0]
  );

  const renderHeader = () => (
    <>
      {/* Header */}
      <View >
      <View className="px-4 pb-6 pt-12">
        
        {/* <LinearGradient
          colors={
            isDarkColorScheme
              ? 
                [
                'rgb(4, 149, 55)',
                'rgb(4, 149, 14)',
                'rgb(28, 121, 2)',
                'rgb(1, 65, 23)',
                ]
              : [
                'rgba(245, 245, 245, 1)', // #F5F5F5
                'rgba(237, 237, 237, 1)', // #EDEDED
                'rgba(224, 224, 224, 1)', // #E0E0E0
                'rgba(255, 255, 255, 1)', // #FFFFFF
                ]
          }
          locations={[0, 0.4, 0.7, 1]} // 40% green, then transition to black
          // locations={[0, 0.5, 1]} // 40% green, then transition to black
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        /> */}
      
        <View className="mb-6 flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
            Portfolio
            </Text>
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
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}>
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {portfolioUnreadCount > 99 ? '99+' : portfolioUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
              
        {/* Current Balance Card */}
        <View
          style={
            
            {
            // backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
            shadowRadius: 12,
            // elevation: 8,
          }}>
        <LinearGradient
        colors={
        isDarkColorScheme
            ? 
              [
                'rgba(255, 216, 100, 0.84)', // Subtle golden yellow shine (top)
                'rgba(171, 199, 44, 0.85)',  // Warm yellow-green transition
                'rgba(123, 136, 3, 0.35)',   // Matches portfolio card theme
                'rgba(6, 95, 70, 0.4)',      // Deep teal-green (bottom)
              ]
            : [
                'rgba(255, 250, 240, 0.95)', // Warm ivory shine
                'rgba(255, 248, 220, 0.85)', // Soft golden-white
                'rgba(250, 250, 245, 0.9)',  // Subtle cream
                'rgba(255, 255, 255, 0.95)', // Pure white
              ]
              }
            locations={[0, 0.3, 0.65, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
            }}
          />

          <Text style={{ color: 'black' }} className="mb-2 text-sm font-medium">
             Total Holdings
          </Text>
          <View className="mb-1 flex-row items-baseline">
            {/* Round to 2 decimal places first, then split for consistent display */}
            {(() => {
              const roundedValue = Math.round(totalValue * 100) / 100;
              const parts = roundedValue.toFixed(2).split('.');
              return (
                <>
            <Text style={{ color: 'black', fontFamily: 'sans-serif' }} className="text-5xl">
                    ${parseInt(parts[0], 10).toLocaleString('en-US')}
            </Text>
            <Text style={{ color: 'black', fontFamily: 'sans-serif-thin' }} className=" text-4xl">
                    .{parts[1]}
            </Text>
                </>
              );
            })()}
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text style={{ color: 'black' }} className="text-xs">
              ${monthlyRentalIncome.toFixed(2)} Monthly Income
          </Text>
          <View 
            style={{ 
                backgroundColor: isDarkColorScheme
                  ? 'rgba(22, 163, 74, 0.15)'
                  : 'rgba(22, 163, 74, 0.1)',
            }}
              className="flex-row items-center rounded-full px-2.5 py-1">
              <Ionicons name="arrow-up" size={14} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary }} className="ml-1 text-xs font-bold">
              +{totalROI.toFixed(1)}%
            </Text>
          </View>
        </View>
        </View>
      </View>

      {/* Quick Actions Row */}
      <View className="mx-4">
        <View className="flex-row"
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        }}
        >
        
        {[
          { label: 'Deposit', icon: 'add', route: '../wallet' },
          { label: 'My Assets', icon: 'cube', route: '../portfolio/myassets/assets-first' },
          { label: 'Guidance', icon: 'document-text-outline', route: '../portfolio/guidance/guidance-one' },
          { label: 'Market', icon: 'storefront', route: '/marketplace' },
        ].map((item, index) => (
          <TouchableOpacity
            onPress={() => router.push(item.route as any)}
            style={{
              flex: 1,
              // backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.08)',
              // borderRadius: 16,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              // borderWidth: 1,
              borderRightWidth: index === 3 ? 0 : 2,
              borderColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.15)',
            }}
            >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
              <Ionicons name={item.icon as any} size={24} color={colors.primaryForeground} />
            </View>
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
          
        </View>
      </View>

      {/* Stats Overview Cards */}
      <View className="mt-6 px-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
          Overview
        </Text>
          <TouchableOpacity>
            <Text style={{ color: colors.primary }} className="text-sm font-medium">
              View All
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {/* Total Earnings Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="trending-up" size={18} color={colors.primary} />
              </View>
              <View
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                  All Time
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Total Earnings
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
              ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* This Month Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
            <View className="mb-2 flex-row items-center justify-between">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
              </View>
              {lastMonthEarnings > 0 && earningsGrowthPercent !== 0 && (
                <View
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                    {earningsGrowthPercent >= 0 ? '+' : ''}{earningsGrowthPercent.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              This Month
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
              ${thisMonthEarnings.toFixed(2)}
            </Text>
          </View>

          {/* Total Invested Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
            <View className="mb-2">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="wallet" size={18} color={colors.primary} />
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
              ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Total Loss Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
            <View className="mb-2">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: hasLoss 
                    ? (isDarkColorScheme ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                    : (isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons 
                  name={hasLoss ? "trending-down" : "trending-up"} 
                  size={18} 
                  color={hasLoss ? "#EF4444" : colors.primary} 
                />
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
              {hasLoss ? 'Total Loss' : 'Total Gain'}
            </Text>
            <Text style={{ 
              color: hasLoss ? '#EF4444' : colors.primary, 
              fontSize: 20, 
              fontWeight: 'bold' 
            }}>
              {hasLoss ? '-' : '+'}${Math.abs(totalLoss).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
              From ${totalInvested.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} invested
            </Text>
          </View>
        </View>
      </View>


      {/* Weekly Performance Chart */}
      <View className="mt-6 px-4">
        <PortfolioWeeklyChart 
          monthlyIncome={monthlyRentalIncome}
          investments={investments}
          totalValue={totalValue}
          transactions={transactions}
        />
      </View>

      {/* Performance Summary */}
      <View className="mt-4 px-4">
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          }}>
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Ionicons name="stats-chart" size={18} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                Performance Summary
            </Text>
            </View>
          </View>
          
          <View className="mb-3 flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              Average Monthly Return
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              ${averageMonthly.toFixed(2)}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              marginVertical: 10,
            }}
          />

          <View className="mb-3 flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Best Performer</Text>
            <Text
              style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}
              numberOfLines={1}>
              {bestProperty?.property.title || 'N/A'}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              marginVertical: 10,
            }}
          />

          <View className="flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Active Properties</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {investments.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Properties Header */}
      <View className="mb-3 mt-6 px-4">
        <View className="flex-row items-center justify-between">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
            YOUR PROPERTIES
          </Text>
          <TouchableOpacity onPress={() => router.push('/portfolio/myassets/assets-first')}>
            <Text style={{ color: colors.primary }} className="text-sm font-semibold">
              View All
        </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overlapping Property Cards */}
      <View className="mb-6 px-4">
        <PropertyCardStack data={investments} />
      </View>

      {/* Saved Plans Section */}
      <SavedPlansSection />
      </View>
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
         {/* Linear Gradient Background - 40% green top, black bottom */}
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
              'rgba(245, 245, 245, 1)', // #F5F5F5
              'rgba(237, 237, 237, 1)', // #EDEDED
              'rgba(224, 224, 224, 1)', // #E0E0E0
              'rgba(255, 255, 255, 1)', // #FFFFFF
              ]
        }
        locations={[0, 0.4, 0.7, 1]} // 40% green, then transition to black
        // locations={[0, 0.5, 1]} // 40% green, then transition to black
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
