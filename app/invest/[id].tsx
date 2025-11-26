import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, PanResponder, Animated, TextInput, Alert, Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useWallet } from '@/services/useWallet';
import { useApp } from '@/contexts/AppContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { KeyboardDismissButton } from '@/components/common/KeyboardDismissButton';

// Epsilon tolerance for floating-point comparison (1 cent)
const BALANCE_EPSILON = 0.01;
// Minimum investment: 0.1 tokens
const MINIMUM_TOKENS = 0.1;
// Effective token price (divided by 10 for fractional investments)
const getEffectiveTokenPrice = (tokenPrice: number) => tokenPrice / 10;

interface InvestScreenProps {
  propertyId?: string;
  onClose?: () => void;
  initialInvestmentAmount?: number; // Amount in USDT from calculator
}

export default function InvestScreen({ propertyId, onClose, initialInvestmentAmount }: InvestScreenProps = {}) {
  const routeParams = useLocalSearchParams<{ id?: string; tokenCount?: string }>();
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const id = propertyId || routeParams.id || '';
  const { property, loading } = useProperty(id);
  const { balance } = useWallet();
  const { invest } = useApp();
  
  // Calculate initial token count from initialInvestmentAmount if provided
  const getInitialTokenCount = () => {
    if (initialInvestmentAmount && property) {
      const effectivePrice = getEffectiveTokenPrice(property.tokenPrice);
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
  const [isDragging, setIsDragging] = useState(false);

  // Pan gesture for drag to close (bottom to top OR top to bottom)
  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow dragging in both directions (down = positive, up = negative)
        // But we want to close on swipe down (positive dy)
        if (gestureState.dy > 0) {
          pan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        
        // Close if:
        // 1. Swiped down more than 150px
        // 2. OR velocity is > 0.5 (fast swipe down)
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          // Animate out and close
          Animated.timing(pan, {
            toValue: 500, // Slide down off screen
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
          });
        } else {
          // Spring back to original position
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Effect to update inputs when initialInvestmentAmount changes (e.g., from calculator)
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

  if (loading || !property) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary }}>Loading...</Text>
      </View>
    );
  }

  const availableTokens = property.totalTokens - property.soldTokens;
  const effectiveTokenPrice = getEffectiveTokenPrice(property.tokenPrice);
  const maxInvestmentAmount = availableTokens * effectiveTokenPrice;
  
  const totalAmount = (tokenCount || 0) * effectiveTokenPrice;
  const transactionFee = totalAmount * 0.02; // 2% fee
  const totalInvestment = totalAmount + transactionFee;
  
  // Calculate progress based on available tokens
  const sliderValue = Math.min((tokenCount / Math.max(availableTokens, 1)) * 100, 100);

  // Check if user has sufficient balance (with epsilon tolerance)
  const hasSufficientBalance = balance.usdc >= (totalInvestment - BALANCE_EPSILON);
  
  // Check if investment meets minimum token requirement (0.1 tokens)
  const meetsMinimumTokens = tokenCount >= MINIMUM_TOKENS;

  // Synchronized update function for tokens
  const updateFromTokens = (tokens: number) => {
    // Validate max tokens
    const validTokens = Math.min(Math.max(0, tokens), availableTokens);
    
    setTokenCount(validTokens);
    setTokenInput(validTokens > 0 ? validTokens.toFixed(2) : '');
    
    // Update price with 2 decimals using effective price
    const calculatedPrice = validTokens * effectiveTokenPrice;
    setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
  };

  // Synchronized update function for price
  const updateFromPrice = (price: number) => {
    // Validate max price
    const validPrice = Math.min(Math.max(0, price), maxInvestmentAmount);
    
    setPriceInput(validPrice > 0 ? validPrice.toFixed(2) : '');
    
    // Update tokens with 2 decimals using effective price
    const calculatedTokens = validPrice / effectiveTokenPrice;
    setTokenCount(calculatedTokens);
    setTokenInput(calculatedTokens > 0 ? calculatedTokens.toFixed(2) : '');
  };

  const handleConfirm = async () => {
    // Validation
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

    if (!hasSufficientBalance) {
      const shortfall = totalInvestment - balance.usdc;
      handleClose();
      router.push({
        pathname: '/wallet/deposit/card',
        params: { amount: shortfall.toFixed(2) },
      } as any);
      return;
    }

    // Ensure tokenCount is valid before investing
    const finalTokenCount = tokenCount;
    const finalTotalAmount = finalTokenCount * effectiveTokenPrice;
    const finalTransactionFee = finalTotalAmount * 0.02;
    const finalTotalInvestment = finalTotalAmount + finalTransactionFee;

    // Double-check with epsilon tolerance
    const hasFinalSufficientBalance = balance.usdc >= (finalTotalInvestment - BALANCE_EPSILON);
    if (!hasFinalSufficientBalance) {
      const shortfall = finalTotalInvestment - balance.usdc;
      handleClose();
      router.push({
        pathname: '/wallet/deposit/card',
        params: { amount: shortfall.toFixed(2) },
      } as any);
      return;
    }

    setIsInvesting(true);
    try {
      await invest(finalTotalInvestment, property.id, finalTokenCount);
      
      // Navigate to confirmation with investment details
      router.replace({
        pathname: `/invest/${id}/confirm` as any,
        params: {
          tokenCount: finalTokenCount.toString(),
          totalAmount: finalTotalAmount.toFixed(2),
          totalInvestment: finalTotalInvestment.toFixed(2),
          propertyTitle: property.title,
        },
      } as any);
    } catch (error) {
      console.error('Investment failed:', error);
      setIsInvesting(false);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={{ 
          flex: 1, 
          backgroundColor: 'rgba(255, 255, 255, 0)', 
          justifyContent: 'flex-end',
          // paddingBottom: 50
          
        }}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity 
        // className='border border-gray-200 mb-[-50px]'
          activeOpacity={1} 
          onPress={(e) => {
            e.stopPropagation();
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View 
              style={{ 
                backgroundColor: colors.card, 
                borderTopLeftRadius: 50, 
                borderTopRightRadius: 50,
                transform: [{ translateY: pan }],
              }}
            >
            {/* iOS Keyboard Dismiss Button */}
            <KeyboardDismissButton inputAccessoryViewID="tokenInputAccessory" />
            <KeyboardDismissButton inputAccessoryViewID="priceInputAccessory" />
            
            {/* Handle - Drag to close indicator */}
            <View 
              style={{ 
                height: 32, 
                alignItems: 'center', 
                justifyContent: 'center', 
                paddingTop: 12, 
                paddingBottom: 8 
              }}
              {...panResponder.panHandlers}
            >
              <View style={{ 
                height: 5, 
                width: 40, 
                borderRadius: 9999, 
                backgroundColor: isDragging ? colors.primary : colors.muted,
                opacity: isDragging ? 0.8 : 1,
              }} />
              {/* Optional: Add instruction text */}
            
            </View>

          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ 
              color: colors.textPrimary, 
              fontSize: 28, 
              fontWeight: 'bold', 
              letterSpacing: -0.5 
            }}>
              Invest in {property.title}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, paddingTop: 4 }}>
              {property.tokenSymbol} - ${effectiveTokenPrice.toFixed(2)}/token (Min: {MINIMUM_TOKENS} tokens)
            </Text>
          </View>

          {/* Token and Price Input */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, gap: 12 }}>
            {/* Token Input */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 16, 
              backgroundColor: colors.muted, 
              paddingHorizontal: 16, 
              minHeight: 56, 
              justifyContent: 'space-between', 
              borderRadius: 8 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, flex: 1 }}>Number of Tokens</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => {
                    const newValue = Math.max(0, tokenCount - 1);
                    updateFromTokens(newValue);
                  }}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 9999, 
                    backgroundColor: colors.secondary 
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '500' }}>-</Text>
                </TouchableOpacity>
                <TextInput
                  inputAccessoryViewID={Platform.OS === 'ios' ? 'tokenInputAccessory' : undefined}
                  value={tokenInput}
                  onChangeText={(text: string) => {
                    // Allow empty string
                    if (text === '') {
                      setTokenInput('');
                      setTokenCount(0);
                      setPriceInput('');
                      return;
                    }
                    
                    // Allow single dot or valid decimal numbers
                    if (text === '.') {
                      setTokenInput(text);
                      return;
                    }
                    
                    // Remove any non-numeric characters except decimal point
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    
                    // Prevent multiple decimal points
                    const parts = cleaned.split('.');
                    if (parts.length > 2) {
                      return;
                    }
                    
                    // Limit to 2 decimal places
                    if (parts.length === 2 && parts[1].length > 2) {
                      return; // Don't allow more than 2 decimal places
                    }
                    
                    // Set raw input
                    setTokenInput(cleaned);
                    
                    // Parse and validate the number
                    const num = parseFloat(cleaned);
                    if (!isNaN(num) && num >= 0) {
                      // Check max limit
                      const validNum = Math.min(num, availableTokens);
                      
                      if (num > availableTokens) {
                        // Show warning but still allow typing
                        setTokenInput(cleaned);
                      }
                      
                      setTokenCount(validNum);
                      
                      // Sync price with 2 decimals using effective price
                      const calculatedPrice = validNum * effectiveTokenPrice;
                      setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
                    } else if (cleaned === '.') {
                      setTokenCount(0);
                      setPriceInput('');
                    }
                  }}
                  onBlur={() => {
                    // On blur, format and validate
                    if (tokenInput === '' || tokenInput === '.') {
                      setTokenInput('');
                      setTokenCount(0);
                      setPriceInput('');
                      return;
                    }
                    
                    const num = parseFloat(tokenInput);
                    if (!isNaN(num) && num > 0) {
                      // Enforce max limit on blur
                      const validNum = Math.min(num, availableTokens);
                      
                      if (num > availableTokens) {
                        Alert.alert(
                          'Maximum Tokens Exceeded',
                          `Only ${availableTokens.toFixed(2)} tokens are available. Your input has been adjusted.`,
                          [{ text: 'OK' }]
                        );
                      }
                      
                      const formatted = validNum.toFixed(2);
                      setTokenCount(parseFloat(formatted));
                      setTokenInput(formatted);
                      
                      // Sync price with 2 decimals using effective price
                      const calculatedPrice = validNum * effectiveTokenPrice;
                      setPriceInput(calculatedPrice.toFixed(2));
                    } else {
                      setTokenInput('');
                      setTokenCount(0);
                      setPriceInput('');
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '500',
                    width: 80,
                    textAlign: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingVertical: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const newValue = tokenCount + 1;
                    updateFromTokens(newValue);
                  }}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 9999, 
                    backgroundColor: colors.secondary 
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '500' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Input */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 16, 
              backgroundColor: colors.muted, 
              paddingHorizontal: 16, 
              minHeight: 56, 
              justifyContent: 'space-between', 
              borderRadius: 8 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                <Ionicons name="cash-outline" size={24} color={colors.primary} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, flex: 1 }}>Investment Amount</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity 
                  onPress={() => {
                    const newAmount = Math.max(0, totalAmount - effectiveTokenPrice);
                    updateFromPrice(newAmount);
                  }}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 9999, 
                    backgroundColor: colors.secondary 
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '500' }}>-</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '500' }}>$</Text>
                  <TextInput
                    inputAccessoryViewID={Platform.OS === 'ios' ? 'priceInputAccessory' : undefined}
                    value={priceInput}
                    onChangeText={(text: string) => {
                      // Allow empty string
                      if (text === '') {
                        setPriceInput('');
                        setTokenCount(0);
                        setTokenInput('');
                        return;
                      }
                      
                      // Allow single dot or valid decimal numbers
                      if (text === '.') {
                        setPriceInput(text);
                        return;
                      }
                      
                      // Remove any non-numeric characters except decimal point
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      
                      // Prevent multiple decimal points
                      const parts = cleaned.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      
                      // Limit to 2 decimal places
                      if (parts.length === 2 && parts[1].length > 2) {
                        return; // Don't allow more than 2 decimal places
                      }
                      
                      // Set raw input
                      setPriceInput(cleaned);
                      
                      // Calculate tokens from price
                      const priceNum = parseFloat(cleaned);
                      if (!isNaN(priceNum) && priceNum >= 0 && effectiveTokenPrice > 0) {
                        // Check max limit
                        const validPrice = Math.min(priceNum, maxInvestmentAmount);
                        
                        if (priceNum > maxInvestmentAmount) {
                          // Show warning but still allow typing
                          setPriceInput(cleaned);
                        }
                        
                        const calculatedTokens = validPrice / effectiveTokenPrice;
                        setTokenCount(calculatedTokens);
                        
                        // Sync tokens with 2 decimals
                        setTokenInput(calculatedTokens > 0 ? calculatedTokens.toFixed(2) : '');
                      } else if (cleaned === '.') {
                        setTokenCount(0);
                        setTokenInput('');
                      }
                    }}
                    onBlur={() => {
                      // On blur, format and validate
                      if (priceInput === '' || priceInput === '.') {
                        setPriceInput('');
                        setTokenCount(0);
                        setTokenInput('');
                        return;
                      }
                      
                      const priceNum = parseFloat(priceInput);
                      if (!isNaN(priceNum) && priceNum > 0 && effectiveTokenPrice > 0) {
                        // Enforce max limit on blur
                        const validPrice = Math.min(priceNum, maxInvestmentAmount);
                        
                        if (priceNum > maxInvestmentAmount) {
                          Alert.alert(
                            'Maximum Investment Exceeded',
                            `Maximum investment amount is $${maxInvestmentAmount.toFixed(2)} (${availableTokens.toFixed(2)} tokens). Your input has been adjusted.`,
                            [{ text: 'OK' }]
                          );
                        }
                        
                        const formatted = validPrice.toFixed(2);
                        setPriceInput(formatted);
                        
                        const calculatedTokens = validPrice / effectiveTokenPrice;
                        setTokenCount(calculatedTokens);
                        setTokenInput(calculatedTokens.toFixed(2));
                      } else {
                        setPriceInput('');
                        setTokenCount(0);
                        setTokenInput('');
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    style={{
                      color: colors.textPrimary,
                      fontSize: 16,
                      fontWeight: '500',
                      width: 80,
                      textAlign: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      paddingVertical: 4,
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newAmount = totalAmount + effectiveTokenPrice;
                    updateFromPrice(newAmount);
                  }}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: 9999, 
                    backgroundColor: colors.secondary 
                  }}
                >
                  <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '500' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Warning if below minimum */}
            {tokenCount > 0 && tokenCount < MINIMUM_TOKENS && (
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 1,
                  borderColor: colors.destructive,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="warning" size={20} color={colors.destructive} />
                <Text style={{ color: colors.destructive, fontSize: 12, flex: 1 }}>
                  Minimum investment is {MINIMUM_TOKENS} tokens (${(MINIMUM_TOKENS * effectiveTokenPrice).toFixed(2)})
                </Text>
              </View>
            )}
            
            {/* Warning if exceeds available */}
            {tokenCount > availableTokens && (
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 1,
                  borderColor: colors.destructive,
                  borderRadius: 8,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="warning" size={20} color={colors.destructive} />
                <Text style={{ color: colors.destructive, fontSize: 12, flex: 1 }}>
                  Exceeds available tokens! Maximum: {availableTokens.toFixed(2)} tokens (${maxInvestmentAmount.toFixed(2)})
                </Text>
              </View>
            )}

            {/* Slider */}
            <View style={{ paddingTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ 
                  flex: 1, 
                  height: 6, 
                  borderRadius: 9999, 
                  backgroundColor: colors.border 
                }}>
                  <View
                    style={{ 
                      height: '100%', 
                      borderRadius: 9999, 
                      backgroundColor: tokenCount > availableTokens ? colors.destructive : colors.primary,
                      width: `${Math.min(sliderValue, 100)}%` 
                    }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {tokenCount.toFixed(2)} of {availableTokens.toFixed(2)} available
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {sliderValue.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Financial Summary */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Available Balance</Text>
              <Text
                style={{
                  color: !hasSufficientBalance && tokenCount > 0
                    ? colors.destructive
                    : colors.textPrimary,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                ${balance.usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Transaction Fee</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                ${transactionFee.toFixed(2)}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                Total Investment
              </Text>
              <Text
                style={{
                  color: !hasSufficientBalance && tokenCount > 0
                    ? colors.destructive
                    : colors.primary,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                ${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* CTA Button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}>
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                width: '100%',
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: (hasSufficientBalance && tokenCount <= availableTokens && meetsMinimumTokens) ? colors.primary : colors.muted,
                opacity: (hasSufficientBalance && !isInvesting && tokenCount <= availableTokens && meetsMinimumTokens) ? 1 : 0.5,
              }}
              disabled={!hasSufficientBalance || isInvesting || !meetsMinimumTokens || tokenCount > availableTokens}
            >
              <Text style={{ 
                color: (hasSufficientBalance && tokenCount <= availableTokens && meetsMinimumTokens) ? colors.primaryForeground : colors.textMuted, 
                fontSize: 16, 
                fontWeight: 'bold', 
                textAlign: 'center' 
              }}>
                {isInvesting
                  ? 'Processing...'
                  : !meetsMinimumTokens
                  ? `Minimum ${MINIMUM_TOKENS} tokens required`
                  : tokenCount > availableTokens
                  ? 'Exceeds Available Tokens'
                  : !hasSufficientBalance
                  ? 'Insufficient Balance'
                  : 'Confirm Investment'}
              </Text>
            </TouchableOpacity>
            {!hasSufficientBalance && tokenCount > 0 && tokenCount <= availableTokens && (
              <TouchableOpacity
                onPress={() => {
                  const shortfall = totalInvestment - balance.usdc;
                  handleClose();
                  router.push({
                    pathname: '/wallet/deposit/card',
                    params: { amount: shortfall.toFixed(2) },
                  } as any);
                }}
                style={{ marginTop: 12 }}
              >
                <Text style={{ 
                  color: colors.primary, 
                  textAlign: 'center', 
                  fontSize: 14, 
                  fontWeight: '600' 
                }}>
                  Add ${(totalInvestment - balance.usdc).toFixed(2)} to your wallet
                </Text>
              </TouchableOpacity>
            )}
          </View>
          </Animated.View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}