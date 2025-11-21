import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ASSETS_CONSTANTS } from './constants';
import { getModalStats } from './utils';

const { SCREEN_WIDTH, SCREEN_HEIGHT } = ASSETS_CONSTANTS;

// Types
export interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  changeColor: string;
  icon: string;
}

interface AssetDetailModalProps {
  visible: boolean;
  investment: any;
  colors: any;
  isDarkColorScheme: boolean;
  modalTranslateY: Animated.Value;
  modalScale: Animated.Value;
  modalBackgroundOpacity: Animated.Value;
  modalHeaderOpacity: Animated.Value;
  modalScrollY: Animated.Value;
  isModalAtTop: boolean;
  selectedRange: string;
  onClose: () => void;
  onShare: () => void;
  onScroll: (event: any) => void;
  onRangeChange: (range: string) => void;
  modalPanResponder: any;
}

// Sub-components
interface EnhancedModalStatCardProps {
  stat: StatCard;
  colors: any;
  isDarkColorScheme: boolean;
}

function EnhancedModalStatCard({ stat, colors, isDarkColorScheme }: EnhancedModalStatCardProps) {
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
        borderWidth: 1,
      }}
      className="rounded-xl p-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-9 h-9 items-center justify-center">
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

interface ModalDetailRowProps {
  label: string;
  value: string;
  icon: string;
  colors: any;
  highlight?: boolean;
  capitalize?: boolean;
}

function ModalDetailRow({ label, value, icon, colors, highlight, capitalize }: ModalDetailRowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5 flex-1">
        <View className="w-9 h-9 items-center justify-center">
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

interface ModalUpdateCardProps {
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

function ModalUpdateCard({ news, colors }: ModalUpdateCardProps) {
  return (
    <TouchableOpacity 
      style={{ 
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }}
      className="flex-row gap-3.5 rounded-xl p-4"
      activeOpacity={0.7}
    >
      <View className="w-11 h-11 items-center justify-center flex-shrink-0">
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

// Main Modal Component
export function AssetDetailModal({
  visible,
  investment,
  colors,
  isDarkColorScheme,
  modalTranslateY,
  modalScale,
  modalBackgroundOpacity,
  modalHeaderOpacity,
  isModalAtTop,
  selectedRange,
  onClose,
  onShare,
  onScroll,
  onRangeChange,
  modalPanResponder,
}: AssetDetailModalProps) {
  const router = useRouter();
  
  if (!visible || !investment) return null;

  const property = investment.property;
  const modalStats = getModalStats(investment, colors);
  const newsData = property?.updates?.slice(0, 3).map((update: { title: string; type: string; description: string; date: string }) => ({
    id: update.title,
    icon: update.type === 'financial' ? 'cash-outline' : update.type === 'project' ? 'construct-outline' : 'people-outline',
    iconBg: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
    title: update.title,
    description: update.description,
    time: update.date,
  })) || [];
  const timeRanges = ASSETS_CONSTANTS.TIME_RANGES;

  return (
    <>
      {/* Dimmed Background */}
      <Animated.View
        className="absolute inset-0"
        style={{
          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)',
          opacity: modalBackgroundOpacity,
        }}
        pointerEvents="none"
      />

      {/* Modal Container */}
      <Animated.View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT * 0.92,
          transform: [
            { translateY: modalTranslateY },
            { scale: modalScale },
          ],
          backgroundColor: colors.background,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTopWidth: isDarkColorScheme ? 0 : 1,
          borderTopColor: isDarkColorScheme ? 'transparent' : colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkColorScheme ? 0.3 : 0.15,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <SafeAreaView className="flex-1">
          {/* Drag Handle */}
          <View 
            className="items-center pt-2 pb-1"
            style={{ paddingVertical: 8 }}
            {...(isModalAtTop ? modalPanResponder.panHandlers : {})}
          >
            <View 
              style={{ backgroundColor: colors.muted }}
              className="w-10 h-1 rounded-full"
            />
          </View>

          {/* Floating Header */}
          <Animated.View
            style={{
              opacity: modalHeaderOpacity,
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
            {...(isModalAtTop ? modalPanResponder.panHandlers : {})}
          >
            <SafeAreaView>
              <View className="px-4 py-3 flex-row items-center justify-between">
                <TouchableOpacity 
                  onPress={onClose} 
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
                  onPress={onShare}
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
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={true}
          >
            <View className="px-5 pt-4 pb-6">
              {/* Hero Section */}
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
                  onPress={onShare}
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
                  {modalStats.map((stat, index) => (
                    <EnhancedModalStatCard 
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
                  <ModalDetailRow 
                    label="Ownership Share"
                    value={`${((investment.tokens / property.totalTokens) * 100).toFixed(3)}%`}
                    icon="pie-chart"
                    colors={colors}
                    highlight
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
                    label="Tokens Owned"
                    value={investment.tokens.toFixed(3)}
                    icon="cube"
                    colors={colors}
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
                    label="Property Status"
                    value={property.status.replace('-', ' ')}
                    icon="checkmark-circle"
                    colors={colors}
                    capitalize
                  />
                  <View style={{ backgroundColor: colors.border }} className="h-px" />
                  <ModalDetailRow 
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
                        onPress={() => onRangeChange(range)}
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
                    borderWidth: 1,
                    height: 200,
                  }}
                  className="rounded-2xl p-6 items-center justify-center"
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
                      <ModalUpdateCard 
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
                    onClose();
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
                    onClose();
                    router.push({
                      pathname: '/property/[id]',
                      params: { id: property.id },
                    } as any);
                  }}
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                  className="flex-row items-center justify-center gap-2.5 rounded-2xl py-4"
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
    </>
  );
}

