import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { quickAmounts } from '@/data/mockWallet';
import { AppAlert } from '@/components/AppAlert';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import { bankTransfersAPI } from '@/services/api/bank-transfers.api';
import { linkedBankAccountsApi, LinkedBankAccount } from '@/services/api/linked-bank-accounts.api';

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
  
  // Get current route path for return navigation
  const currentRoute = '/wallet/deposit/bank-transfer';

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
  
  // Linked bank accounts
  const [linkedBankAccounts, setLinkedBankAccounts] = useState<LinkedBankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<LinkedBankAccount | null>(null);
  const [showBankAccountSelector, setShowBankAccountSelector] = useState(false);
  const [loadingLinkedAccounts, setLoadingLinkedAccounts] = useState(false);

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

  // Fetch bank details from backend (Blocks' bank account)
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

  // Load linked bank accounts
  const loadLinkedAccounts = async () => {
    try {
      setLoadingLinkedAccounts(true);
      const accounts = await linkedBankAccountsApi.getLinkedBankAccounts();
      // Filter out disabled accounts (soft-deleted)
      const activeAccounts = accounts.filter(acc => acc.status !== 'disabled');
      setLinkedBankAccounts(activeAccounts);
      
      // Auto-select default account if available
      const defaultAccount = activeAccounts.find(acc => acc.isDefault && acc.status === 'verified');
      if (defaultAccount) {
        setSelectedBankAccount(defaultAccount);
      } else if (activeAccounts.length > 0) {
        const firstVerified = activeAccounts.find(acc => acc.status === 'verified');
        if (firstVerified) {
          setSelectedBankAccount(firstVerified);
        }
      }
    } catch (error) {
      console.error('Error loading linked bank accounts:', error);
    } finally {
      setLoadingLinkedAccounts(false);
    }
  };

  useEffect(() => {
    loadLinkedAccounts();
  }, []);

  // Reload bank accounts when screen comes into focus (e.g., returning from linked bank page)
  useFocusEffect(
    useCallback(() => {
      if (step === 'bank-details') {
        loadLinkedAccounts();
      }
    }, [step])
  );

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

      {/* Bank Account Selector Modal */}
      <Modal
        visible={showBankAccountSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBankAccountSelector(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowBankAccountSelector(false)}
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
              maxHeight: '80%',
            }}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 100 : 80,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                Select Bank Account
              </Text>
              <TouchableOpacity
                onPress={() => setShowBankAccountSelector(false)}
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

            {loadingLinkedAccounts ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : linkedBankAccounts.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Ionicons name="card-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                  No bank accounts found
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                  Add a bank account to use it for reference
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowBankAccountSelector(false);
                    router.push({
                      pathname: '../../profilesettings/linkedbank',
                      params: {
                        returnTo: currentRoute,
                        returnAmount: amount,
                      },
                    } as any);
                  }}
                  style={{
                    marginTop: 24,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    Add Bank Account
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {linkedBankAccounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => {
                      setSelectedBankAccount(account);
                      setShowBankAccountSelector(false);
                    }}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: selectedBankAccount?.id === account.id
                        ? isDarkColorScheme
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(34, 197, 94, 0.1)'
                        : isDarkColorScheme
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                      borderWidth: 2,
                      borderColor: selectedBankAccount?.id === account.id
                        ? colors.primary
                        : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                            {account.displayName || account.bankName}
                          </Text>
                          {account.isDefault && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="star" size={14} color={colors.warning} />
                            </View>
                          )}
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {account.accountHolderName}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 }}>
                          ****{account.accountNumber.slice(-4)}
                        </Text>
                      </View>
                      {selectedBankAccount?.id === account.id && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  onPress={() => {
                    setShowBankAccountSelector(false);
                    router.push({
                      pathname: '../../profilesettings/linkedbank',
                      params: {
                        returnTo: currentRoute,
                        returnAmount: amount,
                      },
                    } as any);
                  }}
                  style={{
                    marginTop: 8,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderStyle: 'dashed',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                    Add New Bank Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

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

              {/* Linked Bank Account Selector */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 12,
                  paddingLeft: 4,
                }}>
                  Your Bank Account (for reference)
                </Text>
                
                {linkedBankAccounts.length > 0 ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowBankAccountSelector(true)}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                        borderWidth: 1.5,
                        borderColor: selectedBankAccount 
                          ? colors.primary 
                          : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {selectedBankAccount ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                              {selectedBankAccount.displayName || selectedBankAccount.bankName}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                              {selectedBankAccount.accountHolderName} • ****{selectedBankAccount.accountNumber.slice(-4)}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            Select a bank account
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </View>
                      )}
                    </TouchableOpacity>
                    
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '../../profilesettings/linkedbank',
                      params: {
                        returnTo: currentRoute,
                        returnAmount: amount,
                      },
                    } as any)}
                    style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 4, fontWeight: '600' }}>
                      Add Bank Account
                    </Text>
                  </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '../../profilesettings/linkedbank',
                      params: {
                        returnTo: currentRoute,
                        returnAmount: amount,
                      },
                    } as any)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                      borderWidth: 1.5,
                      borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                      borderStyle: 'dashed',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 14, marginTop: 8, fontWeight: '600' }}>
                      Add Bank Account
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                      Link your bank account for reference
                    </Text>
                  </TouchableOpacity>
                )}
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
                  Blocks Bank Account Details
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
