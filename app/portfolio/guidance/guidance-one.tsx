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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";

export default function SetGoalScreen() {
  const router = useRouter();
  const { updateInvestmentPlan } = useGuidance();
  const [inputMode, setInputMode] = useState<"goal" | "amount">("goal");
  const [goalAmount, setGoalAmount] = useState("500");
  const [investmentAmount, setInvestmentAmount] = useState("10000");

  // Calculate estimated investment based on average 5% annual return
  const calculateInvestment = (amount: string) => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return (numAmount * 20).toLocaleString("en-US", {
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
      const estimatedInvestment = goalValue * 20;
      
      updateInvestmentPlan({
        monthlyIncomeGoal: goalValue,
        estimatedInvestmentNeeded: estimatedInvestment,
        investmentAmount: estimatedInvestment,
      });
      
      console.log("Goal-based - Monthly goal:", goalValue, "Estimated investment:", estimatedInvestment);
    } else {
      // User set an investment amount directly
      const amount = parseFloat(investmentAmount.replace(/,/g, '')) || 0;
      const estimatedMonthlyIncome = (amount * 0.05) / 12;
      
      updateInvestmentPlan({
        investmentAmount: amount,
        estimatedInvestmentNeeded: amount,
        monthlyIncomeGoal: estimatedMonthlyIncome,
      });
      
      console.log("Amount-based - Investment:", amount, "Expected monthly income:", estimatedMonthlyIncome);
    }
    
    router.push('./guidance-two');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10221c]">
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-[#10221c]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#e0e0e0" />
          </TouchableOpacity>
          
          <Text className="text-[#e0e0e0] text-lg font-bold flex-1 text-center">
            {inputMode === "goal" ? "Set Your Goal" : "Set Investment"}
          </Text>
          
          <View className="w-10" />
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-4 pt-6">
            {/* Mode Toggle */}
            <View className="mb-8">
              <View className="flex-row h-12 bg-[#1a2c26] rounded-xl p-1">
                <TouchableOpacity
                  onPress={() => setInputMode("goal")}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: inputMode === "goal" ? "#10221c" : "transparent",
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons 
                      name="trending-up" 
                      size={16} 
                      color={inputMode === "goal" ? "#13eca4" : "#9db9b0"} 
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: inputMode === "goal" ? "#e0e0e0" : "#9db9b0",
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
                    backgroundColor: inputMode === "amount" ? "#10221c" : "transparent",
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons 
                      name="wallet" 
                      size={16} 
                      color={inputMode === "amount" ? "#13eca4" : "#9db9b0"} 
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: inputMode === "amount" ? "#e0e0e0" : "#9db9b0",
                      }}
                    >
                      Your Savings
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Content Based on Mode */}
            <View className="flex-1 items-center justify-center">
              {inputMode === "goal" ? (
                /* Monthly Goal Input */
                <View className="w-full items-center">
                  <Text className="text-[#e0e0e0] text-base font-medium text-center mb-4">
                    Define your monthly income goal
                  </Text>

                  {/* Input Section */}
                  <View className="flex-row items-center justify-center">
                    <Text className="text-[#e0e0e0] text-5xl font-bold">$</Text>
                    
                    <TextInput
                      className="w-48 text-center text-6xl font-bold text-[#e0e0e0] px-2"
                      value={goalAmount}
                      onChangeText={setGoalAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9db9b0"
                      maxLength={7}
                      style={{ includeFontPadding: false }}
                    />
                    
                    <Text className="text-[#9db9b0] text-xl font-medium self-end pb-2">
                      / month
                    </Text>
                  </View>

                  {/* Estimated Investment Text */}
                  <View className="mt-6 min-h-[40px] items-center justify-center">
                    <Text className="text-[#9db9b0] text-sm text-center">
                      To reach this goal, you'll need to invest approximately{" "}
                      <Text className="text-[#13eca4] font-semibold">
                        ${calculateInvestment(goalAmount)}
                      </Text>{" "}
                      in real estate properties.
                    </Text>
                  </View>

                  {/* Info Box */}
                  <View className="mt-4 bg-[#1a2c26]/50 rounded-lg p-4 border border-[#13eca4]/20">
                    <Text className="text-[#13eca4] text-xs font-bold mb-1">
                      💡 How It Works
                    </Text>
                    <Text className="text-[#9db9b0] text-xs leading-relaxed">
                      Based on average property yields of ~5% annually, your investment will generate monthly rental income that reaches your goal.
                    </Text>
                  </View>
                </View>
              ) : (
                /* Investment Amount Input */
                <View className="w-full items-center">
                  <Text className="text-[#e0e0e0] text-base font-medium text-center mb-4">
                    How much savings do you have?
                  </Text>

                  {/* Input Section */}
                  <View className="flex-row items-center justify-center">
                    <Text className="text-[#e0e0e0] text-5xl font-bold">$</Text>
                    
                    <TextInput
                      className="w-48 text-center text-6xl font-bold text-[#e0e0e0] px-2"
                      value={investmentAmount}
                      onChangeText={setInvestmentAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9db9b0"
                      maxLength={7}
                      style={{ includeFontPadding: false }}
                    />
                  </View>

                  {/* Estimated Monthly Income Text */}
                  <View className="mt-6 min-h-[40px] items-center justify-center">
                    <Text className="text-[#9db9b0] text-sm text-center">
                      Expected monthly income from this investment:{" "}
                      <Text className="text-[#13eca4] font-semibold">
                        ${calculateMonthlyIncome(investmentAmount)}
                      </Text>
                    </Text>
                  </View>

                  {/* Info Box */}
                  <View className="mt-4 bg-[#1a2c26]/50 rounded-lg p-4 border border-[#13eca4]/20">
                    <Text className="text-[#13eca4] text-xs font-bold mb-1">
                      💡 Investment Details
                    </Text>
                    <Text className="text-[#9db9b0] text-xs leading-relaxed">
                      Your investment will be allocated to high-yield real estate properties. Expected returns are based on ~5% annual yield from rental income.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View className="px-4 pb-6 pt-4 bg-[#10221c]">
          <TouchableOpacity
            onPress={handleContinue}
            className="h-14 items-center justify-center rounded-xl bg-[#13eca4]"
            activeOpacity={0.8}
          >
            <Text className="text-[#10221c] text-base font-bold">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}