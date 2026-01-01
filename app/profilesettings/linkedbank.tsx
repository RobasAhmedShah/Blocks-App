import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ColorValue,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { linkedBankAccountsApi, LinkedBankAccount, CreateLinkedBankAccountDto } from "@/services/api/linked-bank-accounts.api";

export default function LinkedBankAccountsScreen() {
  const router = useRouter();
  const { returnTo, returnAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [bankAccounts, setBankAccounts] = useState<LinkedBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateLinkedBankAccountDto>({
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    bankName: '',
    swiftCode: '',
    branch: '',
    accountType: '',
    displayName: '',
    isDefault: false,
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await linkedBankAccountsApi.getLinkedBankAccounts();
      // Filter out disabled accounts (soft-deleted)
      const activeAccounts = accounts.filter(acc => acc.status !== 'disabled');
      setBankAccounts(activeAccounts);
    } catch (error: any) {
      console.error('Error loading bank accounts:', error);
      Alert.alert('Error', error.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      // Optimistic update
      setBankAccounts(prevAccounts =>
        prevAccounts.map(account => ({
          ...account,
          isDefault: account.id === accountId
        }))
      );

      await linkedBankAccountsApi.setDefaultLinkedBankAccount(accountId, true);
      await loadBankAccounts();
    } catch (error: any) {
      await loadBankAccounts();
      Alert.alert('Error', error.message || 'Failed to set default bank account');
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    Alert.alert(
      "Remove Bank Account",
      "Are you sure you want to remove this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await linkedBankAccountsApi.deleteLinkedBankAccount(accountId);
              await loadBankAccounts();
              Alert.alert('Success', 'Bank account removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove bank account');
            }
          },
        },
      ]
    );
  };

  const handleAddAccount = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    // Reset form
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      iban: '',
      bankName: '',
      swiftCode: '',
      branch: '',
      accountType: '',
      displayName: '',
      isDefault: false,
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.accountHolderName.trim()) {
      Alert.alert('Validation Error', 'Please enter account holder name');
      return;
    }
    if (!formData.accountNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter account number');
      return;
    }
    if (!formData.bankName.trim()) {
      Alert.alert('Validation Error', 'Please enter bank name');
      return;
    }

    try {
      setIsSubmitting(true);
      await linkedBankAccountsApi.createLinkedBankAccount(formData);
      await loadBankAccounts();
      handleCloseModal();
      
      // If we have a return path, navigate back after successful creation
      if (returnTo) {
        // Navigate back immediately without showing alert (or show brief success)
        router.push({
          pathname: returnTo as any,
          params: returnAmount ? { amount: returnAmount } : {},
        } as any);
      } else {
        Alert.alert('Success', 'Bank account added successfully');
      }
    } catch (error: any) {
      console.error('Error creating bank account:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to add bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountDetails = (accountId: string) => {
    router.push({
      pathname: '../profilesettings/bank-account-details',
      params: { accountId },
    } as any);
  };

  // Helper function to mask account number
  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length <= 4) {
      return '****';
    }
    return `****${accountNumber.slice(-4)}`;
  };

  // Helper function to get bank gradient colors
  const getBankGradient = (bankName: string): [ColorValue, ColorValue, ...ColorValue[]] => {
    const bankColors: Record<string, [ColorValue, ColorValue, ...ColorValue[]]> = {
      'Standard Chartered': ['#1A237E', '#283593', '#3949AB'],
      'HBL': ['#E53935', '#C62828', '#B71C1C'],
      'UBL': ['#1B5E20', '#2E7D32', '#388E3C'],
      'MCB': ['#F57C00', '#E65100', '#BF360C'],
      'Allied Bank': ['#00695C', '#004D40', '#003D33'],
    };

    return bankColors[bankName] || (isDarkColorScheme 
      ? ['#1F2937', '#374151', '#4B5563'] 
      : ['#6366F1', '#8B5CF6', '#A855F7']);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

    {/* Header */}
    <View
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Linked Bank Accounts
            </Text>
          </View>

          <View className="w-10" />
        </View>

       
      </View>

              {/* Info Card */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.3)' 
                : 'rgba(13, 165, 165, 0.2)'
            }}
            className="rounded-xl p-4 mb-6"
          >
            <View className="flex-row items-start gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-10 h-10 items-center justify-center rounded-full"
              >
                <Ionicons name="information-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  Secure Banking
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  Your bank accounts are encrypted and secured. You can link multiple accounts and set one as primary for withdrawals.
                </Text>
              </View>
            </View>
          </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }} className="mt-4">
            Loading bank accounts...
          </Text>
        </View>
      ) : (
        <>
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadBankAccounts();
                }}
                tintColor={colors.primary}
              />
            }
          >
            <View className="px-4 py-6">
              {/* Bank Accounts List */}
              <View className="flex flex-col gap-4">
                {bankAccounts.map((account) => {
                  const gradientColors = getBankGradient(account.bankName);
                  return (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => handleAccountDetails(account.id)}
                      activeOpacity={0.9}
                      className="overflow-hidden rounded-xl"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-4"
                      >
                        {/* Primary Badge */}
                        {account.isDefault && (
                          <View className="flex-row items-center gap-1 mb-3">
                            <View className="bg-[#FFD700]/25 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                              <Ionicons name="star" size={14} color="#FFD700" />
                              <Text className="text-[#FFD700] text-xs font-bold">
                                DEFAULT
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Status Badge */}
                        {account.status === 'pending' && (
                          <View className="flex-row items-center gap-1 mb-3">
                            <View className="bg-[#F59E0B]/25 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                              <Ionicons name="time-outline" size={14} color="#F59E0B" />
                              <Text className="text-[#F59E0B] text-xs font-bold">
                                PENDING VERIFICATION
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Card Content */}
                        <View className="flex-row items-center justify-between mb-4">
                          <View className="flex-1">
                            <Text className="text-white text-lg font-bold mb-1">
                              {account.displayName || account.bankName}
                            </Text>
                            <Text className="text-white/80 text-sm">
                              {account.accountType || 'Bank Account'} • {account.accountHolderName}
                            </Text>
                          </View>
                          <View className="w-12 h-12 bg-white/15 rounded-full items-center justify-center backdrop-blur-sm">
                            <Ionicons name="business" size={24} color="white" />
                          </View>
                        </View>

                        {/* Account Number */}
                        <View className="flex-row items-center justify-between mb-4">
                          <Text className="text-white text-base font-mono tracking-widest">
                            {maskAccountNumber(account.accountNumber)}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                        </View>

                        {/* Actions */}
                        <View className="flex-row gap-2">
                          {!account.isDefault && account.status === 'verified' && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleSetPrimary(account.id);
                              }}
                              className="flex-1 bg-white/15 backdrop-blur-sm px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-2"
                              activeOpacity={0.7}
                            >
                              <Ionicons name="star-outline" size={16} color="white" />
                              <Text className="text-white text-xs font-semibold">
                                Set as Default
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleRemoveAccount(account.id);
                            }}
                            className="flex-1 bg-white/10 border border-white/25 px-3 py-2.5 rounded-lg flex-row items-center justify-center gap-2"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
                            <Text className="text-[#ff6b6b] text-xs font-semibold">
                              Remove
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Empty State (if no accounts) */}
              {bankAccounts.length === 0 && (
                <View className="items-center justify-center py-12">
                  <View 
                    style={{ backgroundColor: colors.muted }}
                    className="w-24 h-24 rounded-full items-center justify-center mb-4"
                  >
                    <Ionicons name="card-outline" size={48} color={colors.textMuted} />
                  </View>
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-bold text-center mb-2">
                    No Bank Accounts
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm text-center px-8">
                    Add a bank account to make deposits and withdrawals faster and easier
                  </Text>
                </View>
              )}

              {/* Help Section */}
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.1)' 
                    : 'rgba(13, 165, 165, 0.05)',
                  borderWidth: 1,
                  borderColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.3)' 
                    : 'rgba(13, 165, 165, 0.2)'
                }}
                className="mt-8 rounded-xl p-4"
              >
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  Need Help?
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed mb-3">
                  Having trouble linking your bank account? Our support team is here to help.
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubbles" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                    Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </>
      )}

      {/* Add Account Button - Fixed at Bottom */}
      <View 
        style={{ 
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
        className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4"
      >
        <TouchableOpacity
          onPress={handleAddAccount}
          style={{ backgroundColor: colors.primary }}
          className="h-14 rounded-xl flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text className="text-white text-base font-bold">
            Add Bank Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Bank Account Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleCloseModal}
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
              maxHeight: '90%',
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
                Add Bank Account
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
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
              Enter your bank account details to link it for withdrawals
            </Text>

            <View style={{ gap: 16 }}>
              {/* Display Name (Optional) */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Display Name (Optional)
                </Text>
                <TextInput
                  value={formData.displayName}
                  onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                  placeholder="e.g., My Primary Account"
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

              {/* Account Holder Name */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Account Holder Name *
                </Text>
                <TextInput
                  value={formData.accountHolderName}
                  onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
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

              {/* Account Number */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Account Number *
                </Text>
                <TextInput
                  value={formData.accountNumber}
                  onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
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

              {/* Bank Name */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Bank Name *
                </Text>
                <TextInput
                  value={formData.bankName}
                  onChangeText={(text) => setFormData({ ...formData, bankName: text })}
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

              {/* Account Type */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Account Type (Optional)
                </Text>
                <TextInput
                  value={formData.accountType}
                  onChangeText={(text) => setFormData({ ...formData, accountType: text })}
                  placeholder="e.g., Checking, Savings"
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

              {/* IBAN */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  IBAN (Optional)
                </Text>
                <TextInput
                  value={formData.iban}
                  onChangeText={(text) => setFormData({ ...formData, iban: text })}
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

              {/* SWIFT Code */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  SWIFT Code (Optional)
                </Text>
                <TextInput
                  value={formData.swiftCode}
                  onChangeText={(text) => setFormData({ ...formData, swiftCode: text.toUpperCase() })}
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

              {/* Branch */}
              <View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Branch (Optional)
                </Text>
                <TextInput
                  value={formData.branch}
                  onChangeText={(text) => setFormData({ ...formData, branch: text })}
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

              {/* Set as Default */}
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: formData.isDefault ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor: formData.isDefault ? colors.primary : 'transparent',
                  }}
                >
                  {formData.isDefault && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 14, flex: 1 }}>
                  Set as default account
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !formData.accountHolderName.trim() || !formData.accountNumber.trim() || !formData.bankName.trim()}
              style={{
                backgroundColor: (isSubmitting || !formData.accountHolderName.trim() || !formData.accountNumber.trim() || !formData.bankName.trim()) 
                  ? colors.border 
                  : colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 24,
                marginBottom: 20,
                opacity: (isSubmitting || !formData.accountHolderName.trim() || !formData.accountNumber.trim() || !formData.bankName.trim()) ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Add Bank Account
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}