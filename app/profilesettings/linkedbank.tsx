import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ColorValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { BankAccount } from "@/types/profilesettings";
import { useApp } from "@/contexts/AppContext";

export default function LinkedBankAccountsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, setPrimaryBankAccount, removeBankAccount } = useApp();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(state.bankAccounts);

  // Sync with context when it changes
  React.useEffect(() => {
    setBankAccounts(state.bankAccounts);
  }, [state.bankAccounts]);

  const handleSetPrimary = async (accountId: string) => {
    setBankAccounts(
      bankAccounts.map((account) => ({
        ...account,
        isPrimary: account.id === accountId,
      }))
    );
    await setPrimaryBankAccount(accountId);
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
            setBankAccounts(
              bankAccounts.filter((account) => account.id !== accountId)
            );
            await removeBankAccount(accountId);
          },
        },
      ]
    );
  };

  const handleAddAccount = () => {
    console.log("Navigate to Add Bank Account");
    // router.push("/profile/add-bank-account");
  };

  const handleAccountDetails = (accountId: string) => {
    console.log("View account details:", accountId);
    // router.push(`/profile/bank-account/${accountId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Linked Bank Accounts
        </Text>

        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-4 py-6">
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

          {/* Bank Accounts List */}
          <View className="flex flex-col gap-4">
            {bankAccounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => handleAccountDetails(account.id)}
                activeOpacity={0.9}
                className="overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={account.backgroundColor as [ColorValue, ColorValue, ...ColorValue[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4"
                >
                  {/* Primary Badge */}
                  {account.isPrimary && (
                    <View className="flex-row items-center gap-1 mb-3">
                      <View className="bg-[#D4AF37]/20 px-2 py-1 rounded-full flex-row items-center gap-1">
                        <Ionicons name="star" size={12} color="#D4AF37" />
                        <Text className="text-[#D4AF37] text-xs font-bold">
                          PRIMARY
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Card Content */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold mb-1">
                        {account.bankName}
                      </Text>
                      <Text className="text-white/70 text-sm">
                        {account.accountType}
                      </Text>
                    </View>
                    <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                      <Text className="text-2xl">{account.logo}</Text>
                    </View>
                  </View>

                  {/* Account Number */}
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white/90 text-base font-mono tracking-wider">
                      {account.accountNumber}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-2">
                    {!account.isPrimary && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(account.id);
                        }}
                        className="flex-1 bg-white/20 px-3 py-2 rounded-lg flex-row items-center justify-center gap-2"
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star-outline" size={16} color="white" />
                        <Text className="text-white text-xs font-semibold">
                          Set as Primary
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveAccount(account.id);
                      }}
                      className={`${
                        account.isPrimary ? 'flex-1' : 'flex-1'
                      } bg-white/10 border border-white/20 px-3 py-2 rounded-lg flex-row items-center justify-center gap-2`}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text className="text-red-400 text-xs font-semibold">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Empty State (if no accounts) */}
          {bankAccounts.length === 0 && (
            <View className="items-center justify-center py-12">
              <View 
                style={{ backgroundColor: colors.card }}
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
              >
                <Ionicons name="card-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-2">
                No Bank Accounts Linked
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-sm text-center px-8">
                Add your first bank account to start investing
              </Text>
            </View>
          )}

          {/* Help Section */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border 
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
    </SafeAreaView>
  );
}