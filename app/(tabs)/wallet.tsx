import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useWallet } from '@/services/useWallet';
import { LinearGradient } from 'expo-linear-gradient';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';
import { useApp } from '@/contexts/AppContext';
import { bankWithdrawalsAPI, BankWithdrawalRequest } from '@/services/api/bank-withdrawals.api';
import { useWalletConnect } from '@/src/wallet/WalletConnectProvider';
import { Pressable } from 'react-native';
import { useRestrictionGuard } from '@/hooks/useAccountRestrictions';
import { AccountRestrictedScreen } from '@/components/restrictions/AccountRestrictedScreen';
import { useRestrictionModal } from '@/hooks/useRestrictionModal';
import { RestrictionModal } from '@/components/restrictions/RestrictionModal';

export default function WalletScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { balance, transactions, loading, loadWallet, loadTransactions } = useWallet();
  const { walletUnreadCount } = useNotificationContext();
  const { isAuthenticated, isGuest } = useAuth();
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [pendingWithdrawals, setPendingWithdrawals] = useState<BankWithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  
  // Check account restrictions - if account is restricted, show blocking screen
  const { showRestrictionScreen, restrictionDetails } = useRestrictionGuard();
  const { checkAndBlock, modalProps } = useRestrictionModal();
  const [walletTab, setWalletTab] = useState<'usdc' | 'crypto'>('usdc');
  
  // WalletConnect
  const { connect, disconnect, isConnected, address, provider } = useWalletConnect();
  const [cryptoBalance, setCryptoBalance] = useState<string>('0.00');
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const isLoadingBalanceRef = React.useRef(false);

  // Scroll animation for collapsible sections
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [actualHeaderHeight, setActualHeaderHeight] = useState(120);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  // Extract first name from fullName (from actual profile data)
  const firstName = state.userInfo?.fullName?.split(' ')[0] || 'User';

  // Load pending withdrawal requests
  const loadPendingWithdrawals = React.useCallback(async () => {
    if (isGuest || !isAuthenticated) return;
    
    try {
      setLoadingWithdrawals(true);
      const requests = await bankWithdrawalsAPI.getMyRequests();
      // Filter only pending withdrawals
      const pending = requests.filter(req => req.status === 'pending');
      setPendingWithdrawals(pending);
    } catch (error) {
      console.error('Error loading pending withdrawals:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [isGuest, isAuthenticated]);

  // Load crypto wallet balance
  const loadCryptoBalance = React.useCallback(async (showLoading = false) => {
    console.log('[Crypto Balance] loadCryptoBalance called', { 
      isConnected, 
      address: address ? `${address.slice(0, 10)}...` : null, 
      hasProvider: !!provider 
    });
    
    if (!isConnected || !address || !provider) {
      console.log('[Crypto Balance] Missing connection details, setting balance to 0.00');
      setCryptoBalance('0.00');
      return;
    }
    
    try {
      if (showLoading) {
        setRefreshingBalance(true);
      }
      
      console.log('[Crypto Balance] Fetching balance from Geth Testnet RPC...', { address });
      
      // Always query from Geth Testnet RPC (bypassing WalletConnect provider)
      const testnetRpcUrl = 'http://192.168.1.142:7545';
      console.log('[Crypto Balance] Querying testnet RPC:', testnetRpcUrl);
      
      let balance: string;
      
      try {
        const rpcResponse = await fetch(testnetRpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });
        
        if (!rpcResponse.ok) {
          throw new Error(`RPC request failed with status ${rpcResponse.status}`);
        }
        
        const rpcData = await rpcResponse.json();
        
        if (rpcData.error) {
          throw new Error(rpcData.error.message || 'RPC error');
        }
        
        if (rpcData.result) {
          console.log('[Crypto Balance] Testnet RPC balance response:', rpcData.result);
          balance = rpcData.result;
        } else {
          throw new Error('No result from RPC');
        }
      } catch (rpcError) {
        console.error('[Crypto Balance] Testnet RPC query failed:', rpcError);
        throw rpcError;
      }
      
      console.log('[Crypto Balance] Raw balance response:', balance);
      
      // Convert from wei to ETH (balance is in hex)
      const ethBalance = parseInt(balance, 16) / 1e18;
      const formattedBalance = ethBalance.toFixed(4);
      
      console.log('[Crypto Balance] Converted balance:', { 
        raw: balance, 
        wei: parseInt(balance, 16), 
        eth: ethBalance, 
        formatted: formattedBalance 
      });
      
      setCryptoBalance(formattedBalance);
    } catch (error) {
      console.error('[Crypto Balance] Error loading crypto balance:', error);
      console.error('[Crypto Balance] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      setCryptoBalance('0.00');
    } finally {
      if (showLoading) {
        setRefreshingBalance(false);
      }
    }
  }, [isConnected, address, provider]);

  // Load crypto balance when wallet connects or address/provider changes
  React.useEffect(() => {
    console.log('[Crypto Balance] Connection state changed', { 
      isConnected, 
      address: address ? `${address.slice(0, 10)}...` : null, 
      hasProvider: !!provider 
    });
    
    if (isConnected && address && provider) {
      // Prevent duplicate calls
      if (isLoadingBalanceRef.current) {
        console.log('[Crypto Balance] Balance already loading, skipping...');
        return;
      }
      
      console.log('[Crypto Balance] Wallet connected, loading balance...');
      isLoadingBalanceRef.current = true;
      
      // Small delay to ensure provider is fully ready
      const timer = setTimeout(async () => {
        try {
          await loadCryptoBalance(true);
        } finally {
          isLoadingBalanceRef.current = false;
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
        isLoadingBalanceRef.current = false;
      };
    } else {
      console.log('[Crypto Balance] Wallet not connected, resetting balance');
      setCryptoBalance('0.00');
      isLoadingBalanceRef.current = false;
    }
  }, [isConnected, address, provider, loadCryptoBalance]);


  // Refresh wallet balance and transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadWallet && loadTransactions && !isGuest && isAuthenticated) {
        loadWallet();
        loadTransactions();
        loadPendingWithdrawals();
      }
      // Refresh crypto balance if connected
      if (isConnected && address && provider) {
        loadCryptoBalance();
      }
    }, [loadWallet, loadTransactions, loadPendingWithdrawals, isGuest, isAuthenticated, isConnected, address, provider, loadCryptoBalance])
  );

  // Convert pending withdrawal requests to transaction-like objects
  const pendingWithdrawalTransactions = React.useMemo(() => {
    return pendingWithdrawals.map((withdrawal) => ({
      id: `pending-withdrawal-${withdrawal.id}`,
      type: 'withdraw' as const,
      amount: -withdrawal.amountUSDT,
      date: withdrawal.createdAt,
      description: withdrawal.description || `Bank Withdrawal - ${withdrawal.displayCode}`,
      status: 'pending' as const,
      currency: withdrawal.currency || 'USDC',
      propertyId: undefined,
      propertyTitle: undefined,
      metadata: {
        withdrawalRequestId: withdrawal.id,
        displayCode: withdrawal.displayCode,
        bankAccountName: withdrawal.userBankAccountName,
        bankAccountNumber: withdrawal.userBankAccountNumber,
        bankName: withdrawal.userBankName,
      },
    }));
  }, [pendingWithdrawals]);

  // Merge transactions with pending withdrawal requests
  const allTransactions = React.useMemo(() => {
    // Filter out pending bank transfer deposits (old request-based feature)
    // These are transactions with "Bank Transfer Deposit (Pending Verification)" description
    const filteredTransactions = transactions.filter(tx => {
      // Exclude pending bank transfer deposits that are waiting for admin approval
      if (
        tx.type === 'deposit' &&
        tx.status === 'pending' &&
        tx.description?.includes('Bank Transfer Deposit (Pending Verification)')
      ) {
        return false; // Don't show these in transaction history
      }
      return true;
    });

    // Combine regular transactions with pending withdrawal requests
    // Remove any duplicate pending withdrawals that might already be in transactions
    const existingWithdrawalIds = new Set(
      filteredTransactions
        .filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
        .map(tx => tx.metadata?.withdrawalRequestId)
        .filter(Boolean)
    );

    const newPendingWithdrawals = pendingWithdrawalTransactions.filter(
      tx => !existingWithdrawalIds.has(tx.metadata?.withdrawalRequestId)
    );

    // Sort by date (newest first)
    return [...filteredTransactions, ...newPendingWithdrawals].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactions, pendingWithdrawalTransactions]);

  const filteredTransactions = allTransactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'rental_income') {
      // Show both 'rental' and 'rental_income' when filtering by rental_income
      return tx.type === 'rental' || tx.type === 'rental_income' || tx.type === 'reward';
    }
    return tx.type === activeTab;
  });

  // Show SignInGate if in guest mode (after ALL hooks are called)
  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

  // Loading state - after ALL hooks
  if (loading || loadingWithdrawals) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgb(32, 32, 32)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color='rgb(22, 163, 74)' />
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
        return colors.primary;
      case 'investment':
        return colors.primary;
      case 'transfer':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  // Calculate animated values for header only
  const collapseThreshold = 50; // Start collapsing after 50px scroll
  const walletCardHeight = 320; // Approximate height of wallet card section
  const stickySectionHeight = 100; // Height of categories + heading section

  // Animated background opacity for header - appears VERY QUICKLY for strong sticky effect
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 10, collapseThreshold + 20],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  // Animated opacity for wallet name - fades out as balance appears
  const walletNameOpacity = scrollY.interpolate({
    inputRange: [0, collapseThreshold, collapseThreshold + 50, collapseThreshold + 100],
    outputRange: [1, 1, 0.3, 0],
    extrapolate: 'clamp',
  });

  // Animated opacity for balance in header - appears as user scrolls
  const headerBalanceOpacity = scrollY.interpolate({
    inputRange: [0, collapseThreshold, collapseThreshold + 50, collapseThreshold + 100],
    outputRange: [0, 0, 0.3, 1],
    extrapolate: 'clamp',
  });

  // Animated translateY for balance in header - slides up smoothly from below
  const headerBalanceTranslateY = scrollY.interpolate({
    inputRange: [0, collapseThreshold, collapseThreshold + 50, collapseThreshold + 200],
    outputRange: [30, 30, 15, 0],
    extrapolate: 'clamp',
  });

  // Animated scale for balance in header - subtle zoom in effect
  const headerBalanceScale = scrollY.interpolate({
    inputRange: [0, collapseThreshold, collapseThreshold + 50, collapseThreshold + 200],
    outputRange: [0.8, 0.8, 0.9, 1],
    extrapolate: 'clamp',
  });

  // Sticky section animations - appears when categories would scroll past header
  // Categories are at position: walletCardHeight in normal flow
  // When scrollY reaches walletCardHeight, categories reach header position
  const stickyThreshold = walletCardHeight;
  
  const stickyOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold - 20, stickyThreshold, stickyThreshold + 10],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const stickyBackgroundOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold - 20, stickyThreshold, stickyThreshold + 10],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  // Hide normal categories when sticky version is visible
  const normalCategoriesOpacity = scrollY.interpolate({
    inputRange: [0, stickyThreshold - 20, stickyThreshold],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  // Handle scroll event
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false, // We need to animate height/opacity which requires layout
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const stickyThreshold = walletCardHeight;
        // Enable pointer events when sticky section is visible (opacity > 0.1)
        setIsStickyVisible(offsetY >= stickyThreshold - 20);
    }
    }
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Show restriction screen if account is restricted - render conditionally, not early return */}
      {showRestrictionScreen && restrictionDetails ? (
        <>
          <AccountRestrictedScreen
            title={restrictionDetails.restrictionType === 'general' ? 'Account Restricted' : undefined}
            message={restrictionDetails.message}
            restrictionType={restrictionDetails.restrictionType}
          />
          <RestrictionModal {...modalProps} />
        </>
      ) : (
        <>
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
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
          {/* Sticky Header - Always visible */}
          <Animated.View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setActualHeaderHeight(height);
            }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
            }}
            className="px-4">
            {/* Animated Background for Header */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDarkColorScheme ? 'rgba(22, 22, 22, 1)' : 'rgba(255, 255, 255, 1)',
                opacity: headerBackgroundOpacity,
              }}
            />
            <View className="flex-row items-center justify-between" style={{ zIndex: 1 }}>
              <Animated.View style={{ flex: 1, opacity: walletNameOpacity }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 2,
                }}>
                Welcome,
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 20,
                  fontWeight: '400',
                  marginBottom: 2,
                }}>
                {firstName}'s Wallet
              </Text>
            </Animated.View>
            
              {/* Animated Balance in Header - Centered, appears as wallet card collapses */}
            <Animated.View 
              style={{ 
                position: 'absolute',
                left: 0,
                  right: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                opacity: headerBalanceOpacity,
                  transform: [
                    { translateY: headerBalanceTranslateY },
                    { scale: headerBalanceScale },
                  ],
                  zIndex: 2,
                }}>
                {walletTab === 'usdc' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  color: colors.textPrimary,
                        fontFamily: 'sans-serif-light',
                  fontSize: 18,
                  fontWeight: '600',
                        marginRight: 2,
                }}>
                      $
              </Text>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: 'sans-serif-light',
                        fontSize: 24,
                        fontWeight: '700',
                      }}>
                      {balance.usdc.toFixed(0)}
                    </Text>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: 'sans-serif-light',
                        fontSize: 20,
                        fontWeight: '600',
                      }}>
                      .{balance.usdc.toFixed(2).slice(-2)}
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 14,
                        fontFamily: 'sans-serif-light',
                        fontWeight: 'bold',
                        marginLeft: 6,
                        marginTop: 2,
                      }}>
                      USDC
                    </Text>
          </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: 'sans-serif-light',
                        fontSize: 24,
                        fontWeight: '700',
                      }}>
                      {cryptoBalance}
                    </Text>
                    <Text
                      style={{
                        color: '#3b82f6',
                        fontSize: 14,
                        fontFamily: 'sans-serif-light',
                        fontWeight: 'bold',
                        marginLeft: 6,
                        marginTop: 2,
                      }}>
                      ETH
                    </Text>
                  </View>
                )}
              </Animated.View>
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
                  backgroundColor: colors.primary,
                  borderRadius: 12,
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
        </Animated.View>

          {/* Scrollable Content */}
          <ScrollView
            ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: actualHeaderHeight }}
          >
            {/* Wallet Card Sections */}
            <View>
              <View className="px-4 pb-4">
        {/* Navigation Tabs - Above the Card */}
                <View className="mb-4 mt-4 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setWalletTab('usdc')}
            style={{
              flex: 1,
              backgroundColor: walletTab === 'usdc' ? colors.primary : isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 12,
              padding: 12,
            }}>
            <Text style={{ color: walletTab === 'usdc' ? '#FFFFFF' : colors.textSecondary, textAlign: 'center', fontWeight: '600' }}>
              Custody
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWalletTab('crypto')}
            style={{
              flex: 1,
              backgroundColor: walletTab === 'crypto' ? colors.primary : isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 12,
              padding: 12,
            }}>
            <Text style={{ color: walletTab === 'crypto' ? '#FFFFFF' : colors.textSecondary, textAlign: 'center', fontWeight: '600' }}>
              Crypto
            </Text>
          </TouchableOpacity>
        </View>
        
                {/* Wallet Card - Shows based on selected tab */}
        {walletTab === 'usdc' ? (
                  <View
          style={{
            backgroundColor: isDarkColorScheme ? colors.background : 'rgba(255, 255, 255, 0.8)',
            borderRadius: 30,
                      height: 220,
                      // height: '45%',
                      // borderWidth: 1, borderColor: 'red',
            overflow: 'hidden',
          }}
          className="p-2">
          {/* Radial Gradient Background */}
          <View style={{ position: 'absolute', inset: 0 }}>
            <Svg width="100%" height="100%">
              <Defs>
                {isDarkColorScheme ? (
                  <>
                    {/* Dark Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                    </RadialGradient>

                    {/* Dark Mode - Bottom Left Glow */}
                    <RadialGradient id="grad2" cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                      <Stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                    </RadialGradient>
                  </>
                ) : (
                  <>
                    {/* Light Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </RadialGradient>

                    {/* Light Mode - Bottom Left Glow */}
                    <RadialGradient id="grad2" cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                      <Stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#f0fdf4" stopOpacity="0" />
                    </RadialGradient>
                  </>
                )}
              </Defs>

              {/* Base Layer */}
              <Rect 
                width="100%" 
                height="100%" 
                fill={isDarkColorScheme ? "#022c22" : "#f0fdf4"} 
              />

              {/* Layer the gradients on top of the base */}
              <Rect width="100%" height="100%" fill="url(#grad1)" />
              <Rect width="100%" height="100%" fill="url(#grad2)" />
            </Svg>
          </View>

          {/* Total Balance Label */}
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2,
              // marginBottom: 4,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                paddingHorizontal: 5,
                paddingVertical: 5,
              }}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: colors.primary,
                  marginRight: 6,
                }}
              />
              <Text
                style={{
                  color: isDarkColorScheme ? '#FFFFFF' : '#064e3b',
                  fontSize: 11,
                  fontWeight: '500',
                  opacity: 0.9,
                }}>
                Total Balance
              </Text>
            </View>
          </View>

          {/* Balance Amount - Primary Focus */}
          <View
            style={{
              alignItems: 'baseline',
              justifyContent: 'center',
              flexDirection: 'row',
              marginTop: 2,
              marginBottom: 2,
            }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: 'sans-serif-light',
                paddingRight: 2,
                fontSize: 28,
                fontWeight: '600',
              }}>
              $
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: 'sans-serif-light',
                fontSize: 34,
                fontWeight: '700',
              }}>
              {balance.usdc.toFixed(0)}
            </Text>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: 'sans-serif-light',
                fontSize: 32,
                fontWeight: '600',
              }}>
              .{balance.usdc.toFixed(2).slice(-2)}
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontSize: 18,
                fontFamily: 'sans-serif-light',
                fontWeight: 'bold',
                marginLeft: 8,
                marginTop: 4,
              }}>
              USDC
            </Text>
          </View>

          {/* Actions */}
          <View className="mt-4 flex-row justify-around rounded-2xl px-4 "
                      style={{ height: '50%', width: '100%' }}
          >
            <LinearGradient
              colors={
                isDarkColorScheme
                  ? [
                      'rgba(255, 255, 255, 0.28)',
                      'rgba(255, 255, 255, 0.56)',
                      'rgba(255, 255, 255, 0.56)',
                      'rgba(255, 255, 255, 0.28)',
                    ]
                  : [
                      '#ECFDF5', // Light green (top)
                      '#D1FAE5', // Pale green
                      '#A7F3D0', // Soft green
                      '#FFFFFF', // White (bottom)
                    ]
              }
              locations={[0.25, 0.4, 0.6, 0.75]} // 40% green, then transition to black
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                height: 1,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            {/* Deposit */}
            <View className="items-center rounded-2xl py-4"
            style={{ height: '100%', width: '20%' }}
            >
              <TouchableOpacity
                onPress={() => {
                            console.log('[Wallet] Deposit button pressed, balance:', balance);
                            checkAndBlock('deposits', () => {
                  router.push('../wallet');
                            });
                }}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(22, 163, 74, 0.15)',
                  boxShadow: ' 0px 0px 20px rgba(0, 0, 0, 0.5)'
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="arrow-upward" size={28} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Deposit
              </Text>
            </View>

            {/* Withdraw */}
            <View className="items-center rounded-2xl py-4">
              <TouchableOpacity
                          onPress={() => {
                            checkAndBlock('withdrawals', () => {
                              router.push('/wallet/withdraw' as any);
                            });
                          }}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(239, 68, 68, 0.15)',
                  boxShadow: ' 0px 0px 20px rgba(0, 0, 0, 0.5)',
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="arrow-downward" size={28} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Withdraw
              </Text>
            </View>

            {/* Transfer */}
            <View className="items-center rounded-2xl py-4">
              <TouchableOpacity
                          onPress={() => {
                            checkAndBlock('transfers', () => {
                              router.push('/marketplace' as any);
                            });
                          }}
                style={{
                  backgroundColor: isDarkColorScheme ? colors.card : 'rgba(234, 179, 8, 0.15)',
                  boxShadow: ' 0px 0px 20px rgba(0, 0, 0, 0.5)',
                }}
                className="mb-2 h-14 w-14 items-center justify-center rounded-full">
                <MaterialIcons name="swap-horiz" size={28} color={colors.warning} />
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                Trade
              </Text>
            </View>
          </View>
                  </View>
        ) : (
        /* Crypto Wallet Card */
                  <View
          style={{
            backgroundColor: isDarkColorScheme ? colors.background : 'rgba(255, 255, 255, 0.8)',
            borderRadius: 30,
            overflow: 'hidden',
          }}
          className="p-4 pb-2">

          {/* Radial Gradient Background */}
          <View style={{ position: 'absolute', inset: 0 }}>
            <Svg width="100%" height="100%">
              <Defs>
                {isDarkColorScheme ? (
                  <>
                    <RadialGradient id="grad3" cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                    </RadialGradient>
                    <RadialGradient id="grad4" cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                      <Stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                    </RadialGradient>
                  </>
                ) : (
                  <>
                    <RadialGradient id="grad3" cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </RadialGradient>
                    <RadialGradient id="grad4" cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                      <Stop offset="0%" stopColor="#93c5fd" stopOpacity="0.2" />
                      <Stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
                    </RadialGradient>
                  </>
                )}
              </Defs>
              <Rect width="100%" height="100%" fill={isDarkColorScheme ? "#022c22" : "#eff6ff"} />
              <Rect width="100%" height="100%" fill="url(#grad3)" />
              <Rect width="100%" height="100%" fill="url(#grad4)" />
            </Svg>
          </View>

          {!isConnected ? (
            /* Not Connected State */
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <MaterialIcons name="account-balance-wallet" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
                Connect Your Crypto Wallet
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }}>
                Connect MetaMask or other wallets to view your crypto balance
              </Text>
              <Pressable
                onPress={connect}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Connect Wallet
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Connected State */
            <>
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#3b82f6', marginRight: 6 }} />
                  <Text style={{ color: isDarkColorScheme ? '#FFFFFF' : '#1e40af', fontSize: 11, fontWeight: '500', opacity: 0.9 }}>
                    Crypto Balance
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'baseline', justifyContent: 'center', flexDirection: 'row', marginTop: 4, marginBottom: 4 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: 'sans-serif-light', fontSize: 42, fontWeight: '700' }}>
                  {cryptoBalance}
                </Text>
                <Text style={{ color: '#3b82f6', fontSize: 18, fontFamily: 'sans-serif-light', fontWeight: 'bold', marginLeft: 8, marginTop: 4 }}>
                  ETH
                </Text>
              </View>

              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                  Connected Wallet
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 12, fontFamily: 'monospace' }}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </Text>
              </View>

              <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Pressable
                  onPress={() => router.push('/wallet/send' as any)}
                  style={{ 
                    backgroundColor: isDarkColorScheme ? colors.card : 'rgba(16, 185, 129, 0.15)', 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                    Send
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/wallet/receive' as any)}
                  style={{ 
                    backgroundColor: isDarkColorScheme ? colors.card : 'rgba(59, 130, 246, 0.15)', 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>
                    Receive
                  </Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await loadCryptoBalance(true);
                  }}
                  disabled={refreshingBalance}
                  style={{ 
                    backgroundColor: isDarkColorScheme ? colors.card : 'rgba(59, 130, 246, 0.15)', 
                    paddingHorizontal: 16, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                    opacity: refreshingBalance ? 0.6 : 1,
                  }}>
                  {refreshingBalance ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>
                      Refresh
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={async () => {
                    try {
                      await disconnect();
                      // Reset crypto balance after disconnecting
                      setCryptoBalance('0.00');
                    } catch (error) {
                      console.error('Error disconnecting wallet:', error);
                    }
                  }}
                  style={{ backgroundColor: isDarkColorScheme ? colors.card : 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>
                    Disconnect
                  </Text>
                </Pressable>
              </View>
            </>
          )}
                  </View>
        )}
              </View>
            </View>

            {/* Categories and Recent Transactions Heading - Normal flow */}
        {walletTab === 'usdc' && (
              <Animated.View style={{ opacity: normalCategoriesOpacity }}>
                {/* Categories Chips */}
                <View className="mx-4 mb-3 mt-4">
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
                      borderWidth: activeTab === filter.value ? 0 : 0,
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
            
                {/* Recent Transactions Heading */}
            <View className="px-4">
                  <Text style={{ color: colors.textPrimary }} className="mb-3 ml-4 text-base font-bold">
                Recent Transactions
              </Text>
                </View>
              </Animated.View>
            )}

            {/* Transactions Section - Scrollable */}
            {walletTab === 'usdc' && (
              <View className="px-4 pb-20">
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
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(255, 255, 255, 0.8)',
              }}
              className="mb-2 flex-row items-center rounded-2xl p-4">
              <View className="h-12 w-12 items-center justify-center rounded-full">
                <MaterialIcons
                  name={getTransactionIcon(transaction.type)}
                  size={28}
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
                {/* Show bank details for pending withdrawals */}
                {transaction.type === 'withdraw' &&
                  transaction.status === 'pending' &&
                  transaction.metadata?.bankName && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">
                        {transaction.metadata.bankName}
                      </Text>
                      {transaction.metadata.displayCode && (
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          Request: {transaction.metadata.displayCode}
                        </Text>
                      )}
                    </View>
                  )}
                {/* Show bank transaction ID for completed withdrawals (hide BWR- codes) */}
                {transaction.type === 'withdraw' &&
                  transaction.status === 'completed' &&
                  transaction.metadata?.bankTransactionId && (
                    <Text style={{ color: colors.textSecondary }} className="mt-1 text-xs">
                      Transaction ID: {transaction.metadata.bankTransactionId}
                    </Text>
                  )}
                <Text style={{ color: transaction.status === 'completed' ? colors.primary : colors.warning }} className="text-xs">
                  {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className="text-lg "
                  style={{
                    color:
                      transaction.type === 'deposit' ||
                      transaction.type === 'rental' ||
                      transaction.type === 'reward' ||
                      transaction.type === 'rental_income'
                        ? colors.primary
                        : transaction.type === 'withdraw' || transaction.type === 'investment'
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
            )}
          </ScrollView>

          {/* Sticky Categories and Recent Transactions Heading */}
          {walletTab === 'usdc' && (
            <Animated.View
              style={{
                position: 'absolute',
                top: actualHeaderHeight,
                left: 0,
                right: 0,
                zIndex: 9,
                opacity: stickyOpacity,
              }}
              pointerEvents={isStickyVisible ? 'auto' : 'none'}>
              {/* Animated Background for Sticky Section */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 22, 22, 1)' : 'rgba(255, 255, 255, 1)',
                  opacity: stickyBackgroundOpacity,
                }}
              />

              {/* Categories Chips */}
              <View className="mx-4 mb-3 pt-2" style={{ zIndex: 1 }}>
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
                        borderWidth: activeTab === filter.value ? 0 : 0,
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

              {/* Recent Transactions Heading */}
              <View className="px-4" style={{ zIndex: 1 }}>
                <Text style={{ color: colors.textPrimary }} className="mb-3 ml-4 text-base font-bold">
                  Recent Transactions
                </Text>
              </View>
            </Animated.View>
          )}
          </>
        )}

      {/* Restriction Modal - Always render (outside conditional) */}
      <RestrictionModal {...modalProps} />
    </View>
  );
}
