import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";
import { mockProperties } from "@/data/mockProperties";

export default function GuidedInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();
  const [investmentMode, setInvestmentMode] = useState<"amount" | "earning">("amount");
  const [investAmount, setInvestAmount] = useState(
    investmentPlan.investmentAmount?.toLocaleString() || "1,000"
  );
  const [earnAmount, setEarnAmount] = useState(
    investmentPlan.monthlyIncomeGoal?.toString() || ""
  );
  // Initialize selectedPropertyId from context if available, otherwise null
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    investmentPlan.selectedProperty?.id || null
  );

  // Get top 3 properties by ROI that match the investment amount
  const recommendedProperties = useMemo(() => {
    const amount = parseFloat(investAmount.replace(/,/g, '')) || 1000;
    
    return mockProperties
      .filter(p => {
        // Only show properties where the investment amount is enough to buy at least 0.1 tokens
        const tokens = amount / p.tokenPrice;
        return tokens >= 0.1;
      })
      .sort((a, b) => b.estimatedROI - a.estimatedROI)
      .map(p => ({
        property: p,
        expectedMonthlyReturn: ((amount * p.estimatedYield) / 100 / 12).toFixed(2),
        breakEven: (100 / p.estimatedROI).toFixed(1),
        tokensCount: amount / p.tokenPrice, // Calculate tokens here
      }));
  }, [investAmount]);

  // Clear selection if the selected property is no longer in recommended list
  useEffect(() => {
    if (selectedPropertyId) {
      const isStillValid = recommendedProperties.some(
        rp => rp.property.id === selectedPropertyId
      );
      if (!isStillValid) {
        setSelectedPropertyId(null);
      }
    }
  }, [recommendedProperties, selectedPropertyId]);

  const handleInvestNow = () => {
    const amount = parseFloat(investAmount.replace(/,/g, '')) || 1000;
    
    // First check if user has explicitly selected a property
    let selectedProp = selectedPropertyId 
      ? mockProperties.find(p => p.id === selectedPropertyId)
      : null;
    
    // If no explicit selection, use first recommended property
    if (!selectedProp && recommendedProperties.length > 0) {
      selectedProp = recommendedProperties[0].property;
      setSelectedPropertyId(selectedProp.id); // Set it for visual feedback
    }

    if (!selectedProp) {
      console.error("No property available for this investment amount");
      alert("No properties available for this investment amount. Please adjust your investment amount.");
      return;
    }

    const monthlyReturn = (amount * selectedProp.estimatedYield) / 100 / 12;

    updateInvestmentPlan({
      investmentAmount: amount,
      selectedProperty: selectedProp,
      expectedMonthlyReturn: monthlyReturn,
      estimatedROI: selectedProp.estimatedROI,
    });

    console.log("Invest Now clicked - Amount:", amount, "Property:", selectedProp.title);
    router.push('./guidance-three');
  };

  const handleSavePlan = () => {
    const amount = parseFloat(investAmount.replace(/,/g, '')) || 1000;
    updateInvestmentPlan({
      investmentAmount: amount,
      recurringDeposit: {
        amount: Math.round(amount / 4), // Quarterly deposits
        frequency: 'monthly',
      },
    });
    console.log("Plan saved for later");
    router.push('./guidance-four');
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    console.log("Property selected:", propertyId);
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
          Guided Investment
        </Text>

        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-4 pb-32 ">
          {/* Toggle Section */}
          <View className="py-2 mb-4">
            <View className="flex-row h-12 bg-[#1a2c26] rounded-xl p-1">
              <TouchableOpacity
                onPress={() => setInvestmentMode("amount")}
                className={`flex-1 items-center justify-center rounded-lg ${
                  investmentMode === "amount" ? "bg-[#10221c] shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    investmentMode === "amount"
                      ? "text-[#e0e0e0]"
                      : "text-[#9db9b0]"
                  }`}
                >
                  Invest Amount
                </Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                onPress={() => setInvestmentMode("earning")}
                className={`flex-1 items-center justify-center rounded-lg ${
                  investmentMode === "earning" ? "bg-[#10221c] shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    investmentMode === "earning"
                      ? "text-[#e0e0e0]"
                      : "text-[#9db9b0]"
                  }`}
                >
                  Target Earning
                </Text>
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Input Fields */}
          <View className="flex flex-col gap-3 mb-4">
            {/* Invest Amount Input */}
            <View className={investmentMode === "earning" ? "opacity-50" : ""}>
              <Text className="text-[#e0e0e0] text-base font-medium mb-2">
                I want to invest...
              </Text>
              <View className="relative">
                <Text className="absolute left-4 top-5 text-[#e0e0e0] text-lg font-semibold z-10">
                  $
                </Text>
                <TextInput
                  className="w-full h-16 bg-[#1a2c26] rounded-lg pl-8 pr-4 text-[#e0e0e0] text-lg font-semibold"
                  value={investAmount}
                  onChangeText={setInvestAmount}
                  keyboardType="numeric"
                  placeholder="1,000"
                  placeholderTextColor="#9db9b0"
                  editable={investmentMode === "amount"}
                />
              </View>
            </View>

            {/* Earn Amount Input */}
            <View className={investmentMode === "amount" ? "opacity-50" : ""}>
              <Text className="text-[#e0e0e0] text-base font-medium mb-2">
                To earn per month...
              </Text>
              <View className="relative">
                <Text className="absolute left-4 top-5 text-[#9db9b0] text-lg font-semibold z-10">
                  $
                </Text>
                <TextInput
                  className="w-full h-16 bg-[#1a2c26] rounded-lg pl-8 pr-4 text-[#e0e0e0] text-lg font-semibold"
                  value={earnAmount}
                  onChangeText={setEarnAmount}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor="#9db9b0"
                  editable={investmentMode === "earning"}
                />
              </View>
            </View>
          </View>

          {/* Recommended Properties Section */}
          <View className="mt-4">
            <Text className="text-[#e0e0e0] text-base font-bold mb-2">
              Recommended For You
            </Text>
            <Text className="text-[#9db9b0] text-xs mb-4">
              Tap a property to select it. Properties are ranked by highest ROI that match your investment amount.
            </Text>

            {/* Property Cards */}
            <View className="flex flex-col gap-4">
              <ScrollView 
                className="flex-1 h-[300px]"
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ gap: 16 }}
              >
                {recommendedProperties.length > 0 ? (
                  recommendedProperties.map(({ property, expectedMonthlyReturn, breakEven, tokensCount }) => {
                    const isSelected = selectedPropertyId === property.id;
                    return (
                      <TouchableOpacity
                        key={property.id}
                        onPress={() => handlePropertySelect(property.id)}
                        className={`flex-row gap-4 bg-[#1a2c26] rounded-xl p-3 ${
                          isSelected ? 'border-2 border-[#13eca4]' : 'border-2 border-transparent'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: property.images[0] }}
                          className="w-24 h-24 rounded-lg"
                          resizeMode="cover"
                        />

                        <View className="flex-1 justify-between">
                          <View>
                            <Text className="text-[#e0e0e0] text-sm font-semibold">
                              {property.title}
                            </Text>
                            <Text className="text-[#9db9b0] text-xs mt-1">
                              {property.location}
                            </Text>
                          </View>

                          <View className="flex-row items-center justify-between">
                            <View className="flex flex-col items-start">
                              <Text className="text-[#9db9b0] text-xs">ROI</Text>
                              <Text className="text-[#13eca4] text-sm font-bold">
                                {property.estimatedROI.toFixed(1)}%
                              </Text>
                            </View>

                            <View className="flex flex-col items-start">
                              <Text className="text-[#9db9b0] text-xs">
                                Monthly
                              </Text>
                              <Text className="text-[#e0e0e0] text-sm font-bold">
                                ${expectedMonthlyReturn}
                              </Text>
                            </View>

                            <View className="flex flex-col items-start">
                              <Text className="text-[#9db9b0] text-xs">
                                Tokens
                              </Text>
                              <Text className="text-[#e0e0e0] text-sm font-bold">
                                {tokensCount.toLocaleString()}
                              </Text>
                            </View>

                            <View className="flex-row items-center gap-1">
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color="#13eca4"
                                />
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="py-12 items-center justify-center">
                    <Text className="text-[#e57373] text-2xl font-extrabold text-center mb-2">
                      We&apos;re Sorry!
                    </Text>
                    <Text className="text-[#e0e0e0] text-base font-semibold text-center mb-3">
                      Your savings don&apos;t meet the minimum to invest in our properties yet.
                    </Text>
                 
                    <Text className="text-[#9db9b0] text-sm text-center">
                      Try increasing your savings or let us know if you want updates
                      when new options become available.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-[#10221c] via-[#10221c]">
        <View className="flex flex-col gap-3">
          <TouchableOpacity
            onPress={handleInvestNow}
            className="h-14 items-center justify-center rounded-xl bg-[#13eca4]"
            activeOpacity={0.8}
          >
            <Text className="text-[#10221c] text-base font-bold">
              Invest Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSavePlan}
            className="h-14 items-center justify-center rounded-xl border border-[#13eca4]/50 bg-transparent"
            activeOpacity={0.8}
          >
            <Text className="text-[#13eca4] text-base font-bold">
              Save Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}