import React, { useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, Dimensions, StatusBar, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeaturedSection, { Stat as FeaturedStat } from '@/components/home/FeaturedSection';
import AffordableSection from '@/components/home/AffordableSection';
import InvestmentSection from '@/components/home/InvestmentSection';
import CTAButton from '@/components/home/CTAButton';
import GuidanceCard from '@/components/home/GuidanceCard';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/contexts/AppContext';
import { Property } from '@/types/property';
import { CopilotStep, useCopilot } from 'react-native-copilot';
import { CustomTooltip } from '@/components/tour/CustomTooltip';
import { CopilotView, CopilotTouchableOpacity } from '@/components/tour/walkthroughable';
import { useTour } from '@/contexts/TourContext';
import { TOUR_STEPS } from '@/utils/tourHelpers';
import { useKycCheck } from '@/hooks/useKycCheck';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplacePreviewRow } from '@/components/marketplace/MarketplacePreviewRow';
import Constants from 'expo-constants';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { GlassChip } from '@/components/GlassChip';
import { useRestrictionGuard } from '@/hooks/useAccountRestrictions';
import { AccountRestrictedScreen } from '@/components/restrictions/AccountRestrictedScreen';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

// Glass Button Component
const GlassButton = ({ onPress, icon, size = 36 }: { onPress: () => void; icon: string; size?: number }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <BlurView intensity={20} tint="dark" style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
      <Ionicons name={icon as any} size={20} color="#FFFFFF" />
    </BlurView>
  </TouchableOpacity>
);

