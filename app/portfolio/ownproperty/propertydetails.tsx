import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { usePortfolio } from "@/services/usePortfolio";

const { width } = Dimensions.get("window");

export default function MyInvestmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments } = usePortfolio();

  // Find the specific investment
  const investment = investments.find((inv) => inv.property.id === id);

  if (!investment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>Investment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const property = investment.property;

  // Calculate additional metrics
  const tokensOwned =  Math.floor(investment.investedAmount / property.tokenPrice);
  const totalTokens = property.totalTokens;
  const ownershipPercentage = ((tokensOwned / totalTokens) * 100).toFixed(3);
  const totalEarned = investment.currentValue - investment.investedAmount; // Simulated
  const averageMonthlyReturn = investment.monthlyRentalIncome;
  const annualizedReturn = (averageMonthlyReturn * 12);
  const breakEvenYears = (investment.investedAmount / annualizedReturn).toFixed(1);

  // Investment timeline (simulated)
  const investmentHistory = [
    {
      id: "1",
      date: "Jan 15, 2025",
      type: "Investment",
      amount: investment.investedAmount,
      description: `Purchased ${tokensOwned} tokens`,
    },
    {
      id: "2",
      date: "Feb 01, 2025",
      type: "Dividend",
      amount: investment.monthlyRentalIncome,
      description: "Monthly rental income",
    },
    {
      id: "3",
      date: "Mar 01, 2025",
      type: "Dividend",
      amount: investment.monthlyRentalIncome,
      description: "Monthly rental income",
    },
    {
      id: "4",
      date: "Apr 01, 2025",
      type: "Dividend",
      amount: investment.monthlyRentalIncome,
      description: "Monthly rental income",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row a items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          My Investment
        </Text>

        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Property Image */}
        <Image
          source={{ uri: property.images[0] }}
          style={{ width: width, height: width  }}
          resizeMode="cover"
        />

        <View className="px-4 py-6">
          {/* Property Title */}
          <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold mb-1">
            {property.title}
          </Text>
          <View className="flex-row items-center gap-1 mb-6">
            <Ionicons name="location" size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              {property.location}
            </Text>
          </View>

          {/* Investment Overview Card */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-6"
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Investment Overview
            </Text>

            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                  Initial Investment
                </Text>
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                  ${investment.investedAmount.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                  Current Value
                </Text>
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                  ${investment.currentValue.toLocaleString()}
                </Text>
              </View>
            </View>

            <View 
              style={{ 
                backgroundColor: isDarkColorScheme 
                  ? 'rgba(22, 163, 74, 0.15)' 
                  : 'rgba(22, 163, 74, 0.1)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs mb-1">
                    Total Gain
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-lg font-bold">
                    +${(investment.currentValue - investment.investedAmount).toFixed(2)}
                  </Text>
                </View>
                <View 
                  style={{ 
                    // backgroundColor: colors.primary + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    +{investment.roi.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Ownership Details */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-6"
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Ownership Details
            </Text>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Tokens Owned
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                {tokensOwned.toLocaleString()} tokens
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Ownership Share
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                {ownershipPercentage}%
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Token Price
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                ${property.tokenPrice.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Purchase Date
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                Jan 15, 2025
              </Text>
            </View>
          </View>

          {/* Income & Returns */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-6"
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Income & Returns
            </Text>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Monthly Income
              </Text>
              <Text style={{ color: colors.primary }} className="text-base font-bold">
                ${averageMonthlyReturn.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Annual Projected Income
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                ${annualizedReturn.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Total Earned to Date
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                ${totalEarned.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Next Payout
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                {investment?.property.nextPayout || "N/A"}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Break-Even Period
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                ~{breakEvenYears} years
              </Text>
            </View>
          </View>

          {/* Property Performance */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-6"
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Property Performance
            </Text>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Occupancy Rate
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                {investment?.property.occupancy || "N/A"}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Rental Yield
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                {property.estimatedYield.toFixed(1)}%
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                Property Status
              </Text>
              <View 
                style={{ 
                //   backgroundColor: colors.primary + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: colors.primary }} className="text-xs font-bold">
                  {property.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-6"
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Transaction History
            </Text>

            {investmentHistory.map((transaction, index) => (
              <View key={transaction.id}>
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View 
                      style={{ 
                        backgroundColor: transaction.type === "Investment" 
                          ? 'rgba(59, 130, 246, 0.15)' 
                          : 'rgba(22, 163, 74, 0.15)',
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons 
                        name={transaction.type === "Investment" ? "arrow-down" : "arrow-up"} 
                        size={20} 
                        color={transaction.type === "Investment" ? "#3B82F6" : colors.primary} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                        {transaction.type}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-xs">
                        {transaction.description}
                      </Text>
                      <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                        {transaction.date}
                      </Text>
                    </View>
                  </View>
                  <Text 
                    style={{ 
                      color: transaction.type === "Investment" ? "#3B82F6" : colors.primary 
                    }} 
                    className="text-base font-bold"
                  >
                    {transaction.type === "Investment" ? "-" : "+"}${transaction.amount.toLocaleString()}
                  </Text>
                </View>
                {index < investmentHistory.length - 1 && (
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                )}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.push({
                pathname: "/invest/[id]",
                params: { id: property.id },
              })}
              style={{ backgroundColor: colors.primary }}
              className="flex-1 h-14 rounded-xl items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-bold">
                Invest More
              </Text>
            </TouchableOpacity>

          
          </View>

          {/* View Property Details Link */}
          <TouchableOpacity
            onPress={() => router.push(`/property/${property.id}`)}
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.3)' 
                : 'rgba(13, 165, 165, 0.2)'
            }}
            className="rounded-xl p-4 flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                View Full Property Details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}