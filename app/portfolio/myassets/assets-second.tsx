// asset-second-redesigned.tsx

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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePortfolio } from '@/services/usePortfolio';
import { BlurView } from 'expo-blur';
import { formatCurrency } from '@/components/assets/utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  changeColor: string;
  icon: string;
}

export default function AssetSecondScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments } = usePortfolio();
  const { investmentId } = useLocalSearchParams<{ investmentId?: string }>();
  
  const [selectedRange, setSelectedRange] = useState('6M');
  const scrollY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [isAtTop, setIsAtTop] = useState(true);

  const investment = investmentId 
    ? investments.find(inv => inv.id === investmentId) 
    : investments[0];

  const property = investment?.property;

  // Entrance animation with staggered effects
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 70,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Header opacity based on scroll
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const opacity = Math.min(value / 100, 1);
      headerOpacity.setValue(opacity);
    });

    return () => scrollY.removeListener(listenerId);
  }, []);

  // Pan responder for swipe down
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 5 && isAtTop;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / SCREEN_HEIGHT, 1);
          translateY.setValue(gestureState.dy);
          backgroundOpacity.setValue(1 - progress * 0.8);
          const scale = 1 - progress * 0.08;
          scaleValue.setValue(Math.max(scale, 0.92));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 120;
        
        if (gestureState.dy > threshold || gestureState.vy > 0.65) {
          handleBack();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              velocity: gestureState.vy,
              tension: 70,
              friction: 11,
              useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
              toValue: 1,
              tension: 70,
              friction: 11,
              useNativeDriver: true,
            }),
            Animated.timing(backgroundOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const statsData: StatCard[] = investment && property ? [
    {
      label: 'Current ROI',
      value: `${investment.roi.toFixed(1)}%`,
      change: `+${(investment.roi * 0.1).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
      icon: 'trending-up',
    },
    {
      label: 'Monthly Income',
      value: `$${investment.monthlyRentalIncome.toFixed(0)}`,
      change: `+${(investment.rentalYield * 0.05).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
      icon: 'calendar',
    },
    {
      label: 'Total Invested',
      value: formatCurrency(investment.investedAmount),
      change: 'Principal',
      changeType: 'neutral',
      changeColor: colors.textMuted,
      icon: 'wallet',
    },
    {
      label: 'Current Value',
      value: formatCurrency(investment.currentValue),
      change: `+${((investment.currentValue - investment.investedAmount) / investment.investedAmount * 100).toFixed(1)}%`,
      changeType: 'up',
      changeColor: colors.primary,
      icon: 'cash',
    },
    {
      label: 'Rental Yield',
      value: `${investment.rentalYield.toFixed(2)}%`,
      change: 'Annual',
      changeType: 'neutral',
      changeColor: colors.textSecondary,
      icon: 'stats-chart',
    },
    {
      label: 'Ownership',
      value: `${((investment.tokens / property.totalTokens) * 100).toFixed(2)}%`,
      change: `${investment.tokens.toFixed(2)} tokens`,
      changeType: 'neutral',
      changeColor: colors.textSecondary,
      icon: 'pie-chart',
    },
  ] : [];

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
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.88,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const handleShare = async () => {
    if (!investment || !property) return;
    
    const ownershipPercentage = ((investment.tokens / property.totalTokens) * 100).toFixed(2);
    
    try {
      const result = await Share.share({
        message: `📊 Investment Performance\n\n🏢 ${property.title}\n📍 ${property.location}\n\n💰 Value: $${investment.currentValue.toLocaleString()}\n📈 ROI: ${investment.roi.toFixed(1)}%\n💵 Monthly: $${investment.monthlyRentalIncome.toFixed(2)}\n🎯 Ownership: ${ownershipPercentage}%\n\nInvest with Blocks!`,
        title: `${property.title} - Investment`,
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    setIsAtTop(offsetY <= 10);
  };

  if (!investment || !property) {
    return (
      <View style={{ backgroundColor: colors.background }} className="flex-1 items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={72} color={colors.textMuted} />
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mt-6 text-center">
          Investment Not Found
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-center mt-2 mb-8">
          Unable to load investment details
        </Text>
        <TouchableOpacity 
          onPress={handleBack}
          style={{ backgroundColor: colors.primary }}
          className="px-8 py-3.5 rounded-xl"
        >
          <Text style={{ color: colors.primaryForeground }} className="font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ownershipPercentage = ((investment.tokens / property.totalTokens) * 100).toFixed(3);

  return (
    <View style={{ backgroundColor: 'transparent' }} className="flex-1">
      {/* Backdrop with blur effect */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
          opacity: backgroundOpacity,
        }}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={handleBack}
          className="flex-1"
        />
      </Animated.View>

      {/* Modal Container */}
      <Animated.View 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.92,
          transform: [
            { translateY },
            { scale: scaleValue },
          ],
          backgroundColor: colors.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }}
        {...panResponder.panHandlers}
      >
        <SafeAreaView className="flex-1">
          {/* Drag Handle */}
          <View className="items-center pt-2 pb-1">
            <View 
              style={{ backgroundColor: colors.muted }}
              className="w-10 h-1 rounded-full"
            />
          </View>

          {/* Floating Header with backdrop */}
          <Animated.View
            style={{
              opacity: headerOpacity,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: isDarkColorScheme 
                ? 'rgba(11, 12, 16, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
          >
            <SafeAreaView>
              <View className="px-4 py-3 flex-row items-center justify-between">
                <TouchableOpacity 
                  onPress={handleBack} 
                  className="w-10 h-10 items-center justify-center rounded-full -ml-2"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Ionicons name="chevron-down" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View className="flex-1 items-center px-4">
                  <Text 
                    style={{ color: colors.textPrimary }}
                    className="text-base font-bold"
                    numberOfLines={1}
                  >
                    {property.title}
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
            </SafeAreaView>
          </Animated.View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={true}
          >
            {/* Hero Section */}
            <View className="px-5 pt-4 pb-6">
              {/* Property Image */}
              <View className="rounded-2xl overflow-hidden mb-4 shadow-lg">
                <Image
                  source={{ uri: property.images[0] || property.image }}
                  style={{ width: '100%', height: 240 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                  className="absolute bottom-0 left-0 right-0 p-4"
                >
                  <Text style={{ color: '#fff' }} className="text-2xl font-bold mb-1">
                    {property.title}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location" size={16} color="#fff" />
                    <Text style={{ color: '#fff' }} className="text-sm">
                      {property.location}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Status and Actions Row */}
              <View className="flex-row items-center justify-between mb-6">
                <View
                  style={{
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(22, 163, 74, 0.15)' 
                      : 'rgba(22, 163, 74, 0.1)',
                    borderColor: colors.primary,
                  }}
                  className="px-3.5 py-2 rounded-full border flex-row items-center gap-1.5"
                >
                  <View 
                    style={{ backgroundColor: colors.primary }}
                    className="w-2 h-2 rounded-full"
                  />
                  <Text style={{ color: colors.primary }} className="text-sm font-bold">
                    Active
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleShare}
                  style={{ backgroundColor: colors.muted }}
                  className="px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                  <Ionicons name="share-social" size={16} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                    Share
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Key Metrics Cards */}
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                  Performance
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {statsData.map((stat, index) => (
                    <EnhancedStatCard 
                      key={index} 
                      stat={stat} 
                      colors={colors} 
                      isDarkColorScheme={isDarkColorScheme}
                    />
                  ))}
                </View>
              </View>

              {/* Investment Details Card */}
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                  Investment Details
                </Text>
                <View 
                  style={{ backgroundColor: colors.card }}
                  className="rounded-2xl p-4 gap-4"
                >
                  <DetailRow 
                    label="Ownership Share"
                    value={`${ownershipPercentage}%`}
                    icon="pie-chart"
                    colors={colors}
                    highlight
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <DetailRow 
                    label="Tokens Owned"
                    value={investment.tokens.toFixed(3)}
                    icon="cube"
                    colors={colors}
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <DetailRow 
                    label="Property Status"
                    value={property.status.replace('-', ' ')}
                    icon="checkmark-circle"
                    colors={colors}
                    capitalize
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <DetailRow 
                    label="Annual Return (Est.)"
                    value={`$${(investment.monthlyRentalIncome * 12).toFixed(2)}`}
                    icon="trending-up"
                    colors={colors}
                    highlight
                  />
                </View>
              </View>

              {/* Payout History */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
                    Payout History
                  </Text>
                  <View 
                    style={{ backgroundColor: colors.card }}
                    className="flex-row rounded-full p-1"
                  >
                    {timeRanges.map((range) => (
                      <TouchableOpacity
                        key={range}
                        onPress={() => setSelectedRange(range)}
                        style={{
                          backgroundColor: selectedRange === range ? colors.primary : 'transparent',
                        }}
                        className="px-3 py-1.5 rounded-full"
                      >
                        <Text
                          style={{
                            color: selectedRange === range 
                              ? colors.primaryForeground 
                              : colors.textSecondary,
                          }}
                          className="text-xs font-semibold"
                        >
                          {range}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Chart Placeholder */}
                <View 
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    height: 200,
                  }}
                  className="rounded-2xl border p-6 items-center justify-center"
                >
                  <Ionicons name="bar-chart" size={56} color={colors.textMuted} />
                  <Text style={{ color: colors.textPrimary }} className="mt-3 text-base font-semibold">
                    Payout Visualization
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="mt-1 text-sm">
                    {selectedRange} period data
                  </Text>
                </View>
              </View>

              {/* Latest Updates */}
              {newsData.length > 0 && (
                <View className="mb-6">
                  <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-3">
                    Latest Updates
                  </Text>
                  <View className="gap-3">
                    {newsData.map((news) => (
                      <UpdateCard 
                        key={news.id} 
                        news={news} 
                        colors={colors}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="gap-3 pt-2">
                <TouchableOpacity 
                  onPress={() => {
                    router.push({
                      pathname: '/invest/[id]',
                      params: { id: property.id },
                    } as any);
                  }}
                  style={{ backgroundColor: colors.primary }}
                  className="flex-row items-center justify-center gap-2.5 rounded-2xl py-4 shadow-lg"
                >
                  <Ionicons name="add-circle" size={24} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground }} className="text-base font-bold">
                    Increase Investment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => {
                    router.push({
                      pathname: '/property/[id]',
                      params: { id: property.id },
                    } as any);
                  }}
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                  className="flex-row items-center justify-center gap-2.5 rounded-2xl border py-4"
                >
                  <Ionicons name="home" size={24} color={colors.textPrimary} />
                  <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                    View Property Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View className="h-8" />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// Enhanced Stat Card Component
interface EnhancedStatCardProps {
  stat: StatCard;
  colors: any;
  isDarkColorScheme: boolean;
}

function EnhancedStatCard({ stat, colors, isDarkColorScheme }: EnhancedStatCardProps) {
  const getArrowIcon = () => {
    if (stat.changeType === 'up') return 'arrow-up';
    if (stat.changeType === 'down') return 'arrow-down';
    return 'remove';
  };

  return (
    <View 
      style={{ 
        backgroundColor: colors.card,
        width: (SCREEN_WIDTH - 56) / 2,
        borderColor: colors.border,
      }}
      className="rounded-xl p-4 border"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View 
          style={{ backgroundColor: `${colors.primary}15` }}
          className="w-9 h-9 rounded-full items-center justify-center"
        >
          <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
        </View>
        {stat.changeType !== 'neutral' && (
          <View 
            style={{ 
              backgroundColor: stat.changeType === 'up' 
                ? 'rgba(22, 163, 74, 0.1)' 
                : 'rgba(220, 38, 38, 0.1)' 
            }}
            className="px-2 py-0.5 rounded-full flex-row items-center gap-0.5"
          >
            <Ionicons name={getArrowIcon()} size={12} color={stat.changeColor} />
            <Text style={{ color: stat.changeColor }} className="text-xs font-semibold">
              {stat.change}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
        {stat.label}
      </Text>
      <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
        {stat.value}
      </Text>
      {stat.changeType === 'neutral' && (
        <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
          {stat.change}
        </Text>
      )}
    </View>
  );
}

// Detail Row Component
interface DetailRowProps {
  label: string;
  value: string;
  icon: string;
  colors: any;
  highlight?: boolean;
  capitalize?: boolean;
}

function DetailRow({ label, value, icon, colors, highlight, capitalize }: DetailRowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View 
          style={{ backgroundColor: colors.muted }}
          className="w-9 h-9 rounded-full items-center justify-center"
        >
          <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
          {label}
        </Text>
      </View>
      <Text 
        style={{ color: highlight ? colors.primary : colors.textPrimary }} 
        className={`text-base font-bold ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </Text>
    </View>
  );
}

// Update Card Component
interface UpdateCardProps {
  news: {
    id: string;
    icon: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
  };
  colors: any;
}

function UpdateCard({ news, colors }: UpdateCardProps) {
  return (
    <TouchableOpacity 
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="flex-row gap-3.5 rounded-xl p-4 border"
      activeOpacity={0.7}
    >
      <View
        style={{ backgroundColor: news.iconBg }}
        className="w-11 h-11 rounded-full items-center justify-center flex-shrink-0"
      >
        <Ionicons name={news.icon as any} size={22} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text style={{ color: colors.textPrimary }} className="font-bold text-base mb-1">
          {news.title}
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-2" numberOfLines={2}>
          {news.description}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted }} className="text-xs">
            {news.time}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}