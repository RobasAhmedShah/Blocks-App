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
import { quickAmounts } from '@/data/mockWallet';
import { AppAlert } from '@/components/AppAlert';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { bankTransfersAPI } from '@/services/api/bank-transfers.api';

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

interface ProofState {
  uri: string | null;
  base64: string | null;
  uploaded: boolean;
}

type Step = 'amount' | 'bank-details';

export default function BankTransferDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { addBankTransferDeposit } = useApp();

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [amountError, setAmountError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [touched, setTouched] = useState(!!suggestedAmount);
  
  const [proof, setProof] = useState<ProofState>({
    uri: null,
    base64: null,
    uploaded: false,
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<{
    accountName: string;
    accountNumber: string;
    iban: string;
    bankName: string;
    swiftCode: string;
    branch: string;
  } | null>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);

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

  // Fetch bank details from backend
  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        setLoadingBankDetails(true);
        const details = await bankTransfersAPI.getBankDetails();
        setBankDetails(details);
      } catch (error) {
        console.error('Error fetching bank details:', error);
        // Fallback to hardcoded details if API fails
        setBankDetails({
          accountName: 'Blocks Investment Platform',
          accountNumber: 'PK12BLOCKS0001234567890',
          iban: 'PK12BLOCKS0001234567890',
          bankName: 'Standard Chartered Bank',
          swiftCode: 'SCBLPKKA',
          branch: 'Main Branch, Karachi',
        });
      } finally {
        setLoadingBankDetails(false);
      }
    };
    fetchBankDetails();
  }, []);

  // Validate amount on change
  useEffect(() => {
    if (touched && amount) {
      const validation = validateAmount(amount);
      setAmountError(validation.error || '');
    } else if (touched && !amount) {
      setAmountError('Amount is required');
    }
  }, [amount, touched]);

  const handleContinue = () => {
    setTouched(true);
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      setAlertState({
        visible: true,
        title: 'Invalid Amount',
        message: validation.error || 'Please enter a valid amount',
        type: 'warning',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }
    setStep('bank-details');
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      setAlertState({
        visible: true,
        title: 'Permissions Required',
        message: 'Camera and photo library access is required to upload proof of transfer.',
        type: 'warning',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return false;
    }
    return true;
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Read image as base64 for frontend storage
        try {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: 'base64',
          });
          setProof({
            uri: result.assets[0].uri,
            base64: base64,
            uploaded: true, // Mark as uploaded since we have it locally
          });
        } catch (error) {
          console.error('Error reading image as base64:', error);
          setAlertState({
            visible: true,
            title: 'Error',
            message: 'Failed to process image. Please try again.',
            type: 'error',
            onConfirm: () => {
              setAlertState(prev => ({ ...prev, visible: false }));
            },
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setAlertState({
        visible: true,
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
    }
  };


  const handleSubmit = async () => {
    // Validate proof
    if (!proof.uploaded || !proof.base64) {
      setAlertState({
        visible: true,
        title: 'Proof Required',
        message: 'Please upload proof of transfer before submitting.',
        type: 'warning',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    try {
      setIsProcessing(true);
      const depositAmount = parseFloat(amount);
      
      // Create base64 data URI for proof
      const proofDataUri = `data:image/jpeg;base64,${proof.base64}`;
      
      // Submit to backend API
      const request = await bankTransfersAPI.createRequest({
        amountUSDT: depositAmount,
        proofImageUrl: proofDataUri, // Backend will handle base64 upload
      });
      
      console.log('Bank transfer request created:', request);
      
      // Also add to local storage for pending deposits display (optional)
      if (addBankTransferDeposit) {
        await addBankTransferDeposit(depositAmount, proofDataUri);
      }
      
      // Show success message
      setAlertState({
        visible: true,
        title: 'Request Submitted',
        message: `Your bank transfer deposit request (${request.displayCode}) has been submitted. Verification may take up to 24 hours. You will be notified once it's processed.`,
        type: 'success',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
          // Navigate back to wallet
          router.replace('/(tabs)/wallet' as any);
        },
      });
    } catch (error: any) {
      console.error('Bank transfer deposit error:', error);
      setAlertState({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to submit deposit request. Please try again.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
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
  const canSubmit = proof.uploaded && proof.base64 && !isProcessing;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
      {/* Linear Gradient Background */}
      <LinearGradient
        colors={isDarkColorScheme 
          ? [
            '#00C896',
            '#064E3B',
            '#032822',
            '#021917',
            ]
          : [
              '#ECFDF5',
              '#D1FAE5',
              '#A7F3D0',
              '#FFFFFF',
            ]
        }
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

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

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: 'transparent',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              if (step === 'bank-details') {
                setStep('amount');
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
              backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            {step === 'amount' ? 'Bank Transfer' : 'Bank Details'}
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'amount' ? (
            <>
              {/* Instruction Card */}
              <View style={{
                padding: 16,
                borderRadius: 16,
                marginTop: 24,
                marginBottom: 24,
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.3)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                  }}>
                    <MaterialIcons name="info-outline" size={22} color={colors.warning} />
                  </View>
                  <Text style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.textSecondary,
                  }}>
                    Enter the deposit amount and continue to view bank account details. After transferring funds, upload proof to complete your deposit request.
                  </Text>
                </View>
              </View>

              {/* Amount Input Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 12,
                }}>
                  Deposit Amount
                </Text>
                
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: amountError && touched
                    ? colors.destructive
                    : !amountError && touched && amount
                    ? colors.primary
                    : 'transparent',
                  paddingHorizontal: 16,
                  height: 56,
                }}>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginRight: 8 }}>
                    $
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      if (parts.length > 2) return;
                      if (parts[1] && parts[1].length > VALIDATION_RULES.MAX_DECIMALS) return;
                      if (cleaned.length > 10) return;
                      setAmount(cleaned);
                      setTouched(true);
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
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
                  <Text style={{
                    color: colors.destructive,
                    fontSize: 12,
                    marginTop: 6,
                    marginLeft: 4,
                  }}>
                    {amountError}
                  </Text>
                )}

                {/* Quick Amount Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 12,
                }}>
                  {quickAmounts.map((qa) => (
                    <TouchableOpacity
                      key={qa}
                      onPress={() => handleQuickAmount(qa)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                        ${qa}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                onPress={handleContinue}
                disabled={!isAmountValid}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isAmountValid ? colors.primary : colors.muted,
                  opacity: isAmountValid ? 1 : 0.5,
                  marginBottom: 32,
                }}
              >
                <Text style={{
                  color: isAmountValid ? colors.primaryForeground : colors.textMuted,
                  fontSize: 16,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Instruction Card */}
              <View style={{
                padding: 16,
                borderRadius: 16,
                marginTop: 24,
                marginBottom: 24,
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.3)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDarkColorScheme ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                  }}>
                    <MaterialIcons name="info-outline" size={22} color={colors.warning} />
                  </View>
                  <Text style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.textSecondary,
                  }}>
                    Transfer ${amount} to the bank account below using your bank's app or website. After completing the transfer, upload proof of payment to complete your deposit request.
                  </Text>
                </View>
              </View>

              {/* Bank Details Section */}
              <View style={{
                padding: 16,
                borderRadius: 16,
                marginBottom: 24,
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.2)',
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}>
                  Bank Account Details
                </Text>

                {/* Account Name */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'capitalize',
                  }}>
                    Account Name:
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 1,
                    textAlign: 'right',
                  }}>
                    {bankDetails?.accountName || 'Loading...'}
                  </Text>
                </View>

                {/* Account Number with Copy */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'capitalize',
                  }}>
                    Account Number:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                    <Text
                      selectable
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.textPrimary,
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                      }}
                    >
                      {bankDetails?.accountNumber || 'Loading...'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => bankDetails && handleCopy(bankDetails.accountNumber, 'accountNumber')}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        backgroundColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                      }}
                    >
                      {copiedField === 'accountNumber' ? (
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                      ) : (
                        <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* IBAN with Copy */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}>
                    IBAN:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                    <Text
                      selectable
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: colors.textPrimary,
                        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                      }}
                    >
                      {bankDetails?.iban || 'Loading...'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => bankDetails && handleCopy(bankDetails.iban, 'iban')}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        backgroundColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                      }}
                    >
                      {copiedField === 'iban' ? (
                        <Ionicons name="checkmark" size={16} color="#10B981" />
                      ) : (
                        <Ionicons name="copy-outline" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bank Name */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'capitalize',
                  }}>
                    Bank Name:
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 1,
                    textAlign: 'right',
                  }}>
                    {bankDetails?.bankName || 'Loading...'}
                  </Text>
                </View>

                {/* SWIFT Code */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'capitalize',
                  }}>
                    SWIFT Code:
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 1,
                    textAlign: 'right',
                  }}>
                    {bankDetails?.swiftCode || 'Loading...'}
                  </Text>
                </View>

                {/* Branch */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                }}>
                  <Text style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    textTransform: 'capitalize',
                  }}>
                    Branch:
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.textPrimary,
                    flex: 1,
                    textAlign: 'right',
                  }}>
                    {bankDetails?.branch || 'Loading...'}
                  </Text>
                </View>
              </View>

              {/* Proof Upload Section */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 12,
                }}>
                  Upload Proof of Transfer *
                </Text>

                {proof.uri ? (
                  <View>
                    <Image
                      source={{ uri: proof.uri }}
                      style={{
                        width: '100%',
                        height: 200,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundColor: colors.background,
                      }}
                      resizeMode="contain"
                    />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => pickImage('camera')}
                        style={{
                          flex: 1,
                          padding: 12,
                          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                          borderWidth: 1.5,
                          borderColor: colors.border,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="camera" size={20} color={colors.textPrimary} />
                        <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 4 }}>Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => pickImage('gallery')}
                        style={{
                          flex: 1,
                          padding: 12,
                          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                          borderWidth: 1.5,
                          borderColor: colors.border,
                          borderRadius: 8,
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="images" size={20} color={colors.textPrimary} />
                        <Text style={{ fontSize: 12, color: colors.textPrimary, marginTop: 4 }}>Change</Text>
                      </TouchableOpacity>
                      {proof.uploaded && (
                        <View style={{
                          flex: 1,
                          padding: 12,
                          backgroundColor: isDarkColorScheme 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : 'rgba(16, 185, 129, 0.1)',
                          borderWidth: 1,
                          borderColor: isDarkColorScheme 
                            ? 'rgba(16, 185, 129, 0.3)' 
                            : 'rgba(16, 185, 129, 0.2)',
                          borderRadius: 8,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          <Text style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: '600' }}>Ready</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => pickImage('camera')}
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1.5,
                        borderColor: colors.border,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="camera" size={24} color={colors.textPrimary} />
                      <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8 }}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage('gallery')}
                      style={{
                        flex: 1,
                        padding: 16,
                        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1.5,
                        borderColor: colors.border,
                        borderRadius: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="images" size={24} color={colors.textPrimary} />
                      <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 8 }}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: canSubmit ? colors.primary : colors.muted,
                  opacity: canSubmit ? 1 : 0.5,
                  marginBottom: 32,
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: canSubmit ? colors.primaryForeground : colors.textMuted,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    Submit Deposit Request
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
