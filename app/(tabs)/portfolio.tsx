import React, { useMemo } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePortfolio } from "@/services/usePortfolio";
import { PropertyCardStack } from "@/components/PropertyCard";
import { useColorScheme } from "@/lib/useColorScheme";
import { ROITrendChart } from "@/components/portfolio/ROITrendChart";
import { MonthlyIncomeChart } from "@/components/portfolio/MonthlyIncomeChart";
import { InvestmentDistributionChart } from "@/components/portfolio/InvestmentDistributionChart";

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const {
    investments,
    totalValue,
    totalROI,
    monthlyRentalIncome,
    loading,
  } = usePortfolio();

  // Generate chart data - MUST be called before any early returns
  const chartData = useMemo(() => {
    // ROI Trend - Last 12 months (simulated data based on current ROI)
    // Using deterministic values based on index for consistency
    const roiTrendData = Array.from({ length: 12 }, (_, i) => {
      const baseROI = totalROI || 20;
      // Create a smooth trend with some variation
      const trend = Math.sin((i / 12) * Math.PI * 2) * 3;
      const variation = (i % 3) * 1.5 - 1.5; // Small deterministic variation
      return Math.max(5, baseROI + trend + variation);
    });

    // Monthly Income - Year-to-date (simulated data with growth trend)
    const monthlyIncomeData = Array.from({ length: 8 }, (_, i) => {
      const baseIncome = monthlyRentalIncome || 250;
      // Gradual growth with some variation
      const growth = i * (baseIncome * 0.08);
      const variation = Math.sin(i * 0.5) * (baseIncome * 0.1);
      return Math.max(50, baseIncome * 0.7 + growth + variation);
    });

    // Investment Distribution - By property
    const distributionData = investments.length > 0
      ? investments.map((inv, index) => ({
          label: inv.property.title,
          value: inv.currentValue,
          color: index === 0 ? colors.primary : 
                 index === 1 ? '#10B981' : 
                 index === 2 ? '#3B82F6' : 
                 '#8B5CF6',
        }))
      : [
          { label: 'Sample', value: 10000, color: colors.primary },
          { label: 'Property', value: 5000, color: '#10B981' },
        ];

    return { roiTrendData, monthlyIncomeData, distributionData };
  }, [investments, totalROI, monthlyRentalIncome, colors.primary]);

  // Loading state - AFTER all hooks
  if (loading || !investments) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center">
        <Text style={{ color: colors.textSecondary }}>Loading portfolio...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {/* Header */}
      <View 
        style={{ 
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : colors.background,
          borderBottomWidth: isDarkColorScheme ? 0 : 1,
          borderBottomColor: colors.border,
        }}
        className="px-4 pt-12 pb-4"
      >
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
                    Total Portfolio Value
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/portfolio/guidance/guidance-one')}
                    style={{ 
                      backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="compass-outline" size={14} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                        Guide
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <Ionicons name="person-circle-outline" size={32} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
            $
            {totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)' 
            }}
            className="px-3 py-1.5 rounded-full flex-row items-center"
          >
            <Ionicons name="arrow-up" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="text-sm font-semibold ml-1">
              +{totalROI.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-xs text-right">
          ${monthlyRentalIncome.toFixed(2)} Monthly Rental Income
        </Text>
      </View>

      {/* Charts */}
      <View className="mt-4 w-full mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={376}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        >
          {/* ROI Trend Chart */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
              shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
              shadowOffset: { width: 0, height: isDarkColorScheme ? 4 : 8 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
              shadowRadius: isDarkColorScheme ? 4 : 12,
              elevation: isDarkColorScheme ? 8 : 4,
            }}
            className="rounded-xl p-4 w-[320px]"
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
              ROI Trend
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">Last 12 months</Text>
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                borderRadius: 8,
                height: 96,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ROITrendChart
                data={chartData.roiTrendData}
                width={280}
                height={96}
                color={colors.primary}
                backgroundColor={isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'}
                textColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Monthly Income Chart */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
              shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
              shadowOffset: { width: 0, height: isDarkColorScheme ? 4 : 8 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
              shadowRadius: isDarkColorScheme ? 4 : 12,
              elevation: isDarkColorScheme ? 8 : 4,
            }}
            className="rounded-xl p-4 w-[320px]"
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
              Monthly Income
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">Year-to-date</Text>
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                borderRadius: 8,
                height: 96,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MonthlyIncomeChart
                data={chartData.monthlyIncomeData}
                width={280}
                height={96}
                color={colors.primary}
                backgroundColor={isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'}
                textColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Investment Distribution Chart */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
              shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
              shadowOffset: { width: 0, height: isDarkColorScheme ? 4 : 8 },
              shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
              shadowRadius: isDarkColorScheme ? 4 : 12,
              elevation: isDarkColorScheme ? 8 : 4,
              borderRadius: 12,
              padding: 12,
              width: 360,
            }}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
                Investment Distribution
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>By property type</Text>
            </View>
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                borderRadius: 8,
                height: 110,
                overflow: 'hidden',
              }}
            >
              <InvestmentDistributionChart
                data={chartData.distributionData}
                width={336}
                height={110}
                textColor={colors.textMuted}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Properties Header */}
      <View className="px-4 mb-2">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
          Your Properties
        </Text>
      </View>

      {/* Overlapping Property Cards */}
      <View className="px-4 mb-6">
        <PropertyCardStack data={investments} />
      </View>
    </>
  );

  const renderFooter = () => (
    <>
      {/* Income Timeline */}
      <View className="px-4 mt-8 mb-20">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
          Income Timeline
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
          Total visible income:{" "}
          <Text style={{ color: colors.textPrimary }} className="font-semibold">
            ${monthlyRentalIncome.toFixed(2)}
          </Text>
        </Text>
        <View className="flex-row items-end " style={{ marginLeft: -2 }}>
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug",].map(
            (month, index) => (
              <View
                key={month}
                className="items-center p-1 justify-end"
                style={{
                  flex: 1,
                  marginHorizontal: -1,
                  zIndex: 10 - index,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.primary,
                    width: "100%",
                    height: 60,
                    borderRadius: 8,
                    marginBottom: 8,
                    shadowColor: isDarkColorScheme ? "#000" : "rgba(22, 163, 74, 0.3)",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDarkColorScheme ? 0.3 : 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                />
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
                  {month}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

    </>
  );


  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      <FlatList
        data={[]} // no need to render each investment separately
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCardStack data={[item]} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Bottom Actions */}
      <View className="mb-16 left-0 right-0 z-10 px-4 pb-6">
        <View
          style={{
            backgroundColor: isDarkColorScheme 
              ? 'rgba(11, 61, 54, 0.95)' 
              : '#FFFFFF',
            borderWidth: isDarkColorScheme ? 0 : 1,
            borderColor: colors.border,
            shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
            shadowOffset: { width: 0, height: isDarkColorScheme ? 10 : 8 },
            shadowOpacity: isDarkColorScheme ? 0.25 : 0.08,
            shadowRadius: isDarkColorScheme ? 20 : 24,
            elevation: isDarkColorScheme ? 20 : 8,
          }}
          className="rounded-full flex-row justify-around items-center py-2 px-3"
        >
          <TouchableOpacity
            onPress={() => router.push("../wallet")}
            className="flex-col items-center justify-center p-2 flex-1"
          >
            <Ionicons name="add" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-col items-center justify-center p-2 flex-1">
            <Ionicons name="remove" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
              Withdraw
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
          onPress={() => router.push('../portfolio/guidance/guidance-one')}
          className="flex-col items-center justify-center p-2 flex-1">
            <Ionicons name="document-text-outline" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
              Guidance
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
