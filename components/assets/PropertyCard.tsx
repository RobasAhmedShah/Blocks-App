import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Investment } from '@/types/portfolio';
import { getTierInfo, formatCurrency } from './utils';
import { ASSETS_CONSTANTS } from './constants';
import * as Haptics from 'expo-haptics';

const { CARD_WIDTH, CARD_HEIGHT, SPACING } = ASSETS_CONSTANTS;

interface PropertyCardProps {
  item: Investment;
  colors: any;
  isDarkColorScheme: boolean;
  openModal: (item: Investment) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ 
  item, 
  colors, 
  isDarkColorScheme, 
  openModal 
}) => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    longPressScale.setValue(1);
    longPressOverlay.setValue(0);
    longPressProgress.setValue(0);
    setIsLongPressing(false);
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
      style={{ width: CARD_WIDTH + SPACING * 2 }}
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
            <Image
              source={{ uri: property.images[0] || property.image }}
              className="absolute w-full h-full"
              resizeMode="cover"
            />
            
            <LinearGradient
              colors={
                isDarkColorScheme
                  ? ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.85)']
                  : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.9)']
              }
              className="absolute w-full h-full"
            />

            {/* Punched Hole Effect */}
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
              {/* Tier Badge */}
              <View className="items-center mb-6">
                <View 
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${tierInfo.tierColor}15` }} >
                  <Text 
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: tierInfo.tierColor }}>
                    {tierInfo.tier}
                  </Text>
                </View>
              </View>

              {/* Premium Token Display */}
              <View className="flex-1 items-center justify-center">
                <View className="items-center">
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
                    
                    <Animated.View
                      className="absolute inset-0 rounded-full"
                      style={{ opacity: longPressOverlay }}
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

              <View>
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
                      {formatCurrency(item.currentValue)}
                    </Text>
                    <View className="absolute top-3 right-3 opacity-30">
                      <Ionicons name="wallet" size={20} color={colors.primary} />
                    </View>
                  </View>

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
                        color: isDarkColorScheme ? colors.primary : '#000000',
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

