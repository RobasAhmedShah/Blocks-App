import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Animated,
  PanResponder,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePortfolio } from '@/services/usePortfolio';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getTierInfo = (roi: number) => {
  if (roi >= 15) {
    return {
      tier: 'Sapphire Tier',
      tierColor: '#66B2FC',
      glowColor: 'rgba(102, 178, 252, 0.2)',
    };
  } else if (roi >= 10) {
    return {
      tier: 'Emerald Tier',
      tierColor: '#66FCF1',
      glowColor: 'rgba(102, 252, 241, 0.2)',
    };
  } else {
    return {
      tier: 'Ruby Tier',
      tierColor: '#FC6666',
      glowColor: 'rgba(252, 102, 102, 0.2)',
    };
  }
};

export default function AssetsFirstScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments, loading } = usePortfolio();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Simple animation values that get created fresh each time
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const verticalValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const currentInvestment = investments[currentIndex];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
    },
    
    onPanResponderMove: (_, gesture) => {
      const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
      const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
      
      if (isHorizontal) {
        // Horizontal swipe
        animatedValue.setValue(gesture.dx);
        const rotation = (gesture.dx / SCREEN_WIDTH) * 15;
        rotateValue.setValue(rotation);
        const scale = 1 - (Math.abs(gesture.dx) / SCREEN_WIDTH) * 0.1;
        scaleValue.setValue(Math.max(scale, 0.9));
      } else if (isVertical && gesture.dy < 0) {
        // Vertical swipe up
        verticalValue.setValue(gesture.dy);
        const progress = Math.min(Math.abs(gesture.dy) / 150, 1);
        opacityValue.setValue(1 - progress * 0.3);
        scaleValue.setValue(1 - progress * 0.1);
      }
    },
    
    onPanResponderRelease: (_, gesture) => {
      const threshold = SCREEN_WIDTH * 0.25;
      const verticalThreshold = -80; // Swipe up threshold
      const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
      const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
      
      // Check for vertical swipe up first
      if (isVertical && gesture.dy < verticalThreshold) {
        console.log('Swiping up to details page');
        
        Animated.parallel([
          Animated.timing(verticalValue, {
            toValue: -SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.85,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Navigate to assets second page
          router.push({
            pathname: '/portfolio/myassets/assets-second',
            params: { investmentId: currentInvestment?.id },
          } as any);
          
          // Reset values after navigation
          setTimeout(() => {
            verticalValue.setValue(0);
            opacityValue.setValue(1);
            scaleValue.setValue(1);
          }, 100);
        });
        return;
      }
      
      if (!isHorizontal) {
        // Reset if not enough vertical swipe
        Animated.parallel([
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(verticalValue, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.spring(rotateValue, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(opacityValue, {
            toValue: 1,
            useNativeDriver: true,
          }),
        ]).start();
        return;
      }
      
      // Check if we should change card
      if (gesture.dx > threshold && currentIndex > 0) {
        // Swipe right - go to previous
        console.log('Swiping to previous:', currentIndex - 1);
        
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: 20,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          console.log('Animation complete, changing index');
          // Reset values immediately
          animatedValue.setValue(0);
          scaleValue.setValue(1);
          rotateValue.setValue(0);
          // Change index
          setCurrentIndex(prev => prev - 1);
        });
        
      } else if (gesture.dx < -threshold && currentIndex < investments.length - 1) {
        // Swipe left - go to next
        console.log('Swiping to next:', currentIndex + 1);
        
        Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(rotateValue, {
            toValue: -20,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          console.log('Animation complete, changing index');
          // Reset values immediately
          animatedValue.setValue(0);
          scaleValue.setValue(1);
          rotateValue.setValue(0);
          // Change index
          setCurrentIndex(prev => prev + 1);
        });
        
      } else {
        // Snap back
        console.log('Snapping back to center');
        Animated.parallel([
          Animated.spring(animatedValue, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(rotateValue, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const handleIncreaseInvestment = () => {
    if (currentInvestment) {
      router.push({
        pathname: '/invest/[id]',
        params: { id: currentInvestment.property.id },
      } as any);
    }
  };

  const handleViewDetails = () => {
    if (currentInvestment) {
      router.push({
        pathname: '/portfolio/myassets/assets-second',
        params: { investmentId: currentInvestment.id },
      } as any);
    }
  };

  const handleShare = async () => {
    if (!currentInvestment) return;
    
    const property = currentInvestment.property;
    const ownershipPercentage = ((currentInvestment.tokens / property.totalTokens) * 100).toFixed(2);
    
    try {
      const result = await Share.share({
        message: `Check out my investment in ${property.title}! 🏢\n\nOwnership: ${ownershipPercentage}%\nCurrent Value: $${currentInvestment.currentValue.toLocaleString()}\nROI: ${currentInvestment.roi.toFixed(1)}%\n\nInvest in real estate with Blocks!`,
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

  const navigateToProperty = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      console.log('Button: Going to previous');
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animatedValue.setValue(0);
        scaleValue.setValue(1);
        rotateValue.setValue(0);
        setCurrentIndex(prev => prev - 1);
      });
    } else if (direction === 'next' && currentIndex < investments.length - 1) {
      console.log('Button: Going to next');
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: -SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animatedValue.setValue(0);
        scaleValue.setValue(1);
        rotateValue.setValue(0);
        setCurrentIndex(prev => prev + 1);
      });
    }
  };

  if (loading || investments.length === 0) {
    return (
      <View 
        style={{ backgroundColor: colors.background }} 
        className="flex-1 items-center justify-center"
      >
        <Text style={{ color: colors.textSecondary }}>
          {loading ? 'Loading assets...' : 'No investments found'}
        </Text>
        {!loading && (
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 }}
          >
            <Text style={{ color: colors.primaryForeground, fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const rotateYInterpolate = rotateValue.interpolate({
    inputRange: [-20, 0, 20],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  console.log('Current index:', currentIndex);

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-4 pb-2 z-30">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
              My Assets
            </Text>
          </TouchableOpacity>
          <View 
            style={{ 
              backgroundColor: colors.muted,
              borderColor: colors.border,
            }}
            className="px-3 py-1.5 rounded-full border"
          >
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
              {currentIndex + 1} / {investments.length}
            </Text>
          </View>
        </View>

        {/* Main Card */}
        <View className="flex-1 items-center justify-center py-4">
          <Animated.View
            style={{
              transform: [
                { translateX: animatedValue },
                { translateY: verticalValue },
                { scale: scaleValue },
                { perspective: 1000 },
                { rotateY: rotateYInterpolate },
              ],
              opacity: opacityValue,
            }}
            className="w-full items-center"
            {...panResponder.panHandlers}
          >
            <PropertyCardComponent 
              investment={currentInvestment} 
              colors={colors}
              isDarkColorScheme={isDarkColorScheme}
            />
          </Animated.View>
        </View>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={() => navigateToProperty('prev')}
            className="absolute left-4 top-1/2 z-50"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              transform: [{ translateY: -24 }],
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {currentIndex < investments.length - 1 && (
          <TouchableOpacity
            onPress={() => navigateToProperty('next')}
            className="absolute right-4 top-1/2 z-50"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              transform: [{ translateY: -24 }],
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View className="w-full px-4 pb-6 items-center z-30">
          <View className="flex-col items-center gap-1 mb-4">
            <Ionicons name="chevron-up" size={24} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-xs font-medium">
              Swipe up for details
            </Text>
          </View>

          <View className="flex-row gap-3 w-full max-w-md mb-3">
            <TouchableOpacity 
              onPress={handleIncreaseInvestment}
              style={{ backgroundColor: colors.primary }}
              className="flex-1 flex-col items-center justify-center gap-1.5 py-3 rounded-lg"
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground }} className="text-xs font-medium">
                Invest More
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleViewDetails}
              style={{ 
                backgroundColor: colors.muted,
                borderColor: colors.border,
              }}
              className="flex-1 flex-col items-center justify-center gap-1.5 py-3 rounded-lg border"
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={28} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary }} className="text-xs font-medium">
                Full Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleShare}
              style={{ 
                backgroundColor: colors.muted,
                borderColor: colors.border,
              }}
              className="flex-1 flex-col items-center justify-center gap-1.5 py-3 rounded-lg border"
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={28} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary }} className="text-xs font-medium">
                Share
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-xs">
              Swipe to navigate • Index: {currentIndex}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Property Card Component (unchanged from before)
interface PropertyCardComponentProps {
  investment: any;
  colors: any;
  isDarkColorScheme: boolean;
}

function PropertyCardComponent({ 
  investment, 
  colors,
  isDarkColorScheme 
}: PropertyCardComponentProps) {
  if (!investment) return null;

  const tierInfo = getTierInfo(investment.roi);
  const property = investment.property;
  const ownershipPercentage = (investment.tokens / property.totalTokens) * 100;

  return (
    <View className="w-full max-w-md items-center justify-center px-4">
      <View className="relative w-full aspect-square">
        <View
          style={{
            backgroundColor: tierInfo.glowColor,
            position: 'absolute',
            width: '95%',
            height: '95%',
            borderRadius: 9999,
            opacity: 0.4,
            top: '2.5%',
            left: '2.5%',
          }}
          className="blur-3xl"
        />
        <View
          style={{
            backgroundColor: tierInfo.glowColor,
            position: 'absolute',
            width: '85%',
            height: '85%',
            borderRadius: 9999,
            opacity: 0.6,
            top: '7.5%',
            left: '7.5%',
          }}
          className="blur-2xl"
        />

        <View
          style={{
            width: '85%',
            height: '85%',
            position: 'absolute',
            top: '7.5%',
            left: '7.5%',
            shadowColor: isDarkColorScheme ? '#000' : tierInfo.tierColor,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: isDarkColorScheme ? 0.6 : 0.4,
            shadowRadius: 30,
            elevation: 20,
          }}
        >
          <Image
            source={{ uri: property.images[0] || property.image }}
            className="w-full h-full rounded-full"
            style={{ position: 'absolute' }}
            resizeMode="cover"
          />

          {/* <LinearGradient
            colors={[
              'transparent',
              'rgba(0, 0, 0, 0.3)',
              'rgba(0, 0, 0, 0.7)',
            ]}
            className="absolute inset-0 rounded-full"
          />

          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.3)',
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.3 }}
            className="absolute inset-0 rounded-full"
            style={{ opacity: 0.5 }}
          /> */}

          <View className="absolute inset-0 items-center justify-center px-6">
            <View className="w-full">
              <Text 
                style={{ 
                  color: '#ffffff',
                  textShadowColor: 'rgba(0, 0, 0, 0.75)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
                className="text-3xl font-bold text-center leading-tight"
                numberOfLines={2}
              >
                {property.title}
              </Text>

              <Text 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadowColor: 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
                className="text-sm text-center mt-1"
                numberOfLines={1}
              >
                📍 {property.location}
              </Text>

              <View className="mt-16">
                <Text
                  style={{ 
                    color: tierInfo.tierColor,
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-center"
                >
                  {investment.tokens.toLocaleString()} Tokens
                </Text>

                <Text 
                  style={{ 
                    color: '#ffffff',
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  }}
                  className="text-5xl font-bold text-center leading-tight mt-2"
                >
                  {ownershipPercentage.toFixed(2)}%
                </Text>
                <Text 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                  className="text-sm text-center"
                >
                  Ownership
                </Text>

                <Text 
                  style={{ 
                    color: '#ffffff',
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  }}
                  className="text-2xl font-bold text-center leading-tight mt-3"
                >
                  ${investment.currentValue.toLocaleString()}
                </Text>

                <View className="items-center mt-4">
                  <LinearGradient
                    colors={[
                      `${tierInfo.tierColor}40`,
                      `${tierInfo.tierColor}20`,
                    ]}
                    className="px-5 py-2 rounded-full"
                    style={{
                      borderColor: tierInfo.tierColor,
                      borderWidth: 1.5,
                      shadowColor: tierInfo.tierColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.6,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <Text 
                      style={{ 
                        color: tierInfo.tierColor,
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }} 
                      className="text-sm font-bold"
                    >
                      {tierInfo.tier} • {investment.roi.toFixed(1)}% ROI
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}