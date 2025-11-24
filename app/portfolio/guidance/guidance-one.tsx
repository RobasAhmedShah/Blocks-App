import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { KeyboardDismissButton } from "@/components/common/KeyboardDismissButton";

export default function SetGoalScreen() {
  const router = useRouter();
  const { updateInvestmentPlan } = useGuidance();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [inputMode, setInputMode] = useState<"goal" | "amount">("goal");
  const [goalAmount, setGoalAmount] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");

  // Calculate estimated investment based on average 5% annual return
  // Formula: investment = monthlyIncome * 12 / 0.05 = monthlyIncome * 240
  // This is the reverse of: monthlyIncome = (investment * 0.05) / 12
  const calculateInvestment = (monthlyIncome: string) => {
    const numAmount = parseFloat(monthlyIncome.replace(/,/g, '')) || 0;
    const investment = numAmount * 240; // monthlyIncome * 12 / 0.05
    return investment.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Calculate estimated monthly income from investment amount
  const calculateMonthlyIncome = (amount: string) => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    // Assuming ~5% annual yield = ~0.42% monthly
    const monthlyIncome = (numAmount * 0.05) / 12;
    return monthlyIncome.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleContinue = () => {
    if (inputMode === "goal") {
      // User set a monthly income goal
      const goalValue = parseFloat(goalAmount.replace(/,/g, '')) || 0;
      
      updateInvestmentPlan({
        monthlyIncomeGoal: goalValue,
        // Don't set a fixed investmentAmount - let guidance-two calculate per property
        isGoalBased: true, // Flag to indicate goal-based mode
      });
      
      console.log("Goal-based - Monthly goal:", goalValue);
    } else {
      // User set an investment amount directly
      const amount = parseFloat(investmentAmount.replace(/,/g, '')) || 0;
      const estimatedMonthlyIncome = (amount * 0.05) / 12;
      
      updateInvestmentPlan({ 
        investmentAmount: amount,
        estimatedInvestmentNeeded: amount,
        monthlyIncomeGoal: estimatedMonthlyIncome,
        isGoalBased: false, // Amount-based mode
      });
      
      console.log("Amount-based - Investment:", amount, "Expected monthly income:", estimatedMonthlyIncome);
    }
    
    router.push('./guidance-two');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
      <KeyboardDismissButton inputAccessoryViewID="guidanceOneInputAccessory" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginTop: 35,
          backgroundColor: colors.background,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: 'bold',
            flex: 1,
            textAlign: 'center',
          }}>
            {inputMode === "goal" ? "Set Your Goal" : "Set Investment"}
          </Text>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="never"
        >
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
            {/* Mode Toggle */}
            <View style={{ marginBottom: 32 }}>
              <View style={{
                flexDirection: 'row',
                height: 48,
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 4,
              }}>
                <TouchableOpacity
                  onPress={() => setInputMode("goal")}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: inputMode === "goal" ? colors.background : "transparent",
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons 
                      name="trending-up" 
                      size={16} 
                      color={inputMode === "goal" ? colors.primary : colors.textMuted} 
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: inputMode === "goal" ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      Monthly Goal
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setInputMode("amount")}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: inputMode === "amount" ? colors.background : "transparent",
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons 
                      name="wallet" 
                      size={16} 
                      color={inputMode === "amount" ? colors.primary : colors.textMuted} 
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: inputMode === "amount" ? colors.textPrimary : colors.textMuted,
                      }}
                    >
                      Your Savings
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Content Based on Mode */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {inputMode === "goal" ? (
                /* Monthly Goal Input */
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    Define your monthly income goal
                  </Text>

                  {/* Input Section */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: 'bold' }}>$</Text>
                    
                    <TextInput
                      style={{
                        width: 192,
                        textAlign: 'center',
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: colors.textPrimary,
                        paddingHorizontal: 8,
                        includeFontPadding: false,
                      }}
                      value={goalAmount}
                      onChangeText={setGoalAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      maxLength={7}
                    />
                    
                    <Text style={{
                      color: colors.textMuted,
                      fontSize: 20,
                      fontWeight: '500',
                      alignSelf: 'flex-end',
                      paddingBottom: 8,
                    }}>
                      / month
                    </Text>
                  </View>

                  {/* Info Box */}
                  <View style={{
                    marginTop: 16,
                    backgroundColor: `${colors.card}80`,
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: `${colors.primary}33`,
                  }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                      💡 How It Works
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                      Based on average property yields of ~5% annually, your investment will generate monthly rental income that reaches your goal.
                    </Text>
                  </View>
                </View>
              ) : (
                /* Investment Amount Input */
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    How much savings do you have?
                  </Text>

                  {/* Input Section */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 48, fontWeight: 'bold' }}>$</Text>
                    
                    <TextInput
                      inputAccessoryViewID={Platform.OS === 'ios' ? 'guidanceOneInputAccessory' : undefined}
                      style={{
                        width: 192,
                        textAlign: 'center',
                        fontSize: 60,
                        fontWeight: 'bold',
                        color: colors.textPrimary,
                        paddingHorizontal: 8,
                        includeFontPadding: false,
                      }}
                      value={investmentAmount}
                      onChangeText={setInvestmentAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      maxLength={7}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                      blurOnSubmit={true}
                    />
                  </View>

                

                  {/* Info Box */}
                  <View style={{
                    marginTop: 16,
                    backgroundColor: `${colors.card}80`,
                    borderRadius: 8,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: `${colors.primary}33`,
                  }}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                      💡 Investment Details
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                      Your investment will be allocated to high-yield real estate properties. Expected returns are based on ~5% annual yield from rental income.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 16,
          backgroundColor: colors.background,
        }}>
          <TouchableOpacity
            onPress={handleContinue}
            style={{
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: 'bold' }}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}