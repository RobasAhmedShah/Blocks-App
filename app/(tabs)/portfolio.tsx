import React, { useState, useEffect } from 'react';
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
// import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { LineGraphDataPoint } from '@/components/portfolio/SimpleLineGraph';
import { apiClient } from '@/services/api/apiClient';
import { profileApi } from '@/services/api/profile.api';
import { CircularDragRotator } from '@/components/portfolio/CircularDragRotator';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useRestrictionGuard } from '@/hooks/useAccountRestrictions';
import { AccountRestrictedScreen } from '@/components/restrictions/AccountRestrictedScreen';

// Temporarily disable WebSocket to prevent socket.io-client crash
// TODO: Re-enable once socket.io-client polyfill is properly configured
// import { useWebSocket } from '@/services/websocket/useWebSocket';

// Glass Card Component
const GlassCard2 = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <BlurView 
    intensity={28} 
    tint="dark" 
    style={[{ 
      backgroundColor: 'rgba(255, 255, 255, 0.10)',
      borderRadius: 18, 
      borderWidth: 1, 
      borderColor: 'rgba(255,255,255,0.18)', 
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
      // elevation: 6,
    }, style]}
  >
    {/* Subtle top highlight */}
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.35)',
      }}
    />
    {children}
  </BlurView>
);

