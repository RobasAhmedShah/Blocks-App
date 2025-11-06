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
import { useColorScheme } from "@/lib/useColorScheme";

export default function PlanSavedScreen() {
  const router = useRouter();
  const { investmentPlan, resetPlan } = useGuidance();
  const { colors, isDarkColorScheme } = useColorScheme();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
          {/* Success Icon and Message */}
          <View style={{ flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
            {/* Circular Success Icon */}
            <View style={{
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: `${colors.primary}1A`,
              marginBottom: 24,
            }}>
              <View style={{
                width: 64,
                height: 64,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                // backgroundColor: `${colors.primary}33`,
              }}>
                <Ionicons name="checkmark-circle" size={48}  />
              </View>
            </View>

            {/* Success Title */}
            <Text style={{
              color: colors.textPrimary,
              fontSize: 24,
              fontWeight: 'bold',
              letterSpacing: -0.5,
            }}>
              Plan Saved Successfully
            </Text>

            {/* Subtitle */}
            <Text style={{
              color: colors.textSecondary,
              fontSize: 16,
              marginTop: 8,
              paddingHorizontal: 32,
              textAlign: 'center',
            }}>
              Your investment plan is set and ready to go.
            </Text>
          </View>

          {/* Plan Summary Card */}
          <View style={{ marginVertical: 32 }}>
            <View style={{
              borderRadius: 12,
              backgroundColor: colors.card,
              padding: 24,
            }}>
              <Text style={{
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 16,
              }}>
                Plan Summary
              </Text>

              <View style={{ flexDirection: 'column', gap: 16 }}>
                {/* Investment Target */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                    Investment Target
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    {planSummary.investmentTarget}
                  </Text>
                </View>

                {/* Recurring Deposit */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                    Recurring Deposit
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    {planSummary.recurringDeposit}
                  </Text>
                </View>

                {/* First Deposit */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                    First Deposit
                  </Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>
                    {planSummary.firstDeposit}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
            {/* Return to Wallet Button */}
            <TouchableOpacity
              onPress={handleReturnToWallet}
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
                Go to Wallet
              </Text>
            </TouchableOpacity>

            {/* Edit Plan Button */}
            <TouchableOpacity
              onPress={handleEditPlan}
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
                Edit Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}