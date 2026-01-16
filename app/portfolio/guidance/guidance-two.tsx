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
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";
import { useApp } from "@/contexts/AppContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { KeyboardDismissButton } from "@/components/common/KeyboardDismissButton";
import { savedPlansService } from "@/services/savedPlans";
import { Alert } from "react-native";
import { useKycCheck } from "@/hooks/useKycCheck";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// In the current backend, tokenPrice and minInvestment are already "real" prices.
// No more /10 scaling.
const getEffectiveTokenPrice = (tokenPrice: number) => tokenPrice;
// Minimum investment: 0.1 tokens
const MINIMUM_TOKENS = 0.1;

export default function GuidedInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();
  const { state, isLoadingProperties } = useApp();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isVerified, handleInvestPress } = useKycCheck();
  const [investmentMode, setInvestmentMode] = useState<"amount" | "earning">("amount");
  const isGoalBased = investmentPlan.isGoalBased || false;
  const [investAmount, setInvestAmount] = useState(
    isGoalBased 
      ? "" // Don't show fixed amount in goal-based mode
      : (investmentPlan.investmentAmount?.toLocaleString() || "1,000")
  );
  const [earnAmount, setEarnAmount] = useState(
    investmentPlan.monthlyIncomeGoal?.toString() || ""
  );
  // Initialize selectedTokenId from context if available, otherwise null
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(
    investmentPlan.selectedPropertyTokenId || null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<{
    token: any;
    property: any;
    expectedMonthlyReturn: string;
    breakEven: string;
    tokensCount: number;
    investmentNeeded?: number;
  } | null>(null);
  
  // Animation values for modal
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const modalOpacity = useSharedValue(0);

  // Get top property tokens that match the investment amount or monthly goal
  const recommendedProperties = useMemo(() => {
    const isGoalBased = investmentPlan.isGoalBased || false;
    const monthlyGoal = investmentPlan.monthlyIncomeGoal || 0;
    const fixedAmount = parseFloat(investAmount.replace(/,/g, ''));

    // Use state.properties directly - virtual tokens will be created for properties without tokens
    const propertiesToUse = state.properties;

    // Flatten all property tokens from all properties
    // Logic: If property has tokens array with items, show all those tokens
    //        If property has empty tokens array or no tokens, show main property as virtual token
    const allTokens = propertiesToUse
      .filter(p => {
        // Filter properties that have available tokens
        const hasAvailableTokens = p.totalTokens > 0 && (p.soldTokens || 0) < p.totalTokens;
        return hasAvailableTokens;
      })
      .flatMap(p => {
        // Check if property has tokens array with actual tokens
        console.log("+===============+")
        console.log("Property:", p.title, "Tokens:", p.tokens?.length);
        console.log("+===============+")
        p.tokens?.forEach(token => {
          console.log('Token:', token.name, 'Expected ROI:', token.expectedROI);
        });
        const hasTokens = p.tokens && Array.isArray(p.tokens) && p.tokens.length > 0;
        
        if (hasTokens && p.tokens) {
          // Property has tokens - show all active tokens with available tokens > 0
          return p.tokens
            .filter(token => token.isActive && token.availableTokens > 0)
            .map(token => ({
              token,
              property: p,
            }));
        } else {
          // Property has NO tokens (empty array or undefined) - create virtual token from property data
          const availableTokens = p.totalTokens - (p.soldTokens || 0);
          if (availableTokens > 0 && p.tokenPrice > 0) {
            return [{
              token: {
                id: `${p.id}_virtual`,
                displayCode: p.displayCode || p.id,
                propertyId: p.id,
                name: p.title, // Use property title as token name for virtual tokens
                color: '#10B981',
                tokenSymbol: p.tokenSymbol || p.displayCode?.split('-')[0] || 'PROP',
                pricePerTokenUSDT: p.tokenPrice,
                totalTokens: p.totalTokens,
                availableTokens: availableTokens,
                expectedROI: p.estimatedROI || p.estimatedYield || 0,
                apartmentType: null,
                apartmentFeatures: null,
                description: null,
                displayOrder: 0,
                isActive: true,
                createdAt: new Date(p.createdAt || Date.now()),
                updatedAt: new Date(p.createdAt || Date.now()),
              },
              property: p,
            }];
          }
        }
        return [];
      });

    console.log("==============")
    allTokens.forEach(token => {
      console.log('Token:', token.token.name, 'Property:', token.property.title, 'Expected ROI:', token.token.expectedROI);
    });

    if (isGoalBased && monthlyGoal > 0) {
      // GOAL-BASED MODE: Calculate investment per token to achieve monthly goal
      return allTokens
        .map(({ token, property }) => {
          // Calculate investment needed for this token to achieve monthly goal
          // Formula: investment = (monthlyGoal * 12 * 100) / expectedROI
          // Note: expectedROI is already a percentage (e.g., 10 for 10%)
          const investmentNeeded = (monthlyGoal * 12 * 100) / token.expectedROI;
          const effectivePrice = getEffectiveTokenPrice(token.pricePerTokenUSDT);
          const tokens = investmentNeeded / effectivePrice;
          
          return {
            token,
            property,
            investmentNeeded, // Per-token investment amount
            tokens,
            expectedMonthlyReturn: monthlyGoal.toFixed(2), // Always the goal amount
            breakEven: (100 / token.expectedROI).toFixed(1),
          };
        })
        .filter(rp => {
          // Filter: must be able to buy at least minimum tokens
          return rp.tokens >= MINIMUM_TOKENS && 
                 rp.token.totalTokens > 0 && 
                 rp.token.availableTokens > 0;
        })
        .sort((a, b) => {
          // Sort by lowest investment needed (most efficient tokens first)
          return a.investmentNeeded - b.investmentNeeded;
        })
        .slice(0, 10)
        .map(rp => ({
          token: rp.token,
          property: rp.property,
          expectedMonthlyReturn: rp.expectedMonthlyReturn,
          breakEven: rp.breakEven,
          tokensCount: rp.tokens,
          investmentNeeded: rp.investmentNeeded, // Store this for display
        }));
    } else {
      // AMOUNT-BASED MODE: Filter tokens by investment amount
      if (fixedAmount <= 0) {
        return [];
      }
      
      return allTokens
        .filter(({ token }) => {
          const effectivePrice = getEffectiveTokenPrice(token.pricePerTokenUSDT);
          const tokens = fixedAmount / effectivePrice;
          return tokens >= MINIMUM_TOKENS && token.totalTokens > 0 && token.availableTokens > 0;
        })
        .sort((a, b) => b.token.expectedROI - a.token.expectedROI)
        .slice(0, 10)
        .map(({ token, property }) => {
          const effectivePrice = getEffectiveTokenPrice(token.pricePerTokenUSDT);
          // Calculate monthly return: (investment * expectedROI / 100) / 12
          const monthlyReturn = (fixedAmount * token.expectedROI / 100) / 12;
          return {
            token,
            property,
            expectedMonthlyReturn: monthlyReturn.toFixed(2),
            breakEven: (100 / token.expectedROI).toFixed(1),
            tokensCount: fixedAmount / effectivePrice,
            investmentNeeded: fixedAmount, // Same for all tokens
          };
        });
    }
  }, [investAmount, investmentPlan.isGoalBased, investmentPlan.monthlyIncomeGoal, state.properties]);

  // Clear selection if the selected token is no longer in recommended list
  useEffect(() => {
    if (selectedTokenId) {
      const isStillValid = recommendedProperties.some(
        rp => rp.token.id === selectedTokenId
      );
      if (!isStillValid) {
        setSelectedTokenId(null);
      }
    }
  }, [recommendedProperties, selectedTokenId]);

  const handleInvestNow = () => {
    const isGoalBased = investmentPlan.isGoalBased || false;
    
    // First check if user has explicitly selected a token
    let selectedTokenData = selectedTokenId 
      ? recommendedProperties.find(rp => rp.token.id === selectedTokenId)
      : null;
    
    // If no explicit selection, use first recommended token
    if (!selectedTokenData && recommendedProperties.length > 0) {
      selectedTokenData = recommendedProperties[0];
      setSelectedTokenId(selectedTokenData.token.id); // Set it for visual feedback
    }

    if (!selectedTokenData) {
      console.error("No property token available for this investment amount");
      alert("No property tokens available for this investment amount. Please adjust your investment amount.");
      return;
    }

    const { token, property } = selectedTokenData;
    const amountToInvest = isGoalBased 
      ? (selectedTokenData.investmentNeeded || 0)
      : parseFloat(investAmount.replace(/,/g, '')) || 1000;

    const monthlyReturn = isGoalBased
      ? (investmentPlan.monthlyIncomeGoal || 0)
      : (amountToInvest * token.expectedROI / 100) / 12;

    updateInvestmentPlan({
      investmentAmount: amountToInvest,
      selectedProperty: property,
      selectedPropertyTokenId: token.id,
      expectedMonthlyReturn: monthlyReturn,
      estimatedROI: token.expectedROI,
    });

    console.log("Invest Now clicked - Amount:", amountToInvest, "Token:", token.name, "Property:", property.title, "Monthly Return:", monthlyReturn);
    handleInvestPress(() => {
      router.push({
        pathname: "/invest/[id]",
        params: { 
          id: property.id,
          propertyTokenId: token.id,
          tokenCount: (amountToInvest / getEffectiveTokenPrice(token.pricePerTokenUSDT)).toFixed(2) 
        },
      });
    });
  };

  const handleSavePlan = async () => {
    try {
      const isGoalBased = investmentPlan.isGoalBased || false;
      let amount: number;
      let selectedTokenData = selectedTokenId 
        ? recommendedProperties.find(rp => rp.token.id === selectedTokenId)
        : null;
      
      // If no token selected, use first recommended token
      if (!selectedTokenData && recommendedProperties.length > 0) {
        selectedTokenData = recommendedProperties[0];
      }
      
      if (isGoalBased && recommendedProperties.length > 0) {
        // In goal-based mode, use the selected token's investment amount or first one
        amount = selectedTokenData?.investmentNeeded || 0;
      } else {
        amount = parseFloat(investAmount.replace(/,/g, '')) || 1000;
      }

      if (!selectedTokenData) {
        Alert.alert('Error', 'Please select a property token before saving the plan.');
        return;
      }

      const { token, property } = selectedTokenData;

      // Save the plan
      await savedPlansService.savePlan({
        investmentAmount: amount,
        monthlyIncomeGoal: investmentPlan.monthlyIncomeGoal,
        selectedProperty: property ? {
          id: property.id,
          title: property.title,
          location: property.location || property.city,
          image: property.images?.[0] || property.image,
        } : undefined,
        selectedPropertyTokenId: token.id,
        expectedMonthlyReturn: isGoalBased
          ? (investmentPlan.monthlyIncomeGoal || 0)
          : (amount * token.expectedROI / 100) / 12,
        estimatedROI: token.expectedROI,
        isGoalBased: isGoalBased,
      });

      Alert.alert('Success', 'Investment plan saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('./guidance-four'),
        },
      ]);
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save the plan. Please try again.');
    }
  };

  const handlePropertySelect = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    console.log("Property token selected:", tokenId);
  };

  const handleInfoPress = (propertyData: {
    token: any;
    property: any;
    expectedMonthlyReturn: string;
    breakEven: string;
    tokensCount: number;
    investmentNeeded?: number;
  }) => {
    setSelectedPropertyForModal(propertyData);
    setModalVisible(true);
    modalTranslateY.value = withTiming(0, { duration: 300 });
    modalOpacity.value = withTiming(1, { duration: 300 });
  };

  const handleCloseModal = () => {
    modalTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    modalOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setModalVisible(false);
      setSelectedPropertyForModal(null);
    }, 300);
  };

  // Animated styles for modal
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
      <KeyboardDismissButton inputAccessoryViewID="guidanceTwoInputAccessory" />

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
          Guided Investment
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="never"
      >
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 28 }}>
          {/* Toggle Section - Only show if not in goal-based mode */}
          {!isGoalBased && (
            <View style={{ paddingVertical: 8, marginBottom: 6 }}>
              {/* <View style={{
                flexDirection: 'row',
                height: 20,
                backgroundColor: colors.card,
                borderRadius: 12,
              }}> */}
                <View
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
                      fontSize: 18,
                      fontWeight: '500',
                      color: investmentMode === "amount"
                        ? colors.textPrimary
                        : colors.textMuted,
                    }}
                  >
                    Invest Amount
                  </Text>
                </View>
              {/* </View> */}
            </View>
          )}

          {/* Input Fields - Only show if not in goal-based mode */}
          {!isGoalBased ? (
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
                    inputAccessoryViewID={Platform.OS === 'ios' ? 'guidanceTwoInputAccessory' : undefined}
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
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                  />
                </View>
              </View>
            </View>
          ) : (
            /* Goal-based mode: Show monthly goal info */
            <View style={{ marginBottom: 16, padding: 16, backgroundColor: colors.card, borderRadius: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Your Monthly Income Goal
              </Text>
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>
                ${investmentPlan.monthlyIncomeGoal?.toFixed(2) || '0.00'} / month
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                Each property below shows the minimum investment needed to achieve this goal
              </Text>
            </View>
          )}

          {/* Recommended Properties Section */}
          <View style={{ marginTop: 2 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
              Recommended For You
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 16 }}>
              {isGoalBased 
                ? `Tap a property token to select it. Tokens are ranked by lowest investment needed to achieve your $${investmentPlan.monthlyIncomeGoal?.toFixed(2) || '0.00'}/month goal.`
                : 'Tap a property token to select it. Tokens are ranked by highest ROI that match your investment amount.'}
            </Text>

            {/* Property Cards */}
            <View style={{ flexDirection: 'column', gap: 16 }}>
              {isLoadingProperties ? (
                <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>
                    Loading properties...
                  </Text>
                </View>
              ) : (
                <ScrollView 
                  style={{ flex: 1, height: 420 }}
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ gap: 12,paddingBottom: 10 }} >
                  {recommendedProperties.length > 0 ? (
                    recommendedProperties.map(({ token, property, expectedMonthlyReturn, breakEven, tokensCount, investmentNeeded }) => {
                      const isSelected = selectedTokenId === token.id;
                      const isGoalBased = investmentPlan.isGoalBased || false;
                      return (
                        <TouchableOpacity
                          key={token.id}
                          onPress={() => handlePropertySelect(token.id)}
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
                            source={{ 
                              uri: property.images && property.images.length > 0 
                                ? property.images[0] 
                                : 'https://via.placeholder.com/96x96?text=No+Image'
                            }}
                            style={{ width: 96, height: 96, borderRadius: 8 }}
                            resizeMode="cover"
                            defaultSource={require('@/assets/blank.png')}
                          />

                        <View style={{ flex: 1, justifyContent: 'space-between' }}>
                          <View>
                            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                              {property.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                              {token.name} • {token.tokenSymbol}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                              {property.location || property.city || 'Location not available'}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>ROI</Text>
                              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>
                                {token.expectedROI.toFixed(1)}%
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

                            {isGoalBased && (
                              <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                  Investment
                                </Text>
                                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>
                                  ${investmentNeeded.toFixed(0)}
                                </Text>
                              </View>
                            )}

                            <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                Tokens
                              </Text>
                              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }}>
                                {tokensCount.toFixed(3)}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleInfoPress({ token, property, expectedMonthlyReturn, breakEven, tokensCount, investmentNeeded });
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 16,
                                  backgroundColor: isDarkColorScheme
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(16, 185, 129, 0.15)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons
                                  name="information-circle-outline"
                                  size={20}
                                  color={colors.primary}
                                /> 
                              </TouchableOpacity>
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
                )}
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
              {isVerified ? 'Invest Now' : 'Submit KYC to Invest'}
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

      {/* Property Info Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={handleCloseModal}
        >
          <Animated.View
            style={[
              {
                flex: 1,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(0, 0, 0, 0.7)'
                  : 'rgba(0, 0, 0, 0.5)',
              },
              backdropAnimatedStyle,
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: SCREEN_HEIGHT * 0.85,
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 20,
            },
            modalAnimatedStyle,
          ]}
        >
          <View style={{ flex: 1 }} pointerEvents="box-none">
            <SafeAreaView style={{ flex: 1 }}>
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingTop: 16,
                  paddingBottom: 12,
                  marginTop: 35,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
                pointerEvents="box-none"
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}
                >
                  Investment Details
                </Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Modal Content - Scrollable */}
              {selectedPropertyForModal && (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  bounces={true}
                  scrollEnabled={true}
                  alwaysBounceVertical={false}
                >
                  {/* Property Image */}
                  <Image
                    source={{
                      uri:
                        selectedPropertyForModal.property.images &&
                        selectedPropertyForModal.property.images.length > 0
                          ? selectedPropertyForModal.property.images[0]
                          : 'https://via.placeholder.com/400x200?text=No+Image',
                    }}
                    style={{
                      width: '100%',
                      height: 200,
                      borderRadius: 16,
                      marginBottom: 20,
                    }}
                    resizeMode="cover"
                  />

                  {/* Property Title */}
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 22,
                      fontWeight: 'bold',
                      marginBottom: 8,
                    }}
                  >
                    {selectedPropertyForModal.property.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: '600',
                      marginBottom: 4,
                    }}
                  >
                    {selectedPropertyForModal.token.name} • {selectedPropertyForModal.token.tokenSymbol}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      marginBottom: 24,
                    }}
                  >
                    {selectedPropertyForModal.property.location ||
                      selectedPropertyForModal.property.city ||
                      'Location not available'}
                  </Text>

                  {/* Investment Summary Card */}
                  <View
                    style={{
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.1)',
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 24,
                      borderWidth: 2,
                      borderColor: isDarkColorScheme
                        ? 'rgba(16, 185, 129, 0.3)'
                        : 'rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginBottom: 16,
                      }}
                    >
                      Your Investment Outcomes
                    </Text>

                    <View style={{ gap: 16 }}>
                      {/* Investment Amount */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name="wallet-outline"
                            size={20}
                            color={colors.textSecondary}
                          />
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            Investment Amount
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          ${selectedPropertyForModal.investmentNeeded 
                            ? selectedPropertyForModal.investmentNeeded.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                            : parseFloat(investAmount.replace(/,/g, '')).toLocaleString()}
                        </Text>
                      </View>

                      {/* Tokens */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name="cube-outline"
                            size={20}
                            color={colors.textSecondary}
                          />
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            Tokens You'll Own
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          {selectedPropertyForModal.tokensCount.toFixed(2)}
                        </Text>
                      </View>

                      {/* Monthly Return */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color={colors.primary}
                          />
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            Expected Monthly Income
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 18,
                            fontWeight: 'bold',
                          }}
                        >
                          ${selectedPropertyForModal.expectedMonthlyReturn}
                        </Text>
                      </View>

                      {/* Annual Return */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name="trending-up-outline"
                            size={20}
                            color={colors.primary}
                          />
                          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                            Expected Annual Income
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          $
                          {(
                            parseFloat(selectedPropertyForModal.expectedMonthlyReturn) * 12
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Property Details Card */}
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginBottom: 16,
                      }}
                    >
                      Token Details
                    </Text>

                    <View style={{ gap: 12 }}>
                      {/* Token Name */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Token Name
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          {selectedPropertyForModal.token.name}
                        </Text>
                      </View>

                      {/* Token Symbol */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Token Symbol
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          {selectedPropertyForModal.token.tokenSymbol}
                        </Text>
                      </View>

                      {/* ROI */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Expected ROI
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          {selectedPropertyForModal.token.expectedROI.toFixed(1)}%
                        </Text>
                      </View>

                      {/* Token Price */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Token Price
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          ${getEffectiveTokenPrice(selectedPropertyForModal.token.pricePerTokenUSDT).toFixed(2)}
                        </Text>
                      </View>

                      {/* Available Tokens */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Available Tokens
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          {selectedPropertyForModal.token.availableTokens.toFixed(2)}
                        </Text>
                      </View>

                      {/* Valuation */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Property Valuation
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          $
                          {typeof selectedPropertyForModal.property.valuation === 'number'
                            ? selectedPropertyForModal.property.valuation.toLocaleString()
                            : selectedPropertyForModal.property.valuation}
                        </Text>
                      </View>

                      {/* Funding Progress */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Funding Progress
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          {Math.round(
                            (selectedPropertyForModal.property.soldTokens /
                              selectedPropertyForModal.property.totalTokens) *
                              100
                          )}
                          %
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Projected Returns Card */}
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginBottom: 16,
                      }}
                    >
                      Projected Returns (5 Years)
                    </Text>

                    <View style={{ gap: 12 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Total Monthly Income (5 years)
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          $
                          {(
                            parseFloat(selectedPropertyForModal.expectedMonthlyReturn) * 60
                          ).toFixed(2)}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Total Annual Income (5 years)
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          $
                          {(
                            parseFloat(selectedPropertyForModal.expectedMonthlyReturn) * 12 * 5
                          ).toFixed(2)}
                        </Text>
                      </View>

                      <View
                        style={{
                          height: 1,
                          backgroundColor: colors.border,
                          marginVertical: 8,
                        }}
                      />

                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 15,
                            fontWeight: '600',
                          }}
                        >
                          Net Return (after initial investment)
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 18,
                            fontWeight: 'bold',
                          }}
                        >
                          $
                          {(
                            parseFloat(selectedPropertyForModal.expectedMonthlyReturn) * 12 * 5 -
                            (selectedPropertyForModal.investmentNeeded || parseFloat(investAmount.replace(/,/g, '')))
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Info Note */}
                  <View
                    style={{
                      backgroundColor: isDarkColorScheme
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(59, 130, 246, 0.1)',
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDarkColorScheme
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Ionicons
                        name="information-circle"
                        size={20}
                        color="#3B82F6"
                        style={{ marginTop: 2 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: '#3B82F6',
                            fontSize: 13,
                            fontWeight: '600',
                            marginBottom: 4,
                          }}
                        >
                          Important Note
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 12,
                            lineHeight: 18,
                          }}
                        >
                          Returns are estimates based on current property performance and market
                          conditions. Actual returns may vary. Past performance does not guarantee
                          future results.
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* Modal Footer - Fixed at bottom */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  backgroundColor: colors.background,
                }}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  onPress={() => {
                    if (selectedPropertyForModal) {
                      handleCloseModal();
                      handlePropertySelect(selectedPropertyForModal.token.id);
                    }
                  }}
                  style={{
                    height: 52,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: colors.primaryForeground,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Select This Token
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}