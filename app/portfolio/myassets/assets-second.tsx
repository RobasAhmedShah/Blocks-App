import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  ImageBackground,
  Share,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePortfolio } from '@/services/usePortfolio';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  changeColor: string;
}

export default function AssetsSecondScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments } = usePortfolio();
  const { investmentId } = useLocalSearchParams<{ investmentId?: string }>();
  
  const [selectedRange, setSelectedRange] = useState('6M');
  const scrollY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isAtTop, setIsAtTop] = useState(true);

  // Find the investment by ID, or use the first one
  const investment = investmentId 
    ? investments.find(inv => inv.id === investmentId) 
    : investments[0];

  const property = investment?.property;

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle swipe down at the top of the scroll
        return gestureState.dy > 0 && isAtTop;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down threshold met - navigate back
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          // Return to position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Generate stats from investment data
  const statsData: StatCard[] = investment && property ? [
    {
      label: 'Current ROI',
      value: `${investment.roi.toFixed(1)}%`,
      change: `+${(investment.roi * 0.1).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
    },
    {
      label: 'Monthly Yield',
      value: `$${investment.monthlyRentalIncome.toFixed(2)}`,
      change: `+${(investment.rentalYield * 0.05).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
    },
    {
      label: 'Total Invested',
      value: `$${investment.investedAmount.toLocaleString()}`,
      change: '0.0%',
      changeType: 'neutral',
      changeColor: colors.textMuted,
    },
    {
      label: 'Current Value',
      value: `$${investment.currentValue.toLocaleString()}`,
      change: `+${((investment.currentValue - investment.investedAmount) / investment.investedAmount * 100).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
    },
    {
      label: 'Rental Yield',
      value: `${investment.rentalYield.toFixed(2)}%`,
      change: `+${(investment.rentalYield * 0.08).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
    },
    {
      label: 'Tokens Owned',
      value: investment.tokens.toLocaleString(),
      change: `${((investment.tokens / property.totalTokens) * 100).toFixed(2)}%`,
      changeType: 'neutral',
      changeColor: colors.textSecondary,
    },
  ] : [];

  // Generate news/updates from property updates
  const newsData = property?.updates?.slice(0, 3).map(update => ({
    id: update.title,
    icon: update.type === 'financial' ? 'cash-outline' : update.type === 'project' ? 'construct-outline' : 'people-outline',
    iconBg: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
    title: update.title,
    description: update.description,
    time: update.date,
  })) || [];

  const timeRanges = ['3M', '6M', '1Y', 'All'];

  const handleBack = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleIncreaseInvestment = () => {
    if (property) {
      router.push({
        pathname: '/invest/[id]',
        params: { id: property.id },
      } as any);
    }
  };

  const handleViewProperty = () => {
    if (property) {
      router.push({
        pathname: '/property/[id]',
        params: { id: property.id },
      } as any);
    }
  };

  const handleShare = async () => {
    if (!investment) return;
    const prop = investment.property;
    if (!prop) return;
    
    const ownershipPercentage = ((investment.tokens / prop.totalTokens) * 100).toFixed(2);
    
    try {
      const result = await Share.share({
        message: `📊 My Investment Performance:\n\n🏢 ${prop.title}\n📍 ${prop.location}\n\n💰 Current Value: $${investment.currentValue.toLocaleString()}\n📈 ROI: ${investment.roi.toFixed(1)}%\n💵 Monthly Income: $${investment.monthlyRentalIncome.toFixed(2)}\n🎯 Ownership: ${ownershipPercentage}%\n\nInvest in real estate with Blocks!`,
        title: `Investment Performance: ${prop.title}`,
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Investment details shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share investment details');
      console.error('Share error:', error);
    }
  };

  // ✅ Fixed: Handle scroll event properly
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    setIsAtTop(offsetY <= 0);
  };

  if (!investment || !property) {
    return (
      <View 
        style={{ backgroundColor: colors.background }} 
        className="flex-1 items-center justify-center px-4"
      >
        <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mt-4 text-center">
          Investment not found
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-center mt-2">
          The investment you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity 
          onPress={handleBack}
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Background Image with Gradient Overlay */}
      <ImageBackground
        source={{ uri: property.images[0] || property.image }}
        className="absolute top-0 left-0 h-full w-full opacity-10"
        resizeMode="cover"
      >
        <LinearGradient
          colors={isDarkColorScheme
            ? ['transparent', 'rgba(11, 12, 16, 0.8)', colors.background]
            : ['transparent', 'rgba(255, 255, 255, 0.8)', colors.background]}
          className="absolute inset-0"
        />
      </ImageBackground>

      <SafeAreaView className="flex-1">
        {/* Animated Container */}
        <Animated.View 
          style={{ 
            flex: 1,
            transform: [{ translateY }],
          }}
          {...panResponder.panHandlers}
        >
          {/* Header */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            }}
            className="px-4 py-3 flex-row items-center justify-between border-b"
          >
            <TouchableOpacity 
              onPress={handleBack} 
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <View className="flex-1 items-center px-4">
              <Text 
                style={{ color: colors.textPrimary }}
                className="text-lg font-bold"
                numberOfLines={1}
              >
                {property.title}
              </Text>
              <Text 
                style={{ color: colors.textSecondary }}
                className="text-xs"
                numberOfLines={1}
              >
                {property.location}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleShare}
              style={{ backgroundColor: colors.muted }}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content - ✅ FIXED */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={true}
          >
            <View className="flex-col gap-6 p-4 pb-8">
              {/* Status Badge */}
              <View className="flex-row items-center justify-between">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(22, 163, 74, 0.2)' 
                      : 'rgba(22, 163, 74, 0.1)',
                    borderColor: colors.primary,
                  }}
                  className="px-3 py-1.5 rounded-full border"
                >
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    ● Active Investment
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted }} className="text-sm">
                  Updated just now
                </Text>
              </View>

              {/* Performance Overview */}
              <View>
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-4">
                  Performance Overview
                </Text>
                
                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-3">
                  {statsData.map((stat, index) => (
                    <StatCard 
                      key={index} 
                      stat={stat} 
                      colors={colors} 
                      isDarkColorScheme={isDarkColorScheme} 
                    />
                  ))}
                </View>
              </View>

              {/* Investment Summary */}
              <View 
                style={{ 
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                }}
                className="rounded-lg p-4 border"
              >
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Investment Summary
                </Text>
                <View className="gap-3">
                  <View className="flex-row justify-between items-center">
                    <Text style={{ color: colors.textSecondary }}>Ownership Percentage</Text>
                    <Text style={{ color: colors.primary }} className="font-bold text-lg">
                      {((investment.tokens / property.totalTokens) * 100).toFixed(2)}%
                    </Text>
                  </View>
                  <View 
                    style={{ backgroundColor: colors.border }}
                    className="h-px"
                  />
                  <View className="flex-row justify-between items-center">
                    <Text style={{ color: colors.textSecondary }}>Property Status</Text>
                    <Text style={{ color: colors.textPrimary }} className="font-semibold capitalize">
                      {property.status.replace('-', ' ')}
                    </Text>
                  </View>
                  <View 
                    style={{ backgroundColor: colors.border }}
                    className="h-px"
                  />
                  <View className="flex-row justify-between items-center">
                    <Text style={{ color: colors.textSecondary }}>Estimated Annual Return</Text>
                    <Text style={{ color: colors.primary }} className="font-bold">
                      ${(investment.monthlyRentalIncome * 12).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payout History Section */}
              <View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Payout History
                </Text>

                {/* Time Range Selector */}
                <View 
                  style={{ backgroundColor: colors.muted }}
                  className="flex-row h-10 rounded-full p-1 mb-4"
                >
                  {timeRanges.map((range) => (
                    <TouchableOpacity
                      key={range}
                      onPress={() => setSelectedRange(range)}
                      style={{
                        backgroundColor: selectedRange === range ? colors.primary : 'transparent',
                      }}
                      className="flex-1 items-center justify-center rounded-full"
                    >
                      <Text
                        style={{
                          color: selectedRange === range 
                            ? colors.primaryForeground 
                            : colors.textSecondary,
                        }}
                        className="text-sm font-medium"
                      >
                        {range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Chart Placeholder */}
                <View 
                  style={{ 
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  }}
                  className="w-full h-48 rounded-lg border items-center justify-center"
                >
                  <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted }} className="mt-2 text-sm">
                    Payout History Chart
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="mt-1 text-xs">
                    {selectedRange} data visualization
                  </Text>
                </View>
              </View>

              {/* Latest News Section */}
              {newsData.length > 0 && (
                <View>
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                    Latest Updates
                  </Text>

                  {/* News Feed */}
                  <View className="flex-col gap-3">
                    {newsData.map((news) => (
                      <NewsCard 
                        key={news.id} 
                        news={news} 
                        colors={colors}
                        isDarkColorScheme={isDarkColorScheme}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Quick Actions Section */}
              <View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Quick Actions
                </Text>

                {/* Action Buttons */}
                <View className="flex-col gap-3">
                  <TouchableOpacity 
                    onPress={handleIncreaseInvestment}
                    style={{ backgroundColor: colors.primary }}
                    className="flex-row items-center justify-center gap-2 rounded-lg px-4 py-3.5"
                  >
                    <Ionicons name="add-circle-outline" size={22} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground }} className="text-base font-bold">
                      Increase Investment
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleViewProperty}
                    style={{ 
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    }}
                    className="flex-row items-center justify-center gap-2 rounded-lg border px-4 py-3.5"
                  >
                    <Ionicons name="home-outline" size={22} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                      View Property Details
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleShare}
                    style={{ 
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                    }}
                    className="flex-row items-center justify-center gap-2 rounded-lg border px-4 py-3.5"
                  >
                    <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                      Share Performance
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Stat Card Component
interface StatCardProps {
  stat: StatCard;
  colors: any;
  isDarkColorScheme: boolean;
}

function StatCard({ stat, colors, isDarkColorScheme }: StatCardProps) {
  const getArrowIcon = () => {
    if (stat.changeType === 'up') return 'arrow-up';
    if (stat.changeType === 'down') return 'arrow-down';
    return 'remove';
  };

  return (
    <View 
      style={{ 
        backgroundColor: colors.muted,
        borderColor: colors.border,
        width: '48%',
      }}
      className="flex-col gap-2 rounded-lg p-4 border"
    >
      <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
        {stat.label}
      </Text>
      <Text style={{ color: colors.textPrimary }} className="text-2xl font-bold">
        {stat.value}
      </Text>
      <View className="flex-row items-center">
        <Ionicons name={getArrowIcon()} size={16} color={stat.changeColor} />
        <Text style={{ color: stat.changeColor }} className="text-sm font-medium ml-1">
          {stat.change}
        </Text>
      </View>
    </View>
  );
}

// News Card Component
interface NewsCardProps {
  news: {
    id: string;
    icon: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
  };
  colors: any;
  isDarkColorScheme: boolean;
}

function NewsCard({ news, colors, isDarkColorScheme }: NewsCardProps) {
  return (
    <TouchableOpacity 
      style={{ 
        backgroundColor: colors.muted,
        borderColor: colors.border,
      }}
      className="flex-row items-start gap-4 rounded-lg p-4 border"
      activeOpacity={0.7}
    >
      <View
        style={{ backgroundColor: news.iconBg }}
        className="h-10 w-10 rounded-full items-center justify-center flex-shrink-0"
      >
        <Ionicons name={news.icon as any} size={20} color={colors.primary} />
      </View>
      <View className="flex-1 flex-col">
        <Text style={{ color: colors.textPrimary }} className="font-semibold">
          {news.title}
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mt-1">
          {news.description}
        </Text>
        <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5">
          {news.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}