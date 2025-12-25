import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { AppAlert } from '@/components/AppAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { walletApi, OneLinkQrResponse } from '@/services/api/wallet.api';

// Validation constants for PKR
const VALIDATION_RULES = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 500000,
};

// Validation helper
const validateAmount = (value: string): { isValid: boolean; error?: string } => {
  if (!value || value === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (numValue < VALIDATION_RULES.MIN_AMOUNT) {
    return { isValid: false, error: `Minimum deposit is PKR ${VALIDATION_RULES.MIN_AMOUNT}` };
  }

  if (numValue > VALIDATION_RULES.MAX_AMOUNT) {
    return { isValid: false, error: `Maximum deposit is PKR ${VALIDATION_RULES.MAX_AMOUNT.toLocaleString()}` };
  }

  return { isValid: true };
};

type Step = 'amount' | 'qr-display';

export default function OneLinkQrDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [amountError, setAmountError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [touched, setTouched] = useState(!!suggestedAmount);
  const [qrData, setQrData] = useState<OneLinkQrResponse | null>(null);

  // PKR quick amounts
  const pkrQuickAmounts = [1000, 5000, 10000, 25000];

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

  // Validate amount on change
  useEffect(() => {
    if (touched && amount) {
      const validation = validateAmount(amount);
      setAmountError(validation.error || '');
    } else if (touched && !amount) {
      setAmountError('Amount is required');
    }
  }, [amount, touched]);

  const handleGenerateQr = async () => {
    setTouched(true);
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      setAlertState({
        visible: true,
        title: 'Invalid Amount',
        message: validation.error || 'Please enter a valid amount',
        type: 'warning',
        onConfirm: () => setAlertState((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await walletApi.generateOneLinkQr({
        amountPkr: parseFloat(amount),
        purpose: 'Wallet Top Up',
      });
      setQrData(response);
      setStep('qr-display');
    } catch (error: any) {
      console.error('1LINK QR generation error:', error);
      setAlertState({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to generate QR code. Please try again.',
        type: 'error',
        onConfirm: () => setAlertState((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAmount = (qa: number) => {
    setAmount(qa.toString());
    setTouched(true);
  };

  const isAmountValid = validateAmount(amount).isValid;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Linear Gradient Background */}
      <LinearGradient
        colors={
          isDarkColorScheme
            ? ['#00C896', '#064E3B', '#032822', '#021917']
            : ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#FFFFFF']
        }
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* App Alert */}
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={
          alertState.onConfirm || (() => setAlertState((prev) => ({ ...prev, visible: false })))
        }
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: 'transparent',
        }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              if (step === 'qr-display') {
                setStep('amount');
                setQrData(null);
              } else {
                router.back();
              }
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
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            {step === 'amount' ? '1LINK QR Payment' : 'Scan to Pay'}
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {step === 'amount' ? (
            <>
              {/* Info Card */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginTop: 24,
                  marginBottom: 24,
                  backgroundColor: isDarkColorScheme
                    ? 'rgba(0, 0, 0, 0.5)'
                    : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: 1.5,
                  borderColor: isDarkColorScheme
                    ? 'rgba(0, 166, 81, 0.5)'
                    : 'rgba(0, 166, 81, 0.3)',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(0, 166, 81, 0.2)'
                        : 'rgba(0, 166, 81, 0.15)',
                    }}>
                    <MaterialIcons name="qr-code-2" size={22} color="#00A651" />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 13,
                      lineHeight: 20,
                      color: colors.textSecondary,
                    }}>
                    Enter the deposit amount in PKR. You'll receive a QR code to scan with any
                    Pakistani bank app supporting 1LINK.
                  </Text>
                </View>
              </View>

              {/* Amount Input */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: 12,
                  }}>
                  Deposit Amount (PKR)
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(0, 0, 0, 0.5)'
                      : 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      amountError && touched
                        ? colors.destructive
                        : !amountError && touched && amount
                          ? colors.primary
                          : 'transparent',
                    paddingHorizontal: 16,
                    height: 56,
                  }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginRight: 8,
                    }}>
                    PKR
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      if (cleaned.length <= 10) {
                        setAmount(cleaned);
                        setTouched(true);
                      }
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={{
                      flex: 1,
                      fontSize: 20,
                      fontWeight: '600',
                      color: colors.textPrimary,
                    }}
                  />
                  {!amountError && touched && amount && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>

                {amountError && touched && (
                  <Text
                    style={{
                      color: colors.destructive,
                      fontSize: 12,
                      marginTop: 6,
                      marginLeft: 4,
                    }}>
                    {amountError}
                  </Text>
                )}

                {/* Quick Amount Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {pkrQuickAmounts.map((qa) => (
                    <TouchableOpacity
                      key={qa}
                      onPress={() => handleQuickAmount(qa)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                        borderRadius: 8,
                        backgroundColor: isDarkColorScheme
                          ? 'rgba(0, 0, 0, 0.3)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                      }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                        {qa >= 1000 ? `${qa / 1000}K` : qa}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Generate QR Button */}
              <TouchableOpacity
                onPress={handleGenerateQr}
                disabled={!isAmountValid || isProcessing}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isAmountValid && !isProcessing ? '#00A651' : colors.muted,
                  opacity: isAmountValid && !isProcessing ? 1 : 0.5,
                  marginBottom: 32,
                }}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: isAmountValid ? '#FFFFFF' : colors.textMuted,
                      fontSize: 16,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}>
                    Generate QR Code
                  </Text>
                )}
              </TouchableOpacity>

              {/* Supported Banks Note */}
              <View
                style={{
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isDarkColorScheme
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderWidth: 1.5,
                  borderColor: isDarkColorScheme
                    ? 'rgba(234, 179, 8, 0.5)'
                    : 'rgba(234, 179, 8, 0.3)',
                  marginBottom: 24,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(234, 179, 8, 0.15)',
                    }}>
                    <MaterialIcons name="info-outline" size={22} color={colors.warning} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 13,
                      lineHeight: 20,
                      color: colors.textSecondary,
                    }}>
                    Works with all major Pakistani banks including HBL, MCB, UBL, ABL, Meezan, JS
                    Bank, Faysal Bank, and more via 1LINK network.
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // QR Display Step
            <>
              {qrData && (
                <View style={{ alignItems: 'center', marginTop: 24 }}>
                  {/* Amount Display */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 24,
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderWidth: 1.5,
                      borderColor: `${colors.primary}66`,
                      alignItems: 'center',
                      width: '100%',
                    }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>
                      Amount to Pay
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 28, fontWeight: 'bold' }}>
                      PKR {parseFloat(qrData.amountPkr).toLocaleString()}
                    </Text>
                  </View>

                  {/* QR Code */}
                  <View
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      backgroundColor: '#FFFFFF',
                      marginBottom: 24,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 5,
                    }}>
                    <Image
                      source={{ uri: qrData.qrCodeDataUri }}
                      style={{ width: 250, height: 250 }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Reference Details */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderWidth: 1,
                      borderColor: colors.border,
                      width: '100%',
                      marginBottom: 24,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Reference ID</Text>
                      <Text
                        style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {qrData.referenceId}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Deposit ID</Text>
                      <Text
                        style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}
                        numberOfLines={1}
                        ellipsizeMode="middle">
                        {qrData.depositId}
                      </Text>
                    </View>
                  </View>

                  {/* Instructions */}
                  <View
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(0, 166, 81, 0.15)'
                        : 'rgba(0, 166, 81, 0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 166, 81, 0.3)',
                      width: '100%',
                      marginBottom: 24,
                    }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '600',
                        marginBottom: 8,
                      }}>
                      How to Pay:
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 22 }}>
                      1. Open your bank's mobile app{'\n'}
                      2. Go to "Scan & Pay" or "QR Payment"{'\n'}
                      3. Scan this QR code{'\n'}
                      4. Confirm the payment amount{'\n'}
                      5. Complete the transaction
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ width: '100%', gap: 12, marginBottom: 32 }}>
                    {/* Generate New QR Button */}
                    <TouchableOpacity
                      onPress={() => {
                        setStep('amount');
                        setQrData(null);
                        setAmount('');
                        setTouched(false);
                      }}
                      style={{
                        width: '100%',
                        paddingVertical: 14,
                        borderRadius: 12,
                        backgroundColor: isDarkColorScheme
                          ? 'rgba(0, 0, 0, 0.5)'
                          : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                      }}>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 16,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}>
                        Generate New QR
                      </Text>
                    </TouchableOpacity>

                    {/* Done Button */}
                    <TouchableOpacity
                      onPress={() => router.replace('/(tabs)/wallet' as any)}
                      style={{
                        width: '100%',
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor: colors.primary,
                      }}>
                      <Text
                        style={{
                          color: colors.primaryForeground,
                          fontSize: 16,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

