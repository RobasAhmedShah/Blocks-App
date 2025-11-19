import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, PanResponder, Animated, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useWallet } from '@/services/useWallet';
import { useApp } from '@/contexts/AppContext';
import { useColorScheme } from '@/lib/useColorScheme';

// Epsilon tolerance for floating-point comparison (1 cent)
const BALANCE_EPSILON = 0.01;

interface InvestScreenProps {
  propertyId?: string;
  onClose?: () => void;
}

export default function InvestScreen({ propertyId, onClose }: InvestScreenProps = {}) {
  const routeParams = useLocalSearchParams<{ id?: string; tokenCount?: string }>();
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const id = propertyId || routeParams.id || '';
  const { property, loading } = useProperty(id);
  const { balance } = useWallet();
  const { invest } = useApp();
  const [tokenCount, setTokenCount] = useState<number>(routeParams.tokenCount ? parseFloat(routeParams.tokenCount) : 0);
  const [tokenInput, setTokenInput] = useState<string>(routeParams.tokenCount ? parseFloat(routeParams.tokenCount).toString() : '');
  const [priceInput, setPriceInput] = useState<string>('');
  const [isInvesting, setIsInvesting] = useState(false);

  // Pan gesture for drag to close
  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          handleClose();
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Update price input when token count changes - MUST be before any returns
  useEffect(() => {
    if (property && tokenInput !== '') {
      const calculatedPrice = (tokenCount || 0) * property.tokenPrice;
      setPriceInput(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
    }
  }, [tokenCount, property, tokenInput]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  if (loading || !property) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textPrimary }}>Loading...</Text>
      </View>
    );
  }

  const totalAmount = (tokenCount || 0) * property.tokenPrice;
  const transactionFee = totalAmount * 0.02; // 2% fee
  const totalInvestment = totalAmount + transactionFee;
  
  // Calculate progress based on available tokens
  const availableTokens = property.totalTokens - property.soldTokens;
  const sliderValue = Math.min((tokenCount / Math.max(availableTokens, 1)) * 100, 100);

  // Check if user has sufficient balance (with epsilon tolerance)
  const hasSufficientBalance = balance.usdc >= (totalInvestment - BALANCE_EPSILON);

  const handleConfirm = async () => {
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
    const finalTokenCount = tokenCount && tokenCount > 0 ? tokenCount : 0.01;
    const finalTotalAmount = finalTokenCount * property.tokenPrice;
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)', 
          justifyContent: 'flex-end' 
        }}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Animated.View 
            style={{ 
              backgroundColor: colors.card, 
              borderTopLeftRadius: 20, 
              borderTopRightRadius: 20,
              transform: [{ translateY: pan }],
            }}
            {...panResponder.panHandlers}
          >
            {/* Handle - Drag to close */}
            <View style={{ 
              height: 32, 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingTop: 12, 
              paddingBottom: 8 
            }}>
              <View style={{ 
                height: 5, 
                width: 40, 
                borderRadius: 9999, 
                backgroundColor: colors.muted 
              }} />
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
              {property.tokenSymbol} - ${property.tokenPrice.toFixed(2)}/token
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
                    const currentValue = tokenCount || 0;
                    const newValue = Math.max(0, currentValue - 1);
                    setTokenCount(newValue);
                    setTokenInput(newValue > 0 ? newValue.toFixed(2) : '');
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
                      return; // Invalid input, don't update
                    }
                    
                    setTokenInput(cleaned);
                    
                    // Parse and validate the number
                    const num = parseFloat(cleaned);
                    if (!isNaN(num) && num >= 0) {
                      setTokenCount(num);
                    } else if (cleaned === '.') {
                      setTokenCount(0);
                    }
                  }}
                  onBlur={() => {
                    // On blur, format the number if valid
                    if (tokenInput === '' || tokenInput === '.') {
                      setTokenInput('');
                      setTokenCount(0);
                      setPriceInput('');
                      return;
                    }
                    
                    const num = parseFloat(tokenInput);
                    if (!isNaN(num) && num > 0) {
                      const formatted = num.toFixed(2);
                      setTokenCount(parseFloat(formatted));
                      setTokenInput(formatted);
                    } else {
                      setTokenInput('');
                      setTokenCount(0);
                      setPriceInput('');
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
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
                    const currentValue = tokenCount || 0;
                    const newValue = currentValue + 1;
                    setTokenCount(newValue);
                    setTokenInput(newValue.toFixed(2));
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
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '500' }}>$</Text>
                <TextInput
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
                    
                    setPriceInput(cleaned);
                    
                    // Calculate tokens from price
                    const priceNum = parseFloat(cleaned);
                    if (!isNaN(priceNum) && priceNum >= 0 && property.tokenPrice > 0) {
                      const calculatedTokens = priceNum / property.tokenPrice;
                      setTokenCount(calculatedTokens);
                      setTokenInput(calculatedTokens.toFixed(2));
                    } else if (cleaned === '.') {
                      setTokenCount(0);
                    }
                  }}
                  onBlur={() => {
                    // On blur, format the number if valid
                    if (priceInput === '' || priceInput === '.') {
                      setPriceInput('');
                      setTokenCount(0);
                      setTokenInput('');
                      return;
                    }
                    
                    const priceNum = parseFloat(priceInput);
                    if (!isNaN(priceNum) && priceNum > 0 && property.tokenPrice > 0) {
                      const formatted = priceNum.toFixed(2);
                      setPriceInput(formatted);
                      const calculatedTokens = priceNum / property.tokenPrice;
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
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '500',
                    width: 100,
                    textAlign: 'right',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingVertical: 4,
                  }}
                />
              </View>
            </View>

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
                      backgroundColor: colors.primary,
                      width: `${sliderValue}%` 
                    }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {tokenCount.toFixed(2)} of {availableTokens.toLocaleString()} available
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
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
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
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: 'bold' }}>
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
                backgroundColor: hasSufficientBalance ? colors.primary : colors.muted,
                opacity: (hasSufficientBalance && !isInvesting) ? 1 : 0.5,
              }}
              disabled={!hasSufficientBalance || isInvesting || tokenCount <= 0}
            >
              <Text style={{ 
                color: hasSufficientBalance ? colors.primaryForeground : colors.textMuted, 
                fontSize: 16, 
                fontWeight: 'bold', 
                textAlign: 'center' 
              }}              >
                {isInvesting
                  ? 'Processing...'
                  : tokenCount <= 0
                  ? 'Enter Amount'
                  : hasSufficientBalance
                  ? 'Confirm Investment'
                  : 'Insufficient Balance'}
              </Text>
            </TouchableOpacity>
            {!hasSufficientBalance && tokenCount > 0 && (
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
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

