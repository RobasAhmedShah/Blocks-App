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
import { useColorScheme } from "@/lib/useColorScheme";

export default function GuidedInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();
  const { colors, isDarkColorScheme } = useColorScheme();
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
    const amount = parseFloat(investAmount.replace(/,/g, ''));

    // If amount is less than or equal to 0, return empty array
    if (amount <= 0) {
      return [];
    }
    
    return mockProperties
      .filter(p => {
        
        // Only show properties where the investment amount is enough to buy at least 0.1 tokens
        const tokens = amount / p.tokenPrice;
        return tokens >= 0.1;
      } )
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
    router.push({
      pathname: "/invest/[id]",
      params: { id: selectedProp.id , tokenCount: (amount / selectedProp.tokenPrice).toFixed(2) },
    })
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
          Guided Investment
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 128 }}>
          {/* Toggle Section */}
          <View style={{ paddingVertical: 8, marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row',
              height: 48,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 4,
            }}>
              <TouchableOpacity
                onPress={() => setInvestmentMode("amount")}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: investmentMode === "amount" ? colors.background : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: investmentMode === "amount"
                      ? colors.textPrimary
                      : colors.textMuted,
                  }}
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
          <View style={{ flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {/* Invest Amount Input */}
            <View style={{ opacity: investmentMode === "earning" ? 0.5 : 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
                I want to invest...
              </Text>
              <View style={{ position: 'relative' }}>
                <Text style={{
                  position: 'absolute',
                  left: 16,
                  top: 20,
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '600',
                  zIndex: 10,
                }}>
                  $
                </Text>
                <TextInput
                  style={{
                    width: '100%',
                    height: 64,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    paddingLeft: 32,
                    paddingRight: 16,
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                  maxLength={7}
                  value={investAmount}
                  onChangeText={setInvestAmount}
                  keyboardType="numeric"
                  placeholder="1,000"
                  placeholderTextColor={colors.textMuted}
                  editable={investmentMode === "amount"}
                />
              </View>
            </View>

            {/* Earn Amount Input */}
            <View style={{ opacity: investmentMode === "amount" ? 0.5 : 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
                To earn per month...
              </Text>
              <View style={{ position: 'relative' }}>
                <Text style={{
                  position: 'absolute',
                  left: 16,
                  top: 20,
                  color: colors.textMuted,
                  fontSize: 18,
                  fontWeight: '600',
                  zIndex: 10,
                }}>
                  $
                </Text>
                <TextInput
                  style={{
                    width: '100%',
                    height: 64,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    paddingLeft: 32,
                    paddingRight: 16,
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '600',
                  }}
                  value={earnAmount}
                  onChangeText={setEarnAmount}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={colors.textMuted}
                  editable={investmentMode === "earning"}
                />
              </View>
            </View>
          </View>

          {/* Recommended Properties Section */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
              Recommended For You
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16 }}>
              Tap a property to select it. Properties are ranked by highest ROI that match your investment amount.
            </Text>

            {/* Property Cards */}
            <View style={{ flexDirection: 'column', gap: 16 }}>
              <ScrollView 
                style={{ flex: 1, height: 300 }}
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
                        style={{
                          flexDirection: 'row',
                          gap: 16,
                          backgroundColor: colors.card,
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : 'transparent',
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: property.images[0] }}
                          style={{ width: 96, height: 96, borderRadius: 8 }}
                          resizeMode="cover"
                        />

                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                          <View>
                            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                              {property.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                              {property.location}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>ROI</Text>
                              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>
                                {property.estimatedROI.toFixed(1)}%
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                Monthly
                              </Text>
                              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>
                                ${expectedMonthlyReturn}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                Tokens
                              </Text>
                              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>
                                {tokensCount.toLocaleString()}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color={colors.primary}
                                />
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.destructive, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
                      We&apos;re Sorry!
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
                      Your savings don&apos;t meet the minimum to invest in our properties yet.
                    </Text>
                 
                    <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
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
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 16,
        backgroundColor: colors.background,
      }}>
        <View style={{ flexDirection: 'column', gap: 12 }}>
          <TouchableOpacity
            onPress={handleInvestNow}
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
              Invest Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSavePlan}
            style={{
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${colors.primary}80`,
              backgroundColor: 'transparent',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>
              Save Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}