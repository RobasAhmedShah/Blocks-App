import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { savedPlansService, SavedPlan } from '@/services/savedPlans';
import { useGuidance } from '@/contexts/GuidanceContext';
import { useApp } from '@/contexts/AppContext';
import { BlurView } from 'expo-blur';

export function SavedPlansSection() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { updateInvestmentPlan } = useGuidance();
  const { state } = useApp();
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = React.useCallback(async () => {
    try {
      setLoading(true);
      const plans = await savedPlansService.getAllPlans();
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error loading saved plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only load plans when screen comes into focus, not on every render
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      let isCancelled = false;
      
      const load = async () => {
        if (isCancelled || !isMounted) return;
        
        try {
          setLoading(true);
          const plans = await savedPlansService.getAllPlans();
          
          if (!isCancelled && isMounted) {
            setSavedPlans(plans);
          }
        } catch (error) {
          if (!isCancelled && isMounted) {
            console.error('Error loading saved plans:', error);
          }
        } finally {
          if (!isCancelled && isMounted) {
            setLoading(false);
          }
        }
      };
      
      load();
      
      return () => {
        isCancelled = true;
        isMounted = false;
      };
    }, []) // Empty deps - only run on focus
  );

  const handleDeletePlan = async (planId: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this saved plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedPlansService.deletePlan(planId);
              await loadPlans();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const handleUsePlan = (plan: SavedPlan) => {
    // Restore the plan to GuidanceContext
    const property = plan.selectedProperty?.id 
      ? state.properties.find(p => p.id === plan.selectedProperty?.id)
      : null;

    updateInvestmentPlan({
      investmentAmount: plan.investmentAmount,
      monthlyIncomeGoal: plan.monthlyIncomeGoal,
      selectedProperty: property || undefined,
      expectedMonthlyReturn: plan.expectedMonthlyReturn,
      estimatedROI: plan.estimatedROI,
      isGoalBased: plan.isGoalBased,
    });

    // Navigate to guidance-two screen
    router.push({
      pathname: '/portfolio/guidance/guidance-two',
      params: {},
    });
  };

  if (loading) {
    return null;
  }

  if (savedPlans.length === 0) {
    return null;
  }

  return (
    <View className="px-4 mt-6 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
          Saved Plans
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Clear All Plans',
              'Are you sure you want to delete all saved plans?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await savedPlansService.clearAllPlans();
                      await loadPlans();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear plans.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={{ color: colors.textMuted }} className="text-sm">
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 4 }}
      >
        {savedPlans.map((plan) => (
          <View
            key={plan.id}
            style={{
              width: 280,
              borderRadius: 18,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              // elevation: 6,
              marginRight: 12,
            }}
          >
            <BlurView
              intensity={28}
              tint="dark"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.10)',
                padding: 16,
              }}
            >
              {/* Subtle top highlight */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.35)',
                }}
              />
              
              <TouchableOpacity
                onPress={() => handleUsePlan(plan)}
                activeOpacity={0.8}
              >
            {/* Plan Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(16, 185, 129, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 10,
                      fontWeight: '600',
                    }}
                  >
                    {plan.isGoalBased ? 'GOAL-BASED' : 'AMOUNT-BASED'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePlan(plan.id);
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Property Info */}
            {plan.selectedProperty && (
              <View className="flex-row items-center gap-3 mb-3">
                {plan.selectedProperty.image && (
                  <Image
                    source={{ uri: plan.selectedProperty.image }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                )}
                <View className="flex-1">
                  <Text
                    style={{ color: colors.textPrimary }}
                    className="text-sm font-semibold"
                    numberOfLines={1}
                  >
                    {plan.selectedProperty.title}
                  </Text>
                  {plan.selectedProperty.location && (
                    <Text
                      style={{ color: colors.textSecondary }}
                      className="text-xs"
                      numberOfLines={1}
                    >
                      {plan.selectedProperty.location}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Plan Details */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  Investment Amount
                </Text>
                <Text style={{ color: colors.textPrimary }} className="text-sm font-bold">
                  ${plan.investmentAmount.toLocaleString()}
                </Text>
              </View>

              {plan.monthlyIncomeGoal && (
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    Monthly Goal
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    ${plan.monthlyIncomeGoal.toFixed(2)}/mo
                  </Text>
                </View>
              )}

              {plan.expectedMonthlyReturn && (
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    Expected Monthly
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    ${plan.expectedMonthlyReturn.toFixed(2)}/mo
                  </Text>
                </View>
              )}

              {plan.estimatedROI && (
                <View className="flex-row items-center justify-between">
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    Estimated ROI
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    {plan.estimatedROI.toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Use Plan Button */}
            <TouchableOpacity
              onPress={() => handleUsePlan(plan)}
              style={{
                marginTop: 12,
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8} >
              <Text
                style={{ color: colors.primaryForeground }}
                className="text-sm font-semibold"
              >
                Use This Plan
              </Text>
            </TouchableOpacity>

            {/* Date Info */}
            <Text
              style={{ color: colors.textMuted }}
              className="text-xs text-center mt-2"
            >
              Saved {new Date(plan.createdAt).toLocaleDateString()}
            </Text>
            </TouchableOpacity>
            </BlurView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

