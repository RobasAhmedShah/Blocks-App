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
  Modal,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { AppAlert } from '@/components/AppAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { useWallet } from '@/services/useWallet';
import { bankWithdrawalsAPI } from '@/services/api/bank-withdrawals.api';

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
  const { balance, transactions } = useWallet();

  // Calculate locked/pending amount
  const pendingWithdrawals = transactions
    .filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const pendingDeposits = balance.pendingDeposits || 0;
  const lockedAmount = pendingWithdrawals + pendingDeposits;
  const availableBalance = balance.usdc;

  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    iban: '',
    bankName: '',
    swiftCode: '',
    branch: '',
  });
  const [hasBankDetails, setHasBankDetails] = useState(false);

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

  const handleSaveBankDetails = () => {
    // Validate required fields
    if (!bankDetails.accountName.trim()) {
      setAlertState({
        visible: true,
        title: 'Missing Information',
        message: 'Please enter account holder name.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    if (!bankDetails.accountNumber.trim()) {
      setAlertState({
        visible: true,
        title: 'Missing Information',
        message: 'Please enter account number.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    if (!bankDetails.bankName.trim()) {
      setAlertState({
        visible: true,
        title: 'Missing Information',
        message: 'Please enter bank name.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    // Save bank details
    setHasBankDetails(true);
    setShowBankDetailsModal(false);
  };

  const isFormValid = () => {
    const baseValidation = 
      amount &&
      !amountError &&
      withdrawAmount >= VALIDATION_RULES.MIN_AMOUNT &&
      withdrawAmount <= availableBalance &&
      selectedMethod &&
      isConfirmed;

    // If bank transfer is selected, require bank details
    if (selectedMethod === 'bank' && !hasBankDetails) {
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
      // Create withdrawal request via backend API
      const request = await bankWithdrawalsAPI.createRequest({
        amountUSDT: withdrawAmount,
        userBankAccountName: bankDetails.accountName.trim(),
        userBankAccountNumber: bankDetails.accountNumber.trim(),
        userBankIban: bankDetails.iban.trim() || undefined,
        userBankName: bankDetails.bankName.trim(),
        userBankSwiftCode: bankDetails.swiftCode.trim() || undefined,
        userBankBranch: bankDetails.branch.trim() || undefined,
      });

      console.log('Withdrawal request created:', request);

      // Navigate to success screen (don't pass BWR- code to user)
      router.push({
        pathname: '/wallet/withdraw-success',
        params: {
          amount: withdrawAmount.toString(),
          method: 'Bank Transfer',
        },
      } as any);
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit withdrawal request. Please try again.';
      setAlertState({
        visible: true,
        title: 'Error',
        message: errorMessage,
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

      {/* Bank Details Entry Modal */}
      <Modal
        visible={showBankDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankDetailsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowBankDetailsModal(false)}
            style={{
              flex: 1,
              backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            }}
          />
          <ScrollView
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              maxHeight: '80%',
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                Bank Account Details
              </Text>
              <TouchableOpacity
                onPress={() => setShowBankDetailsModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 20 }}>
              Enter your bank account details to receive withdrawals
            </Text>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Account Holder Name *
                </Text>
                <TextInput
                  value={bankDetails.accountName}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, accountName: text })}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Account Number *
                </Text>
                <TextInput
                  value={bankDetails.accountNumber}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, accountNumber: text })}
                  placeholder="1234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Bank Name *
                </Text>
                <TextInput
                  value={bankDetails.bankName}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, bankName: text })}
                  placeholder="Standard Chartered Bank"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  IBAN (Optional)
                </Text>
                <TextInput
                  value={bankDetails.iban}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, iban: text })}
                  placeholder="GB29 NWBK 6016 1331 9268 19"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  SWIFT Code (Optional)
                </Text>
                <TextInput
                  value={bankDetails.swiftCode}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, swiftCode: text })}
                  placeholder="SCBLPKKA"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }}
                />
              </View>

              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Branch (Optional)
                </Text>
                <TextInput
                  value={bankDetails.branch}
                  onChangeText={(text) => setBankDetails({ ...bankDetails, branch: text })}
                  placeholder="Main Branch, Karachi"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveBankDetails}
              disabled={!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim()}
              style={{
                backgroundColor: (!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim()) ? colors.border : colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 20,
                opacity: (!bankDetails.accountName.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim()) ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                Save Bank Details
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

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
                ? 'rgba(189, 192, 31, 0.36)'
                : 'rgba(255, 255, 255, 0.9)',
              // borderWidth: 1,
              // borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
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
          
          <View style={{ paddingTop: 8, paddingBottom: 10 }}>
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
                  paddingLeft: 5,
                  marginBottom: 5,
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
              <View style={{ flexDirection: 'row', gap: 8 }}
              className='px-1'>
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
                  marginBottom: 5,
                  paddingLeft: 5,
                }}>
                Withdrawal Method
              </Text>

              {/* Bank Transfer Option */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedMethod('bank');
                  if (!hasBankDetails) {
                    setShowBankDetailsModal(true);
                  }
                }}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 5,
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
                      Linked Bank Account 1-3 business days | No Fee
                    </Text>
                    {/* <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      1-3 business days | No Fee
                    </Text> */}
                  </View>
                  {selectedMethod === 'bank' && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>

                {/* Display Saved Bank Details */}
                {selectedMethod === 'bank' && hasBankDetails && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}>
                    <View style={{ gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>
                            Account Name
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                            {bankDetails.accountName}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setShowBankDetailsModal(true)}
                          style={{ padding: 4 }}>
                          <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      <View>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>
                          Account Number
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                          {bankDetails.accountNumber}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>
                          Bank
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                          {bankDetails.bankName}
                        </Text>
                      </View>
                    </View>
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
                marginBottom: 2,
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
                padding: 12,
                borderRadius: 12,
                // backgroundColor: isDarkColorScheme
                //   ? 'rgba(0, 0, 0, 0.3)'
                //   : 'rgba(255, 255, 255, 0.6)',
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
            {/* <View
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
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
