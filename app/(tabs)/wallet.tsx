import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import EmeraldLoader from '@/components/EmeraldLoader';

// Memoized SVG Background Component
const BackgroundGradient = React.memo(({ isDarkColorScheme }: { isDarkColorScheme: boolean }) => (
  <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(22, 22, 22, 1)' }}>
    <Svg width="100%" height="100%">
      <Defs>
        {isDarkColorScheme ? (
          <>
            <RadialGradient id="grad1" cx="90%" cy="0%" r="80%" fx="90%" fy="10%">
              <Stop offset="0%" stopColor="rgb(226, 223, 34)" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
            </RadialGradient>
          </>
        ) : (
          <>
            <RadialGradient id="grad1" cx="10%" cy="10%" r="80%" fx="90%" fy="10%">
              <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </>
        )}
      </Defs>
      <Rect 
        width="100%" 
        height="100%" 
        fill={isDarkColorScheme ? "rgba(22,22,22,0)" : "#f0fdf4"} 
      />
      <Rect width="100%" height="50%" fill="url(#grad1)" />
    </Svg>
  </View>
));
BackgroundGradient.displayName = 'BackgroundGradient';

// Memoized Wallet Card SVG Gradient
const WalletCardGradient = React.memo(({ 
  isDarkColorScheme, 
  gradientId 
}: { 
  isDarkColorScheme: boolean;
  gradientId: string;
}) => {
  const isCrypto = gradientId.includes('crypto');
  
  return (
    <View style={{ position: 'absolute', inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          {isDarkColorScheme ? (
            <>
              {isCrypto ? (
                <>
                  <RadialGradient id={`grad3-${gradientId}`} cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                    <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id={`grad4-${gradientId}`} cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                    <Stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                  </RadialGradient>
                </>
              ) : (
                <>
                  <RadialGradient id={`grad1-${gradientId}`} cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                    <Stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id={`grad2-${gradientId}`} cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                    <Stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#022c22" stopOpacity="0" />
                  </RadialGradient>
                </>
              )}
            </>
          ) : (
            <>
              {isCrypto ? (
                <>
                  <RadialGradient id={`grad3-${gradientId}`} cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                    <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id={`grad4-${gradientId}`} cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                    <Stop offset="0%" stopColor="#93c5fd" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
                  </RadialGradient>
                </>
              ) : (
                <>
                  <RadialGradient id={`grad1-${gradientId}`} cx="90%" cy="10%" r="70%" fx="90%" fy="10%">
                    <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </RadialGradient>
                  <RadialGradient id={`grad2-${gradientId}`} cx="10%" cy="90%" r="70%" fx="10%" fy="90%">
                    <Stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.2" />
                    <Stop offset="100%" stopColor="#f0fdf4" stopOpacity="0" />
                  </RadialGradient>
                </>
              )}
            </>
          )}
        </Defs>
        <Rect 
          width="100%" 
          height="100%" 
          fill={isDarkColorScheme ? (isCrypto ? "#022c22" : "#022c22") : (isCrypto ? "#eff6ff" : "#f0fdf4")} 
        />
        {isCrypto ? (
          <>
            <Rect width="100%" height="100%" fill={`url(#grad3-${gradientId})`} />
            <Rect width="100%" height="100%" fill={`url(#grad4-${gradientId})`} />
          </>
        ) : (
          <>
            <Rect width="100%" height="100%" fill={`url(#grad1-${gradientId})`} />
            <Rect width="100%" height="100%" fill={`url(#grad2-${gradientId})`} />
          </>
        )}
      </Svg>
    </View>
  );
});
WalletCardGradient.displayName = 'WalletCardGradient';

// Memoized Category Chip Component
const CategoryChip = React.memo(({ 
  filter, 
  activeTab, 
  onPress, 
  colors, 
  isDarkColorScheme 
}: {
  filter: { value: string; label: string };
  activeTab: string;
  onPress: () => void;
  colors: any;
  isDarkColorScheme: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor:
        activeTab === filter.value
          ? colors.primary
          : isDarkColorScheme
            ? 'rgba(0, 0, 0, 0.3)'
            : 'rgba(255, 255, 255, 0.8)',
      borderWidth: 0,
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
));
CategoryChip.displayName = 'CategoryChip';

// Memoized Transaction Item Component
const TransactionItem = React.memo(({ 
  transaction, 
  colors, 
  isDarkColorScheme,
}: {
  transaction: any;
  colors: any;
  isDarkColorScheme: boolean;
}) => (
  <View
    style={{
      backgroundColor: isDarkColorScheme
        ? 'rgba(0, 0, 0, 0.5)'
        : 'rgba(255, 255, 255, 0.8)',
    }}
    className="mb-2 flex-row items-center rounded-2xl p-4">
    <View className="h-12 w-12 items-center justify-center rounded-full">
      <MaterialIcons
        name={getTransactionIcon(transaction.type) as any}
        size={28}
        color={getTransactionColor(transaction.type, colors)}
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
));
TransactionItem.displayName = 'TransactionItem';

// Helper functions moved outside component to avoid recreation
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

const getTransactionColor = (type: string, colors: any) => {
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
  
  // Check if user is non-KYC (wallet-only user)
  const isNonKycUser = state.userInfo?.customerTypeEnum === 'nonkyc';
  
  // For non-KYC users, default to 'crypto' tab and don't allow switching to 'usdc'
  const [walletTab, setWalletTab] = useState<'usdc' | 'crypto'>(isNonKycUser ? 'crypto' : 'usdc');
  
  // Update walletTab if user type changes (e.g., after profile loads)
  useEffect(() => {
    if (isNonKycUser && walletTab === 'usdc') {
      setWalletTab('crypto');
    }
  }, [isNonKycUser]);
  
  // WalletConnect
  const { connect, disconnect, isConnected, address, provider, chainId, isOnPolygonAmoy } = useWalletConnect();
  const [cryptoBalance, setCryptoBalance] = useState<string>('0.00');
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const isLoadingBalanceRef = React.useRef(false);
  // Token symbol - always USDC
  const [tokenSymbol, setTokenSymbol] = useState<string>('USDC');
  
  // Format large numbers for display (e.g., 99999836.87 -> "99.99M")
  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    
    if (num >= 1000000000) {
      // Billions - show 2 decimal places
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      // Millions - use floor to avoid rounding up to 100M
      const millions = num / 1000000;
      // If it's between 99.9 and 100, use floor to show 99.XX instead of rounding to 100.00
      if (millions >= 99.9 && millions < 100) {
        // Floor to 2 decimal places to prevent rounding up
        const floored = Math.floor(millions * 100) / 100;
        return floored.toFixed(2) + 'M';
      }
      // For other values, use normal rounding
      return millions.toFixed(2) + 'M';
    } else if (num >= 1000) {
      // Thousands - show 2 decimal places
      return (num / 1000).toFixed(2) + 'K';
    } else {
      // Less than 1000, show 2 decimal places
      return num.toFixed(2);
    }
  };
  
  // Polygon Amoy Token Contract Address
  const POLYGON_AMOY_TOKEN_ADDRESS = '0x5dAe3dA171CFEA728CB7042860Ab31BAbD5E9385';
  const [tokenDecimals, setTokenDecimals] = React.useState<number>(6); // Default to 6 (USDC standard), will be fetched from contract

  // Get RPC URL based on detected chain
  // Since we only support Polygon Amoy Testnet, default to it when chainId is null
  const getRpcUrl = (detectedChainId: number | null | undefined): string => {
    if (!detectedChainId) {
      // Default to Polygon Amoy Testnet (since that's the only supported chain)
      console.log('[RPC URL] Chain ID not detected, defaulting to Polygon Amoy Testnet');
      return 'https://rpc-amoy.polygon.technology';
    }

    switch (detectedChainId) {
      case 1:
        // Ethereum Mainnet
        return 'https://eth.llamarpc.com'; // Public RPC endpoint
      case 11155111:
        // Sepolia Testnet
        return 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'; // Public Sepolia RPC
      case 80002:
        // Polygon Amoy Testnet
        return 'https://rpc-amoy.polygon.technology'; // Polygon Amoy RPC
      case 5777:
      case 1337:
        // Local testnet (Ganache/Geth)
        return 'http://192.168.1.142:7545';
      default:
        // Default to local testnet for unknown chains
        console.warn(`[Crypto Balance] Unknown chain ID ${detectedChainId}, using local testnet RPC`);
        return 'http://192.168.1.142:7545';
    }
  };

  // Scroll animation for collapsible sections
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [actualHeaderHeight, setActualHeaderHeight] = useState(120);

  // Extract first name from fullName (from actual profile data)
  const firstName = state.userInfo?.fullName?.split(' ')[0] || 'User';

  // Deposit success detection (for bank transfers)
  const PENDING_DEPOSIT_KEY = 'pending_bank_deposit_info';
  const [depositSuccessState, setDepositSuccessState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });
  const initialBalanceRef = useRef<number>(0);
  const depositAmountRef = useRef<number>(0);
  const pendingDepositRef = useRef<boolean>(false);
  const currentBalanceRef = useRef<number>(0);

  // Load pending deposit info and check for success
  useFocusEffect(
    useCallback(() => {
      const checkPendingDeposit = async () => {
        try {
          const stored = await AsyncStorage.getItem(PENDING_DEPOSIT_KEY);
          if (stored) {
            const pendingInfo = JSON.parse(stored);
            initialBalanceRef.current = pendingInfo.initialBalance || 0;
            depositAmountRef.current = pendingInfo.expectedAmount || 0;
            pendingDepositRef.current = true;
            currentBalanceRef.current = state.balance?.usdc || 0;
            if (__DEV__) {
              console.log('📦 Wallet: Loaded pending deposit from storage');
            }
          }
        } catch (error) {
          console.error('Error loading pending deposit in wallet:', error);
        }
      };
      checkPendingDeposit();
    }, [state.balance?.usdc])
  );

  // Watch for balance changes to detect deposit success
  useEffect(() => {
    if (!pendingDepositRef.current || depositSuccessState.visible) {
      return;
    }

    const currentBalance = state.balance?.usdc || 0;
    const previousBalance = currentBalanceRef.current;
    
    const balanceIncrease = currentBalance - initialBalanceRef.current;
    const expectedAmount = depositAmountRef.current;
    const tolerance = 0.01;
    
    if (__DEV__) {
      console.log('🔍 Wallet: Checking deposit success', {
        currentBalance,
        previousBalance,
        initialBalance: initialBalanceRef.current,
        balanceIncrease,
        expectedAmount,
      });
    }
    
    if (balanceIncrease >= expectedAmount - tolerance && balanceIncrease > 0.01) {
      if (__DEV__) {
        console.log('✅ Wallet: Deposit detected! Balance increased by:', balanceIncrease);
      }
      
      // Clear pending deposit
      pendingDepositRef.current = false;
      AsyncStorage.removeItem(PENDING_DEPOSIT_KEY).catch(console.error);
      
      // Show success dialog
      setDepositSuccessState({
        visible: true,
        title: 'Deposit Successful',
        message: `Your deposit of $${balanceIncrease.toFixed(2)} has been processed successfully!`,
      });
    }
    
    if (currentBalance !== previousBalance) {
      currentBalanceRef.current = currentBalance;
    }
  }, [state.balance?.usdc, depositSuccessState.visible]);

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
      hasProvider: !!provider,
      chainId,
      isOnPolygonAmoy
    });
    
    if (!isConnected || !address || !provider) {
      if (__DEV__) {
        console.log('[Crypto Balance] Missing connection details, setting balance to 0.00');
      }
      setCryptoBalance('0.00');
      setTokenSymbol('USDC');
      return;
    }
    
    try {
      if (showLoading) {
        setRefreshingBalance(true);
      }

      // FORCE Polygon Amoy RPC - we only support Polygon Amoy Testnet
      // Don't use getRpcUrl() which might return wrong chain
      const rpcUrl = 'https://rpc-amoy.polygon.technology';
      const networkName = 'Polygon Amoy Testnet';
      
      console.log('[Crypto Balance] Fetching token balance on Polygon Amoy...', { 
        address, 
        chainId, 
        network: networkName,
        rpcUrl,
        note: 'Forced Polygon Amoy RPC regardless of detected chainId'
      });

      let balance: string = '0x0';
      let formattedBalance: string = '0.0000';
      
      // ALWAYS fetch token balance - we only support Polygon Amoy Testnet
      // No need to check chainId, just always fetch token when connected
      console.log('[Crypto Balance] Fetching token balance (Polygon Amoy only):', {
        chainId,
        isOnPolygonAmoy,
        isConnected,
        rpcUrl
      });
      
      // Always fetch token balance - we only support Polygon Amoy
      console.log('[Crypto Balance] Fetching token balance on Polygon Amoy...');
      console.log('[Crypto Balance] Wallet address:', address);
      console.log('[Crypto Balance] Token contract:', POLYGON_AMOY_TOKEN_ADDRESS);
      console.log('[Crypto Balance] RPC URL:', rpcUrl);
      setTokenSymbol('USDC');
        
      // ERC-20 balanceOf function signature: 0x70a08231
      // Then pad the address to 32 bytes (64 hex chars)
      const balanceOfFunction = '0x70a08231';
      const walletAddress = address.startsWith('0x') ? address.slice(2).toLowerCase() : address.toLowerCase();
      const paddedAddress = walletAddress.padStart(64, '0');
      const data = balanceOfFunction + paddedAddress;
      
      console.log('[Crypto Balance] ERC-20 call data:', {
        function: balanceOfFunction,
        walletAddress,
        paddedAddress,
        fullData: data
      });
        
      try {
        const requestBody = {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: POLYGON_AMOY_TOKEN_ADDRESS,
              data: data,
            },
            'latest',
          ],
          id: 1,
        };
        
        console.log('[Crypto Balance] RPC request:', JSON.stringify(requestBody, null, 2));
        
        const rpcResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        console.log('[Crypto Balance] RPC response status:', rpcResponse.status);
        
        if (!rpcResponse.ok) {
          const errorText = await rpcResponse.text();
          console.error('[Crypto Balance] RPC response error text:', errorText);
          throw new Error(`RPC request failed with status ${rpcResponse.status}: ${errorText}`);
        }
        
        const rpcData = await rpcResponse.json();
        console.log('[Crypto Balance] RPC response data:', JSON.stringify(rpcData, null, 2));
        
        if (rpcData.error) {
          console.error('[Crypto Balance] RPC error:', rpcData.error);
          throw new Error(rpcData.error.message || 'RPC error');
        }
        
        if (rpcData.result) {
          console.log('[Crypto Balance] Token balance response:', rpcData.result);
          balance = rpcData.result;
          
          // Handle "0x" result (zero balance)
          if (balance === '0x' || balance === '0x0') {
            console.log('[Crypto Balance] Zero token balance detected');
            formattedBalance = '0.00';
          } else {
            // Convert from token units using decimals (6 for this token)
            const balanceHex = balance === '0x' || balance === '0x0' ? '0' : balance;
            const tokenBalanceRaw = BigInt(balanceHex);
            const decimals = tokenDecimals || 6; // This token uses 6 decimals
            
            console.log('[Crypto Balance] Raw balance:', {
              hex: balance,
              decimal: tokenBalanceRaw.toString(),
              decimals: decimals,
            });
            
            // Simple division: raw balance / 10^decimals
            // For 100 million tokens with 6 decimals:
            // 100,000,000 * 10^6 = 100,000,000,000,000
            // 100,000,000,000,000 / 10^6 = 100,000,000
            const divisor = Math.pow(10, decimals);
            const tokenBalance = Number(tokenBalanceRaw) / divisor;
            
            console.log('[Crypto Balance] Balance conversion:', { 
              rawDecimal: tokenBalanceRaw.toString(),
              decimals: decimals,
              divisor: divisor,
              tokenBalance: tokenBalance,
            });
            
            // Format the balance nicely (e.g., 100M, 1.5K, etc.)
            formattedBalance = formatBalance(tokenBalance.toString());
            
            console.log('[Crypto Balance] Final formatted balance:', formattedBalance);
          }
        } else {
          console.error('[Crypto Balance] No result in RPC response');
          throw new Error('No result from RPC');
        }
        } catch (rpcError: any) {
          console.error('[Crypto Balance] Polygon Amoy token RPC query failed:', rpcError);
          console.error('[Crypto Balance] Error stack:', rpcError.stack);
          // Don't throw - set balance to 0 and let user know
          formattedBalance = '0.00';
          console.warn('[Crypto Balance] Setting balance to 0.00 due to error');
        }
      
      console.log('[Crypto Balance] Setting balance to:', formattedBalance);
      setCryptoBalance(formattedBalance);
      console.log('[Crypto Balance] Balance state updated, token symbol:', tokenSymbol);
    } catch (error) {
      console.error('[Crypto Balance] Error loading crypto balance:', error);
      console.error('[Crypto Balance] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Set to 0 but keep token symbol
      setCryptoBalance('0.00');
      setTokenSymbol('USDC');
      console.warn('[Crypto Balance] Balance set to 0.0000 due to error, but keeping token symbol');
    } finally {
      if (showLoading) {
        setRefreshingBalance(false);
      }
    }
  }, [isConnected, address, provider, chainId, isOnPolygonAmoy]);

  // Fetch token symbol and decimals from contract when connected
  React.useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!isConnected || !address || !provider) {
        setTokenSymbol('USDC');
        return;
      }

      const rpcUrl = 'https://rpc-amoy.polygon.technology';

      try {
        // Fetch token symbol - ERC-20 symbol() function signature: 0x95d89b41
        const symbolFunction = '0x95d89b41';
        
        const symbolResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
              {
                to: POLYGON_AMOY_TOKEN_ADDRESS,
                data: symbolFunction,
              },
              'latest',
            ],
            id: 1,
          }),
        });

        const symbolData = await symbolResponse.json();
        if (symbolData.result && symbolData.result !== '0x') {
          // Decode the string from hex
          const hex = symbolData.result.slice(2);
          const lengthHex = hex.slice(64, 128);
          const length = parseInt(lengthHex, 16) * 2;
          const stringHex = hex.slice(128, 128 + length);
          let symbol = '';
          for (let i = 0; i < stringHex.length; i += 2) {
            const charCode = parseInt(stringHex.substr(i, 2), 16);
            if (charCode > 0) {
              symbol += String.fromCharCode(charCode);
            }
          }
          console.log('[Token Info] Fetched symbol from contract:', symbol.trim());
          // Always display as USDC regardless of contract symbol
          setTokenSymbol('USDC');
        } else {
          console.log('[Token Info] Could not fetch symbol, using USDC');
          setTokenSymbol('USDC');
        }

        // Fetch token decimals - ERC-20 decimals() function signature: 0x313ce567
        const decimalsFunction = '0x313ce567';
        
        const decimalsResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
              {
                to: POLYGON_AMOY_TOKEN_ADDRESS,
                data: decimalsFunction,
              },
              'latest',
            ],
            id: 2,
          }),
        });

        const decimalsData = await decimalsResponse.json();
        if (decimalsData.result && decimalsData.result !== '0x') {
          const decimals = parseInt(decimalsData.result, 16);
          console.log('[Token Info] Fetched decimals from contract:', decimals);
          setTokenDecimals(decimals);
          
          // Reload balance with correct decimals
          if (isConnected && address && provider) {
            console.log('[Token Info] Decimals fetched, reloading balance with correct decimals');
            setTimeout(() => {
              loadCryptoBalance(false);
            }, 500);
          }
        } else {
          console.log('[Token Info] Could not fetch decimals, using default 6');
          setTokenDecimals(6);
        }
      } catch (error) {
        console.error('[Token Info] Error fetching token info:', error);
        setTokenSymbol('USDC');
        setTokenDecimals(6);
      }
    };

    if (isConnected) {
      fetchTokenInfo();
    } else {
      setTokenSymbol('USDC');
      setTokenDecimals(18);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, provider]);

  // Reload balance when decimals change (to use correct decimals)
  React.useEffect(() => {
    if (isConnected && address && provider && tokenDecimals > 0) {
      console.log('[Token Decimals] Decimals changed to', tokenDecimals, '- reloading balance with correct decimals');
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        if (!isLoadingBalanceRef.current) {
          loadCryptoBalance(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenDecimals]);

  // Load crypto balance when wallet connects or address/provider changes
  React.useEffect(() => {
    console.log('[Crypto Balance] Connection state changed', { 
      isConnected, 
      address: address ? `${address.slice(0, 10)}...` : null, 
      hasProvider: !!provider,
      chainId,
      isOnPolygonAmoy
    });
    
    if (isConnected && address && provider) {
      // Prevent duplicate calls
      if (isLoadingBalanceRef.current) {
        if (__DEV__) {
          console.log('[Crypto Balance] Balance already loading, skipping...');
        }
        return;
      }
      
      if (__DEV__) {
        console.log('[Crypto Balance] Wallet connected, loading balance...');
      }
      isLoadingBalanceRef.current = true;
      
      // Small delay to ensure provider is fully ready and chainId is detected
      // If chainId is null, wait a bit longer for it to be detected
      const delay = chainId ? 300 : 1000;
      console.log('[Crypto Balance] Waiting', delay, 'ms before loading balance (chainId:', chainId, ')');
      
      const timer = setTimeout(async () => {
        try {
          await loadCryptoBalance(true);
        } finally {
          isLoadingBalanceRef.current = false;
        }
      }, delay);
      
      return () => {
        clearTimeout(timer);
        isLoadingBalanceRef.current = false;
      };
    } else {
      if (__DEV__) {
        console.log('[Crypto Balance] Wallet not connected, resetting balance');
      }
      setCryptoBalance('0.00');
      setTokenSymbol('USDC'); // Default to TOKEN (will be fetched from contract)
      isLoadingBalanceRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, provider, chainId, isOnPolygonAmoy]); // Added chainId and isOnPolygonAmoy to detect chain changes

  // Reload balance when chainId changes from null to a value (chain detection completed)
  React.useEffect(() => {
    if (isConnected && address && provider && chainId && !isLoadingBalanceRef.current) {
      console.log('[Crypto Balance] Chain ID detected, reloading balance for chain:', chainId);
      const timer = setTimeout(async () => {
        try {
          await loadCryptoBalance(false); // Don't show loading spinner on chain change
        } catch (error) {
          console.error('[Crypto Balance] Error reloading balance after chain detection:', error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]); // Only trigger when chainId changes


  // Refresh wallet balance and transactions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset scroll position to top when screen comes into focus
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      scrollY.setValue(0);
      
      if (loadWallet && loadTransactions && !isGuest && isAuthenticated) {
        loadWallet();
        loadTransactions();
        loadPendingWithdrawals();
      }
      // Refresh crypto balance if connected (only if not already loading)
      if (isConnected && address && provider && !isLoadingBalanceRef.current) {
        // Add a small delay to ensure blockchain state is updated
        setTimeout(() => {
          if (isConnected && address && provider && !isLoadingBalanceRef.current) {
            loadCryptoBalance(false); // Don't show loading spinner on focus refresh
          }
        }, 500);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadWallet, loadTransactions, loadPendingWithdrawals, isGuest, isAuthenticated, isConnected, address, provider, chainId]) // Added chainId to refresh when chain changes
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

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'rental_income') {
        // Show both 'rental' and 'rental_income' when filtering by rental_income
        return tx.type === 'rental' || tx.type === 'rental_income' || tx.type === 'reward';
      }
      return tx.type === activeTab;
    });
  }, [allTransactions, activeTab]);

  // Memoized renderItem for FlatList
  const renderTransactionItem = useCallback(({ item: transaction }: { item: any }) => (
    <TransactionItem
      transaction={transaction}
      colors={colors}
      isDarkColorScheme={isDarkColorScheme}
    />
  ), [colors, isDarkColorScheme]);

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: any) => item.id, []);

  // Memoized ListEmptyComponent
  const ListEmptyComponent = useMemo(() => (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text style={{ color: colors.textSecondary }} className="text-sm">
        No transactions found
      </Text>
    </View>
  ), [colors.textSecondary]);

  // Calculate animated values for header only (must be before early returns)
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
    inputRange: [1, stickyThreshold - 20, stickyThreshold],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Animated background opacity for categories section - starts transparent, gradually darkens on scroll
  const categoriesBackgroundOpacity = scrollY.interpolate({
    inputRange: [walletCardHeight - 50, walletCardHeight, walletCardHeight + 100, walletCardHeight + 200],
    outputRange: [0, 0.3, 0.7, 1],
    extrapolate: 'clamp',
  });

  // Track sticky visibility for pointer events (minimize state updates) - MUST be before early returns
  const [stickyPointerEventsEnabled, setStickyPointerEventsEnabled] = useState(false);
  
  // Update pointer events state only when crossing threshold to minimize re-renders
  useEffect(() => {
    const listenerId = stickyOpacity.addListener(({ value }) => {
      const shouldEnable = value > 0.1;
      if (shouldEnable !== stickyPointerEventsEnabled) {
        setStickyPointerEventsEnabled(shouldEnable);
      }
    });
    return () => {
      stickyOpacity.removeListener(listenerId);
    };
  }, [stickyOpacity, stickyPointerEventsEnabled]);

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
        <EmeraldLoader />
      </View>
    );
  }

  // Handle scroll event - use native driver for all opacity/transform animations
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false, // Required for scrollY value updates
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
      <BackgroundGradient isDarkColorScheme={isDarkColorScheme} />
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
          {/* Sticky Header - Always visible */}
          <Animated.View
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setActualHeaderHeight(height);
            }}
        style={{
          // position: 'absolute',
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
                {/* Show crypto balance for non-KYC users, otherwise show based on selected tab */}
                {isNonKycUser || walletTab === 'crypto' ? (
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
                      {tokenSymbol}
                    </Text>
                  </View>
                ) : (
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
            stickyHeaderIndices={[1]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
            contentContainerStyle={{ }}
          >
            {/* Wallet Card Sections */}
            <View>
              <View className="px-4 pb-4">
        {/* Navigation Tabs - Above the Card */}
                {/* Hide Custody tab for non-KYC users - they only use crypto wallet */}
                {!isNonKycUser && (
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
                )}
        
                {/* Wallet Card - Shows based on selected tab */}
        {/* Hide Custody wallet UI for non-KYC users - they only use crypto wallet */}
        {!isNonKycUser && walletTab === 'usdc' ? (
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
          <WalletCardGradient isDarkColorScheme={isDarkColorScheme} gradientId="usdc-card" />

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
                            if (__DEV__) {
                              console.log('[Wallet] Deposit button pressed, balance:', balance);
                            }
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
          <WalletCardGradient isDarkColorScheme={isDarkColorScheme} gradientId="crypto-card" />

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
                          onPress={async () => {
                            try {
                              if (__DEV__) {
                                console.log('[Wallet] Connect button pressed, calling connect()...');
                              }
                              await connect();
                              if (__DEV__) {
                                console.log('[Wallet] Connect function completed');
                              }
                            } catch (error) {
                              if (__DEV__) {
                                console.error('[Wallet] Error connecting wallet:', error);
                              }
                              Alert.alert(
                                'Connection Error',
                                error instanceof Error ? error.message : 'Failed to open wallet connection. Please try again.',
                                [{ text: 'OK' }]
                              );
                            }
                          }}
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
                            {tokenSymbol}
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
        {/* Hide Custody transactions UI for non-KYC users */}
        {!isNonKycUser && walletTab === 'usdc' && (
              <Animated.View style={{ position: 'relative' }}>
                {/* Animated background that gradually appears on scroll */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isDarkColorScheme ? 'rgba(22, 22, 22, 1)' : 'rgba(255, 255, 255, 1)',
                    opacity: categoriesBackgroundOpacity,
                  }}
                />
                <View style={{ position: 'relative', zIndex: 1 }}>
                 {/* Categories Chips */}
                 <View 
                 className="mx-4 mb-3 mt-4 "
                 >
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
                  <CategoryChip
                    key={filter.value}
                    filter={filter}
                    activeTab={activeTab}
                    onPress={() => setActiveTab(filter.value)}
                    colors={colors}
                    isDarkColorScheme={isDarkColorScheme}
                  />
                ))}
              </ScrollView>
             </View>
            
                {/* Recent Transactions Heading */}
            <View className="px-4">
                  <Text style={{ color: colors.textPrimary }} className="mb-3 ml-4 text-base font-bold">
                Recent Transactionssss
              </Text>
                </View>
                </View>
              </Animated.View>
            )}

            {/* Transactions Section - Scrollable */}
            {/* Hide Custody transactions for non-KYC users */}
            {!isNonKycUser && walletTab === 'usdc' && (
              <View className="px-4 pb-20 mt-4">
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
                  color={getTransactionColor(transaction.type, isDarkColorScheme)}
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

          {/* Deposit Success Modal */}
          <Modal
            visible={depositSuccessState.visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setDepositSuccessState(prev => ({ ...prev, visible: false }))}
          >
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}>
              <View style={{
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.9)' : '#FFFFFF',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 320,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: colors.primary,
                position: 'relative',
              }}>
                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setDepositSuccessState(prev => ({ ...prev, visible: false }))}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="close" 
                    size={20} 
                    color={isDarkColorScheme ? colors.textSecondary : colors.textPrimary} 
                  />
                </TouchableOpacity>

                <View style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: isDarkColorScheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                  </View>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: colors.textPrimary,
                    marginBottom: 8,
                    textAlign: 'center',
                  }}>
                    {depositSuccessState.title}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}>
                    {depositSuccessState.message}
                  </Text>
                </View>
              </View>
            </View>
          </Modal>

          {/* Sticky Categories and Recent Transactions Heading */}
          {/* Hide sticky categories for non-KYC users */}
          {!isNonKycUser && walletTab === 'usdc' && (
            <Animated.View
              style={{
                position: 'absolute',
                top: actualHeaderHeight,
                left: 0,
                right: 0,
                zIndex: 9,
                opacity: stickyOpacity,
              }}
              pointerEvents={stickyPointerEventsEnabled ? 'auto' : 'none'}>
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
              {/* <View className="mx-4 mb-3 pt-2" style={{ zIndex: 1 }}>
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
                    <CategoryChip
                      key={filter.value}
                      filter={filter}
                      activeTab={activeTab}
                      onPress={() => setActiveTab(filter.value)}
                      colors={colors}
                      isDarkColorScheme={isDarkColorScheme}
                    />
                  ))}
                </ScrollView>
              </View> */}

              {/* Recent Transactions Heading */}
              {/* <View className="px-4" style={{ zIndex: 1 }}>
                <Text style={{ color: colors.textPrimary }} className="mb-3 ml-4 text-base font-bold">
                  Recent Transactions
                </Text>
              </View> */}
            </Animated.View>
          )}
          </>
        )}

      {/* Restriction Modal - Always render (outside conditional) */}
      <RestrictionModal {...modalProps} />
    </View>
  );
}
