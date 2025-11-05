import React from "react";
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
// import BookCard from "@/components/Testcard";

export default function PortfolioScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const {
    investments,
    totalValue,
    totalROI,
    monthlyRentalIncome,
    loading,
  } = usePortfolio();

  // Theme colors
  const colors = {
    light: {
      background: '#F8F7F5',
      card: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#4B5563',
      textMuted: '#6B7280',
      primary: '#16A34A',
      primarySoft: '#22C55E',
      border: 'rgba(0, 0, 0, 0.06)',
      neutral: '#E5E7EB',
      warning: '#EAB308',
    },
    dark: {
      background: '#012A24',
      card: '#0B3D36',
      textPrimary: '#F9FAFB',
      textSecondary: '#D1D5DB',
      textMuted: '#9CA3AF',
      primary: '#16A34A',
      primarySoft: '#22C55E',
      border: 'rgba(255, 255, 255, 0.08)',
      neutral: '#374151',
      warning: '#EAB308',
    },
  };

  const theme = isDarkColorScheme ? colors.dark : colors.light;

  // Loading state
  if (loading || !investments) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }} className="items-center justify-center">
        <Text style={{ color: theme.textSecondary }}>Loading portfolio...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {/* Header */}
      <View 
        style={{ 
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : theme.background,
          borderBottomWidth: isDarkColorScheme ? 0 : 1,
          borderBottomColor: theme.border,
        }}
        className="px-4 pt-12 pb-4"
      >
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: theme.textSecondary }} className="text-sm font-medium">
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
                      <Ionicons name="compass-outline" size={14} color={theme.primary} />
                      <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>
                        Guide
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <Ionicons name="person-circle-outline" size={32} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text style={{ color: theme.textPrimary }} className="text-4xl font-bold">
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
            <Ionicons name="arrow-up" size={16} color={theme.primary} />
            <Text style={{ color: theme.primary }} className="text-sm font-semibold ml-1">
              +{totalROI.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={{ color: theme.textSecondary }} className="text-xs text-right">
          ${monthlyRentalIncome.toFixed(2)} Monthly Rental Income
        </Text>
      </View>

      {/* Charts */}
      <View className="mt-4 w-full mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={340}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        >
          {[
            { title: "ROI Trend", subtitle: "Last 12 months" },
            { title: "Monthly Income", subtitle: "Year-to-date" },
            { title: "Investment Distribution", subtitle: "By property type" },
          ].map((card, i) => (
            <View
              key={i}
              style={{
                backgroundColor: theme.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: theme.border,
                shadowColor: isDarkColorScheme ? '#000' : 'rgba(45, 55, 72, 0.08)',
                shadowOffset: { width: 0, height: isDarkColorScheme ? 4 : 8 },
                shadowOpacity: isDarkColorScheme ? 0.3 : 0.08,
                shadowRadius: isDarkColorScheme ? 4 : 12,
                elevation: isDarkColorScheme ? 8 : 4,
              }}
              className="rounded-xl p-4 w-[320px]"
            >
              <Text style={{ color: theme.textPrimary }} className="text-sm font-semibold mb-1">
                {card.title}
              </Text>
              <Text style={{ color: theme.textSecondary }} className="text-xs mb-3">{card.subtitle}</Text>
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.05)' : '#F9FAFB',
                }}
                className="h-24 rounded-lg items-center justify-center"
              >
                <Text style={{ color: theme.textMuted }} className="text-xs">Chart Placeholder</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Properties Header */}
      <View className="px-4 mb-2">
        <Text style={{ color: theme.textPrimary }} className="text-xl font-bold">
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
        <Text style={{ color: theme.textPrimary }} className="text-xl font-bold mb-1">
          Income Timeline
        </Text>
        <Text style={{ color: theme.textSecondary }} className="text-sm mb-3">
          Total visible income:{" "}
          <Text style={{ color: theme.textPrimary }} className="font-semibold">
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
                    backgroundColor: theme.primary,
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
                <Text style={{ color: theme.textSecondary }} className="text-xs font-medium">
                  {month}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* BookCard */}
      {/* <View style={{ marginTop: 8, marginBottom: 20 }}>
        <BookCard navigation={router} />
      </View> */}
    </>
  );


  return (
    <View style={{ backgroundColor: theme.background }} className="flex-1">
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
            borderColor: theme.border,
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
            <Ionicons name="add" size={24} color={theme.textPrimary} />
            <Text style={{ color: theme.textPrimary }} className="text-xs font-medium mt-0.5">
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-col items-center justify-center p-2 flex-1">
            <Ionicons name="remove" size={24} color={theme.textPrimary} />
            <Text style={{ color: theme.textPrimary }} className="text-xs font-medium mt-0.5">
              Withdraw
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
          onPress={() => router.push('../portfolio/guidance/guidance-one')}
          className="flex-col items-center justify-center p-2 flex-1">
            <Ionicons name="document-text-outline" size={24} color={theme.textPrimary} />
            <Text style={{ color: theme.textPrimary }} className="text-xs font-medium mt-0.5">
              Guidance
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
