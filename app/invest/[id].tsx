import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  Keyboard,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useWallet } from '@/services/useWallet';
import { useApp } from '@/contexts/AppContext';
import { useKycCheck } from '@/hooks/useKycCheck';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import EmeraldLoader from '@/components/EmeraldLoader';
import { usePortfolio } from '@/services/usePortfolio';
import { marketplaceAPI } from '@/services/api/marketplace.api';
import { AccountRestrictedScreen } from '@/components/restrictions/AccountRestrictedScreen';
import { useWalletConnect } from '@/src/wallet/WalletConnectProvider';
import { useRestrictionModal } from '@/hooks/useRestrictionModal';
import { RestrictionModal } from '@/components/restrictions/RestrictionModal';

// Constants
const BALANCE_EPSILON = 0.01;
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MINIMUM_TOKENS = 0.1;
const getEffectiveTokenPrice = (tokenPrice: number) => tokenPrice;

export default function BuyTokensScreen() {
  const routeParams = useLocalSearchParams<{ id?: string; tokenCount?: string; initialInvestmentAmount?: string; tokenId?: string }>();
  const router = useRouter();
  const { colors, isDarkColorScheme} = useColorScheme();
  const insets = useSafeAreaInsets();
  const initialId = routeParams.id || '';
  
  // Property selection - must be declared before useProperty
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialId);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(routeParams.tokenId || null);
  
  const { property, loading: propertyLoading } = useProperty(selectedPropertyId || initialId);
  const { balance } = useWallet();
  const { invest } = useApp();
  const { isVerified, kycLoading } = useKycCheck();
  const { isConnected, address, provider, connect } = useWalletConnect();
  
  const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
  
  // Payment method: 'wallet' (USD) or 'crypto' (ETH)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'crypto'>('wallet');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  
  // Admin address for crypto payments
  const ADMIN_ADDRESS = '0xe19bf17047a06c6107a1E3803835E0730e19aDee';

  // Check complianceStatus and granular restrictions
  // Only show full blocking screen if 'restricted'
  // 'under_review' allows navigation but blocks actions via modals
  // Investments are token transfers, not trading
  const complianceStatus = balance?.complianceStatus;
  const restrictions = balance?.restrictions;
  const isFullyRestricted = complianceStatus === 'restricted' || restrictions?.blockTokenTransfers === true;
  
  // Also use modal hook for safety checks in actions
  const { checkAndBlock, modalProps } = useRestrictionModal();

  if (isFullyRestricted) {
    const message = balance?.blockedReason || 'Trading is blocked for your account. Please contact Blocks team for assistance.';
    
    return (
      <>
        <AccountRestrictedScreen
          title="Investment Blocked"
          message={message}
          restrictionType="investment"
        />
        <RestrictionModal {...modalProps} />
      </>
    );
  }
  
  // Get initialInvestmentAmount from route params
  const initialInvestmentAmount = routeParams.initialInvestmentAmount ? parseFloat(routeParams.initialInvestmentAmount) : undefined;
  
  // Input mode: 'tokens' or 'amount'
  const [inputMode, setInputMode] = useState<'tokens' | 'amount'>('tokens');
  // Active tab: 'buy' or 'sell'
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  
  // Property selection
  const [showPropertySelector, setShowPropertySelector] = useState(false);
  
  // Sell mode state
  const { investments, loadInvestments } = usePortfolio();
  const [tokensToSell, setTokensToSell] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  
  // Animation for digit dial reveal
  const digitAnimation = useRef(new Animated.Value(1)).current;
  
  // Calculate initial token count
  const getInitialTokenCount = () => {
    if (initialInvestmentAmount && property) {
      // Use selected token price if available
      const selectedToken = selectedTokenId && property.tokens 
        ? property.tokens.find(t => t.id === selectedTokenId)
        : null;
      const price = selectedToken?.pricePerTokenUSDT || property.tokenPrice;
      const effectivePrice = getEffectiveTokenPrice(price);
      return initialInvestmentAmount / effectivePrice;
    }
    if (routeParams.tokenCount) {
      return parseFloat(routeParams.tokenCount);
    }
    return 0;
  };

  const initialTokenCount = getInitialTokenCount();
  const [tokenCount, setTokenCount] = useState<number>(initialTokenCount);
  const [tokenInput, setTokenInput] = useState<string>(initialTokenCount > 0 ? initialTokenCount.toFixed(2) : '');
  const [priceInput, setPriceInput] = useState<string>(initialInvestmentAmount && initialInvestmentAmount > 0 ? initialInvestmentAmount.toFixed(2) : '');
  const [isInvesting, setIsInvesting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Redirect to KYC if not verified
  useEffect(() => {
    if (!kycLoading && !isVerified) {
      router.replace('../profilesettings/kyc');
    }
  }, [isVerified, kycLoading, router]);

  // Update inputs when initialInvestmentAmount changes
  useEffect(() => {
    if (initialInvestmentAmount && initialInvestmentAmount > 0 && property) {
      const effectivePrice = getEffectiveTokenPrice(property.tokenPrice);
      const calculatedTokens = initialInvestmentAmount / effectivePrice;
      const availableTokens = property.totalTokens - property.soldTokens;
      const validTokens = Math.min(calculatedTokens, availableTokens);
      
      setTokenCount(validTokens);
      setTokenInput(validTokens > 0 ? validTokens.toFixed(2) : '');
      setPriceInput(initialInvestmentAmount > 0 ? initialInvestmentAmount.toFixed(2) : '');
    }
  }, [initialInvestmentAmount, property]);

  // Auto-focus input on mount (but don't show system keyboard)
  useEffect(() => {
    setTimeout(() => {
      // Focus the input but system keyboard won't show due to showSoftInputOnFocus={false}
      inputRef.current?.focus();
      // Ensure system keyboard is dismissed
      Keyboard.dismiss();
    }, 300);
  }, []);

  // Load investments for Sell tab
  useEffect(() => {
    if (activeTab === 'sell') {
      loadInvestments();
    }
  }, [activeTab, loadInvestments]);

  // Get owned properties for Sell tab
  const ownedProperties = investments.filter(inv => inv.tokens > 0);

  // Get available tokens based on mode
  const getAvailableTokens = () => {
    if (activeTab === 'sell') {
      const investment = investments.find(inv => inv.property?.id === selectedPropertyId);
      return investment?.tokens || 0;
    }
    // If a token is selected, use token-specific available tokens
    if (selectedToken?.availableTokens !== undefined) {
      return selectedToken.availableTokens;
    }
    return property ? property.totalTokens - property.soldTokens : 0;
  };

  const availableTokens = getAvailableTokens();
  
  // Get selected token if tokenId is provided
  const selectedToken = selectedTokenId && property?.tokens 
    ? property.tokens.find(t => t.id === selectedTokenId)
    : null;
  
  // Use token-specific price if token is selected, otherwise use property price
  const tokenPrice = selectedToken?.pricePerTokenUSDT || property?.tokenPrice || 0;
  const effectiveTokenPrice = getEffectiveTokenPrice(tokenPrice);
  const maxInvestmentAmount = availableTokens * effectiveTokenPrice;
  
  // Calculate total investment amount
  // Calculate investment amounts
  const totalAmount = (tokenCount || 0) * effectiveTokenPrice;
  const totalTransactionFee = totalAmount * 0.02;
  const totalInvestment = totalAmount + totalTransactionFee;
  
  // Check balance for wallet payment method
  const hasSufficientBalance = paymentMethod === 'wallet' 
    ? balance.usdc >= (totalInvestment - BALANCE_EPSILON)
    : true; // For crypto, balance check happens in payment screen

  if (propertyLoading || (activeTab === 'buy' && !property)) {
    return (
      <LinearGradient colors={['#064E3B', '#022C22', '#000']} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <EmeraldLoader />
          <Text style={{ color: '#fff', marginTop: 16 }}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  // Check if investment meets minimum token requirement
  const meetsMinimumTokens = tokenCount >= MINIMUM_TOKENS;

  // Helper to get property image URL
  const getPropertyImageUrl = (images: any): string | null => {
    if (!images) return null;
    const imageArray = normalizePropertyImages(images);
    if (imageArray.length === 0) return null;
    const firstImage = imageArray[0];
    if (!firstImage) return null;
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      return firstImage;
    }
    if (firstImage.startsWith('/')) {
      return `${API_BASE_URL}${firstImage}`;
    }
    return `${API_BASE_URL}/${firstImage}`;
  };

  // Handle numeric keypad input
  const handleKeypadInput = (key: string) => {
    const currentInput = inputMode === 'tokens' ? tokenInput : priceInput;
    let newInput = currentInput;

    if (key === 'backspace') {
      newInput = currentInput.slice(0, -1);
    } else if (key === '.') {
      if (!currentInput.includes('.')) {
        newInput = currentInput === '' ? '0.' : currentInput + '.';
      }
    } else {
      // Number input
      if (currentInput === '0' && key !== '.') {
        newInput = key;
      } else {
        newInput = currentInput + key;
      }
    }

    // Apply validation
    if (newInput === '') {
      if (inputMode === 'tokens') {
        setTokenInput('');
        setTokenCount(0);
        setPriceInput('');
      } else {
        setPriceInput('');
        setTokenCount(0);
        setTokenInput('');
      }
      return;
    }

    if (newInput === '.') {
      if (inputMode === 'tokens') {
        setTokenInput(newInput);
      } else {
        setPriceInput(newInput);
      }
      return;
    }

    const cleaned = newInput.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }

    // Update based on input mode
    if (inputMode === 'tokens') {
      setTokenInput(cleaned);
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num >= 0) {
        // Use token-specific available tokens if token is selected
        const tokenAvailable = selectedToken?.availableTokens || availableTokens;
        const validNum = Math.min(num, tokenAvailable);
        setTokenCount(validNum);
        const calculatedPrice = validNum * effectiveTokenPrice;
        setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
      } else if (cleaned === '.') {
        setTokenCount(0);
        setPriceInput('');
      }
    } else {
      setPriceInput(cleaned);
      const priceNum = parseFloat(cleaned);
      if (!isNaN(priceNum) && priceNum >= 0 && effectiveTokenPrice > 0) {
        // Use token-specific available tokens if token is selected
        const tokenAvailable = selectedToken?.availableTokens || availableTokens;
        const maxAmount = tokenAvailable * effectiveTokenPrice;
        const validPrice = Math.min(priceNum, maxAmount);
        const calculatedTokens = validPrice / effectiveTokenPrice;
        setTokenCount(calculatedTokens);
        setTokenInput(calculatedTokens > 0 ? calculatedTokens.toFixed(2) : '');
      } else if (cleaned === '.') {
        setTokenCount(0);
        setTokenInput('');
      }
    }
  };

  // Handle TextInput change
  const handleInputChange = (text: string) => {
    if (text === '') {
      if (inputMode === 'tokens') {
        setTokenInput('');
        setTokenCount(0);
        setPriceInput('');
      } else {
        setPriceInput('');
        setTokenCount(0);
        setTokenInput('');
      }
      return;
    }
    
    if (text === '.') {
      if (inputMode === 'tokens') {
        setTokenInput(text);
      } else {
        setPriceInput(text);
      }
      return;
    }
    
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    if (inputMode === 'tokens') {
      setTokenInput(cleaned);
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num >= 0) {
        const validNum = Math.min(num, availableTokens);
        setTokenCount(validNum);
        const calculatedPrice = validNum * effectiveTokenPrice;
        setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
      }
    } else {
      setPriceInput(cleaned);
      const priceNum = parseFloat(cleaned);
      if (!isNaN(priceNum) && priceNum >= 0 && effectiveTokenPrice > 0) {
        const validPrice = Math.min(priceNum, maxInvestmentAmount);
        const calculatedTokens = validPrice / effectiveTokenPrice;
        setTokenCount(calculatedTokens);
        setTokenInput(calculatedTokens > 0 ? calculatedTokens.toFixed(2) : '');
      }
    }
  };

  const handleConfirm = async () => {
    // Safety check: If account is restricted, block action
    // Use 'investment' type for investment-specific blocking
    if (!checkAndBlock('investment')) {
      return; // Modal will show, don't proceed
    }
    
    if (activeTab === 'sell') {
      // Sell flow validation
      if (!property) {
        Alert.alert('Error', 'Please select a property to sell');
        return;
      }

      if (tokenCount < MINIMUM_TOKENS) {
        Alert.alert(
          'Minimum Tokens Required',
          `Minimum ${MINIMUM_TOKENS} tokens required to sell`
        );
        return;
      }

      if (tokenCount > availableTokens) {
        Alert.alert(
          'Exceeds Available Tokens',
          `You only have ${availableTokens.toFixed(2)} tokens available`
        );
        return;
      }

      // Navigate to sell review screen
      router.push({
        pathname: `/invest/${selectedPropertyId}/sell-review` as any,
        params: {
          tokenCount: tokenCount.toString(),
          propertyId: selectedPropertyId,
          propertyTitle: property.title,
          pricePerToken: effectiveTokenPrice.toString(),
        },
      } as any);
      return;
    }

    // Buy flow validation
    if (tokenCount < MINIMUM_TOKENS) {
      Alert.alert(
        'Minimum Investment Required', 
        `Minimum investment is ${MINIMUM_TOKENS} tokens ($${(MINIMUM_TOKENS * effectiveTokenPrice).toFixed(2)}). Please increase your investment amount.`
      );
      return;
    }

    if (tokenCount > availableTokens) {
      Alert.alert(
        'Exceeds Available Tokens', 
        `Only ${availableTokens.toFixed(2)} tokens are available. Please reduce your investment amount.`
      );
      return;
    }

    // Handle crypto payment method
    if (paymentMethod === 'crypto') {
      if (!isConnected || !address || !provider) {
        Alert.alert(
          'Wallet Not Connected',
          'Please connect your crypto wallet to pay with ETH',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Connect Wallet',
              onPress: async () => {
                try {
                  await connect();
                } catch (error) {
                  console.error('Error connecting wallet:', error);
                }
              },
            },
          ]
        );
        return;
      }

      // Navigate to crypto payment screen
      const finalTokenCount = tokenCount;
      const finalTotalAmount = finalTokenCount * effectiveTokenPrice;
      const finalTotalTransactionFee = finalTotalAmount * 0.02;
      const finalTotalInvestment = finalTotalAmount + finalTotalTransactionFee;

      router.push({
        pathname: `/invest/${selectedPropertyId}/crypto-payment` as any,
        params: {
          tokenCount: finalTokenCount.toString(),
          totalAmount: finalTotalAmount.toFixed(2),
          transactionFee: finalTotalTransactionFee.toFixed(2),
          totalInvestment: finalTotalInvestment.toFixed(2),
          propertyTitle: property?.title || '',
          propertyId: selectedPropertyId,
          tokenId: selectedTokenId || '',
          tokenName: selectedToken?.name || '',
          tokenSymbol: selectedToken?.tokenSymbol || '',
          tokenPrice: tokenPrice.toFixed(2),
          adminAddress: ADMIN_ADDRESS,
        },
      } as any);
      return;
    }

    // Handle wallet (USD) payment method
    if (!hasSufficientBalance) {
      const shortfall = totalInvestment - balance.usdc;
      router.push({
        pathname: '/wallet/deposit/card',
        params: { amount: shortfall.toFixed(2) },
      } as any);
      return;
    }

    const finalTokenCount = tokenCount;
    const finalTotalAmount = finalTokenCount * effectiveTokenPrice;
    const finalTotalTransactionFee = finalTotalAmount * 0.02;
    const finalTotalInvestment = finalTotalAmount + finalTotalTransactionFee;

    const hasFinalSufficientBalance = balance.usdc >= (finalTotalInvestment - BALANCE_EPSILON);
    if (!hasFinalSufficientBalance) {
      const shortfall = finalTotalInvestment - balance.usdc;
      router.push({
        pathname: '/wallet/deposit/card',
        params: { amount: shortfall.toFixed(2) },
      } as any);
      return;
    }

    // Navigate to review screen
    if (!property) {
      Alert.alert('Error', 'Property not found');
      return;
    }

    router.push({
      pathname: `/invest/${selectedPropertyId}/review` as any,
        params: {
          tokenCount: finalTokenCount.toString(),
          totalAmount: finalTotalAmount.toFixed(2),
          transactionFee: finalTotalTransactionFee.toFixed(2),
          totalInvestment: finalTotalInvestment.toFixed(2),
        propertyTitle: property.title,
        propertyId: selectedPropertyId,
        tokenId: selectedTokenId || '',
        tokenName: selectedToken?.name || '',
        tokenSymbol: selectedToken?.tokenSymbol || '',
        tokenPrice: tokenPrice.toFixed(2),
      },
    } as any);
  };

  const propertyImage = property ? getPropertyImageUrl(property.images) : null;
  const displayValue = inputMode === 'tokens' ? (tokenInput || '0') : (priceInput || '0');
  // Use selected token symbol if available, otherwise fall back to property tokenSymbol
  const displayTokenSymbol = selectedToken?.tokenSymbol || property?.tokenSymbol || 'TKN';
  const displayLabel = inputMode === 'tokens' ? displayTokenSymbol : 'USDT';
  const conversionText = inputMode === 'tokens' 
    ? `≈ $${totalAmount.toFixed(2)}`
    : `≈ ${tokenCount.toFixed(2)} ${displayTokenSymbol}`;

  const handleBack = () => {
    router.back();
  };

  const handleToggleInputMode = () => {
    const newMode = inputMode === 'tokens' ? 'amount' : 'tokens';
    
    // Animate digit dial reveal
    Animated.sequence([
      Animated.timing(digitAnimation, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(digitAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setInputMode(newMode);
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowPropertySelector(false);
    // Reset inputs when property changes
    setTokenInput('');
    setPriceInput('');
    setTokenCount(0);
  };
  return (
    <LinearGradient
      colors={['#064E3B', '#022C22', '#000']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        {/* Header - Fixed at top */}
        <View
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          className="flex-row items-center px-4 py-3"
        >
          <View className="flex-row items-center justify-between w-full">
            <TouchableOpacity 
              className="w-10 h-10 items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                Investment
              </Text>
            </View>

            <View className="w-10" />
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'buy' && styles.tabActive]}
            onPress={() => {
              setActiveTab('buy');
              setInputMode('tokens');
              if (!selectedPropertyId) {
                setSelectedPropertyId(initialId);
              }
            }}
          >
            <Text style={activeTab === 'buy' ? styles.tabTextActive : styles.tabText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'sell' && styles.tabActive]}
            onPress={() => {
              setActiveTab('sell');
              setInputMode('tokens');
              setTokenInput('');
              setPriceInput('');
              setTokenCount(0);
            }}
          >
            <Text style={activeTab === 'sell' ? styles.tabTextActive : styles.tabText}>Sell</Text>
          </TouchableOpacity>
        </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Animated.View style={[styles.amountRow, { opacity: digitAnimation }]}>
              <TextInput
                ref={inputRef}
                value={displayValue === '0' ? '' : displayValue}
                onChangeText={handleInputChange}
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                keyboardType="default"
                showSoftInputOnFocus={false}
                style={styles.amountValueInput}
                selectTextOnFocus={true}
                onFocus={() => {
                  // Dismiss any system keyboard that might try to open
                  Keyboard.dismiss();
                }}
                onPressIn={() => {
                  // Prevent system keyboard from opening
                  Keyboard.dismiss();
                }}
              />
              <Text style={styles.amountUnit}>{displayLabel}</Text>
            </Animated.View>

            {activeTab === 'buy' && (
              <TouchableOpacity 
                style={styles.convertRow}
                onPress={handleToggleInputMode}
                activeOpacity={0.7}
              >
                <MaterialIcons name="swap-vert" size={16} color="#10B981" />
                <Text style={styles.convertText}>{conversionText}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Cards */}
          <View style={styles.card}>
            {/* Property */}
            <TouchableOpacity 
              style={styles.row} 
              activeOpacity={0.7}
              onPress={() => {
                if (activeTab === 'buy') {
                  // Navigate to property listing screen
                  router.push('/(tabs)/property');
                } else {
                  // Show modal for Sell tab
                  setShowPropertySelector(true);
                }
              }}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  {propertyImage ? (
                    <Image
                      source={{ uri: propertyImage }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons name="apartment" size={24} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{activeTab === 'buy' ? 'Buy' : 'Sell'}</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {property 
                      ? (activeTab === 'buy' 
                          ? `${property.title}${selectedToken ? ` • ${selectedToken.name} (${selectedToken.tokenSymbol})` : ''}`
                          : property.title)
                      : (activeTab === 'buy' ? 'Select Property' : 'Select Property to Sell')
                    }
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Payment Method */}
            <TouchableOpacity 
              style={styles.row} 
              activeOpacity={0.7}
              onPress={() => setShowPaymentMethodModal(true)}
            >
              <View style={styles.rowLeft}>
                <View style={styles.walletCircle}>
                  <Text style={styles.walletText}>
                    {paymentMethod === 'crypto' ? 'ETH' : 'USD'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Pay with</Text>
                  <Text style={styles.rowValue}>
                    {paymentMethod === 'crypto' 
                      ? (isConnected ? 'Crypto Wallet' : 'Connect Wallet')
                      : 'My Wallet'}
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                {paymentMethod === 'crypto' ? (
                  isConnected ? (
                    <>
                      <Text style={styles.balance}>
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </Text>
                      <Text style={styles.balanceLabel}>Connected</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.balance}>Not Connected</Text>
                      <Text style={styles.balanceLabel}>Tap to connect</Text>
                    </>
                  )
                ) : (
                  <>
                    <Text style={styles.balance}>
                      ${balance.usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.balanceLabel}>Available</Text>
                  </>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>

          {/* Warnings */}
          {tokenCount > 0 && tokenCount < MINIMUM_TOKENS && (
            <View style={styles.warning}>
              <Ionicons name="warning" size={14} color="#fca5a5" />
              <Text style={styles.warningText}>
                Minimum {MINIMUM_TOKENS} tokens required
              </Text>
            </View>
          )}
          
          {tokenCount > availableTokens && (
            <View style={styles.warning}>
              <Ionicons name="warning" size={14} color="#fca5a5" />
              <Text style={styles.warningText}>
                Max: {availableTokens.toFixed(2)} tokens
              </Text>
            </View>
          )}
        </ScrollView>

        {/* CTA - Fixed above keyboard */}
        <View style={styles.ctaContainerWrapper}>
          <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={[
              styles.cta,
              ((activeTab === 'buy' && (
                (paymentMethod === 'wallet' && (!hasSufficientBalance || !meetsMinimumTokens || tokenCount > availableTokens || isInvesting)) ||
                (paymentMethod === 'crypto' && (!isConnected || !meetsMinimumTokens || tokenCount > availableTokens || isInvesting))
              )) ||
               (activeTab === 'sell' && (!meetsMinimumTokens || tokenCount > availableTokens || isInvesting))) && styles.ctaDisabled
            ]}
            onPress={handleConfirm}
            disabled={
              activeTab === 'buy' 
                ? (
                    (paymentMethod === 'wallet' && (!hasSufficientBalance || isInvesting || !meetsMinimumTokens || tokenCount > availableTokens)) ||
                    (paymentMethod === 'crypto' && (!isConnected || isInvesting || !meetsMinimumTokens || tokenCount > availableTokens))
                  )
                : (isInvesting || !meetsMinimumTokens || tokenCount > availableTokens)
            }
          >
            <Text style={styles.ctaText}>
              {isInvesting
                ? 'Processing...'
                : !meetsMinimumTokens
                ? `Minimum ${MINIMUM_TOKENS} tokens required`
                : tokenCount > availableTokens
                ? activeTab === 'sell'
                  ? `Exceeds Owned Tokens (${availableTokens.toFixed(2)} available)`
                  : 'Exceeds Available Tokens'
                : activeTab === 'sell'
                ? 'Review order'
                : paymentMethod === 'crypto' && !isConnected
                ? 'Connect Wallet'
                : paymentMethod === 'crypto'
                ? 'Pay with Crypto'
                : !hasSufficientBalance
                ? 'Insufficient Balance'
                : 'Review order'}
            </Text>
          </TouchableOpacity>

          {!hasSufficientBalance && tokenCount > 0 && tokenCount <= availableTokens && (
            <TouchableOpacity
              onPress={() => {
                const shortfall = totalInvestment - balance.usdc;
                const propertyId = selectedPropertyId || initialId;
                router.push({
                  pathname: '/wallet/deposit/card',
                  params: { 
                    amount: shortfall.toFixed(2),
                    returnTo: `/invest/${propertyId}`,
                    returnPropertyId: propertyId,
                    returnTokenCount: tokenCount.toString(),
                    returnTotalAmount: totalAmount.toFixed(2),
                    returnTransactionFee: totalTransactionFee.toFixed(2),
                    returnTotalInvestment: totalInvestment.toFixed(2),
                  },
                } as any);
              }}
              style={styles.addFundsButton}
            >
              <Text style={styles.addFundsText}>
                Add ${(totalInvestment - balance.usdc).toFixed(2)} to your wallet
              </Text>
            </TouchableOpacity>
          )}
          </View>
        </View>

      {/* Keypad */}
      <View style={[styles.keypadContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.keypadBorder} />
        <View style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((k) => (
            <TouchableOpacity 
              key={k} 
              style={styles.key}
              onPress={() => {
                if (k === '⌫') {
                  handleKeypadInput('backspace');
                } else {
                  handleKeypadInput(k);
                }
              }}
              onLongPress={k === '⌫' ? () => {
                if (inputMode === 'tokens') {
                  setTokenInput('');
                  setTokenCount(0);
                  setPriceInput('');
                } else {
                  setPriceInput('');
                  setTokenCount(0);
                  setTokenInput('');
                }
              } : undefined}
              activeOpacity={0.5}
            >
              {k === '⌫' ? (
                <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.95)" />
              ) : (
                <Text style={styles.keyText}>{k}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </View>

      {/* Property Selector Modal */}
      <Modal
        visible={showPropertySelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Property to Sell
              </Text>
              <TouchableOpacity onPress={() => setShowPropertySelector(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {ownedProperties.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <MaterialIcons name="apartment" size={48} color="rgba(255,255,255,0.3)" />
                  <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16, fontSize: 16 }}>
                    No properties to sell
                  </Text>
                </View>
              ) : (
                  ownedProperties.map((investment) => {
                    const prop = investment.property;
                    const propImage = getPropertyImageUrl(prop?.images);
                    return (
                      <View
                        key={investment.id}
                        style={[
                          styles.propertyOption,
                          selectedPropertyId === prop?.id && styles.propertyOptionSelected,
                        ]} >
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => handlePropertySelect(prop?.id || '')}
                        >
                          {propImage ? (
                            <Image
                              source={{ uri: propImage }}
                              style={styles.propertyOptionImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.propertyOptionImage, { backgroundColor: '#10B981' }]}>
                              <MaterialIcons name="apartment" size={24} color="#fff" />
                            </View>
                          )}
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.propertyOptionTitle}>{prop?.title}</Text>
                            <Text style={styles.propertyOptionSubtitle}>
                              {prop?.city} • ${prop?.tokenPrice?.toFixed(2)} per token
                            </Text>
                            <Text style={styles.propertyOptionTokens}>
                              {investment.tokens.toFixed(2)} tokens owned
                            </Text>
                          </View>
                          {selectedPropertyId === prop?.id && (
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
                          )}
                        </TouchableOpacity>
                        
                        {/* My Assets Icon */}
                        <TouchableOpacity
                          onPress={() => {
                            if (prop?.id) {
                              router.push({
                                pathname: '/portfolio/myassets/assets-first',
                                params: { propertyId: prop.id },
                              } as any);
                            }
                          }}
                          style={styles.assetsIconButton}
                        >
                          <Ionicons name="cube" size={20} color="#10B981" />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentMethodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* My Wallet Option */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  paymentMethod === 'wallet' && styles.paymentMethodOptionSelected,
                ]}
                onPress={() => {
                  setPaymentMethod('wallet');
                  setShowPaymentMethodModal(false);
                }}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.paymentMethodIcon, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.paymentMethodIconText}>USD</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.paymentMethodTitle}>My Wallet</Text>
                    <Text style={styles.paymentMethodSubtitle}>
                      Pay with your USDC balance
                    </Text>
                    <Text style={styles.paymentMethodBalance}>
                      ${balance.usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available
                    </Text>
                  </View>
                </View>
                {paymentMethod === 'wallet' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>

              {/* Crypto Wallet Option */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  paymentMethod === 'crypto' && styles.paymentMethodOptionSelected,
                  !isConnected && styles.paymentMethodOptionDisabled,
                ]}
                onPress={async () => {
                  if (!isConnected) {
                    try {
                      await connect();
                    } catch (error) {
                      Alert.alert('Connection Failed', 'Please try connecting your wallet again');
                    }
                    return;
                  }
                  setPaymentMethod('crypto');
                  setShowPaymentMethodModal(false);
                }}
                disabled={!isConnected && false}
              >
                <View style={styles.paymentMethodLeft}>
                  <View style={[styles.paymentMethodIcon, { backgroundColor: '#627EEA' }]}>
                    <Text style={styles.paymentMethodIconText}>ETH</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.paymentMethodTitle}>Crypto Wallet</Text>
                    <Text style={styles.paymentMethodSubtitle}>
                      {isConnected 
                        ? `Pay with ETH from ${address?.slice(0, 6)}...${address?.slice(-4)}`
                        : 'Connect your wallet to pay with ETH'}
                    </Text>
                    {!isConnected && (
                      <Text style={styles.paymentMethodConnect}>Tap to connect wallet</Text>
                    )}
                  </View>
                </View>
                {paymentMethod === 'crypto' && isConnected && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
                {!isConnected && (
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Restriction Modal */}
      <RestrictionModal {...modalProps} />
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // headerPill: {
  //   flexDirection: 'row',
  //   backgroundColor: 'rgba(255,255,255,0.08)',
  //   paddingHorizontal: 12,
  //   paddingVertical: 6,
  //   borderRadius: 999,
  //   alignItems: 'center',
  //   gap: 6,
  // },

  // headerPillText: { color: '#fff', fontWeight: '500' },

  tabs: {
    marginHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    marginTop: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  tabActive: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 },

  amountContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },

  amountValue: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
  },
  amountValueInput: {
    fontSize: 56,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    minWidth: 80,
    textAlign: 'center',
    letterSpacing: -1,
  },

  amountUnit: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 10,
    fontWeight: '500',
  },

  convertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  convertText: { color: '#10B981', fontWeight: '500', fontSize: 14 },

  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 52,
  },

  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  walletCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  walletText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },

  rowLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  rowValue: { color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  balance: { color: 'rgba(255,255,255,0.95)', fontWeight: '700', fontSize: 17, letterSpacing: -0.3 },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3, fontWeight: '500' },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
    marginLeft: 0,
  },

  cta: {
    backgroundColor: '#10B981',
    paddingVertical: SCREEN_HEIGHT * 0.018, // 1.8% of screen height
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
    minHeight: SCREEN_HEIGHT * 0.06, // 6% of screen height
  },

  ctaText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: SCREEN_WIDTH * 0.042, // 4.2% of screen width
    letterSpacing: 0.5 
  },

  keypadContainer: {
    backgroundColor: 'transparent',
    paddingVertical: SCREEN_HEIGHT * 0.01, // 1% of screen height
  },
  keypadBorder: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 0,
    marginBottom: SCREEN_HEIGHT * 0.015, // 1.5% of screen height
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.05, // 5% of screen width
    paddingTop: SCREEN_HEIGHT * 0.005, // 0.5% of screen height
  },

  key: {
    width: '30%',
    height: SCREEN_HEIGHT * 0.06, // 7% of screen height (responsive button height)
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: SCREEN_HEIGHT * 0.015, // 1.5% of screen height
    borderRadius: 0,
    backgroundColor: 'transparent',
  },

  keyText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: SCREEN_WIDTH * 0.065, // 6.5% of screen width (responsive font)
    fontWeight: '400',
    letterSpacing: 0,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: SCREEN_HEIGHT * 0.01, // 1% of screen height
    marginHorizontal: SCREEN_WIDTH * 0.04, // 4% of screen width
    marginTop: SCREEN_HEIGHT * 0.008, // 0.8% of screen height
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warningText: {
    color: '#fca5a5',
    fontSize: SCREEN_WIDTH * 0.03, // 3% of screen width
    flex: 1,
    fontWeight: '500',
    lineHeight: SCREEN_HEIGHT * 0.02, // 2% of screen height
  },
  ctaContainerWrapper: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  ctaContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.04, // 4% of screen width
    paddingTop: SCREEN_HEIGHT * 0.02, // 2% of screen height
    paddingBottom: SCREEN_HEIGHT * 0.02, // 2% of screen height
    backgroundColor: 'transparent',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  addFundsButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  addFundsText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#022C22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 16,
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  propertyOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  propertyOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  propertyOptionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyOptionSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 4,
  },
  propertyOptionTokens: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paymentMethodOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  paymentMethodOptionDisabled: {
    opacity: 0.6,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentMethodTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentMethodSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 4,
  },
  paymentMethodBalance: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
  },
  paymentMethodConnect: {
    color: '#627EEA',
    fontSize: 12,
    fontWeight: '500',
  },
  assetsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
});
