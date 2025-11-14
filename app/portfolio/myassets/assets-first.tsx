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
  
  // Animation values for current card
  const currentCardX = useRef(new Animated.Value(0)).current;
  const currentCardScale = useRef(new Animated.Value(1)).current;
  const currentCardRotate = useRef(new Animated.Value(0)).current;
  const currentCardOpacity = useRef(new Animated.Value(1)).current;
  
  // Animation values for next/prev cards
  const nextCardX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const nextCardOpacity = useRef(new Animated.Value(0)).current;
  const prevCardX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const prevCardOpacity = useRef(new Animated.Value(0)).current;
  
  // Vertical animation for swipe up
  const verticalValue = useRef(new Animated.Value(0)).current;
  const verticalOpacity = useRef(new Animated.Value(1)).current;
  const verticalScale = useRef(new Animated.Value(1)).current;

  const currentInvestment = investments[currentIndex];
  const nextInvestment = currentIndex < investments.length - 1 ? investments[currentIndex + 1] : null;
  const prevInvestment = currentIndex > 0 ? investments[currentIndex - 1] : null;

  // Card pan responder
  const cardPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
    },
    
    onPanResponderMove: (_, gesture) => {
      const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
      const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
      
      if (isHorizontal) {
        // Current card animation
        currentCardX.setValue(gesture.dx);
        const rotation = (gesture.dx / SCREEN_WIDTH) * 18;
        currentCardRotate.setValue(rotation);
        const scale = 1 - (Math.abs(gesture.dx) / SCREEN_WIDTH) * 0.12;
        currentCardScale.setValue(Math.max(scale, 0.88));
        
        // Next/Prev card sliding in smoothly
        if (gesture.dx < 0 && nextInvestment) {
          // Swiping left - show next card sliding from right
          const progress = Math.min(Math.abs(gesture.dx) / SCREEN_WIDTH, 1);
          nextCardX.setValue(SCREEN_WIDTH - Math.abs(gesture.dx));
          nextCardOpacity.setValue(progress);
        } else if (gesture.dx > 0 && prevInvestment) {
          // Swiping right - show prev card sliding from left
          const progress = Math.min(Math.abs(gesture.dx) / SCREEN_WIDTH, 1);
          prevCardX.setValue(-SCREEN_WIDTH + gesture.dx);
          prevCardOpacity.setValue(progress);
        }
      } else if (isVertical && gesture.dy < 0) {
        // Vertical swipe up - reels style with preview
        const progress = Math.min(Math.abs(gesture.dy) / SCREEN_HEIGHT, 1);
        verticalValue.setValue(gesture.dy);
        verticalOpacity.setValue(1 - progress * 0.5);
        verticalScale.setValue(1 - progress * 0.15);
      }
    },
    
    onPanResponderRelease: (_, gesture) => {
      const threshold = SCREEN_WIDTH * 0.22;
      const verticalThreshold = -100;
      const isHorizontal = Math.abs(gesture.dx) > Math.abs(gesture.dy);
      const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
      
      // Check for vertical swipe up first - Navigate with reels-style transition
      if (isVertical && gesture.dy < verticalThreshold) {
        console.log('Swiping up to details page');
        
        Animated.parallel([
          Animated.spring(verticalValue, {
            toValue: -SCREEN_HEIGHT,
            velocity: gesture.vy,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(verticalOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(verticalScale, {
            toValue: 0.85,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.push({
            pathname: '/portfolio/myassets/assets-second',
            params: { investmentId: currentInvestment?.id },
          } as any);
          
          setTimeout(() => {
            verticalValue.setValue(0);
            verticalOpacity.setValue(1);
            verticalScale.setValue(1);
          }, 100);
        });
        return;
      }
      
      if (!isHorizontal) {
        // Reset vertical swipe if not enough
        Animated.parallel([
          Animated.spring(verticalValue, {
            toValue: 0,
            velocity: gesture.vy,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(verticalOpacity, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(verticalScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(currentCardX, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(currentCardScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(currentCardRotate, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
        ]).start();
        return;
      }
      
      // Handle horizontal swipe with smooth card transitions
      if (gesture.dx > threshold && currentIndex > 0) {
        // Swipe right - go to previous
        console.log('Swiping to previous:', currentIndex - 1);
        
        Animated.parallel([
          // Current card slides out to the right
          Animated.spring(currentCardX, {
            toValue: SCREEN_WIDTH * 1.3,
            velocity: gesture.vx,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(currentCardOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          // Previous card slides in from the left
          Animated.spring(prevCardX, {
            toValue: 0,
            velocity: gesture.vx,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(prevCardOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset all animation values first (synchronously)
          currentCardX.setValue(0);
          currentCardScale.setValue(1);
          currentCardRotate.setValue(0);
          currentCardOpacity.setValue(1);
          prevCardX.setValue(-SCREEN_WIDTH);
          prevCardOpacity.setValue(0);
          nextCardX.setValue(SCREEN_WIDTH);
          nextCardOpacity.setValue(0);
          
          // Then change index in next frame to avoid flickering
          requestAnimationFrame(() => {
            setCurrentIndex(prev => prev - 1);
          });
        });
        
      } else if (gesture.dx < -threshold && currentIndex < investments.length - 1) {
        // Swipe left - go to next
        console.log('Swiping to next:', currentIndex + 1);
        
        Animated.parallel([
          // Current card slides out to the left
          Animated.spring(currentCardX, {
            toValue: -SCREEN_WIDTH * 1.3,
            velocity: gesture.vx,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(currentCardOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          // Next card slides in from the right
          Animated.spring(nextCardX, {
            toValue: 0,
            velocity: gesture.vx,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(nextCardOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Reset all animation values first (synchronously)
          currentCardX.setValue(0);
          currentCardScale.setValue(1);
          currentCardRotate.setValue(0);
          currentCardOpacity.setValue(1);
          prevCardX.setValue(-SCREEN_WIDTH);
          prevCardOpacity.setValue(0);
          nextCardX.setValue(SCREEN_WIDTH);
          nextCardOpacity.setValue(0);
          
          // Then change index in next frame to avoid flickering
          requestAnimationFrame(() => {
            setCurrentIndex(prev => prev + 1);
          });
        });
        
      } else {
        // Snap back to center
        console.log('Snapping back to center');
        Animated.parallel([
          Animated.spring(currentCardX, {
            toValue: 0,
            velocity: gesture.vx,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(currentCardScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(currentCardRotate, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(nextCardX, {
            toValue: SCREEN_WIDTH,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(nextCardOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(prevCardX, {
            toValue: -SCREEN_WIDTH,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.timing(prevCardOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  // Footer swipe-up pan responder
  const footerPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return gesture.dy < -5; // Only for upward swipes
    },
    
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy < 0) {
        const progress = Math.min(Math.abs(gesture.dy) / SCREEN_HEIGHT, 1);
        verticalValue.setValue(gesture.dy);
        verticalOpacity.setValue(1 - progress * 0.5);
        verticalScale.setValue(1 - progress * 0.15);
      }
    },
    
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy < -80) {
        // Swipe up threshold met
        Animated.parallel([
          Animated.spring(verticalValue, {
            toValue: -SCREEN_HEIGHT,
            velocity: gesture.vy,
            tension: 50,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(verticalOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(verticalScale, {
            toValue: 0.85,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          router.push({
            pathname: '/portfolio/myassets/assets-second',
            params: { investmentId: currentInvestment?.id },
          } as any);
          
          setTimeout(() => {
            verticalValue.setValue(0);
            verticalOpacity.setValue(1);
            verticalScale.setValue(1);
          }, 100);
        });
      } else {
        // Reset
        Animated.parallel([
          Animated.spring(verticalValue, {
            toValue: 0,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(verticalOpacity, {
            toValue: 1,
            tension: 70,
            friction: 11,
            useNativeDriver: true,
          }),
          Animated.spring(verticalScale, {
            toValue: 1,
            tension: 70,
            friction: 11,
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
        Animated.spring(currentCardX, {
          toValue: SCREEN_WIDTH * 1.3,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(currentCardOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(prevCardX, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(prevCardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset animation values first
        currentCardX.setValue(0);
        currentCardScale.setValue(1);
        currentCardRotate.setValue(0);
        currentCardOpacity.setValue(1);
        prevCardX.setValue(-SCREEN_WIDTH);
        prevCardOpacity.setValue(0);
        nextCardX.setValue(SCREEN_WIDTH);
        nextCardOpacity.setValue(0);
        
        // Then update index in next frame
        requestAnimationFrame(() => {
          setCurrentIndex(prev => prev - 1);
        });
      });
    } else if (direction === 'next' && currentIndex < investments.length - 1) {
      console.log('Button: Going to next');
      Animated.parallel([
        Animated.spring(currentCardX, {
          toValue: -SCREEN_WIDTH * 1.3,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(currentCardOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(nextCardX, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(nextCardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset animation values first
        currentCardX.setValue(0);
        currentCardScale.setValue(1);
        currentCardRotate.setValue(0);
        currentCardOpacity.setValue(1);
        prevCardX.setValue(-SCREEN_WIDTH);
        prevCardOpacity.setValue(0);
        nextCardX.setValue(SCREEN_WIDTH);
        nextCardOpacity.setValue(0);
        
        // Then update index in next frame
        requestAnimationFrame(() => {
          setCurrentIndex(prev => prev + 1);
        });
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

  const currentRotateYInterpolate = currentCardRotate.interpolate({
    inputRange: [-28, 0, 28],
    outputRange: ['-28deg', '0deg', '28deg'],
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

        {/* Main Card Area with Stacked Cards */}
        <View className="flex-1 items-center justify-center py-4" {...cardPanResponder.panHandlers}>
          <View style={{ width: '100%', height: '80%', position: 'relative' }}>
            
            {/* Previous Card (Behind) */}
            {prevInvestment && (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [
                    { translateX: prevCardX },
                    { translateY: verticalValue },
                    { scale: verticalScale },
                  ],
                  opacity: prevCardOpacity,
                }}
                pointerEvents="none"
              >
                <PropertyCardComponent 
                  investment={prevInvestment} 
                  colors={colors}
                  isDarkColorScheme={isDarkColorScheme}
                />
              </Animated.View>
            )}
            
            {/* Current Card (Center) */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: [
                  { translateX: currentCardX },
                  { translateY: verticalValue },
                  { scale: currentCardScale },
                  { perspective: 1000 },
                  { rotateY: currentRotateYInterpolate },
                ],
                opacity: Animated.multiply(currentCardOpacity, verticalOpacity),
              }}
            >
              <PropertyCardComponent 
                investment={currentInvestment} 
                colors={colors}
                isDarkColorScheme={isDarkColorScheme}
              />
            </Animated.View>
            
            {/* Next Card (Behind) */}
            {nextInvestment && (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  transform: [
                    { translateX: nextCardX },
                    { translateY: verticalValue },
                    { scale: verticalScale },
                  ],
                  opacity: nextCardOpacity,
                }}
                pointerEvents="none"
              >
                <PropertyCardComponent 
                  investment={nextInvestment} 
                  colors={colors}
                  isDarkColorScheme={isDarkColorScheme}
                />
              </Animated.View>
            )}
          </View>
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

        {/* Footer with Swipe-Up Gesture */}
        <View className="w-full px-4 pb-6 items-center z-30">
          {/* Swipe Up Area */}
          <View {...footerPanResponder.panHandlers} className="flex-col items-center gap-1 mb-4 py-2">
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
                backgroundColor: colors.card,
              
              }}
              className="flex-1 flex-col items-center justify-center gap-1.5 py-3 rounded-lg "
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
                backgroundColor: colors.card,
              }}
              className="flex-1 flex-col items-center justify-center gap-1.5 py-3 rounded-lg"
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
              Swipe to navigate
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Property Card Component
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