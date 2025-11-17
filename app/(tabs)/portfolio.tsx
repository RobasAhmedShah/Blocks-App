import React from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { usePortfolio } from "@/services/usePortfolio";
import { PropertyCardStack } from "@/components/PropertyCard";
import { useColorScheme } from "@/lib/useColorScheme";

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

  // Refresh investments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadInvestments) {
        loadInvestments();
      }
    }, [loadInvestments])
  );

  // Loading state
  if (loading || !investments) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center">
        <Text style={{ color: colors.textSecondary }}>Loading portfolio...</Text>
      </View>
    );
  }

  // Calculate stats
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalEarnings = totalValue - totalInvested;
  const averageMonthly = monthlyRentalIncome;
  const thisMonthEarnings = monthlyRentalIncome * 1.12; // Simulated 12% growth
  const nextPayoutDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  // Find best performing property
  const bestProperty = investments.reduce((best, current) => 
    current.roi > (best?.roi || 0) ? current : best
  , investments[0]);

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
          </View>
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

      {/* Stats Overview Cards */}
      <View className="px-4 mt-6">
        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
          Overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {/* Total Earnings Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.08)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.3)' : 'rgba(22, 163, 74, 0.2)',
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <View
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.3)' : 'rgba(22, 163, 74, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                  All Time
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Total Earnings
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* This Month Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="calendar" size={20} color="#10B981" />
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>
                  +12%
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              This Month
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${thisMonthEarnings.toFixed(2)}
            </Text>
          </View>

          {/* Total Invested Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="wallet" size={20} color="#3B82F6" />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Next Payout Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Next Payout
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
              {nextPayoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              ~${averageMonthly.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Summary */}
      <View className="px-4 mt-6">
        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
          Performance Summary
        </Text>
        <View
          style={{
            backgroundColor: isDarkColorScheme ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
          }}
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="trending-up" size={20} color="#8B5CF6" />
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
              Monthly Highlights
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Average Monthly Return
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              ${averageMonthly.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Best Performer
            </Text>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
              {bestProperty?.property.title || 'N/A'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Active Properties
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              {investments.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-4 mt-6">
        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
          Recent Activity
        </Text>
        <View className="gap-3">
          {/* Activity Item 1 - Rental Payment */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="cash" size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Rental Payment Received
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {bestProperty?.property.title || 'Property'}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: 'bold' }}>
              +${(monthlyRentalIncome / investments.length).toFixed(2)}
            </Text>
          </View>

          {/* Activity Item 2 - Value Increase */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="arrow-up" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Property Value Increased
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {investments[1]?.property.title || 'Property'}
              </Text>
            </View>
            <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: 'bold' }}>
              +2.5%
            </Text>
          </View>

          {/* Activity Item 3 - Dividend */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="gift" size={20} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Dividend Payment
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                Quarterly distribution
              </Text>
            </View>
            <Text style={{ color: '#F59E0B', fontSize: 14, fontWeight: 'bold' }}>
              +${(monthlyRentalIncome * 0.15).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Properties Header */}
      <View className="px-4 mb-2 mt-6">
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

  // const renderFooter = () => (
  //   <>
  //     {/* Income Timeline */}
  //     <View className="px-4 mt-8 mb-20">
  //       <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
  //         Income Timeline
  //       </Text>
  //       <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
  //         Total visible income:{" "}
  //         <Text style={{ color: colors.textPrimary }} className="font-semibold">
  //           ${monthlyRentalIncome.toFixed(2)}
  //         </Text>
  //       </Text>
  //       <View className="flex-row items-end " style={{ marginLeft: -2 }}>
  //         {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug",].map(
  //           (month, index) => (
  //             <View
  //               key={month}
  //               className="items-center p-1 justify-end"
  //               style={{
  //                 flex: 1,
  //                 marginHorizontal: -1,
  //                 zIndex: 10 - index,
  //               }}
  //             >
  //               <View
  //                 style={{
  //                   backgroundColor: colors.primary,
  //                   width: "100%",
  //                   height: 60,
  //                   borderRadius: 8,
  //                   marginBottom: 8,
  //                   shadowColor: isDarkColorScheme ? "#000" : "rgba(22, 163, 74, 0.3)",
  //                   shadowOffset: { width: 0, height: 2 },
  //                   shadowOpacity: isDarkColorScheme ? 0.3 : 0.2,
  //                   shadowRadius: 4,
  //                   elevation: 3,
  //                 }}
  //               />
  //               <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
  //                 {month}
  //               </Text>
  //             </View>
  //           )
  //         )}
  //       </View>
  //     </View>
  //   </>
  // );

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      <FlatList
        data={[]}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCardStack data={[item]} />}
        ListHeaderComponent={renderHeader}
        // ListFooterComponent={renderFooter}
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
            className="flex-col items-center justify-center p-2 flex-1"
          >
            <Ionicons name="cube" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
             My Assets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('../portfolio/guidance/guidance-one')}
            className="flex-col items-center justify-center p-2 flex-1"
          >
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