// Glass Card Component
const GlassCard = ({ children, style }: { children?: React.ReactNode; style?: any }) => (
  <BlurView intensity={10} tint="dark" style={[{ backgroundColor: 'rgba(22, 22, 22, 0.56)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }, style]}>
    {children}
  </BlurView>
);




function BlocksHomeScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { colors, isDarkColorScheme } = useColorScheme();
  const { state, loadWallet } = useApp();
  const { start, copilotEvents } = useCopilot();
  const { 
    isTourCompleted, 
    markTourCompleted, 
    isFirstLaunch, 
    shouldStartTour, 
    setShouldStartTour, 
    updateCurrentStep,
    isTourActive,
    setIsTourActive,
    setScrollViewRef,
  } = useTour();
  
  // KYC Status using hook (with caching)
  const { kycStatus, kycLoading, loadKycStatus } = useKycCheck();
  const { isGuest, isAuthenticated } = useAuth();
  
  // Check account restrictions - if account is restricted, show blocking screen
  const { showRestrictionScreen, restrictionDetails } = useRestrictionGuard();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hero carousel state
  const [heroIndex, setHeroIndex] = useState(0);
  const heroCarouselRef = useRef<FlatList>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);
  
  // Create ref for ScrollView only
  const scrollViewRef = useRef<any>(null);
  
  // Register ScrollView ref with context
  useEffect(() => {
    if (scrollViewRef.current) {
      setScrollViewRef(scrollViewRef);
    }
  }, [setScrollViewRef]);

  // Refresh wallet balance, KYC status, and marketplace listings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isTourActive) {
        console.log('[HomeScreen] Skipping wallet reload - tour is active');
        return;
      }
      if (!isGuest && isAuthenticated) {
      loadWallet();
      loadKycStatus(false);
      }
    }, [loadWallet, loadKycStatus, isTourActive])
  );
  
  // Auto-start tour logic - DISABLED PERMANENTLY
  useLayoutEffect(() => {
    const checkAndStartTour = async () => {
      // Tour is permanently disabled - return immediately
      return;
      
      // Original tour logic commented out below
      /*
      if (isTourActive) {
        console.log('[HomeScreen] Tour already active, skipping start check');
        return;
      }

      const firstLaunch = await isFirstLaunch();
      const tourDone = await isTourCompleted('home');
      
      const shouldStart = shouldStartTour || (!tourDone && firstLaunch);
      
      if (shouldStart) {
        setTimeout(() => {
          console.log('[HomeScreen] Calling start() now...');
          setIsTourActive(true);
          try {
            start();
            console.log('[HomeScreen] start() called successfully');
          } catch (error) {
            console.error('[HomeScreen] Error calling start():', error);
          }
          setShouldStartTour(false);
        }, 800);
      }
      */
    };
    
    checkAndStartTour();
  }, [
    start,
    shouldStartTour,
    setShouldStartTour,
    isTourActive,
    setIsTourActive,
    isFirstLaunch,
    isTourCompleted,
  ]);

  // Tour event listeners
  useEffect(() => {
    const handleStart = () => {
      console.log('[HomeScreen] 🚀 Tour STARTED');
      setIsTourActive(true);
    };

    const handleStop = async () => {
      console.log('[HomeScreen] 🛑 Tour STOPPED');
      setIsTourActive(false);
      await markTourCompleted('home');
    };
    
    const handleStepChange = (step: any) => {
      console.log('[HomeScreen] 📍 Step changed:', step?.name, 'Order:', step?.order);
      console.log('[HomeScreen] 📍 Step details:', {
        name: step?.name,
        order: step?.order,
        text: step?.text,
        visible: step?.visible,
        hasWrapperRef: !!step?.wrapperRef,
        wrapperRefCurrent: !!step?.wrapperRef?.current,
      });
      
      if (step?.name) {
        updateCurrentStep(step.name);
        if (step?.wrapperRef?.current && scrollViewRef.current) {
          setTimeout(() => {
            try {
              step.wrapperRef.current.measureLayout(
                scrollViewRef.current,
                (x: number, y: number, width: number, height: number) => {
                  console.log(`[HomeScreen] Scrolling to ${step.name}:`, { x, y, width, height });
                  const screenHeight = Dimensions.get('window').height;
                  const centerOffset = screenHeight / 2 - height / 2;
                  const scrollToY = Math.max(0, y - centerOffset);
                  
                  scrollViewRef.current?.scrollTo({
                    y: scrollToY,
                    animated: true,
                  });
                },
                (error: any) => {
                  console.error(`[HomeScreen] Error measuring ${step.name}:`, error);
                }
              );
            } catch (error) {
              console.error(`[HomeScreen] Error scrolling to ${step.name}:`, error);
            }
          }, 200);
        }
      }
    };

    copilotEvents.on('start', handleStart);
    copilotEvents.on('stop', handleStop);
    copilotEvents.on('stepChange', handleStepChange);

    return () => {
      copilotEvents.off('start', handleStart);
      copilotEvents.off('stop', handleStop);
      copilotEvents.off('stepChange', handleStepChange);
    };
  }, [copilotEvents, markTourCompleted, updateCurrentStep, setIsTourActive]);
  
  // Get user's wallet balance
  const balance = state.balance.usdc;
  
  // Get user info
  const userName = state.userInfo?.fullName || state.userInfo?.email?.split('@')[0] || 'User';
  const userImage = state.userInfo?.profileImage;
  
  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  // Filter properties based on user's purchase power
  const { affordable, featured, midRange } = useMemo(() => {
    const allProperties = state.properties.filter(
      (p) => p.totalTokens > 0 && p.soldTokens < p.totalTokens
    );
    
    if (balance <= 0) {
      return {
        affordable: allProperties
          .sort((a, b) => a.tokenPrice - b.tokenPrice)
          .slice(0, 2)
          .map((property) => ({
            id: property.id,
            name: property.title,
            entry: `$${(property.minInvestment / 10).toFixed(2)}`,
            roi: `${property.estimatedROI}%`,
            image: property.images?.[0] || '',
            property: property,
          })),
        featured: allProperties
          .sort((a, b) => b.estimatedROI - a.estimatedROI)
          .slice(0, 4)
          .map((property) => ({
            id: property.id,
            title: property.title,
            roi: `${property.estimatedROI}%`,
            funded: `${Math.round((property.soldTokens / property.totalTokens) * 100)}%`,
            minInvestment: `$${(property.minInvestment / 10).toFixed(2) || (property.tokenPrice / 10).toFixed(2)}`,
            image: property.images?.[0] || '',
            property: property,
          })),
        midRange: allProperties
          .filter((p) => {
            const avgPrice = allProperties.reduce((sum, prop) => sum + prop.tokenPrice, 0) / allProperties.length;
            return p.tokenPrice >= avgPrice * 0.3 && p.tokenPrice <= avgPrice;
          })
          .sort((a, b) => b.estimatedROI - a.estimatedROI)
          .slice(0, 3)
          .map((property) => ({
            id: property.id,
            name: property.title,
            value: `$${typeof property.valuation === 'number' ? property.valuation.toLocaleString() : property.valuation}`,
            roi: `${property.estimatedROI}%`,
            image: property.images?.[0] || '',
            path: 'M0,30 Q25,20 50,25 T100,30',
            property: property,
          })),
      };
    }
    
    const affordableProperties = allProperties.filter((p) => p.tokenPrice <= balance);
    const featuredProperties = allProperties.filter((p) => balance >= p.tokenPrice * 0.1);
    const midRangeProperties = allProperties.filter((p) => p.tokenPrice >= balance * 0.1 && p.tokenPrice <= balance);
    
    return {
      affordable: affordableProperties
        .sort((a, b) => a.tokenPrice - b.tokenPrice)
        .slice(0, 2)
        .map((property) => ({
          id: property.id,
          name: property.title,
          entry: `$${(property.tokenPrice / 10).toFixed(2)}`,
          roi: `${property.estimatedROI}%`,
          image: property.images?.[0] || '',
          property: property,
        })),
      featured: featuredProperties
        .sort((a, b) => b.estimatedROI - a.estimatedROI)
        .slice(0, 4)
        .map((property) => ({
          id: property.id,
          title: property.title,
          roi: `${property.estimatedROI}%`,
          funded: `${Math.round((property.soldTokens / property.totalTokens) * 100)}%`,
          minInvestment: `$${(property.minInvestment / 10).toFixed(2) || (property.tokenPrice / 10).toFixed(2)}`,
          image: property.images?.[0] || '',
          property: property,
        })),
      midRange: midRangeProperties
        .sort((a, b) => b.estimatedROI - a.estimatedROI)
        .slice(0, 3)
        .map((property) => ({
          id: property.id,
          name: property.title,
          value: `$${typeof property.valuation === 'number' ? property.valuation.toLocaleString() : property.valuation}`,
          roi: `${property.estimatedROI}%`,
          image: property.images?.[0] || '',
          path: 'M0,30 Q25,20 50,25 T100,30',
          property: property,
        })),
    };
  }, [balance, state.properties, isTourActive]);

  // Get image URL helper
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${API_BASE_URL}${image.startsWith('/') ? image : `/${image}`}`;
  };

  // Hero carousel auto-advance
  useEffect(() => {
    if (featured.length <= 1) return;
    
    // Clear any existing timer
    if (autoAdvanceTimerRef.current) {
      clearInterval(autoAdvanceTimerRef.current);
    }
    
    // Only auto-advance if user is not manually scrolling
    if (!isUserScrollingRef.current) {
      autoAdvanceTimerRef.current = setInterval(() => {
        if (!isUserScrollingRef.current) {
          setHeroIndex((prev) => {
            const nextIndex = (prev + 1) % featured.length;
            // Scroll to next item
            heroCarouselRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
            return nextIndex;
          });
        }
      }, 5000);
    }
    
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
      }
    };
  }, [featured.length]);

  // Scroll to initial index when featured data changes
  useEffect(() => {
    if (featured.length > 0 && heroCarouselRef.current) {
      // Small delay to ensure FlatList is rendered
      setTimeout(() => {
        heroCarouselRef.current?.scrollToIndex({
          index: heroIndex,
          animated: false,
        });
      }, 100);
    }
  }, [featured.length]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Get current hero property
  const heroProperty = featured[heroIndex] || featured[0];
  const heroPropertyData = heroProperty?.property || state.properties.find(p => p.id === heroProperty?.id);

  // Show restriction screen if account is restricted
  if (showRestrictionScreen && restrictionDetails) {
    return (
      <AccountRestrictedScreen
        title={restrictionDetails.restrictionType === 'general' ? 'Account Restricted' : undefined}
        message={restrictionDetails.message}
        restrictionType={restrictionDetails.restrictionType}
      />
    );
  }

  return (
    <View style={{ flex: 1,backgroundColor: 'rgba(22, 22, 22, 1)' }}>
      <StatusBar barStyle="light-content" translucent={false} />
      
      {/* Dark Olive/Green Gradient Background */}
      <LinearGradient
        colors={['rgba(11, 26, 18, 1)', 'rgba(9, 20, 15, 1)', 'rgba(5, 10, 8, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Soft top-left glow overlay */}
      {/* <View style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#9EDC5A', opacity: 0.1 }} /> */}
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Radial Gradient Background */}
        <View style={{ position: 'absolute', inset: 0 }}>
            <Svg width="100%" height="100%">
              <Defs>
                {isDarkColorScheme ? (
                  <>
                    {/* Dark Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="0%" cy="0%" r="80%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="rgb(226, 223, 34)" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
                    </RadialGradient>
                  </>
                ) : (
                  <>
                    {/* Light Mode - Top Right Glow */}
                    <RadialGradient id="grad1" cx="10%" cy="10%" r="80%" fx="90%" fy="10%">
                      <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </RadialGradient>
                  </>
                )}
              </Defs>

              {/* Base Layer */}
              <Rect 
                width="100%" 
                height="100%" 
                fill={isDarkColorScheme ? "rgba(22,22,22,0)" : "#f0fdf4"} 
              />

              {/* Layer the gradients on top of the base */}
              <Rect width="100%" height="50%" fill="url(#grad1)" />
            </Svg>
          </View>

        <Animated.ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >

          {/* Top Header Row */}
          <View className="flex-row items-center justify-between px-5 pt-4 mb-6">
            {/* Left: Avatar */}
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7}>
              {userImage ? (
                <Image source={{ uri: getImageUrl(userImage) || undefined }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(158, 220, 90, 0.2)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={20} color="#9EDC5A" />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Center: Greeting */}
            <View className="flex-1 ml-3">
              <Text className="text-white text-base font-semibold">{userName}</Text>
              <Text className="text-white/55 text-sm">{getGreeting()}</Text>
            </View>
            
            {/* Right: Icon Buttons */}
            {/* <View className="flex-row gap-3">
              <GlassButton icon="scan-outline" onPress={() => {}} />
              <GlassButton icon="settings-outline" onPress={() => router.push('/(tabs)/profile')} />
            </View> */}
          </View>

          {/* Search Row */}
          {/* <View className="flex-row items-center gap-3 px-5 mb-4">
            <GlassCard style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.55)" style={{ marginRight: 12 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search properties..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
              />
            </GlassCard>
            <GlassButton icon="options-outline" size={40} onPress={() => {}} />
          </View> */}

          {/* Featured Hero Carousel Card */}
          {featured.length > 0 && (
            <View className="px-5 mb-4">
              <FlatList
                ref={heroCarouselRef}
                data={featured}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                snapToInterval={width - 40}
                decelerationRate="fast"
                onScrollBeginDrag={() => {
                  // User started scrolling manually - pause auto-advance
                  isUserScrollingRef.current = true;
                }}
                onMomentumScrollEnd={(event) => {
                  const cardWidth = width - 40; // Full width minus horizontal padding (20px each side)
                  const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
                  if (index >= 0 && index < featured.length) {
                    setHeroIndex(index);
                  }
                  // Resume auto-advance after a delay
                  setTimeout(() => {
                    isUserScrollingRef.current = false;
                  }, 3000); // Wait 3 seconds before resuming auto-advance
                }}
                onScrollToIndexFailed={(info) => {
                  // Handle scroll to index failure gracefully
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    heroCarouselRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
                getItemLayout={(data, index) => {
                  const cardWidth = width - 40;
                  return {
                    length: cardWidth,
                    offset: cardWidth * index,
                    index,
                  };
                }}
                renderItem={({ item }) => {
                  const propertyData = item.property || state.properties.find(p => p.id === item.id);
                  if (!propertyData) return null;
                  
                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push(`/property/${item.id}`)}
                      style={{ width: width - 40, height: 260, borderRadius: 22, overflow: 'hidden', marginRight: 0 }}
                    >
                      {item.image ? (
                        <Image source={{ uri: getImageUrl(item.image) || undefined }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(158, 220, 90, 0.1)' }} />
                      )}
                      
                      {/* Overlay Gradient */}
                      <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.57)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                      />
                      
                      {/* Top-right Heart */}
                      <View style={{ position: 'absolute', top: 16, right: 16 }}>
                        <GlassButton icon="heart-outline" size={40} onPress={() => {}} />
                      </View>
                      
                      {/* Content */}
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
                        {/* Chip */}
                        <View className="mb-3">
                          <GlassChip text="Hot Rent" />
                        </View>
                        
                        {/* Title */}
                        <Text className="text-white text-3xl font-bold mb-4" numberOfLines={2}>
                          {item.title}
                        </Text>
                        
                        {/* Stat Chips */}
                        <View className="flex-row gap-2">
                          {propertyData.amenities?.slice(0, 3).map((amenity: string, amenityIndex: number) => (
                            <View key={`${item.id}-amenity-${amenityIndex}`} className="flex-row gap-2">
                              {/* <Ionicons name={amenity as any} size={20} color="#FFFFFF" /> */}
                              <GlassChip text={amenity} />
                            </View>
                          ))}
                         
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
              
              {/* Pagination Dots */}
              {featured.length > 1 && (
                <View className="flex-row justify-center gap-2 mt-4">
                  {featured.slice(0, 4).map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: index === heroIndex ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: index === heroIndex ? '#9EDC5A' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Section Header */}
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text className="text-white text-xl font-bold">Description</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={24} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          </View>

          {/* List Cards */}
          <View className="px-5 gap-4 mb-6">
            {(() => {
              // Remove duplicates by id to prevent duplicate keys
              const combined = [...affordable, ...midRange];
              const uniqueItems = combined.filter((item, index, self) => 
                index === self.findIndex((t) => t.id === item.id)
              );
              return uniqueItems.slice(0, 3);
            })().map((item, index) => {
              const property = item.property || state.properties.find(p => p.id === item.id);
              if (!property) return null;
              
              return (
                <TouchableOpacity
                  key={`${item.id}-${index}`}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/property/${item.id}`)}
                >
                  <GlassCard style={{ padding: 16, flexDirection: 'row', gap: 12 }}>
                    {/* Thumbnail */}
                    <Image
                      source={{ uri: getImageUrl(item.image) || undefined }}
                      style={{ width: 72, height: 72, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  
                    
                    {/* Middle Content */}
                    <View className="flex-1">
                      <Text className="text-white text-base font-semibold mb-1" numberOfLines={1}>
                        {item.name || (item as any).title || property.title}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.55)" />
                        <Text className="text-white/55 text-sm ml-1">{property.city || 'Location'}</Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white/85 text-sm font-sans-serif-thin">
                          ${property.tokenPrice?.toFixed(2) || '0.00'} per token
                        </Text>
                        <View className="flex-row items-center bg-yellow-500/20 px-2 py-1 rounded-lg">
                          <Text className="text-white text-xs font-semibold ml-1">ROI: </Text>
                          <Text className="text-white text-xs font-semibold ml-1">{property.estimatedROI || '0'}%</Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* KYC Verification Alert */}
          {kycStatus && kycStatus.status === 'not_submitted' && (
            <View className="mx-5 mb-4">
              <GlassCard style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold mb-1">Verify Your Identity</Text>
                  <Text className="text-white/55 text-sm">Complete KYC to start investing</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('../profilesettings/kyc')}
                  style={{ backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                >
                  <Text className="text-white text-sm font-semibold">Verify</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          )}

          {/* Marketplace Section */}
          {!isGuest && isAuthenticated && (
            <View className="mt-6 mb-4">
              <View className="flex-row items-center justify-between px-5 mb-4">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">Marketplace</Text>
                  <Text className="text-white/55 text-sm">Buy & sell property tokens</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/marketplace')}>
                  <Text className="text-[#9EDC5A] text-sm font-semibold">View All</Text>
                </TouchableOpacity>
              </View>
              <MarketplacePreviewRow limit={6} />
            </View>
          )}

          
            <GuidanceCard />
          


          {/* Additional Sections (preserved for tour) */}
          {featured.length > 0 && (
            <View className="mt-6 mb-4">
              <CopilotStep
                text={TOUR_STEPS.HOME.PROPERTY_CARD.text}
                order={TOUR_STEPS.HOME.PROPERTY_CARD.order}
                name={TOUR_STEPS.HOME.PROPERTY_CARD.name}
              >
                <CopilotView>
                  <FeaturedSection featured={featured.slice(0, 2)} />
                </CopilotView>
              </CopilotStep>
            </View>
          )}

          {affordable.length > 0 && <AffordableSection affordable={affordable} />}
          {/* {midRange.length > 0 && <InvestmentSection title="Mid-Range Investments" data={midRange} />} */}
          
          {!isGuest && (
            <View className="mt-6 mb-4">
              <CopilotStep
                text={TOUR_STEPS.HOME.GUIDANCE_CARD.text}
                order={TOUR_STEPS.HOME.GUIDANCE_CARD.order}
                name={TOUR_STEPS.HOME.GUIDANCE_CARD.name}
              >
                <CopilotView>
                 
                </CopilotView>
              </CopilotStep>
            </View>
          )}

        
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default BlocksHomeScreen;