const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <BlurView intensity={25} tint="dark" style={[{ backgroundColor: 'rgba(22, 22, 22, 0.56)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }, style]}>
    {/* Subtle top highlight */}
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.35)',
      }}
    />
    {children}
  </BlurView>
);

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const { investments, totalValue, totalInvested: totalInvestedFromHook, totalROI, monthlyRentalIncome, loading, loadInvestments } =
    usePortfolio();
  const { portfolioUnreadCount } = useNotificationContext();
  const { state, loadTransactions } = useApp();
  const transactions = state.transactions || [];
  const [portfolioCandlesData, setPortfolioCandlesData] = useState<LineGraphDataPoint[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Check account restrictions - if account is restricted, show blocking screen
  const { showRestrictionScreen, restrictionDetails } = useRestrictionGuard();




  // WebSocket connection for real-time portfolio updates
  // Temporarily disabled to prevent socket.io-client crash
  // TODO: Re-enable once socket.io-client polyfill is properly configured
  const isConnected = false;
  const subscribe = (_event: string, _callback: (...args: any[]) => void) => () => { };
  const emit = (_event: string, _data?: any) => { };
  // const { isConnected, subscribe, emit } = useWebSocket({
  //   enabled: !isGuest && isAuthenticated,
  //   onConnect: () => {
  //     console.log('[Portfolio] WebSocket connected');
  //   },
  //   onDisconnect: () => {
  //     console.log('[Portfolio] WebSocket disconnected');
  //   },
  //   onError: (error) => {
  //     console.error('[Portfolio] WebSocket error:', error);
  //   },
  // });

  // Interface for portfolio daily candle data from API
  interface PortfolioDailyCandle {
    date: string; // YYYY-MM-DD format
    userId: string;
    openValue: number;
    highValue: number;
    lowValue: number;
    closeValue: number;
    totalInvested: number;
    snapshotCount: number;
  }

  // Fetch portfolio candles data
  useFocusEffect(
    React.useCallback(() => {
    const fetchPortfolioCandles = async () => {
      if (isGuest || !isAuthenticated) return;

      try {
        // Get user ID from profile
        const profile = await profileApi.getProfile();
        const userId = profile.userInfo.id;

        if (!userId) return;

        setCurrentUserId(userId);
        setLoadingCandles(true);
        const candles: PortfolioDailyCandle[] = await apiClient.get<PortfolioDailyCandle[]>(
          `/api/mobile/portfolio/candles?userId=${userId}&days=30`
        );

        // Transform candles data: use closeValue for the portfolio value
        const transformedData: LineGraphDataPoint[] = candles.map((candle) => {
          return {
            date: new Date(candle.date), // Convert YYYY-MM-DD string to Date
            value: candle.closeValue, // Use close value as the portfolio value
          };
        });

        // Sort by date to ensure chronological order
        transformedData.sort((a, b) => a.date.getTime() - b.date.getTime());

        setPortfolioCandlesData(transformedData);
      } catch (error) {
        console.error('Error fetching portfolio candles:', error);
        // On error, set empty array (graph will show "No data available")
        setPortfolioCandlesData([]);
      } finally {
        setLoadingCandles(false);
      }
    };

    fetchPortfolioCandles();
  }, [isGuest, isAuthenticated]));


  // WebSocket subscription state
  // const [isSubscribed, setIsSubscribed] = useState(false);
  // const unsubscribeRef = React.useRef<(() => void) | null>(null);

  // Subscribe to portfolio WebSocket updates when connected and screen is focused
  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (isGuest || !isAuthenticated || !currentUserId) {
  //       return;
  //     }

  //     // Wait for WebSocket connection
  //     if (!isConnected) {
  //       console.log('[Portfolio] Waiting for WebSocket connection...');
  //       return;
  //     }

  //     // Already subscribed, skip
  //     if (isSubscribed) {
  //       return;
  //     }

  //     console.log('[Portfolio] Subscribing to portfolio updates');

  //     // Subscribe to portfolio room
  //     emit('subscribe:portfolio');

  //     // Listen for portfolio candle updates
  //     const unsubscribe = subscribe('portfolio:candle:updated', (data: {
  //       userId: string;
  //       candle: {
  //         date: string | Date;
  //         openValue: number;
  //         highValue: number;
  //         lowValue: number;
  //         closeValue: number;
  //         totalInvested: number;
  //         snapshotCount: number;
  //       };
  //       timestamp: Date;
  //     }) => {
  //       // Only process updates for current user
  //       if (data.userId !== currentUserId) {
  //         return;
  //       }

  //       console.log('[Portfolio] Received portfolio candle update:', data);

  //       // Update the candles data with the new candle
  //       setPortfolioCandlesData((prevData) => {
  //         const candleDate = new Date(data.candle.date);
  //         const candleDateStr = candleDate.toISOString().split('T')[0]; // YYYY-MM-DD

  //         // Check if candle for this date already exists
  //         const existingIndex = prevData.findIndex(
  //           (item) => item.date.toISOString().split('T')[0] === candleDateStr
  //         );

  //         const newCandle: LineGraphDataPoint = {
  //           date: candleDate,
  //           value: data.candle.closeValue,
  //         };

  //         if (existingIndex >= 0) {
  //           // Update existing candle
  //           const updated = [...prevData];
  //           updated[existingIndex] = newCandle;
  //           return updated.sort((a, b) => a.date.getTime() - b.date.getTime());
  //         } else {
  //           // Add new candle
  //           const updated = [...prevData, newCandle];
  //           return updated.sort((a, b) => a.date.getTime() - b.date.getTime());
  //         }
  //       });
  //     });

  //     unsubscribeRef.current = unsubscribe;
  //     setIsSubscribed(true);

  //     // Cleanup: unsubscribe when screen loses focus
  //     return () => {
  //       console.log('[Portfolio] Unsubscribing from portfolio updates');
  //       emit('unsubscribe:portfolio');
  //       if (unsubscribeRef.current) {
  //         unsubscribeRef.current();
  //         unsubscribeRef.current = null;
  //       }
  //       setIsSubscribed(false);
  //     };
  //   }, [isConnected, currentUserId, isGuest, isAuthenticated, subscribe, emit, isSubscribed])
  // );

  // Handle connection state changes (re-subscribe if connection is restored)
  // useEffect(() => {
  //   if (isConnected && currentUserId && !isGuest && isAuthenticated && !isSubscribed) {
  //     // Connection restored, trigger re-subscription via focus effect
  //     // This will be handled by the useFocusEffect above
  //   }
  // }, [isConnected, currentUserId, isGuest, isAuthenticated, isSubscribed]);


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
        style={{ backgroundColor: 'rgb(32, 32, 32)' }}>
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
      (tx.type === 'rental_income' || tx.type === 'rental' || tx.type === 'reward') &&
      tx.status === 'completed'
    )
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  // Calculate this month's earnings from actual rental income and rewards transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lineGraphData = transactions.map(tx => ({
    date: new Date(tx.date),
    value: tx.amount,
  }));

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

        <View className="px-8 pb-2 pt-16 mb-4">
         

   


          {/* <View className="mb-6 flex-row items-center justify-between">
          <Text style={{ color: colors.textPrimary, fontFamily: 'sans-serif' }} className="text-2xl">
           
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
        </View> */}


          {/* <View
          style={
            
            {
        
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
            shadowRadius: 12,
     
          }}>
        <LinearGradient
        colors={
        isDarkColorScheme
            ? 
              [
                'rgba(255, 216, 100, 0.84)', 
                'rgba(171, 199, 44, 0.85)',  
                'rgba(123, 136, 3, 0.35)',   
                'rgba(6, 95, 70, 0.4)',      
              ]
            : [
                'rgba(255, 250, 240, 0.95)', 
                'rgba(255, 248, 220, 0.85)', 
                'rgba(250, 250, 245, 0.9)',  
                'rgba(255, 255, 255, 0.95)', 
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
        </View> */}
        </View>

        <View className="flex-1 items-center justify-center pt-0 pb-10">

          <CircularDragRotator
            size={360}
            totalInvested={totalInvested}
            totalValue={totalValue}
            investments={investments}
          />
        </View>


        {/* Quick Actions Row */}
        <View className="mx-4">
          <GlassCard style={{ padding: 16 }}>
          <View className="flex-row">

            {[
              { label: 'Deposit', icon: 'add', route: '../wallet' },
              { label: 'My Assets', icon: 'cube', route: '../portfolio/myassets/assets-first' },
              { label: 'Guidance', icon: 'document-text-outline', route: '../portfolio/guidance/guidance-one' },
              { label: 'Market', icon: 'storefront', route: '/marketplace' },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.label}
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
          </GlassCard>
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
            <GlassCard
              style={{
                flex: 1,
                minWidth: '47%',
                padding: 16,
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
            </GlassCard>

            {/* This Month Card */}
            <GlassCard
              style={{
                flex: 1,
                minWidth: '47%',
                padding: 16,
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
            </GlassCard>

            {/* Total Invested Card */}
            <GlassCard
              style={{
                flex: 1,
                minWidth: '47%',
                padding: 16,
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
            </GlassCard>

            {/* Total Loss Card */}
            <GlassCard
              style={{
                flex: 1,
                minWidth: '47%',
                padding: 16,
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
            </GlassCard>
          </View>
        </View>


        {/* Properties Header */}
        <View className="mb-3 mt-8 px-4">
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


        {/* Analytics Header */}
        <View className="px-4">
          <View className="flex-row items-center justify-between">
            <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
              Analytics
            </Text>
          </View>
        </View>

        {/* Weekly Performance Chart */}
        <View className="mt-6 px-4">
          <PortfolioWeeklyChart
            monthlyIncome={monthlyRentalIncome}
            investments={investments}
            totalValue={totalValue}
            transactions={transactions}
            portfolioCandlesData={portfolioCandlesData}
          />
        </View>

        {/* Performance Summary */}
        <View className="mt-4 px-4">
          <GlassCard style={{ padding: 18 }}>
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
          </GlassCard>
        </View>



        {/* Saved Plans Section */}
        <SavedPlansSection />
      </View>
    </>
  );

  // Show restriction screen if account is restricted
  if (showRestrictionScreen && restrictionDetails) {
    return (
      <AccountRestrictedScreen
        title={restrictionDetails.restrictionType === 'general' ? 'Account Restricted' : undefined}
        message={restrictionDetails.message}
        restrictionType={restrictionDetails.restrictionType}
      />
    );
  }

  return (
    <View style={{ backgroundColor: 'rgba(22,22,22,1)' }} className="flex-1">


             {/* Radial Gradient Background */}
             <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(22, 22, 22, 1)' }}>
            <Svg width="100%" height="100%">
              <Defs>
                {isDarkColorScheme ? (
                  <>
                    {/* Dark Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="90%" cy="0%" r="80%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="rgb(226, 223, 34)" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
                    </RadialGradient>
                  </>
                ) : (
                  <>
                    {/* Light Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="10%" cy="10%" r="80%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </RadialGradient>
                  </>
                )}
              </Defs>

              {/* Base Layer */}
              <Rect 
                width="100%" 
                height="100%" 
                fill={isDarkColorScheme ? "rgba(22,22,22,0)" : "#f0fdf4"} 
              />

              {/* Layer the gradients on top of the base */}
              <Rect width="100%" height="50%" fill="url(#grad1)" />
            </Svg>
          </View>


      {/* Linear Gradient Background - 40% green top, black bottom */}
      {/* <LinearGradient
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
      /> */}
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

    </View>
  );
}