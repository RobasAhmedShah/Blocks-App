import React, { useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import FeaturedSection, { Stat as FeaturedStat} from "@/components/home/FeaturedSection";
import AffordableSection from "@/components/home/AffordableSection";
import InvestmentSection from "@/components/home/InvestmentSection";
import CTAButton from "@/components/home/CTAButton";
import GuidanceCard from "@/components/home/GuidanceCard";
import { useColorScheme } from "@/lib/useColorScheme";
import { useApp } from "@/contexts/AppContext";
import { Property } from "@/types/property";
import { CopilotStep, useCopilot } from "react-native-copilot";
import { CustomTooltip } from "@/components/tour/CustomTooltip";
import { CopilotView, CopilotTouchableOpacity } from "@/components/tour/walkthroughable";
import { useTour } from "@/contexts/TourContext";
import { TOUR_STEPS } from "@/utils/tourHelpers";
import { useKycCheck } from "@/hooks/useKycCheck";

const { width, height } = Dimensions.get("window");

// Subtle grid pattern that doesn't overwhelm - matches portfolio aesthetic
const SubtlePattern = ({ isDark }: { isDark: boolean }) => (
  <Svg
    height="100%"
    width="100%"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: isDark ? 0.4 : 0.3,
    }}
    preserveAspectRatio="xMidYMid slice"
  >
    <Defs>
      <Pattern
        id="subtleGrid"
        patternUnits="userSpaceOnUse"
        width="80"
        height="80"
      >
        {/* Horizontal line */}
        <Rect 
          x="0" 
          y="0" 
          width="80" 
          height="3" 
          fill={isDark ? "rgb(80, 74, 74)" : "rgba(0, 0, 0, 0.6)"}
        />
        {/* Vertical line */}
        <Rect 
          x="0" 
          y="0" 
          width="3" 
          height="80" 
          fill={isDark ? "rgb(80, 74, 74)" : "rgba(22, 163, 74, 0.6)"}
        />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#subtleGrid)" />
  </Svg>
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
  
  // Create ref for ScrollView only
  // NOTE: We don't create refs for tour steps - walkthroughable handles refs internally
  const scrollViewRef = useRef<any>(null);
  
  // Register ScrollView ref with context
  useEffect(() => {
    if (scrollViewRef.current) {
      setScrollViewRef(scrollViewRef);
    }
  }, [setScrollViewRef]);

  // Refresh wallet balance and KYC status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // CRITICAL: Don't reload wallet during active tour!
      if (isTourActive) {
        console.log('[HomeScreen] Skipping wallet reload - tour is active');
        return;
      }
      
      loadWallet();
      // Refresh KYC in background (cached data shows immediately)
      loadKycStatus(false);
    }, [loadWallet, loadKycStatus, isTourActive])
  );
  
  // Check for shouldStartTour when screen comes into focus (for replay button)
  // REMOVED: This was causing duplicate tour starts. useLayoutEffect handles it.

  // Auto-start tour logic - use useLayoutEffect to ensure layout is ready
  useLayoutEffect(() => {
    const checkAndStartTour = async () => {
      // CRITICAL: Don't start if tour is already active!
      if (isTourActive) {
        console.log('[HomeScreen] Tour already active, skipping start check');
        return;
      }

      const firstLaunch = await isFirstLaunch();
      const tourDone = await isTourCompleted('home');
      
      console.log('[HomeScreen] Tour check:', { 
        firstLaunch, 
        tourDone, 
        shouldStartTour,
        isTourActive 
      });
      
      // FIX: Check shouldStartTour FIRST (highest priority)
      // This allows manual replay from Profile button
      const shouldStart = shouldStartTour || (!tourDone && firstLaunch);
      
      if (shouldStart) {
        console.log('[HomeScreen] Starting tour... Reason:', {
          manualReplay: shouldStartTour,
          firstLaunch: !tourDone && firstLaunch,
        });
        
        // Use longer delay to ensure screen is fully rendered and CopilotProvider is ready
        setTimeout(() => {
          console.log('[HomeScreen] Calling start() now...');
          setIsTourActive(true);
          try {
            start();
            console.log('[HomeScreen] start() called successfully');
          } catch (error) {
            console.error('[HomeScreen] Error calling start():', error);
          }
          setShouldStartTour(false); // Reset flag after starting
        }, 800); // Increased delay to ensure everything is ready
      } else {
        console.log('[HomeScreen] Not starting tour:', {
          shouldStartTour,
          tourDone,
          firstLaunch,
          isTourActive,
        });
      }
    };
    
    checkAndStartTour();
  }, [start, shouldStartTour, setShouldStartTour, isTourActive, setIsTourActive, isFirstLaunch, isTourCompleted]);

  // Tour event listeners
  useEffect(() => {
    const handleStart = () => {
      console.log('[HomeScreen] 🚀 Tour STARTED');
      setIsTourActive(true);
    };

    const handleStop = async () => {
      console.log('[HomeScreen] 🛑 Tour STOPPED');
      setIsTourActive(false); // CRITICAL: Set inactive when tour stops
      await markTourCompleted('home');
    };
    
    const handleStepChange = (step: any) => {
      console.log('[HomeScreen] 📍 Step changed:', step?.name, 'Order:', step?.order);
      // FIX: Don't use JSON.stringify on step object - it has circular references
      // Log only the properties we need
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
        // AUTO-SCROLL TO STEP using wrapperRef from step object
        // react-native-copilot provides wrapperRef in the step object
        if (step?.wrapperRef?.current && scrollViewRef.current) {
          setTimeout(() => {
            try {
              step.wrapperRef.current.measureLayout(
                scrollViewRef.current,
                (x: number, y: number, width: number, height: number) => {
                  console.log(`[HomeScreen] Scrolling to ${step.name}:`, { x, y, width, height });
                  const screenHeight = Dimensions.get('window').height;
                  const centerOffset = (screenHeight / 2) - (height / 2);
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
          }, 200); // Delay to ensure tooltip is rendered
        } else {
          console.warn(`[HomeScreen] Cannot scroll - missing refs for step: ${step.name}`, {
            hasWrapperRef: !!step?.wrapperRef?.current,
            hasScrollViewRef: !!scrollViewRef.current,
          });
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
  
  // Filter properties based on user's purchase power
  const { affordable, featured, midRange } = useMemo(() => {
    const allProperties = state.properties.filter(
      (p) => p.totalTokens > 0 && p.soldTokens < p.totalTokens // Only available properties
    );
    
    // If user has no balance, show default properties (all properties)
    if (balance <= 0) {
      return {
        affordable: allProperties
          .sort((a, b) => a.tokenPrice - b.tokenPrice)
          .slice(0, 2)
          .map((property) => ({
            id: property.id,
            name: property.title,
            entry: `$${(property.minInvestment/10).toFixed(2)}`,
            roi: `${property.estimatedROI}%`,
            image: property.images?.[0] || '',
          })),
        featured: allProperties
          .sort((a, b) => b.estimatedROI - a.estimatedROI)
          .slice(0, 2)
          .map((property) => ({
            id: property.id,
            title: property.title,
            roi: `${property.estimatedROI}%`,
            funded: `${Math.round((property.soldTokens / property.totalTokens) * 100)}%`,
            minInvestment: `$${(property.minInvestment/10).toFixed(2) || (property.tokenPrice/10).toFixed(2)}`,
            image: property.images?.[0] || '',
          })),
        midRange: allProperties
          .filter((p) => {
            // Mid-range: properties between 30% and 100% of average property price
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
            path: "M0,30 Q25,20 50,25 T100,30", // Simple path for chart
          })),
      };
    }
    
    // User has balance - filter by affordability
    // Affordable: Properties where user can buy at least 1 token (tokenPrice <= balance)
    const affordableProperties = allProperties.filter(
      (p) => p.tokenPrice <= balance
    );
    
    // Featured: High ROI properties user can afford (can buy at least 0.1 tokens)
    const featuredProperties = allProperties.filter(
      (p) => balance >= p.tokenPrice * 0.1 // Can buy at least 0.1 tokens
    );
    
    // Mid-range: Properties where user can buy 0.1 to 1 tokens (balance * 0.1 <= tokenPrice <= balance)
    const midRangeProperties = allProperties.filter(
      (p) => p.tokenPrice >= balance * 0.1 && p.tokenPrice <= balance
    );
    
    return {
      affordable: affordableProperties
        .sort((a, b) => a.tokenPrice - b.tokenPrice)
        .slice(0, 2)
        .map((property) => ({
          id: property.id,
          name: property.title,
          entry: `$${(property.tokenPrice/10).toFixed(2)}`,
          roi: `${property.estimatedROI}%`,
          image: property.images?.[0] || '',
        })),
      featured: featuredProperties
        .sort((a, b) => b.estimatedROI - a.estimatedROI)
        .slice(0, 2)
        .map((property) => ({
          id: property.id,
          title: property.title,
          roi: `${property.estimatedROI}%`,
          funded: `${Math.round((property.soldTokens / property.totalTokens) * 100)}%`,
          minInvestment: `$${(property.minInvestment/10).toFixed(2) || (property.tokenPrice/10).toFixed(2)}`,
          image: property.images?.[0] || '',
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
          path: "M0,30 Q25,20 50,25 T100,30", // Simple path for chart
        })),
    };
  }, [balance, state.properties, isTourActive]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Parallax animations
  const heroParallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 300],
      [0, -50],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 300],
      [1, 0.95],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 200, 300],
      [1, 0.7, 0.3],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const headerParallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -30],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const contentParallaxStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 300],
      [50, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }],
    };
  });


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Linear Gradient Background - 40% green top, black bottom */}
      <LinearGradient
        colors={isDarkColorScheme 
          ? [
              '#00C896',           // Teal green (top)
              '#064E3B',           // Deep emerald (40% mark)
              '#032822',
              '#021917',
            ]
          : [
            '#F5F5F5', // Smoky light gray
            '#EDEDED', // Soft ash
            '#E0E0E0', // Gentle gray
            '#FFFFFF'  // Pure white
            ]
        }
        locations={[0, 0.4, 0.7, 1]}  // 40% green, then transition to black
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Grid pattern background - visible in both modes */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <SubtlePattern isDark={isDarkColorScheme} />
      </View>

      {/* Scrollable content with parallax */}
      <Animated.ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Header with parallax */}
        <Animated.View 
          style={[
            headerParallaxStyle,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              paddingTop: 48,
              backgroundColor: 'transparent',
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="apps" size={28} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>Blocks</Text>
          </View>
          <CopilotStep
            text={TOUR_STEPS.HOME.PORTFOLIO_BALANCE.text}
            order={TOUR_STEPS.HOME.PORTFOLIO_BALANCE.order}
            name={TOUR_STEPS.HOME.PORTFOLIO_BALANCE.name}
          >
            <CopilotView 
              style={{
                // backgroundColor: `${colors.warning}${isDarkColorScheme ? '30' : '20'}`,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: `${colors.warning}${isDarkColorScheme ? '50' : '40'}`,
              }}
            >
              <CopilotTouchableOpacity
               onPress={() => router.push('./wallet')}>
              <Text style={{ color: colors.warning, fontSize: 16, fontWeight: 'bold' }}>
                ${balance.toFixed(2)}
              </Text>
              </CopilotTouchableOpacity>
            </CopilotView>
          </CopilotStep>
        </Animated.View>

        {/* KYC Verification Alert - only shows when not submitted, disappears after submission */}
        {kycStatus && kycStatus.status === 'not_submitted' && (
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              marginBottom: 8,
              backgroundColor: isDarkColorScheme 
                ? 'rgba(245, 158, 11, 0.15)' 
                : 'rgba(245, 158, 11, 0.1)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(245, 158, 11, 0.3)' 
                : 'rgba(245, 158, 11, 0.4)',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDarkColorScheme 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(245, 158, 11, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                Verify Your Identity
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                Complete KYC verification to start investing and unlock all features
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('../profilesettings/kyc')}
              style={{
                backgroundColor: '#F59E0B',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                }}
              >
                Verify Now
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hero Section - Typography Focus with Parallax */}
        <Animated.View 
          style={[
            heroParallaxStyle,
            {
              paddingTop: 48,
              paddingBottom: 64,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
            }
          ]}
        >
       

          {/* Oversized Typography */}
          <View style={{ alignItems: 'center', zIndex: 10 }}>
      
            <Text 
              style={{
                color: colors.textPrimary,
                fontSize: 14,
                fontWeight: 'bold',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Real Estate. Reimagined.
            </Text>

          
            <View style={{ marginBottom: 8 }}>
              <Text 
                style={{
                  color: colors.textPrimary,
                  fontSize: 60,
                  fontWeight: '900',
                  textAlign: 'center',
                  lineHeight: 64,
                  letterSpacing: -2,
                }}
              >
                Build Your
              </Text>
            </View>
            
            <View style={{ position: 'relative' }}>
              <Text 
                style={{
                  color: colors.primary,
                  fontSize: 60,
                  fontWeight: '900',
                  textAlign: 'center',
                  lineHeight: 64,
                  letterSpacing: -2,
                }}
              >
                Future
              </Text>
            </View>

        
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <Text 
                style={{
                  color: colors.textPrimary,
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 32,
                  letterSpacing: -0.5,
                }}
              >
                Block by Block
              </Text>
              <LinearGradient
                colors={[colors.primary, colors.primarySoft, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: 120,
                  height: 4,
                  borderRadius: 2,
                  marginTop: 8,
                }}
              />
            </View>

     
            <Text 
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                textAlign: 'center',
                lineHeight: 24,
                marginTop: 32,
                maxWidth: 400,
              }}
            >
              Invest in tokenized real estate with as little as{' '}
              <Text style={{ fontWeight: 'bold', color: colors.primary }}>$10</Text>
              . Own fractional shares of premium properties worldwide.
            </Text>

            {/* Minimal stats */}
            <CopilotStep
              text={TOUR_STEPS.HOME.STATS_SECTION.text}
              order={TOUR_STEPS.HOME.STATS_SECTION.order}
              name={TOUR_STEPS.HOME.STATS_SECTION.name}
            >
              <CopilotView 
                style={{ flexDirection: 'row', gap: 32, marginTop: 40 }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary }}>50+</Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: colors.textPrimary, 
                    textTransform: 'uppercase', 
                    letterSpacing: 1, 
                    marginTop: 4 
                  }}>
                    Properties
                  </Text>
                </View>
                <View style={{ width: 1, height: 48, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary }}>$2M+</Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: colors.textPrimary, 
                    textTransform: 'uppercase', 
                    letterSpacing: 1, 
                    marginTop: 4 
                  }}>
                    Invested
                  </Text>
                </View>
                <View style={{ width: 1, height: 48, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 30, fontWeight: '900', color: colors.primary }}>12%</Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: colors.textPrimary, 
                    textTransform: 'uppercase', 
                    letterSpacing: 1, 
                    marginTop: 4 
                  }}>
                    Avg ROI
                  </Text>
                </View>
              </CopilotView>
            </CopilotStep>
          </View>
        </Animated.View>

        {/* Content sections with smooth entrance */}
        <Animated.View style={[contentParallaxStyle]}>
          {/* Guidance Card - Step 4 - Must be rendered AFTER Property Cards for correct order */}
          <CopilotStep
            text={TOUR_STEPS.HOME.GUIDANCE_CARD.text}
            order={TOUR_STEPS.HOME.GUIDANCE_CARD.order}
            name={TOUR_STEPS.HOME.GUIDANCE_CARD.name}
          >
            <CopilotView>
              <GuidanceCard />
            </CopilotView>
          </CopilotStep>
          
          {/* Property Cards - Step 3 - Must be rendered BEFORE Guidance Card for correct order */}
          {/* Property Cards - Always render CopilotStep even if no featured properties */}
          <CopilotStep
            text={TOUR_STEPS.HOME.PROPERTY_CARD.text}
            order={TOUR_STEPS.HOME.PROPERTY_CARD.order}
            name={TOUR_STEPS.HOME.PROPERTY_CARD.name}
          >
            <CopilotView>
              {featured.length > 0 ? (
                <FeaturedSection featured={featured} />
              ) : (
                <View style={{ minHeight: 200, padding: 20 }}>
                  <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                    No featured properties available
                  </Text>
                </View>
              )}
            </CopilotView>
          </CopilotStep>
          
          
          
          
          {affordable.length > 0 && <AffordableSection affordable={affordable} />}
          {midRange.length > 0 && <InvestmentSection title="Mid-Range Investments" data={midRange} />}
          <CTAButton />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

export default BlocksHomeScreen;