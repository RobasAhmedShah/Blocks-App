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
import { useColorScheme } from "@/lib/useColorScheme";

export default function ConfirmInvestmentScreen() {
  const router = useRouter();
  const { investmentPlan, updateInvestmentPlan } = useGuidance();
  const { colors, isDarkColorScheme } = useColorScheme();

  // Get investment details from context
  const property = investmentPlan.selectedProperty;
  const investmentAmount = investmentPlan.investmentAmount;
  const monthlyReturn = investmentPlan.expectedMonthlyReturn || 0;
  const roi = investmentPlan.estimatedROI || 0;

  // Show loading/fallback state if no property
  if (!property) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Loading investment details...</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }}>Go Back</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: 35,
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
          Confirm Investment
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 32 }}>
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 384 }}>
            {/* Property Image and Info */}
            <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {property.images && property.images.length > 0 ? (
                <Image
                  source={{ uri: property.images[0] }}
                  style={{ width: 128, height: 128, borderRadius: 12 }}
                  resizeMode="cover"
                  defaultSource={require('@/assets/blank.png')}
                />
              ) : (
                <View style={{ 
                  width: 128, 
                  height: 128, 
                  borderRadius: 12, 
                  backgroundColor: colors.card,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                </View>
              )}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
                  {property.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                  {property.location || property.city || 'Location not available'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {property.builder.name} • {property.builder.rating}/5.0
                  </Text>
                </View>
              </View>
            </View>

            {/* Investment Details Card */}
            <View style={{
              flexDirection: 'column',
              gap: 20,
              borderRadius: 12,
              backgroundColor: colors.card,
              padding: 24,
              width: '100%',
            }}>
              {/* Investment Amount */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Investment Amount
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
                  ${investmentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: `${colors.border}80` }} />

              {/* Tokens to Purchase */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Tokens to Purchase
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '600' }}>
                  {(investmentAmount / property.tokenPrice).toFixed(2)} tokens
                </Text>
              </View>

              {/* Estimated ROI */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Estimated Annual ROI
                </Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '600' }}>
                  {roi.toFixed(1)}%
                </Text>
              </View>

              {/* Expected Monthly Return */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Expected Monthly Return
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '600' }}>
                  ${monthlyReturn.toFixed(2)}
                </Text>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: `${colors.border}80` }} />

              {/* Annual Return */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                  Expected Annual Return
                </Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '600' }}>
                  ${(monthlyReturn * 12).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Investment Breakdown Info Box */}
            <View style={{
              width: '100%',
              backgroundColor: `${colors.card}80`,
              borderRadius: 8,
              padding: 16,
              borderWidth: 1,
              borderColor: `${colors.primary}33`,
            }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                💡 What This Means
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
                You're investing <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>${investmentAmount.toLocaleString()}</Text> to purchase{' '}
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{Math.floor(investmentAmount / property.tokenPrice)} tokens</Text> of{' '}
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{property.title}</Text>.{'\n\n'}
                This property has an estimated annual ROI of{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>{roi.toFixed(1)}%</Text>, meaning you could earn approximately{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>${monthlyReturn.toFixed(2)}/month</Text> or{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>${(monthlyReturn * 12).toFixed(2)}/year</Text> in rental income.
              </Text>
            </View>

            {/* Terms Text */}
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 }}>
              By confirming, you agree to the Terms of Service. This is a non-binding intent to invest.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={{
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 16,
        backgroundColor: colors.background,
      }}>
        <View style={{ flexDirection: 'column', gap: 12 }}>
          <TouchableOpacity
            onPress={handleConfirm}
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
              Confirm & Proceed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            style={{
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: 'transparent',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}