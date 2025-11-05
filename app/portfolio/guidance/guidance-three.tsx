import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";

export default function ConfirmInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();

  // Get investment details from context
  const property = investmentPlan.selectedProperty;
  const investmentAmount = investmentPlan.investmentAmount;
  const monthlyReturn = investmentPlan.expectedMonthlyReturn || 0;
  const roi = investmentPlan.estimatedROI || 0;

  // Show loading/fallback state if no property
  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-[#10221c]">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-[#9db9b0]">Loading investment details...</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-3 bg-[#13eca4] rounded-xl"
          >
            <Text className="text-[#10221c] font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirm = () => {
    // Set first deposit date to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const firstDepositDate = nextMonth.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    updateInvestmentPlan({
      firstDepositDate,
      recurringDeposit: {
        amount: Math.round(investmentAmount / 4), // Suggest quarterly amount
        frequency: 'monthly',
      },
    });

    console.log("Investment confirmed:", {
      property: property.title,
      amount: investmentAmount,
      roi,
      monthlyReturn,
    });
    
    router.push('./guidance-four');
  };

  const handleCancel = () => {
    console.log("Investment cancelled");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10221c]">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-[#10221c]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#e0e0e0" />
        </TouchableOpacity>

        <Text className="text-[#e0e0e0] text-lg font-bold flex-1 text-center">
          Confirm Investment
        </Text>

        <View className="w-10" />
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center px-4 py-8">
          <View className="flex flex-col items-center gap-6 w-full max-w-sm">
            {/* Property Image and Info */}
            <View className="flex flex-col items-center gap-4">
              <Image
                source={{ uri: property.images[0] }}
                className="w-32 h-32 rounded-xl"
                resizeMode="cover"
              />
              <View className="items-center">
                <Text className="text-[#e0e0e0] text-lg font-bold">
                  {property.title}
                </Text>
                <Text className="text-[#9db9b0] text-sm mt-1">
                  {property.location}
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Ionicons name="star" size={14} color="#EAB308" />
                  <Text className="text-[#9db9b0] text-xs">
                    {property.builder.name} • {property.builder.rating}/5.0
                  </Text>
                </View>
              </View>
            </View>

            {/* Investment Details Card */}
            <View className="flex flex-col gap-5 rounded-xl bg-[#1a2c26] p-6 w-full">
              {/* Investment Amount */}
              <View className="flex-row justify-between items-baseline">
                <Text className="text-[#9db9b0] text-base">
                  Investment Amount
                </Text>
                <Text className="text-[#e0e0e0] text-2xl font-bold">
                  ${investmentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Divider */}
              <View className="h-[1px] bg-white/10" />

              {/* Tokens to Purchase */}
              <View className="flex-row justify-between items-baseline">
                <Text className="text-[#9db9b0] text-base">
                  Tokens to Purchase
                </Text>
                <Text className="text-[#e0e0e0] text-xl font-semibold">
                  {Math.floor(investmentAmount / property.tokenPrice)} tokens
                </Text>
              </View>

              {/* Estimated ROI */}
              <View className="flex-row justify-between items-baseline">
                <Text className="text-[#9db9b0] text-base">
                  Estimated Annual ROI
                </Text>
                <Text className="text-[#13eca4] text-xl font-semibold">
                  {roi.toFixed(1)}%
                </Text>
              </View>

              {/* Expected Monthly Return */}
              <View className="flex-row justify-between items-baseline">
                <Text className="text-[#9db9b0] text-base">
                  Expected Monthly Return
                </Text>
                <Text className="text-[#e0e0e0] text-xl font-semibold">
                  ${monthlyReturn.toFixed(2)}
                </Text>
              </View>

              {/* Divider */}
              <View className="h-[1px] bg-white/10" />

              {/* Annual Return */}
              <View className="flex-row justify-between items-baseline">
                <Text className="text-[#9db9b0] text-base">
                  Expected Annual Return
                </Text>
                <Text className="text-[#13eca4] text-xl font-semibold">
                  ${(monthlyReturn * 12).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Investment Breakdown Info Box */}
            <View className="w-full bg-[#1a2c26]/50 rounded-lg p-4 border border-[#13eca4]/20">
              <Text className="text-[#13eca4] text-xs font-bold mb-2 text-center">
                💡 What This Means
              </Text>
              <Text className="text-[#9db9b0] text-xs leading-relaxed text-center">
                You're investing <Text className="text-[#e0e0e0] font-semibold">${investmentAmount.toLocaleString()}</Text> to purchase{' '}
                <Text className="text-[#e0e0e0] font-semibold">{Math.floor(investmentAmount / property.tokenPrice)} tokens</Text> of{' '}
                <Text className="text-[#e0e0e0] font-semibold">{property.title}</Text>.{'\n\n'}
                This property has an estimated annual ROI of{' '}
                <Text className="text-[#13eca4] font-semibold">{roi.toFixed(1)}%</Text>, meaning you could earn approximately{' '}
                <Text className="text-[#13eca4] font-semibold">${monthlyReturn.toFixed(2)}/month</Text> or{' '}
                <Text className="text-[#13eca4] font-semibold">${(monthlyReturn * 12).toFixed(2)}/year</Text> in rental income.
              </Text>
            </View>

            {/* Terms Text */}
            <Text className="text-[#9db9b0] text-xs text-center px-4 leading-relaxed">
              By confirming, you agree to the Terms of Service. This is a non-binding intent to invest.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="px-4 pb-6 pt-4 bg-[#10221c]">
        <View className="flex flex-col gap-3">
          <TouchableOpacity
            onPress={handleConfirm}
            className="h-14 items-center justify-center rounded-xl bg-[#13eca4]"
            activeOpacity={0.8}
          >
            <Text className="text-[#10221c] text-base font-bold">
              Confirm & Proceed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            className="h-14 items-center justify-center rounded-xl bg-transparent"
            activeOpacity={0.8}
          >
            <Text className="text-[#13eca4] text-base font-bold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}