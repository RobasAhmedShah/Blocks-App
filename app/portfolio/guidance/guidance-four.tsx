import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";

export default function PlanSavedScreen() {
  const router = useRouter();
  const { investmentPlan, resetPlan } = useGuidance();

  const planSummary = {
    investmentTarget: `$${investmentPlan.investmentAmount?.toLocaleString() || '0'}`,
    propertyName: investmentPlan.selectedProperty?.title || 'Property',
    recurringDeposit: investmentPlan.recurringDeposit 
      ? `$${investmentPlan.recurringDeposit.amount.toLocaleString()} / ${investmentPlan.recurringDeposit.frequency}`
      : 'Not set',
    firstDeposit: investmentPlan.firstDepositDate || 'Not set',
    monthlyReturn: investmentPlan.expectedMonthlyReturn 
      ? `$${investmentPlan.expectedMonthlyReturn.toFixed(2)}`
      : '$0',
    estimatedROI: investmentPlan.estimatedROI 
      ? `${investmentPlan.estimatedROI.toFixed(1)}%`
      : '0%',
  };

  const handleEditPlan = () => {
    console.log("Edit Plan - Returning to Guidance");
    // Don't reset plan, just go back to guidance-two to edit
    router.push('/portfolio/guidance/guidance-two');
  };

  const handleReturnToWallet = () => {
    console.log("Return to Wallet");
    // Navigate first, then reset plan to avoid triggering effects in unmounting screens
    router.replace("/(tabs)/wallet");
    // Reset plan after a short delay to allow navigation to complete
    setTimeout(() => {
      resetPlan();
    }, 100);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10221c]">
      <StatusBar barStyle="light-content" />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between p-4">
          {/* Success Icon and Message */}
          <View className="flex flex-col items-center text-center pt-20">
            {/* Circular Success Icon */}
            <View className="w-20 h-20 items-center justify-center rounded-full bg-[#13eca4]/10 mb-6">
              <View className="w-16 h-16 items-center justify-center rounded-full bg-[#13eca4]/20">
                <Ionicons name="checkmark-circle" size={48} color="#13eca4" />
              </View>
            </View>

            {/* Success Title */}
            <Text className="text-[#e0e0e0] text-2xl font-bold tracking-tight">
              Plan Saved Successfully
            </Text>

            {/* Subtitle */}
            <Text className="text-[#9db9b0] text-base mt-2 px-8 text-center">
              Your investment plan is set and ready to go.
            </Text>
          </View>

          {/* Plan Summary Card */}
          <View className="my-8">
            <View className="rounded-xl bg-[#1a2c26] p-6">
              <Text className="text-[#e0e0e0] text-lg font-bold mb-4">
                Plan Summary
              </Text>

              <View className="flex flex-col gap-4">
                {/* Investment Target */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#9db9b0] text-base">
                    Investment Target
                  </Text>
                  <Text className="text-[#e0e0e0] text-base font-semibold">
                    {planSummary.investmentTarget}
                  </Text>
                </View>

                {/* Recurring Deposit */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#9db9b0] text-base">
                    Recurring Deposit
                  </Text>
                  <Text className="text-[#e0e0e0] text-base font-semibold">
                    {planSummary.recurringDeposit}
                  </Text>
                </View>

                {/* First Deposit */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#9db9b0] text-base">
                    First Deposit
                  </Text>
                  <Text className="text-[#e0e0e0] text-base font-semibold">
                    {planSummary.firstDeposit}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex flex-col gap-3 pb-2">
            {/* Return to Wallet Button */}
            <TouchableOpacity
              onPress={handleReturnToWallet}
              className="h-14 items-center justify-center rounded-xl bg-[#13eca4]"
              activeOpacity={0.8}
            >
              <Text className="text-[#10221c] text-base font-bold">
                Go to Wallet
              </Text>
            </TouchableOpacity>

            {/* Edit Plan Button */}
            <TouchableOpacity
              onPress={handleEditPlan}
              className="h-14 items-center justify-center rounded-xl border border-[#13eca4]/50 bg-transparent"
              activeOpacity={0.8}
            >
              <Text className="text-[#13eca4] text-base font-bold">
                Edit Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}