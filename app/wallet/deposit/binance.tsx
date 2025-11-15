// Binance Pay Rules:

// ✅ Min: $10
// ✅ Max: $50,000 (crypto payment limits)
// ✅ Max 2 decimal places
// ✅ Numeric only
// ✅ Max length: 10 characters

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { quickAmounts } from '@/data/mockWallet';
import { useWallet } from '@/services/useWallet';

// Validation constants
const VALIDATION_RULES = {
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 50000, // Binance Pay might have different limits
  MAX_DECIMALS: 2,
  AMOUNT_REGEX: /^\d+\.?\d{0,2}$/,
};

// Validation helper
const validateAmount = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  if (!VALIDATION_RULES.AMOUNT_REGEX.test(value)) {
    return { isValid: false, error: 'Invalid amount format' };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue < VALIDATION_RULES.MIN_AMOUNT) {
    return { isValid: false, error: `Minimum deposit is $${VALIDATION_RULES.MIN_AMOUNT}` };
  }

  if (numValue > VALIDATION_RULES.MAX_AMOUNT) {
    return { isValid: false, error: `Maximum deposit is $${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}` };
  }

  return { isValid: true };
};

export default function BinancePayDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { deposit } = useWallet();

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [amountError, setAmountError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const payId = 'BLOCKS_' + Math.random().toString(36).substring(7).toUpperCase();

  // Validate amount on change
  useEffect(() => {
    if (touched && amount) {
      const validation = validateAmount(amount);
      setAmountError(validation.error || '');
    } else if (touched && !amount) {
      setAmountError('Amount is required');
    }
  }, [amount, touched]);

  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    let cleanText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = (cleanText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleanText = cleanText.substring(0, cleanText.lastIndexOf('.'));
    }
    
    // Limit to 2 decimal places
    const parts = cleanText.split('.');
    if (parts[1] && parts[1].length > VALIDATION_RULES.MAX_DECIMALS) {
      cleanText = `${parts[0]}.${parts[1].substring(0, VALIDATION_RULES.MAX_DECIMALS)}`;
    }
    
    // Limit total length
    if (cleanText.length > 10) {
      return;
    }
    
    setAmount(cleanText);
    setTouched(true);
  };

  const handleQuickAmount = (qa: number) => {
    setAmount(qa.toString());
    setTouched(true);
  };

  const handleGenerateQR = () => {
    setTouched(true);
    
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      Alert.alert('Invalid Amount', validation.error || 'Please enter a valid amount');
      return;
    }
    
    setShowQR(true);
  };

  const handleConfirmDeposit = async () => {
    try {
      setIsProcessing(true);
      const depositAmount = parseFloat(amount);
      await deposit(depositAmount, 'Binance Pay');
      router.push({
        pathname: '/wallet/deposit/card-successfull',
        params: {
          amount: depositAmount.toString(),
          method: 'Binance Pay',
        },
      } as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const isAmountValid = validateAmount(amount).isValid;
  const amountNum = parseFloat(amount || '0');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: `${colors.background}CC`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme ? `${colors.card}99` : colors.muted,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Binance Pay
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {/* Binance Logo */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 9999,
            backgroundColor: 'rgba(240, 185, 11, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            borderWidth: 2,
            borderColor: 'rgba(240, 185, 11, 0.3)',
          }}>
            <Text style={{ fontSize: 40 }}>💳</Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
            Pay with Binance
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
            Fast and secure crypto payment
          </Text>
        </View>

        {!showQR ? (
          <>
            {/* Amount Input */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
                  Amount to Deposit
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Min: ${VALIDATION_RULES.MIN_AMOUNT} • Max: ${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                  borderWidth: 2,
                  borderColor: amountError && touched
                    ? '#EF4444'
                    : isAmountValid && touched
                    ? '#F0B90B'
                    : isDarkColorScheme
                    ? 'rgba(240, 185, 11, 0.2)'
                    : 'transparent',
                }}
              >
                <MaterialIcons 
                  name="attach-money" 
                  size={24} 
                  color={amountError && touched ? '#EF4444' : '#F0B90B'} 
                />
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  onBlur={() => setTouched(true)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  maxLength={10}
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: colors.textPrimary,
                  }}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                  USDC
                </Text>
              </View>

              {/* Validation Error/Success Message */}
              {amountError && touched && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontSize: 13, marginLeft: 6 }}>
                    {amountError}
                  </Text>
                </View>
              )}

              {isAmountValid && touched && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#F0B90B" />
                  <Text style={{ color: '#F0B90B', fontSize: 13, marginLeft: 6 }}>
                    Valid amount
                  </Text>
                </View>
              )}

              {/* Quick Amount Buttons */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {quickAmounts.map((qa) => (
                  <TouchableOpacity
                    key={qa}
                    onPress={() => handleQuickAmount(qa)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 9999,
                      backgroundColor: amount === qa.toString()
                        ? '#F0B90B'
                        : isDarkColorScheme
                        ? `${colors.card}66`
                        : colors.muted,
                      borderWidth: amount === qa.toString() ? 0 : 1,
                      borderColor: amount === qa.toString() ? 'transparent' : 'rgba(240, 185, 11, 0.2)',
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 14,
                        fontWeight: '600',
                        color: amount === qa.toString()
                          ? '#000000'
                          : colors.textPrimary,
                      }}
                    >
                      ${qa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Benefits */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>
                Why Binance Pay?
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color="#F0B90B" />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary, fontSize: 14 }}>
                    Instant deposits (1-2 minutes)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color="#F0B90B" />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary, fontSize: 14 }}>
                    Zero transaction fees
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color="#F0B90B" />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary, fontSize: 14 }}>
                    Bank-level security
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="check-circle" size={20} color="#F0B90B" />
                  <Text style={{ marginLeft: 12, color: colors.textSecondary, fontSize: 14 }}>
                    24/7 customer support
                  </Text>
                </View>
              </View>
            </View>

            {/* Fee Info */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  Deposit Amount
                </Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
                  ${amountNum.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  Processing Fee
                </Text>
                <Text style={{ color: '#F0B90B', fontWeight: '500' }}>$0.00</Text>
              </View>
              <View style={{ height: 1, marginVertical: 8, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
                  You'll Receive
                </Text>
                <Text style={{ color: '#F0B90B', fontWeight: 'bold', fontSize: 16 }}>
                  ${amountNum.toFixed(2)} USDC
                </Text>
              </View>
            </View>

            {/* Info Note */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: 'rgba(240, 185, 11, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(240, 185, 11, 0.2)',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle" size={20} color="#F0B90B" />
                <Text style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 12,
                  lineHeight: 18,
                  color: colors.textSecondary,
                }}>
                  You'll need the Binance app installed to complete this payment. The QR code will be generated after you proceed.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* QR Code Screen */}
            <View style={{
              alignItems: 'center',
              padding: 24,
              borderRadius: 16,
              marginBottom: 24,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                Scan to Pay
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                Amount: ${amountNum.toFixed(2)} USDC
              </Text>
              <View style={{
                width: 224,
                height: 224,
                backgroundColor: '#FFFFFF',
                padding: 12,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 4,
                borderColor: '#F0B90B',
              }}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=binancepay://${payId}?amount=${amountNum}`,
                  }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
              <View style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme ? colors.background : colors.muted,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: colors.textPrimary,
                  fontWeight: '600',
                }}>
                  {payId}
                </Text>
              </View>
              <Text style={{
                textAlign: 'center',
                marginTop: 16,
                color: colors.textSecondary,
                fontSize: 13,
                lineHeight: 20,
              }}>
                Open Binance app → Tap Pay → Scan this QR code to complete payment
              </Text>
            </View>

            {/* Status */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: 'rgba(240, 185, 11, 0.3)',
              marginBottom: 16,
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: '#F0B90B',
                marginRight: 12,
              }} />
              <Text style={{ color: '#F0B90B', fontWeight: '600' }}>Waiting for payment...</Text>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirmDeposit}
              disabled={isProcessing}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 16 }}>
                {isProcessing ? 'Processing...' : 'I\'ve Completed Payment'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowQR(false)}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel Payment</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!showQR && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: `${colors.background}CC`,
          }}
        >
          <TouchableOpacity
            onPress={handleGenerateQR}
            disabled={!isAmountValid || !amount}
            style={{
              backgroundColor: (!isAmountValid || !amount) ? colors.border : '#F0B90B',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ 
              color: (!isAmountValid || !amount) ? colors.textMuted : '#000000', 
              fontSize: 18, 
              fontWeight: 'bold' 
            }}>
              {!amount 
                ? 'Enter Amount' 
                : !isAmountValid 
                ? 'Invalid Amount' 
                : 'Generate Payment QR'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}