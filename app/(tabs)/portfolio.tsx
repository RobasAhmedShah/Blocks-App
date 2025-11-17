import React, { useMemo, useState, useRef } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { usePortfolio } from "@/services/usePortfolio";
import { PropertyCardStack } from "@/components/PropertyCard";
import { useColorScheme } from "@/lib/useColorScheme";
import { ROITrendChart } from "@/components/portfolio/ROITrendChart";
import { MonthlyIncomeChart } from "@/components/portfolio/MonthlyIncomeChart";
import { InvestmentDistributionChart } from "@/components/portfolio/InvestmentDistributionChart";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32; // Full width minus padding

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const {
    investments,
    totalValue,
    totalROI,
    monthlyRentalIncome,
    loading,
    loadInvestments,
  } = usePortfolio();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<'roi' | 'income' | 'distribution' | null>(null);
  const modalTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Modal functions
  const openModal = (chartType: 'roi' | 'income' | 'distribution') => {
    setSelectedChartType(chartType);
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(modalTranslateY, {
        toValue: Dimensions.get('window').height,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedChartType(null);
    });
  };

  // Refresh investments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadInvestments) {
        loadInvestments();
      }
    }, [loadInvestments])
  );

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
                  {/* <TouchableOpacity
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
                  </TouchableOpacity> */}
                </View>
                {/* <TouchableOpacity
                onPress={() => router.push('/profile')}
                >
                  <Ionicons name="person-circle-outline" size={32} color={colors.textMuted} />
                </TouchableOpacity> */}
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
          snapToInterval={CHART_WIDTH }
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        >
          {/* ROI Trend Chart */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openModal('roi')}
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
              padding: 16,
              width: CHART_WIDTH,
            }}
            
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
              ROI Trend
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">Last 12 months</Text>
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                borderRadius: 8,
                height: 100,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <ROITrendChart
                data={chartData.roiTrendData}
                width={CHART_WIDTH - 32}
                height={100}
                color={colors.primary}
                backgroundColor={isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'}
                textColor={colors.textMuted}
              />
            </View>
          </TouchableOpacity>

          {/* Monthly Income Chart */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openModal('income')}
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
              padding: 16,
              width: CHART_WIDTH,
            }}
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
              Monthly Income
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">Year-to-date</Text>
            <View 
              style={{ 
                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                borderRadius: 8,
                height: 100,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <MonthlyIncomeChart
                data={chartData.monthlyIncomeData}
                width={CHART_WIDTH - 32}
                height={100}
                color={colors.primary}
                backgroundColor={isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB'}
                textColor={colors.textMuted}
              />
            </View>
          </TouchableOpacity>

          {/* Investment Distribution Chart */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openModal('distribution')}
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
              padding: 16,
              width: CHART_WIDTH,
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
                height: 120,
                overflow: 'hidden',
              }}
            >
              <InvestmentDistributionChart
                data={chartData.distributionData}
                width={CHART_WIDTH - 32}
                height={120}
                textColor={colors.textMuted}
              />
            </View>
          </TouchableOpacity>
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
          <TouchableOpacity 
          onPress={() => router.push('/portfolio/myassets/assets-first')}
          className="flex-col items-center justify-center p-2 flex-1">
            <Ionicons name="cube" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
             My Assets
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

      {/* Chart Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: modalOpacity,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '85%',
              transform: [{ translateY: modalTranslateY }],
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: '85%' }}
            >
              {/* Drag Handle */}
              <View className="items-center py-3">
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                  }}
                />
              </View>

              {/* Header */}
              <View className="px-6 pb-4 flex-row items-center justify-between">
                <View>
                  <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
                    {selectedChartType === 'roi' && 'ROI Trend Details'}
                    {selectedChartType === 'income' && 'Monthly Income Details'}
                    {selectedChartType === 'distribution' && 'Investment Distribution Details'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
                    {selectedChartType === 'roi' && 'Last 12 months performance'}
                    {selectedChartType === 'income' && 'Year-to-date income breakdown'}
                    {selectedChartType === 'distribution' && 'Portfolio allocation by property'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View className="px-6 pb-8">
                {selectedChartType === 'roi' && (
                  <View>
                    <View className="mb-4">
                      <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
                        Monthly ROI Performance
                      </Text>
                      {chartData.roiTrendData.map((value, index) => {
                        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        return (
                          <View
                            key={index}
                            style={{
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 12,
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View>
                                <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                                  {months[index]}
                                </Text>
                                <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">
                                  Month {index + 1} of 12
                                </Text>
                              </View>
                              <View className="items-end">
                                <View
                                  style={{
                                    backgroundColor: value >= (totalROI || 20) ? `rgba(68, 239, 82, 0.2)` : 'rgba(239, 68, 68, 0.2)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: value >= (totalROI || 20) ? colors.primary : '#EF4444',
                                      fontSize: 16,
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    {value.toFixed(2)}%
                                  </Text>
                                </View>
                                <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                                  ROI
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary }} className="text-base font-semibold mb-2">
                        Summary
                      </Text>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Average ROI:</Text>
                        <Text style={{ color: colors.textPrimary }} className="font-semibold">
                          {(chartData.roiTrendData.reduce((a, b) => a + b, 0) / chartData.roiTrendData.length).toFixed(2)}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Highest ROI:</Text>
                        <Text style={{ color: colors.primary }} className="font-semibold">
                          {Math.max(...chartData.roiTrendData).toFixed(2)}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text style={{ color: colors.textSecondary }}>Lowest ROI:</Text>
                        <Text style={{ color: '#EF4444' }} className="font-semibold">
                          {Math.min(...chartData.roiTrendData).toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {selectedChartType === 'income' && (
                  <View>
                    <View className="mb-4">
                      <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
                        Monthly Income Breakdown
                      </Text>
                      {chartData.monthlyIncomeData.map((value, index) => {
                        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
                        return (
                          <View
                            key={index}
                            style={{
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 12,
                            }}
                          >
                            <View className="flex-row items-center justify-between">
                              <View>
                                <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                                  {months[index]}
                                </Text>
                                <Text style={{ color: colors.textSecondary }} className="text-xs mt-1">
                                  Month {index + 1} of 8
                                </Text>
                              </View>
                              <View className="items-end">
                                <Text style={{ color: colors.primary }} className="text-lg font-bold">
                                  ${value.toFixed(2)}
                                </Text>
                                <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                                  Rental Income
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary }} className="text-base font-semibold mb-2">
                        Summary
                      </Text>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Total Income:</Text>
                        <Text style={{ color: colors.textPrimary }} className="font-semibold">
                          ${chartData.monthlyIncomeData.reduce((a, b) => a + b, 0).toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Average Monthly:</Text>
                        <Text style={{ color: colors.primary }} className="font-semibold">
                          ${(chartData.monthlyIncomeData.reduce((a, b) => a + b, 0) / chartData.monthlyIncomeData.length).toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text style={{ color: colors.textSecondary }}>Highest Month:</Text>
                        <Text style={{ color: colors.primary }} className="font-semibold">
                          ${Math.max(...chartData.monthlyIncomeData).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {selectedChartType === 'distribution' && (
                  <View>
                    <View className="mb-4">
                      <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
                        Property Investment Breakdown
                      </Text>
                      {chartData.distributionData.map((item, index) => {
                        const total = chartData.distributionData.reduce((sum, d) => sum + d.value, 0);
                        const percentage = (item.value / total) * 100;
                        return (
                          <View
                            key={index}
                            style={{
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 12,
                            }}
                          >
                            <View className="flex-row items-center justify-between mb-3">
                              <View className="flex-row items-center gap-3">
                                <View
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: item.color,
                                  }}
                                />
                                <Text style={{ color: colors.textPrimary }} className="text-base font-semibold" numberOfLines={1}>
                                  {item.label}
                                </Text>
                              </View>
                              <Text style={{ color: colors.primary }} className="text-lg font-bold">
                                {percentage.toFixed(1)}%
                              </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                              <Text style={{ color: colors.textSecondary }} className="text-sm">
                                Investment Value
                              </Text>
                              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                                ${item.value.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Text>
                            </View>
                            {/* Progress Bar */}
                            <View
                              style={{
                                height: 6,
                                backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: 3,
                                marginTop: 12,
                                overflow: 'hidden',
                              }}
                            >
                              <View
                                style={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  backgroundColor: item.color,
                                  borderRadius: 3,
                                }}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <View
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <Text style={{ color: colors.textPrimary }} className="text-base font-semibold mb-2">
                        Portfolio Summary
                      </Text>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Total Properties:</Text>
                        <Text style={{ color: colors.textPrimary }} className="font-semibold">
                          {chartData.distributionData.length}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text style={{ color: colors.textSecondary }}>Total Investment:</Text>
                        <Text style={{ color: colors.primary }} className="font-semibold">
                          ${chartData.distributionData.reduce((sum, d) => sum + d.value, 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text style={{ color: colors.textSecondary }}>Largest Position:</Text>
                        <Text style={{ color: colors.textPrimary }} className="font-semibold" numberOfLines={1}>
                          {chartData.distributionData.reduce((max, d) => d.value > max.value ? d : max, chartData.distributionData[0])?.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}
