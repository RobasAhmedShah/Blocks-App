import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { AppAlert } from '@/components/AppAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useWallet } from '@/services/useWallet';

// Validation constants
const VALIDATION_RULES = {
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 100000,
};

// Fee structure
const FEES = {
  BANK_TRANSFER: 0, // No fee for bank transfer
  ONCHAIN: 2.5, // $2.50 flat fee for on-chain
};

type WithdrawMethod = 'bank' | 'onchain';

export default function WithdrawScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { addBankTransferWithdrawal } = useApp();
  const { balance, transactions } = useWallet();

  // Calculate locked/pending amount
  const pendingWithdrawals = transactions
    .filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const pendingDeposits = balance.pendingDeposits || 0;
  const lockedAmount = pendingWithdrawals + pendingDeposits;
  const availableBalance = balance.usdc;

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod>('bank');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false); // TODO: Check from actual payment methods API
  const [showIbanInput, setShowIbanInput] = useState(false);
  const [ibanNumber, setIbanNumber] = useState('');

  // Alert state
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Calculate fee and final amount
  const withdrawAmount = parseFloat(amount) || 0;
  const fee = selectedMethod === 'bank' ? FEES.BANK_TRANSFER : FEES.ONCHAIN;
  const youWillReceive = withdrawAmount > 0 ? withdrawAmount - fee : 0;

  // Validate amount
  useEffect(() => {
    if (!amount) {
      setAmountError('');
      return;
    }

    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      setAmountError('Please enter a valid number');
      return;
    }

    if (numAmount < VALIDATION_RULES.MIN_AMOUNT) {
      setAmountError(`Minimum withdrawal is $${VALIDATION_RULES.MIN_AMOUNT}`);
      return;
    }

    if (numAmount > availableBalance) {
      setAmountError(`Insufficient balance. Available: $${availableBalance.toFixed(2)}`);
      return;
    }

    if (numAmount > VALIDATION_RULES.MAX_AMOUNT) {
      setAmountError(`Maximum withdrawal is $${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}`);
      return;
    }

    setAmountError('');
  }, [amount, availableBalance]);

  const handleAmountChange = (text: string) => {
    // Allow empty string, numbers, and single decimal point
    if (text === '' || /^\d*\.?\d{0,2}$/.test(text)) {
      setAmount(text);
      // Reset selected quick amount when user manually types
      setSelectedQuickAmount(null);
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const calculatedAmount = (availableBalance * percentage) / 100;
    setAmount(calculatedAmount.toFixed(2));
    setSelectedQuickAmount(percentage);
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toFixed(2));
    setSelectedQuickAmount(100);
  };

  const handleAddIban = () => {
    if (ibanNumber.trim().length < 15) {
      setAlertState({
        visible: true,
        title: 'Invalid IBAN',
        message: 'Please enter a valid IBAN number (minimum 15 characters).',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }
    // Save IBAN and mark as having payment method
    setHasPaymentMethod(true);
    setShowIbanInput(false);
    setAlertState({
      visible: true,
      title: 'IBAN Added',
      message: 'Your IBAN has been added successfully.',
      type: 'success',
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const isFormValid = () => {
    const baseValidation = 
      amount &&
      !amountError &&
      withdrawAmount >= VALIDATION_RULES.MIN_AMOUNT &&
      withdrawAmount <= availableBalance &&
      selectedMethod &&
      isConfirmed;

    // If bank transfer is selected and no payment method, require IBAN or payment method
    if (selectedMethod === 'bank' && !hasPaymentMethod) {
      return false;
    }

    return baseValidation;
  };

  const handleWithdraw = async () => {
    if (!isFormValid()) return;

    if (selectedMethod === 'onchain') {
      setAlertState({
        visible: true,
        title: 'Coming Soon',
        message: 'On-chain withdrawals will be available soon. Please use bank transfer for now.',
        type: 'info',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Add withdrawal to context (frontend-only)
      const bankDetails = {
        accountHolderName: 'Saved Bank Account',
        accountNumber: '****1234',
        bankName: 'Standard Chartered Bank',
        iban: '',
        swiftCode: '',
      };
      
      await addBankTransferWithdrawal(withdrawAmount, bankDetails);

      // Show success alert
      setAlertState({
        visible: true,
        title: 'Withdrawal Request Submitted',
        message: 'Your withdrawal request has been submitted successfully. Processing may take 1-3 business days. You will be notified once the funds are transferred.',
        type: 'success',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
          router.push('/(tabs)/wallet');
        },
      });
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setAlertState({
        visible: true,
        title: 'Error',
        message: 'Failed to submit withdrawal request. Please try again.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* App Alert */}
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm || (() => {
          setAlertState(prev => ({ ...prev, visible: false }));
        })}
      />

      {/* Linear Gradient Background */}
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
                '#ECFDF5', // Light green (top)
                '#D1FAE5', // Pale green
                '#A7F3D0', // Soft green
                '#FFFFFF', // White (bottom)
              ]
        }
        locations={[0, 0.6, 0.8, 1]} // 40% green, then transition to black
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

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: 'transparent',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme
                ? 'rgba(0, 0, 0, 0.4)'
                : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Withdraw Funds
          </Text>
          <TouchableOpacity
            onPress={() => {
              setAlertState({
                visible: true,
                title: 'Withdrawal Information',
                message: 'Withdrawals are processed within 1-3 business days. Bank transfers have no fees, while on-chain transfers incur network fees.',
                type: 'info',
                onConfirm: () => {
                  setAlertState(prev => ({ ...prev, visible: false }));
                },
              });
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme
                ? 'rgba(0, 0, 0, 0.4)'
                : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }}>
            <Ionicons name="information-circle-outline" size={24} color={colors.warning} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <View style={{ paddingTop: 8, paddingBottom: 100 }}>
            {/* Balance Card */}
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                marginBottom: 20,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              }}>
              <View style={{ marginBottom: lockedAmount > 0 ? 12 : 0 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>
                  Available Balance
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ color: colors.primary, fontSize: 32, fontWeight: 'bold' }}>
                    ${availableBalance.toFixed(2)}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                    USDC
                  </Text>
                </View>
              </View>

              {/* Locked/Pending Amount */}
              {lockedAmount > 0 && (
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="lock-closed" size={16} color={colors.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        Locked / Pending: <Text style={{ color: colors.warning, fontWeight: '600' }}>${lockedAmount.toFixed(2)}</Text>
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        Pending funds are not available for withdrawal
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Withdraw Amount Section */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 12,
                }}>
                Withdrawal Amount
              </Text>

              {/* Amount Input with Asset Selector */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkColorScheme
                    ? 'rgba(0, 0, 0, 0.5)'
                    : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: amountError ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  paddingHorizontal: 16,
                  height: 60,
                  marginBottom: 12,
                }}>
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '600', marginRight: 8 }}>
                  $
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    color: colors.textPrimary,
                    fontSize: 24,
                    fontWeight: '600',
                  }}
                />
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                    USDC
                  </Text>
                </View>
              </View>

              {/* Error Message */}
              {amountError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 }}>
                  <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={{ color: colors.destructive, fontSize: 13, marginLeft: 6 }}>
                    {amountError}
                  </Text>
                </View>
              )}

              {/* Quick Amount Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleQuickAmount(25)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: selectedQuickAmount === 25
                      ? isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(34, 197, 94, 0.15)'
                      : isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1.5,
                    borderColor: selectedQuickAmount === 25
                      ? colors.primary
                      : isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(0, 0, 0, 0.1)',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: selectedQuickAmount === 25 ? colors.primary : colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    25%
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuickAmount(50)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: selectedQuickAmount === 50
                      ? isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(34, 197, 94, 0.15)'
                      : isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1.5,
                    borderColor: selectedQuickAmount === 50
                      ? colors.primary
                      : isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(0, 0, 0, 0.1)',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: selectedQuickAmount === 50 ? colors.primary : colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    50%
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleMaxAmount}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: selectedQuickAmount === 100
                      ? isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'rgba(34, 197, 94, 0.15)'
                      : isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1.5,
                    borderColor: selectedQuickAmount === 100
                      ? colors.primary
                      : isDarkColorScheme
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(0, 0, 0, 0.1)',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: selectedQuickAmount === 100 ? colors.primary : colors.textPrimary,
                      fontSize: 15,
                      fontWeight: '600',
                    }}>
                    MAX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Withdraw Method Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '600',
                  marginBottom: 12,
                }}>
                Withdrawal Method
              </Text>

              {/* Bank Transfer Option */}
              <TouchableOpacity
                onPress={() => setSelectedMethod('bank')}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  backgroundColor: selectedMethod === 'bank'
                    ? isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(34, 197, 94, 0.1)'
                    : isDarkColorScheme
                      ? 'rgba(0, 0, 0, 0.5)'
                      : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 2,
                  borderColor: selectedMethod === 'bank'
                    ? colors.primary
                    : isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(0, 0, 0, 0.1)',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selectedMethod === 'bank'
                        ? isDarkColorScheme
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(34, 197, 94, 0.2)'
                        : 'transparent',
                      borderWidth: selectedMethod === 'bank' ? 2 : 0,
                      borderColor: colors.primary,
                    }}>
                    <MaterialIcons 
                      name="account-balance" 
                      size={24} 
                      color={selectedMethod === 'bank' ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: '700',
                        marginBottom: 4,
                      }}>
                      Bank Transfer
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                      Linked Bank Account
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      1-3 business days | No Fee
                    </Text>
                  </View>
                  {selectedMethod === 'bank' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>

                {/* IBAN Input Section - Show when bank transfer is selected and no payment method exists */}
                {selectedMethod === 'bank' && !hasPaymentMethod && (
                  <View
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTopWidth: 1,
                      borderTopColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                      Please add your IBAN to continue
                    </Text>

                    {/* Add IBAN Option */}
                    <TouchableOpacity
                      onPress={() => setShowIbanInput(!showIbanInput)}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                        borderWidth: 1,
                        borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                        marginBottom: showIbanInput ? 12 : 0,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons name="card-outline" size={20} color={colors.primary} />
                        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                          Add IBAN Number
                        </Text>
                      </View>
                      <Ionicons 
                        name={showIbanInput ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>

                    {/* IBAN Input Field */}
                    {showIbanInput && (
                      <View style={{ paddingHorizontal: 8 }}>
                        <TextInput
                          value={ibanNumber}
                          onChangeText={setIbanNumber}
                          placeholder="Enter IBAN (e.g., GB29 NWBK 6016 1331 9268 19)"
                          placeholderTextColor={colors.textMuted}
                          autoCapitalize="characters"
                          style={{
                            backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                            color: colors.textPrimary,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 12,
                            fontSize: 14,
                            borderWidth: 1.5,
                            borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                            marginBottom: 8,
                          }}
                        />
                        <TouchableOpacity
                          onPress={handleAddIban}
                          disabled={ibanNumber.trim().length < 15}
                          style={{
                            backgroundColor: ibanNumber.trim().length < 15 ? colors.border : colors.primary,
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                            opacity: ibanNumber.trim().length < 15 ? 0.6 : 1,
                          }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                            Add IBAN
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {/* On-Chain Transfer Option */}
              <TouchableOpacity
                onPress={() => setSelectedMethod('onchain')}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: selectedMethod === 'onchain'
                    ? isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(34, 197, 94, 0.1)'
                    : isDarkColorScheme
                      ? 'rgba(0, 0, 0, 0.5)'
                      : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 2,
                  borderColor: selectedMethod === 'onchain'
                    ? colors.primary
                    : isDarkColorScheme
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(0, 0, 0, 0.1)',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selectedMethod === 'onchain'
                        ? isDarkColorScheme
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(34, 197, 94, 0.2)'
                        : 'transparent',
                      borderWidth: selectedMethod === 'onchain' ? 2 : 0,
                      borderColor: colors.primary,
                    }}>
                    <MaterialIcons 
                      name="account-balance-wallet" 
                      size={24} 
                      color={selectedMethod === 'onchain' ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: '700',
                        marginBottom: 4,
                      }}>
                      On-Chain Transfer
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                      Withdraw to a crypto wallet instantly
                    </Text>
                  </View>
                  <Ionicons 
                    name={selectedMethod === 'onchain' ? 'checkmark-circle' : 'chevron-forward'} 
                    size={24} 
                    color={selectedMethod === 'onchain' ? colors.primary : colors.textMuted} 
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Fee Summary Card */}
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                marginBottom: 20,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              }}>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    Withdrawal Amount
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                    ${withdrawAmount.toFixed(2)} USDC
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    Fee
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '500' }}>
                    ${fee.toFixed(2)} USDC
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    marginVertical: 2,
                  }}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>
                    You Will Receive
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
                    ${youWillReceive.toFixed(2)} USDC
                  </Text>
                </View>
              </View>
            </View>

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              onPress={() => setIsConfirmed(!isConfirmed)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                padding: 16,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(255, 255, 255, 0.6)',
              }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isConfirmed ? colors.primary : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  backgroundColor: isConfirmed ? colors.primary : 'transparent',
                }}>
                {isConfirmed && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, flex: 1 }}>
                I confirm the details are correct
              </Text>
            </TouchableOpacity>

            {/* Withdraw Button */}
            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={!isFormValid() || isProcessing}
              style={{
                backgroundColor: isFormValid() && !isProcessing ? colors.warning : colors.border,
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                opacity: isFormValid() && !isProcessing ? 1 : 0.6,
                marginBottom: 16,
              }}>
              {isProcessing ? (
                <ActivityIndicator size="small" color={isDarkColorScheme ? '#000000' : '#000000'} />
              ) : (
                <Text
                  style={{
                    color: isFormValid() ? (isDarkColorScheme ? '#000000' : '#000000') : colors.textMuted,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                  Withdraw
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer Note */}
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(59, 130, 246, 0.1)',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Ionicons name="information-circle" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 }}>
                  Withdrawals may take 1–3 business days to process. You will be notified once the transfer is complete.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
