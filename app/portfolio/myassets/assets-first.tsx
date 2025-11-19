//asset-first.tsx

import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Share,
  Alert,
  FlatList,
  ViewToken,
  Animated,
  ScrollView,
  ImageBackground,
  PanResponder,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePortfolio } from '@/services/usePortfolio';
import { Investment } from '@/types/portfolio';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;
const SPACING = 16;

const getTierInfo = (roi: number) => {
  if (roi >= 15) {
    return {
      tier: 'Sapphire Tier',
      tierColor: '#66B2FC',
      glowColor: 'rgba(102, 178, 252, 0.3)',
    };
  } else if (roi >= 10) {
    return {
      tier: 'Emerald Tier',
      tierColor: '#66FCF1',
      glowColor: 'rgba(102, 252, 241, 0.3)',
    };
  } else {
    return {
      tier: 'Ruby Tier',
      tierColor: '#FC6666',
      glowColor: 'rgba(252, 102, 102, 0.3)',
    };
  }
};

// Extracted Property Card Component
interface PropertyCardProps {
  item: Investment;
  colors: any;
  isDarkColorScheme: boolean;
  openModal: (item: Investment) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ item, colors, isDarkColorScheme, openModal }) => {
  const tierInfo = getTierInfo(item.roi);
  const property = item.property;
  const ownershipPercentage = ((item.tokens / property.totalTokens) * 100).toFixed(3);
  const statCardWidth = (CARD_WIDTH - 64) / 2;
  
  // Flip animation state
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  // Long press burden effect state
  const longPressScale = useRef(new Animated.Value(1)).current;
  const longPressOverlay = useRef(new Animated.Value(0)).current;
  const longPressProgress = useRef(new Animated.Value(0)).current;
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleLongPressStart = () => {
    setIsLongPressing(true);
    
    // Haptic feedback on start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate scale down (burden effect)
        Animated.parallel([
      Animated.spring(longPressScale, {
        toValue: 0.96,
        friction: 8,
        tension: 50,
            useNativeDriver: true,
          }),
      Animated.timing(longPressOverlay, {
        toValue: 1,
        duration: 400,
            useNativeDriver: true,
          }),
      Animated.timing(longPressProgress, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, // Progress needs layout animation
      }),
    ]).start();
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Reset animations
        Animated.parallel([
      Animated.spring(longPressScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
            useNativeDriver: true,
          }),
      Animated.timing(longPressOverlay, {
            toValue: 0,
        duration: 200,
            useNativeDriver: true,
          }),
      Animated.timing(longPressProgress, {
            toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsLongPressing(false);
    });
  };

  const handleLongPress = () => {
    // Haptic feedback on completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Reset animations immediately
    longPressScale.setValue(1);
    longPressOverlay.setValue(0);
    longPressProgress.setValue(0);
    setIsLongPressing(false);
    
    // Open modal
    openModal(item);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [90, 90, 180],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  
  return (
    <View 
      className="items-center justify-center"
      style={{ width: CARD_WIDTH + SPACING * 2  }}
    >
      <View
        style={{ 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT,
          left: -15,
        }}
      >
        {/* Front Side - Minimalistic Punched Hole Card */}
        <Animated.View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            position: 'absolute',
            backfaceVisibility: 'hidden',
            transform: [
              { rotateY: frontInterpolate },
              { scale: longPressScale },
            ],
            opacity: frontOpacity,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ 
              width: CARD_WIDTH, 
              height: CARD_HEIGHT,
              backgroundColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}
            onPress={flipCard}
            onPressIn={handleLongPressStart}
            onPressOut={handleLongPressEnd}
            onLongPress={handleLongPress}
            delayLongPress={400}
          >
            {/* Background Image */}
            <Image
              source={{ uri: property.images[0] || property.image }}
              className="absolute w-full h-full"
              resizeMode="cover"
            />
            
            {/* Subtle Gradient Overlay */}
            <LinearGradient
              colors={
                isDarkColorScheme
                  ? ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.85)']
                  : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)']
              }
              className="absolute w-full h-full"
            />

            {/* Punched Hole Effect - Circular cutouts */}
            <View className="absolute top-6 left-6">
              <View 
                style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: 10,
                  backgroundColor: isDarkColorScheme ? '#000' : '#fff',
                  opacity: 0.3,
                }} 
              />
            </View>
            <View className="absolute top-6 right-6">
              <View 
                style={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: 10,
                  backgroundColor: isDarkColorScheme ? '#000' : '#fff',
                  opacity: 0.3,
                }} 
              />
            </View>

            {/* Minimalistic Content */}
            <View className="flex-1 p-8">
              {/* Tier Badge - Subtle - Top Middle */}
              <View className="items-center mb-6">
                <View 
                  className="px-3 py-1.5 rounded-full"
                  style={{ 
                    backgroundColor: `${tierInfo.tierColor}15`,
                  }}
                >
                  <Text 
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: tierInfo.tierColor }}
                  >
                    {tierInfo.tier}
                  </Text>
                </View>
              </View>

              {/* Premium Token Display - Center Focal Point */}
              <View className="flex-1 items-center justify-center">
                <View className="items-center">
                  {/* Token Icon with Glow */}
                  <View 
                    className="mb-4 rounded-full p-6 relative"
                    style={{ 
                      backgroundColor: `${tierInfo.tierColor}20`,
                      shadowColor: tierInfo.tierColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.6,
                      shadowRadius: 20,
                      elevation: 10,
                    }}
                  >
                    <Ionicons name="cube" size={48} color={tierInfo.tierColor} />
                    
                    {/* Long Press Loading Animation in Icon */}
                    <Animated.View
                      className="absolute inset-0 rounded-full"
                      style={{
                        opacity: longPressOverlay,
                      }}
                      pointerEvents="none"
                    >
                      <Animated.View
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          borderRadius: 999,
                          borderWidth: 4,
                          borderColor: tierInfo.tierColor,
                          borderTopColor: 'transparent',
                          borderRightColor: 'transparent',
                          transform: [
                            {
                              rotate: longPressProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg'],
                              }),
                            },
                          ],
                        }}
                      />
                    </Animated.View>
                  </View>

                  {/* Token Count - Hero Number */}
                  <Text 
                    className="text-6xl font-black mb-2"
                    style={{ 
                      color: colors.textPrimary,
                      textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                      textShadowOffset: { width: 0, height: 3 },
                      textShadowRadius: 8,
                      letterSpacing: -2,
                    }}
                  >
                    {item.tokens.toFixed(3)}
                  </Text>

                  {/* Label */}
                  <Text 
                    className="text-sm font-bold uppercase tracking-widest mb-1"
                    style={{ 
                      color: colors.textSecondary,
                      textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  >
                    Tokens Owned
                  </Text>

                  {/* Ownership Percentage Badge */}
                  {/* <View 
                    className="px-4 py-2 rounded-full mt-2"
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Text 
                      className="text-base font-bold"
                      style={{ 
                        color: tierInfo.tierColor,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      {ownershipPercentage}% Ownership
                    </Text>
                  </View> */}
                </View>
              </View>

              {/* Property Info at Bottom */}
              <View className="mt-auto">
                <Text 
                  className="text-3xl font-bold mb-3 leading-10"
                  style={{ 
                    color: colors.textPrimary,
                    textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                  numberOfLines={2}
                >
                  {property.title}
                </Text>
                <View className="flex-row items-center gap-2 mb-6">
                  <Ionicons name="location-sharp" size={18} color={colors.textSecondary} />
                  <Text 
                    className="text-base flex-1"
                    style={{ 
                      color: colors.textSecondary,
                      textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                    numberOfLines={1}
                  >
                    {property.location}
                  </Text>
                </View>

                {/* Flip Indicator */}
                <View className="items-center py-3">
                  <View 
                    className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Ionicons name="sync" size={16} color={colors.textMuted} />
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Tap to Hover
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Back Side - Detailed Stats */}
        <Animated.View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            position: 'absolute',
            backfaceVisibility: 'hidden',
            transform: [
              { rotateY: backInterpolate },
              { scale: longPressScale },
            ],
            opacity: backOpacity,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ 
              width: CARD_WIDTH, 
              height: CARD_HEIGHT,
              backgroundColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}
            onPress={flipCard}
            onPressIn={handleLongPressStart}
            onPressOut={handleLongPressEnd}
            onLongPress={handleLongPress}
            delayLongPress={400}
          >
            {/* Background Image with Gradient */}
            <Image
              source={{ uri: property.images[0] || property.image }}
              className="absolute w-full h-full"
              resizeMode="cover"
            />
            
            <LinearGradient
              colors={
                isDarkColorScheme
                  ? ['transparent', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.95)']
                  : ['transparent', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.95)']
              }
              className="absolute w-full h-full"
            />

            {/* Back Side Content */}
            <View className="flex-1 justify-between p-5">
              {/* Header with Flip Back Button */}
              <View className="flex-row items-center justify-between">
                <View 
                  className="px-4 py-2 rounded-full border-[1.5px]"
                  style={{ 
                    backgroundColor: `${tierInfo.tierColor}20`, 
                    borderColor: tierInfo.tierColor 
                  }}
                >
                  <Text 
                    className="text-[13px] font-bold uppercase tracking-wider"
                    style={{ color: tierInfo.tierColor }}
                  >
                    {tierInfo.tier}
                  </Text>
                </View>

                <View 
                  className="w-10 h-10 items-center justify-center rounded-full"
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Ionicons name="sync" size={18} color={colors.textPrimary} />
                </View>
              </View>

              {/* Stats Section */}
              <View>
                {/* Property Title */}
                <View className="mb-4">
                  <Text 
                    className="text-xl font-bold mb-1.5 leading-7"
                    style={{ 
                      color: colors.textPrimary,
                      textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    }}
                    numberOfLines={2}
                  >
                    {property.title}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location" size={14} color={colors.textSecondary} />
                    <Text 
                      className="text-xs flex-1"
                      style={{ 
                        color: colors.textSecondary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                      numberOfLines={1}
                    >
                      {property.location}
                    </Text>
                  </View>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {/* Ownership */}
                  <View 
                    className="px-4 py-3.5 rounded-2xl relative overflow-hidden"
                    style={{ 
                      width: statCardWidth,
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(0, 0, 0, 0.4)' 
                        : 'rgba(255, 255, 255, 0.85)',
                      borderWidth: 1,
                      borderColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text 
                      className="text-xs mb-1 font-medium"
                      style={{ 
                        color: colors.textSecondary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      Ownership
                    </Text>
                    <Text 
                      className="text-xl font-bold"
                      style={{ 
                        color: isDarkColorScheme ? colors.textPrimary : '#000000',
                        textShadowColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      {ownershipPercentage}%
                    </Text>
                    <View className="absolute top-3 right-3 opacity-30">
                      <Ionicons name="pie-chart" size={20} color={'#000000'} />
                    </View>
                  </View>

                  {/* Current Value */}
                  <View 
                    className="px-4 py-3.5 rounded-2xl relative overflow-hidden"
                    style={{ 
                      width: statCardWidth,
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(0, 0, 0, 0.4)' 
                        : 'rgba(255, 255, 255, 0.85)',
                      borderWidth: 1,
                      borderColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text 
                      className="text-xs mb-1 font-medium"
                      style={{ 
                        color: colors.textSecondary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      Value
                    </Text>
                    <Text 
                      className="text-xl font-bold"
                      style={{ 
                        color: colors.primary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      ${item.currentValue >= 1000 ? `${(item.currentValue / 1000).toFixed(1)}k` : item.currentValue}
                    </Text>
                    <View className="absolute top-3 right-3 opacity-30">
                      <Ionicons name="wallet" size={20} color={colors.primary} />
                    </View>
                  </View>

                  {/* ROI */}
                  <View 
                    className="px-4 py-3.5 rounded-2xl relative overflow-hidden"
                    style={{ 
                      width: statCardWidth,
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(0, 0, 0, 0.4)' 
                        : 'rgba(255, 255, 255, 0.85)',
                      borderWidth: 1,
                      borderColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text 
                      className="text-xs mb-1 font-medium"
                      style={{ 
                        color: colors.textSecondary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      ROI
                    </Text>
                    <Text 
                      className="text-xl font-bold"
                      style={{ 
                        color:isDarkColorScheme ? colors.primary : '#000000',
                        textShadowColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      +{item.roi.toFixed(1)}%
                    </Text>
                    <View className="absolute top-3 right-3 opacity-30">
                      <Ionicons name="trending-up" size={20} color={'#000000'} />
                    </View>
                  </View>

                  {/* Tokens */}
                  <View 
                    className="px-4 py-3.5 rounded-2xl relative overflow-hidden"
                    style={{ 
                      width: statCardWidth,
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(0, 0, 0, 0.4)' 
                        : 'rgba(255, 255, 255, 0.85)',
                      borderWidth: 1,
                      borderColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text 
                      className="text-xs mb-1 font-medium"
                      style={{ 
                        color: colors.textSecondary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      Tokens
                    </Text>
                    <Text 
                      className="text-xl font-bold"
                      style={{ 
                        color: colors.primary,
                        textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      {item.tokens.toFixed(3)}
                    </Text>
                    <View className="absolute top-3 right-3 opacity-30">
                      <Ionicons name="cube" size={20} color={colors.primary} />
                    </View>
                  </View>
                </View>

                {/* Monthly Income Badge */}
                <View 
                  className="flex-row items-center gap-2 px-4 py-3 rounded-xl mb-3 overflow-hidden"
                  style={{ 
                    backgroundColor: isDarkColorScheme 
                      ? 'rgba(0, 0, 0, 0.4)' 
                      : 'rgba(255, 255, 255, 0.85)',
                    borderWidth: 1,
                    borderColor: isDarkColorScheme 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                  <Text 
                    className="text-[15px] font-semibold"
                    style={{ 
                      color: colors.textPrimary,
                      textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    ${item.monthlyRentalIncome.toFixed(2)} / month
                  </Text>
                </View>

                {/* Full Details Hint */}
                <View className="items-center py-2.5">
                  <View 
                    className="flex-row items-center gap-2 px-4 py-2 rounded-full"
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Ionicons name="hand-left" size={16} color={colors.textMuted} />
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Long press for full details
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Long Press Burden Overlay */}
            <Animated.View
              className="absolute inset-0 rounded-3xl items-center justify-center"
              style={{
                opacity: longPressOverlay,
                backgroundColor: isDarkColorScheme 
                  ? 'rgba(0, 0, 0, 0.6)' 
                  : 'rgba(0, 0, 0, 0.5)',
              }}
              pointerEvents="none"
            >
              <View className="items-center">
                {/* Progress Ring */}
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 4,
                    borderColor: isDarkColorScheme 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 4,
                      borderColor: tierInfo.tierColor,
                      borderTopColor: 'transparent',
                      borderRightColor: 'transparent',
                      transform: [
                        {
                          rotate: longPressProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    }}
                  />
                  <Ionicons name="arrow-up" size={32} color={tierInfo.tierColor} />
                </View>
                <Text 
                  className="text-sm font-bold mt-4"
                  style={{ 
                    color: colors.textPrimary,
                    textShadowColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  Loading Details...
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

interface StatCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  changeColor: string;
  icon: string;
}

export default function AssetsFirstScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments, loading } = usePortfolio();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [isModalAtTop, setIsModalAtTop] = useState(true);
  const [selectedRange, setSelectedRange] = useState('6M');

  // Modal animations
  const modalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.95)).current;
  const modalScrollY = useRef(new Animated.Value(0)).current;
  const modalHeaderOpacity = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const openModal = (investment: any) => {
    setSelectedInvestment(investment);
    setIsModalVisible(true);
    setIsModalAtTop(true);
    
        Animated.parallel([
      Animated.spring(modalTranslateY, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
      Animated.spring(modalScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
      Animated.timing(modalBackgroundOpacity, {
            toValue: 1,
        duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
  };

  // Header opacity based on scroll
  useEffect(() => {
    if (!isModalVisible) return;
    
    const listenerId = modalScrollY.addListener(({ value }) => {
      const opacity = Math.min(value / 100, 1);
      modalHeaderOpacity.setValue(opacity);
    });

    return () => {
      if (isModalVisible) {
        modalScrollY.removeListener(listenerId);
      }
    };
  }, [isModalVisible]);

  const closeModal = () => {
        Animated.parallel([
      Animated.spring(modalTranslateY, {
        toValue: SCREEN_HEIGHT,
        tension: 55,
        friction: 10,
            useNativeDriver: true,
          }),
      Animated.timing(modalBackgroundOpacity, {
            toValue: 0,
        duration: 280,
            useNativeDriver: true,
          }),
      Animated.timing(modalScale, {
        toValue: 0.88,
        duration: 280,
            useNativeDriver: true,
          }),
        ]).start(() => {
      setIsModalVisible(false);
      setSelectedInvestment(null);
      modalTranslateY.setValue(SCREEN_HEIGHT);
      modalScale.setValue(0.95);
      modalBackgroundOpacity.setValue(0);
      modalHeaderOpacity.setValue(0);
        });
  };

  // Handle back button press - close modal if open, otherwise navigate back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isModalVisible) {
        closeModal();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior (navigate back)
    });

    return () => backHandler.remove();
  }, [isModalVisible]);

  // Pan responder for swipe down to close modal
  const modalPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only activate if:
          // 1. Modal is at top
          // 2. Swiping down (dy > 0)
          // 3. Vertical movement is greater than horizontal (to avoid interfering with horizontal scrolls)
          // 4. Movement is significant enough
          return (
            isModalAtTop &&
            gestureState.dy > 5 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
            gestureState.dy > 0
          );
        },
        onPanResponderGrant: () => {
          // Prevent ScrollView from scrolling when we start the drag
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0 && isModalAtTop) {
            const progress = Math.min(gestureState.dy / SCREEN_HEIGHT, 1);
            modalTranslateY.setValue(gestureState.dy);
            modalBackgroundOpacity.setValue(1 - progress * 0.8);
            const scale = 1 - progress * 0.08;
            modalScale.setValue(Math.max(scale, 0.92));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!isModalAtTop) return;
          
          const threshold = 120;
          if (gestureState.dy > threshold || gestureState.vy > 0.65) {
            closeModal();
      } else {
        Animated.parallel([
              Animated.spring(modalTranslateY, {
            toValue: 0,
                velocity: gestureState.vy,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
              Animated.spring(modalScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
              Animated.timing(modalBackgroundOpacity, {
                toValue: 1,
                duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
        onPanResponderTerminationRequest: () => false,
      }),
    [isModalAtTop, closeModal]
  );

  const handleShare = async (investment: any) => {
    if (!investment) return;
    
    const property = investment.property;
    const ownershipPercentage = ((investment.tokens / property.totalTokens) * 100);
    
    try {
      const result = await Share.share({
        message: `Check out my investment in ${property.title}! 🏢\n\nOwnership: ${ownershipPercentage}%\nCurrent Value: $${investment.currentValue.toLocaleString()}\nROI: ${investment.roi.toFixed(1)}%\n\nInvest in real estate with Blocks!`,
        title: `My Investment: ${property.title}`,
      });
      
      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Investment shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share investment');
      console.error('Share error:', error);
    }
  };

  const handleModalShare = async () => {
    if (!selectedInvestment) return;
    const prop = selectedInvestment.property;
    if (!prop) return;
    
    const ownershipPercentage = ((selectedInvestment.tokens / prop.totalTokens) * 100).toFixed(2);
    
    try {
      const result = await Share.share({
        message: `📊 My Investment Performance:\n\n🏢 ${prop.title}\n📍 ${prop.location}\n\n💰 Current Value: $${selectedInvestment.currentValue.toLocaleString()}\n📈 ROI: ${selectedInvestment.roi.toFixed(1)}%\n💵 Monthly Income: $${selectedInvestment.monthlyRentalIncome.toFixed(2)}\n🎯 Ownership: ${ownershipPercentage}%\n\nInvest in real estate with Blocks!`,
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

  const handleModalScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    modalScrollY.setValue(offsetY);
    setIsModalAtTop(offsetY <= 10);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <PropertyCard
        item={item}
        colors={colors}
        isDarkColorScheme={isDarkColorScheme}
        openModal={openModal}
      />
    );
  };

  const renderDots = () => {
    if (investments.length <= 1) return null;
    
    return (
      <View className="flex-row justify-center items-center py-4 gap-2">
        {investments.map((_, index) => (
      <View 
            key={index}
            className="h-2 rounded"
            style={{
              backgroundColor: index === activeIndex ? colors.primary : colors.muted,
              width: index === activeIndex ? 24 : 8,
            }}
          />
        ))}
      </View>
    );
  };

  // Generate stats for modal (matching assets-second.tsx)
  const getModalStats = (investment: any) => {
    if (!investment || !investment.property) return [];
    const property = investment.property;
    
    return [
      {
        label: 'Current ROI',
        value: `${investment.roi.toFixed(1)}%`,
        change: `+${(investment.roi * 0.1).toFixed(1)}%`,
        changeType: 'up' as const,
        changeColor: colors.primary,
        icon: 'trending-up',
      },
      {
        label: 'Monthly Income',
        value: `$${investment.monthlyRentalIncome.toFixed(0)}`,
        change: `+${(investment.rentalYield * 0.05).toFixed(1)}%`,
        changeType: 'up' as const,
        changeColor: colors.primary,
        icon: 'calendar',
      },
      {
        label: 'Total Invested',
        value: `$${(investment.investedAmount / 1000).toFixed(1)}k`,
        change: 'Principal',
        changeType: 'neutral' as const,
        changeColor: colors.textMuted,
        icon: 'wallet',
      },
      {
        label: 'Current Value',
        value: `$${(investment.currentValue / 1000).toFixed(1)}k`,
        change: `+${((investment.currentValue - investment.investedAmount) / investment.investedAmount * 100).toFixed(1)}%`,
        changeType: 'up' as const,
        changeColor: colors.primary,
        icon: 'cash',
      },
      {
        label: 'Rental Yield',
        value: `${investment.rentalYield.toFixed(2)}%`,
        change: 'Annual',
        changeType: 'neutral' as const,
        changeColor: colors.textSecondary,
        icon: 'stats-chart',
      },
      {
        label: 'Ownership',
        value: `${((investment.tokens / property.totalTokens) * 100).toFixed(2)}%`,
        change: `${investment.tokens.toFixed(2)} tokens`,
        changeType: 'neutral' as const,
        changeColor: colors.textSecondary,
        icon: 'pie-chart',
      },
    ];
  };

  if (loading) {
    return (
      <View 
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: colors.background }} 
      >
        <Text 
          className="text-base font-medium"
          style={{ color: colors.textSecondary }}
        >
          Loading your investments...
        </Text>
          </View>
    );
  }

  if (investments.length === 0) {
    return (
      <View 
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: colors.background }}
      >
        <Ionicons name="briefcase-outline" size={64} color={colors.textMuted} />
        <Text 
          className="text-2xl font-bold mt-6 mb-2"
          style={{ color: colors.textPrimary }}
        >
          No Investments Yet
        </Text>
        <Text 
          className="text-base text-center mb-8"
          style={{ color: colors.textSecondary }}
        >
          Start investing to see your assets here
        </Text>
          <TouchableOpacity 
            onPress={() => router.back()}
          className="px-8 py-4 rounded-xl"
              style={{ backgroundColor: colors.primary }}
          >
          <Text 
            className="text-base font-semibold"
            style={{ color: colors.primaryForeground }}
          >
            Explore Properties
              </Text>
          </TouchableOpacity>
      </View>
    );
  }

  const currentInvestment = investments[activeIndex];
  const modalStats = selectedInvestment ? getModalStats(selectedInvestment) : [];
  const modalProperty = selectedInvestment?.property;
  const newsData = modalProperty?.updates?.slice(0, 3).map((update: { title: string; type: string; description: string; date: string }) => ({
    id: update.title,
    icon: update.type === 'financial' ? 'cash-outline' : update.type === 'project' ? 'construct-outline' : 'people-outline',
    iconBg: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)',
    title: update.title,
    description: update.description,
    time: update.date,
  })) || [];
  const timeRanges = ['3M', '6M', '1Y', 'All'];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View 
          className="flex-row justify-between items-center px-4 pt-4 pb-3 z-10"
          style={{ backgroundColor: colors.background }}
        >
            <TouchableOpacity 
            onPress={() => router.back()} 
            className="flex-row items-center gap-2"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text 
              className="text-lg font-semibold"
              style={{ color: colors.textPrimary }}
            >
              My Assets
            </Text>
          </TouchableOpacity>
          
          <View 
            className="px-4 py-2 rounded-full border"
            style={{ 
              backgroundColor: colors.muted,
              borderColor: colors.border 
            }}
          >
            <Text 
              className="text-sm font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {activeIndex + 1} / {investments.length}
            </Text>
          </View>
        </View>

        {/* Carousel */}
        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={investments}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING * 2}
            decelerationRate="fast"
            contentContainerStyle={{ 
              paddingHorizontal: SPACING,
              alignItems: 'center',
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + SPACING * 2,
              offset: (CARD_WIDTH + SPACING * 2) * index,
              index,
            })}
            />
        </View>

        {/* Pagination Dots */}
        {renderDots()}

        {/* Action Buttons */}
        <View className="flex-row px-4 pt-2 gap-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl"
              style={{ backgroundColor: colors.primary }}
            onPress={() => {
              if (currentInvestment) {
                router.push({
                  pathname: '/invest/[id]',
                  params: { id: currentInvestment.property.id },
                } as any);
              }
            }}
              activeOpacity={0.8}
            >
            <Ionicons name="add-circle" size={24} color={colors.primaryForeground} />
            <Text 
              className="text-[15px] font-semibold"
              style={{ color: colors.primaryForeground }}
            >
                Invest More
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border"
              style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.border 
              }}
            onPress={() => handleShare(currentInvestment)}
              activeOpacity={0.8}
            >
            <Ionicons name="share-social" size={24} color={colors.textPrimary} />
            <Text 
              className="text-[15px] font-semibold"
              style={{ color: colors.textPrimary }}
            >
                Share
              </Text>
            </TouchableOpacity>
          </View>

        {/* Navigation Hint */}
        <View className="flex-row items-center justify-center gap-2 py-4">
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text 
            className="text-[13px] font-medium"
            style={{ color: colors.textMuted }}
          >
              Swipe to navigate
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </SafeAreaView>

      {/* Modal Overlay - Assets Second Screen */}
      {isModalVisible && selectedInvestment && modalProperty && (
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
              {/* Drag Handle - PanResponder attached here for drag down */}
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

              {/* Floating Header with backdrop - Also has PanResponder when at top */}
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
                      onPress={closeModal} 
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
                        {modalProperty.title}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={handleModalShare}
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
                onScroll={handleModalScroll}
                scrollEventThrottle={16}
                bounces={true}
              >
                {/* Hero Section */}
                <View className="px-5 pt-4 pb-6">
                  {/* Property Image */}
                  <View className="rounded-2xl overflow-hidden mb-4 shadow-lg">
          <Image
                      source={{ uri: modalProperty.images[0] || modalProperty.image }}
                      style={{ width: '100%', height: 240 }}
            resizeMode="cover"
          />
                    <LinearGradient
                      colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                      className="absolute bottom-0 left-0 right-0 p-4"
                    >
                      <Text style={{ color: '#fff' }} className="text-2xl font-bold mb-1">
                        {modalProperty.title}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text style={{ color: '#fff' }} className="text-sm">
                          {modalProperty.location}
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
                      onPress={handleModalShare}
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
                        value={`${((selectedInvestment.tokens / modalProperty.totalTokens) * 100).toFixed(3)}%`}
                        icon="pie-chart"
                        colors={colors}
                        highlight
                      />
                      <View style={{ backgroundColor: colors.border }} className="h-px" />
                      <ModalDetailRow 
                        label="Tokens Owned"
                        value={selectedInvestment.tokens.toFixed(3)}
                        icon="cube"
                        colors={colors}
                      />
                      <View style={{ backgroundColor: colors.border }} className="h-px" />
                      <ModalDetailRow 
                        label="Property Status"
                        value={modalProperty.status.replace('-', ' ')}
                        icon="checkmark-circle"
                        colors={colors}
                        capitalize
                      />
                      <View style={{ backgroundColor: colors.border }} className="h-px" />
                      <ModalDetailRow 
                        label="Annual Return (Est.)"
                        value={`$${(selectedInvestment.monthlyRentalIncome * 12).toFixed(2)}`}
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
                        {newsData.map((news: { id: string; icon: string; iconBg: string; title: string; description: string; time: string }) => (
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
                        closeModal();
                        router.push({
                          pathname: '/invest/[id]',
                          params: { id: modalProperty.id },
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
                        closeModal();
                        router.push({
                          pathname: '/property/[id]',
                          params: { id: modalProperty.id },
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
      )}
    </View>
  );
}

// Enhanced Modal Stat Card Component (matching assets-second.tsx)
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
        <View 
          className="w-9 h-9 items-center justify-center"
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

// Modal Detail Row Component
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
        <View 
          className="w-9 h-9 items-center justify-center"
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

// Modal Update Card Component (matching assets-second.tsx)
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
      <View
        className="w-11 h-11 items-center justify-center flex-shrink-0"
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
