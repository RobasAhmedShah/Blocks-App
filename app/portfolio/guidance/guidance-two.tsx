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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGuidance } from "@/contexts/GuidanceContext";
import { useApp } from "@/contexts/AppContext";
import { useColorScheme } from "@/lib/useColorScheme";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GuidedInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();
  const { state, isLoadingProperties } = useApp();
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<{
    property: any;
    expectedMonthlyReturn: string;
    breakEven: string;
    tokensCount: number;
  } | null>(null);
  
  // Animation values for modal
  const modalTranslateY = useSharedValue(SCREEN_HEIGHT);
  const modalOpacity = useSharedValue(0);

  // Get top 3 properties by ROI that match the investment amount
  const recommendedProperties = useMemo(() => {
    const amount = parseFloat(investAmount.replace(/,/g, ''));

    // If amount is less than or equal to 0, return empty array
    if (amount <= 0) {
      return [];
    }
    
    // Use properties from AppContext (API data)
    return state.properties
      .filter(p => {
        // Only show properties where the investment amount is enough to buy at least 0.1 tokens
        const tokens = amount / p.tokenPrice;
        return tokens >= 0.1 && p.totalTokens > 0 && p.soldTokens < p.totalTokens; // Only show available properties
      })
      .sort((a, b) => b.estimatedROI - a.estimatedROI)
      .slice(0, 10) // Limit to top 10 recommendations
      .map(p => ({
        property: p,
        expectedMonthlyReturn: ((amount * p.estimatedYield) / 100 / 12).toFixed(2),
        breakEven: (100 / p.estimatedROI).toFixed(1),
        tokensCount: amount / p.tokenPrice, // Calculate tokens here
      }));
  }, [investAmount, state.properties]);

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
      ? state.properties.find(p => p.id === selectedPropertyId)
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

  const handleInfoPress = (propertyData: {
    property: any;
    expectedMonthlyReturn: string;
    breakEven: string;
    tokensCount: number;
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
              // padding: 4,
            }}>
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
              {isLoadingProperties ? (
                <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>
                    Loading properties...
                  </Text>
                </View>
              ) : (
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
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                              {property.location || property.city || 'Location not available'}
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

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleInfoPress({ property, expectedMonthlyReturn, breakEven, tokensCount });
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
          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
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
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
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
                  bounces={false}
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
                          ${parseFloat(investAmount.replace(/,/g, '')).toLocaleString()}
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
                      Property Details
                    </Text>

                    <View style={{ gap: 12 }}>
                      {/* ROI */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Estimated ROI
                        </Text>
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 16,
                            fontWeight: 'bold',
                          }}
                        >
                          {selectedPropertyForModal.property.estimatedROI.toFixed(1)}%
                        </Text>
                      </View>

                      {/* Yield */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                          Annual Yield
                        </Text>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: '600',
                          }}
                        >
                          {selectedPropertyForModal.property.estimatedYield.toFixed(1)}%
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
                          ${selectedPropertyForModal.property.tokenPrice.toFixed(2)}
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
                            parseFloat(investAmount.replace(/,/g, ''))
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
              >
                <TouchableOpacity
                  onPress={() => {
                    if (selectedPropertyForModal) {
                      handleCloseModal();
                      handlePropertySelect(selectedPropertyForModal.property.id);
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
                    Select This Property
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}