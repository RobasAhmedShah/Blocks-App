// Rules:

// ✅ Min: $10
// ✅ Max: $100,000
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
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { quickAmounts } from '@/data/mockWallet';
import { useWallet } from '@/services/useWallet';
import { paymentMethodsApi, PaymentMethod } from '@/services/api/paymentMethods.api';

// Validation constants
const VALIDATION_RULES = {
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 100000,
  MAX_DECIMALS: 2,
  AMOUNT_REGEX: /^\d+\.?\d{0,2}$/,
};

// Validation helper functions
const validateAmount = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  // Check if it matches the decimal pattern
  if (!VALIDATION_RULES.AMOUNT_REGEX.test(value)) {
    return { isValid: false, error: 'Invalid amount format' };
  }

  const numValue = parseFloat(value);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  // Check minimum amount
  if (numValue < VALIDATION_RULES.MIN_AMOUNT) {
    return { isValid: false, error: `Minimum deposit is $${VALIDATION_RULES.MIN_AMOUNT}` };
  }

  // Check maximum amount
  if (numValue > VALIDATION_RULES.MAX_AMOUNT) {
    return { isValid: false, error: `Maximum deposit is $${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}` };
  }

  return { isValid: true };
};

export default function CardDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount, selectedMethodId } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { deposit, loadWallet } = useWallet();

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [amountError, setAmountError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [touched, setTouched] = useState(false);
  
  // Payment method selection
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  // Load payment methods on mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Handle returning from add card screen
  useEffect(() => {
    if (selectedMethodId && paymentMethods.length > 0) {
      const method = paymentMethods.find(m => m.id === selectedMethodId);
      if (method) {
        setSelectedMethod(method);
      }
    }
  }, [selectedMethodId, paymentMethods]);

  // Validate amount on change
  useEffect(() => {
    if (touched && amount) {
      const validation = validateAmount(amount);
      setAmountError(validation.error || '');
    } else if (touched && !amount) {
      setAmountError('Amount is required');
    }
  }, [amount, touched]);

  const loadPaymentMethods = async () => {
    try {
      setIsLoadingMethods(true);
      const methods = await paymentMethodsApi.getPaymentMethods();
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(m => m.isDefault && m.status === 'verified');
      if (defaultMethod) {
        setSelectedMethod(defaultMethod);
      } else if (methods.length > 0) {
        const firstVerified = methods.find(m => m.status === 'verified');
        if (firstVerified) {
          setSelectedMethod(firstVerified);
        }
      }
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoadingMethods(false);
    }
  };

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
    
    // Limit total length (including decimal)
    if (cleanText.length > 10) {
      return;
    }
    
    setAmount(cleanText);
    setTouched(true);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setShowMethodSelector(false);
  };

  const handleAddNewCard = () => {
    setShowMethodSelector(false);
    router.push({
      pathname: '../profilesettings/addcard',
      params: {
        returnTo: 'wallet/deposit/card',
        returnAmount: amount,
      },
    } as any);
  };

  const handleDeposit = async () => {
    // Mark as touched to show validation errors
    setTouched(true);

    // Validate amount
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      Alert.alert('Invalid Amount', validation.error || 'Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setIsProcessing(true);
      const depositAmount = parseFloat(amount);
      
      // Call deposit with payment method ID
      await deposit(depositAmount, selectedMethod.id);
      
      // Reload wallet to get updated balance
      if (loadWallet) {
        await loadWallet();
      }
      
      router.push({
        pathname: '/wallet/deposit/card-successfull',
        params: {
          amount: depositAmount.toString(),
          method: selectedMethod.provider,
          cardLast4: selectedMethod.cardDetails?.cardNumber || '****',
        },
      } as any);
    } catch (error: any) {
      console.error('Deposit error:', error);
      Alert.alert('Error', error.message || 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAmount = (qa: number) => {
    setAmount(qa.toString());
    setTouched(true);
  };

  // Calculate fees
  const amountNum = parseFloat(amount || '0');
  const processingFee = amountNum * 0.029;
  const youReceive = amountNum - processingFee;
  const isAmountValid = validateAmount(amount).isValid;

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
            Card Deposit
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500' }}>
              Amount
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
                ? colors.primary
                : isDarkColorScheme
                ? `${colors.primary}33`
                : 'transparent',
            }}
          >
            <MaterialIcons 
              name="attach-money" 
              size={24} 
              color={amountError && touched ? '#EF4444' : colors.primary} 
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

          {/* Validation Error Message */}
          {amountError && touched && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 13, marginLeft: 6 }}>
                {amountError}
              </Text>
            </View>
          )}

          {/* Success indicator */}
          {isAmountValid && touched && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 6 }}>
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
                    ? colors.primary
                    : isDarkColorScheme
                    ? `${colors.card}66`
                    : colors.muted,
                  borderWidth: amount === qa.toString() ? 0 : 1,
                  borderColor: amount === qa.toString() ? 'transparent' : `${colors.primary}33`,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '600',
                    color: amount === qa.toString()
                      ? colors.primaryForeground
                      : colors.textPrimary,
                  }}
                >
                  ${qa}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method Selection */}
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 12 }}>
          Payment Method
        </Text>

        {isLoadingMethods ? (
          <View style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: colors.card,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading payment methods...</Text>
          </View>
        ) : selectedMethod ? (
          /* Selected Payment Method Card */
          <TouchableOpacity
            onPress={() => setShowMethodSelector(true)}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: colors.primary,
              marginBottom: 24,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="card" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                    {selectedMethod.provider}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {selectedMethod.cardDetails?.cardNumber || 'Card ending in ****'}
                  </Text>
                  {selectedMethod.isDefault && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={{ color: '#FFD700', fontSize: 12, marginLeft: 4 }}>Default</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowMethodSelector(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  backgroundColor: `${colors.primary}20`,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : (
          /* No Payment Method */
          <TouchableOpacity
            onPress={handleAddNewCard}
            style={{
              padding: 20,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              marginBottom: 24,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginTop: 12 }}>
              No Payment Method
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
              Tap to add a payment method
            </Text>
          </TouchableOpacity>
        )}

        {/* Fee Info */}
        <View style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary }}>
              Deposit Amount
            </Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
              ${amountNum.toFixed(2)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary }}>
              Processing Fee (2.9%)
            </Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
              ${processingFee.toFixed(2)}
            </Text>
          </View>
          <View style={{ height: 1, marginVertical: 8, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
              You'll Receive
            </Text>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
              ${youReceive.toFixed(2)} USDC
            </Text>
          </View>
        </View>

        {/* Security Note */}
        <View style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <MaterialIcons name="lock" size={20} color={colors.primary} />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 12,
              lineHeight: 18,
              color: colors.textSecondary,
            }}>
              Your card details are encrypted and secure. We use industry-standard security measures to protect your information.
            </Text>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Payment Method Selector Modal */}
      <Modal
        visible={showMethodSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMethodSelector(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: 32,
            maxHeight: '80%',
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
                Select Payment Method
              </Text>
              <TouchableOpacity onPress={() => setShowMethodSelector(false)}>
                <Ionicons name="close" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {/* Payment Methods List */}
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => handleSelectMethod(method)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    borderWidth: 2,
                    borderColor: selectedMethod?.id === method.id ? colors.primary : colors.border,
                    marginBottom: 12,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${colors.primary}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons name="card" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
                          {method.provider}
                        </Text>
                        {method.isDefault && (
                          <View style={{ backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                            <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                        {method.cardDetails?.cardNumber || 'Card ending in ****'}
                      </Text>
                      {method.cardDetails && (
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                          Expires {method.cardDetails.expiryMonth}/{method.cardDetails.expiryYear}
                        </Text>
                      )}
                    </View>
                    {selectedMethod?.id === method.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Add New Card Button */}
              <TouchableOpacity
                onPress={handleAddNewCard}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  marginTop: 8,
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 12 }}>
                    Add New Payment Method
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom CTA */}
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
          onPress={handleDeposit}
          disabled={isProcessing || !selectedMethod || !isAmountValid || !amount}
          style={{
            backgroundColor: (!selectedMethod || isProcessing || !isAmountValid || !amount) 
              ? colors.border 
              : colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: 'bold' }}>
              {!amount 
                ? 'Enter Amount' 
                : !isAmountValid 
                ? 'Invalid Amount' 
                : !selectedMethod 
                ? 'Select Payment Method' 
                : 'Deposit Funds'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}