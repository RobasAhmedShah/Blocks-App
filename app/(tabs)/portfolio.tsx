import React, { useRef, useEffect } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { usePortfolio } from "@/services/usePortfolio";
import { PropertyCardStack } from "@/components/PropertyCard";
import { useColorScheme } from "@/lib/useColorScheme";
import { useNotificationContext } from "@/contexts/NotificationContext";
import ArcLoader from "@/components/EmeraldLoader";
import { SavedPlansSection } from "@/components/portfolio/SavedPlansSection";
import { useWalkthroughStep, useWalkthrough as useWalkthroughLib } from '@/react-native-interactive-walkthrough/src/index';
import { TooltipOverlay } from '@/components/walkthrough/TooltipOverlay';
import { useWalkthrough } from '@/contexts/WalkthroughContext';

export default function PortfolioScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const {
    investments,
    totalValue,
    totalROI,
    monthlyRentalIncome,
    loading,
    loadInvestments,
  } = usePortfolio();
  const { portfolioUnreadCount } = useNotificationContext();
  const { isWalkthroughCompleted, markWalkthroughCompleted } = useWalkthrough();
  
  // Refs for walkthrough elements
  const portfolioValueRef = useRef<View>(null);
  const roiBadgeRef = useRef<View>(null);
  const overviewCardsRef = useRef<View>(null);
  const totalEarningsCardRef = useRef<View>(null);
  const thisMonthCardRef = useRef<View>(null);
  const performanceSummaryRef = useRef<View>(null);
  const savedPlansRef = useRef<View>(null);
  const propertyCardsRef = useRef<View>(null);
  const bottomActionsRef = useRef<View>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Track Y positions of sections for scrolling
  const sectionPositions = useRef<{ [key: string]: number }>({});
  
  // Track if walkthrough has been started
  const walkthroughStartedRef = useRef(false);
  
  // Track if we're currently measuring to prevent infinite loops
  const measuringRef = useRef<{ [key: string]: boolean }>({});
  const measureTimeoutRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> | null }>({});
  
  // Helper function to scroll to a section and re-measure mask
  const scrollToSection = (sectionKey: string, offset: number = 0, measureMaskFn?: () => void) => {
    const position = sectionPositions.current[sectionKey];
    
    // Clear any existing timeout for this section to prevent multiple calls
    if (measureTimeoutRef.current[sectionKey]) {
      clearTimeout(measureTimeoutRef.current[sectionKey]!);
      measureTimeoutRef.current[sectionKey] = null;
    }
    
    // Prevent multiple simultaneous scrolls/measurements for the same section
    if (position !== undefined && flatListRef.current && !measuringRef.current[sectionKey]) {
      measuringRef.current[sectionKey] = true;
      
      const scrollTimeout = setTimeout(() => {
        if (!flatListRef.current) {
          measuringRef.current[sectionKey] = false;
          return;
        }
        
        flatListRef.current.scrollToOffset({ 
          offset: Math.max(0, position - offset), 
          animated: true 
        });
        
        // Re-measure mask after scroll animation completes
        // First measurement after scroll settles
        if (measureMaskFn && !measuringRef.current[`${sectionKey}_measured`]) {
          // Measure multiple times to ensure accurate positioning after scroll
          measureTimeoutRef.current[sectionKey] = setTimeout(() => {
            if (measuringRef.current[`${sectionKey}_measured`]) {
              measuringRef.current[sectionKey] = false;
              return;
            }
            
            try {
              // First measurement
              measureMaskFn();
              
              // Second measurement after a short delay to ensure accuracy
              setTimeout(() => {
                try {
                  measureMaskFn();
                } catch (error) {
                  console.error('Error in second mask measurement:', error);
                }
              }, 200);
              
            } catch (error) {
              console.error('Error measuring mask:', error);
            }
            
            measuringRef.current[`${sectionKey}_measured`] = true;
            
            // Reset after a delay to allow future measurements if needed
            measureTimeoutRef.current[sectionKey] = setTimeout(() => {
              measuringRef.current[sectionKey] = false;
              measuringRef.current[`${sectionKey}_measured`] = false;
              measureTimeoutRef.current[sectionKey] = null;
            }, 1000);
          }, 700); // Wait for scroll animation + some buffer
        } else {
          measuringRef.current[sectionKey] = false;
        }
      }, 300);
      
      measureTimeoutRef.current[`${sectionKey}_scroll`] = scrollTimeout;
    }
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(measureTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);
  
  // Helper function to store section position
  const storeSectionPosition = (sectionKey: string, y: number) => {
    sectionPositions.current[sectionKey] = y;
  };

  // Refresh investments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (loadInvestments) {
        loadInvestments();
      }
    }, [loadInvestments])
  );
  
  // Get start function from walkthrough context
  const { isReady: isPortfolioReady, isWalkthroughOn, goTo } = useWalkthroughLib();
  
  // Walkthrough Step 1: Portfolio Value
  const { onLayout: onPortfolioValueLayout, step: portfolioValueStep } = useWalkthroughStep({
    number: 4,
    identifier: 'portfolio-value-step',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Your Portfolio Value"
        description="This shows your total investment value across all properties. This is the sum of all your property investments."
        position="bottom"
        isFirstStep={true}
        isLastStep={false}
      />
    ),
    layoutLock: true,
    onStart: () => {
      scrollToSection('portfolioValue', 150, portfolioValueStep?.measureMask);
    },
  });
  
  // Walkthrough Step 2: ROI Badge
  const { onLayout: onROIBadgeLayout, step: roiBadgeStep } = useWalkthroughStep({
    number: 5,
    identifier: 'portfolio-roi-badge',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Return on Investment"
        description="This percentage shows your overall ROI across all investments. A positive percentage means your portfolio is growing!"
        position="bottom"
        isFirstStep={false}
        isLastStep={false}
      />
    ),
    layoutLock: true,
    onStart: () => {
      scrollToSection('portfolioValue', 150, roiBadgeStep?.measureMask);
    },
  });
  
  // Walkthrough Step 3: Overview Cards Section
  const { onLayout: onOverviewCardsLayout, step: overviewCardsStep } = useWalkthroughStep({
    number: 6,
    identifier: 'portfolio-overview-cards',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Portfolio Overview Cards"
        description="These cards show key metrics: Total Earnings (all-time profits), This Month (current month performance), Total Invested (your capital), and Next Payout (when you'll receive rental income)."
        position="bottom"
        isFirstStep={false}
        isLastStep={false}
      />
    ),
    layoutLock: true,
  });
  
  // Walkthrough Step 4: Performance Summary
  const { onLayout: onPerformanceSummaryLayout, step: performanceSummaryStep } = useWalkthroughStep({
    number: 7,
    identifier: 'portfolio-performance-summary',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Performance Summary"
        description="Track your investment performance here. See your average monthly return, which property is performing best, and how many active properties you own."
        position="bottom"
        isFirstStep={false}
        isLastStep={false}
      />
    ),
    layoutLock: true,
    layoutAdjustments: {
      addPadding: 0,
      addY: 0
    },
    onFinish: () => {
      // Scroll down to show Property Cards section after user clicks "Next"
      if (flatListRef.current) {
        const propertyCardsPosition = sectionPositions.current['propertyCards'];
        if (propertyCardsPosition !== undefined) {
          // Scroll to position Property Cards higher on screen to leave room for tooltip above
          flatListRef.current.scrollToOffset({ 
            offset: Math.max(0, propertyCardsPosition - 250), // Increased offset to position higher, leaving room for tooltip
            animated: true 
          });
        }
      }
    },
  });
  
  // Walkthrough Step 5: Property Cards
  const { onLayout: onPropertyCardsLayout, step: propertyCardsStep } = useWalkthroughStep({
    number: 8,
    identifier: 'portfolio-property-cards',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Your Property Investments"
        description="These are all the properties you've invested in. Tap any card to view detailed information, download certificates, and track individual property performance."
        position="bottom"
        isFirstStep={false}
        isLastStep={false}
      />
    ),
    layoutLock: true,
    layoutAdjustments: {
      addPadding: 8,
      addHeight: 90,
      addY: -560,
      addX: -10,
    },
    onStart: () => {
      // Wait for scroll from previous step to complete, then measure mask
      setTimeout(() => {
        try {
          propertyCardsStep?.measureMask?.();
        } catch (error) {
          console.error('Error measuring property cards mask:', error);
        }
      }, 800); // Wait for scroll animation to complete
    },
  });
  
  // Walkthrough Step 6: Saved Plans Section
  const { onLayout: onSavedPlansLayout, step: savedPlansStep } = useWalkthroughStep({
    number: 9,
    identifier: 'portfolio-saved-plans',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Saved Investment Plans"
        description="View and manage your saved investment plans here. These are properties you've bookmarked or are planning to invest in later."
        position="bottom"
        isFirstStep={false}
        isLastStep={false}
      />
    ),
    layoutLock: true,
    layoutAdjustments: {
      // addPadding: 12, // Subtle padding for better visual highlight
    },
    onStart: () => {
      // Scroll to Saved Plans section to ensure it's visible
      if (flatListRef.current && savedPlansRef.current) {
        const savedPlansPosition = sectionPositions.current['savedPlans'];
        if (savedPlansPosition !== undefined) {
          // Scroll to position Saved Plans section with enough space above for tooltip
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ 
              offset: Math.max(0, savedPlansPosition - 200), // 200px offset to leave room for tooltip above
              animated: true 
            });
            // Re-measure mask after scroll completes
            setTimeout(() => {
              try {
                savedPlansStep?.measureMask?.();
              } catch (error) {
                console.error('Error measuring saved plans mask:', error);
              }
            }, 600);
          }, 300);
        } else {
          // Fallback: just measure if position not available
          setTimeout(() => {
            try {
              savedPlansStep?.measureMask?.();
            } catch (error) {
              console.error('Error measuring saved plans mask:', error);
            }
          }, 300);
        }
      }
    },
  });
  
  // Walkthrough Step 7: Bottom Actions
  const { onLayout: onBottomActionsLayout, step: bottomActionsStep } = useWalkthroughStep({
    number: 10,
    identifier: 'portfolio-bottom-actions',
    OverlayComponent: (props) => (
      <TooltipOverlay
        {...props}
        title="Quick Actions"
        description="Use these buttons to: Deposit funds into your wallet, View your assets in detail, or Access investment guidance and educational resources."
        position="top"
        isFirstStep={false}
        isLastStep={true}
        onFinish={async () => {
          await markWalkthroughCompleted('PORTFOLIO');
        }}
      />
    ),
    layoutLock: true,
    onStart: () => {
      // Scroll to bottom actions when this step starts
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
          // Re-measure mask after scroll animation completes
          setTimeout(() => {
            bottomActionsStep?.measureMask?.();
          }, 600);
        }, 300);
      }
    },
    onFinish: async () => {
      await markWalkthroughCompleted('PORTFOLIO');
    },
  });
  
  // Auto-start walkthrough on first visit to portfolio tab
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const checkAndStartWalkthrough = async () => {
      if (walkthroughStartedRef.current || isWalkthroughOn || !isPortfolioReady || loading) {
        return;
      }
      
      try {
        const completed = await isWalkthroughCompleted('PORTFOLIO');
        
        if (isMounted && !completed && !walkthroughStartedRef.current) {
          walkthroughStartedRef.current = true;
          timeoutId = setTimeout(() => {
            if (isMounted && !isWalkthroughOn && isPortfolioReady) {
              // Start at step 5 (first portfolio step)
              goTo(5);
            }
          }, 800);
        }
      } catch (error) {
        console.error('Error checking portfolio walkthrough status:', error);
      }
    };
    
    if (isPortfolioReady && !loading) {
      checkAndStartWalkthrough();
    }
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPortfolioReady, loading]);

  // Loading state
  if (loading || !investments) {
    return (
      <View className="flex-1 items-center justify-center"
      style={{ backgroundColor: colors.background }}>
      <ArcLoader size={46} color={colors.primary} />
    </View>
    );
  }

  // Calculate stats
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalEarnings = totalValue - totalInvested;
  const averageMonthly = monthlyRentalIncome;
  const thisMonthEarnings = monthlyRentalIncome * 1.12; // Simulated 12% growth
  const nextPayoutDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  // Find best performing property
  const bestProperty = investments.reduce((best, current) => 
    current.roi > (best?.roi || 0) ? current : best
  , investments[0]);

  const renderHeader = () => (
    <>
      {/* Header */}
      <View 
        style={{ 
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : colors.background,
          borderBottomWidth: isDarkColorScheme ? 0 : 1,
          borderBottomColor: colors.border,
        }}
        className="px-4 pt-12 pb-4"
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2">
            <Text style={{ color: colors.textSecondary }} className="text-sm font-medium">
              Total Portfolio Value
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              router.push({
                pathname: '/notifications',
                params: { context: 'portfolio' },
              } as any);
            }}
            className="p-2"
            style={{ position: 'relative' }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            {portfolioUnreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: colors.destructive,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                  borderWidth: 2,
                  borderColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.95)' : colors.background,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                  {portfolioUnreadCount > 99 ? '99+' : portfolioUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
              
        <View 
          ref={portfolioValueRef}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            storeSectionPosition('portfolioValue', y);
            onPortfolioValueLayout(event);
          }}
          className="flex-row justify-between items-center mb-2"
        >
          <Text style={{ color: colors.textPrimary }} className="text-4xl font-bold">
            $
            {totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <View 
            ref={roiBadgeRef}
            onLayout={onROIBadgeLayout}
            style={{ 
              backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)' 
            }}
            className="px-3 py-1.5 rounded-full flex-row items-center"
          >
            <Ionicons name="arrow-up" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="text-sm font-semibold ml-1">
              +{totalROI.toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-xs text-right">
          ${monthlyRentalIncome.toFixed(2)} Monthly Rental Income
        </Text>
      </View>

      {/* Stats Overview Cards */}
      <View 
        ref={overviewCardsRef}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          storeSectionPosition('overviewCards', y);
          onOverviewCardsLayout(event);
        }}
        className="px-4 mt-6"
      >
        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
          Overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          {/* Total Earnings Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.08)',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.3)' : 'rgba(22, 163, 74, 0.2)',
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <View
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.3)' : 'rgba(22, 163, 74, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                  All Time
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Total Earnings
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* This Month Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="calendar" size={20} color="#10B981" />
              <View
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>
                  +12%
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              This Month
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${thisMonthEarnings.toFixed(2)}
            </Text>
          </View>

          {/* Total Invested Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="wallet" size={20} color="#3B82F6" />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Total Invested
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' }}>
              ${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Next Payout Card */}
          <View
            style={{
              flex: 1,
              minWidth: '47%',
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>
              Next Payout
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold' }}>
              {nextPayoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>
              ~${averageMonthly.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Summary */}
      <View 
        ref={performanceSummaryRef}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          storeSectionPosition('performanceSummary', y);
          onPerformanceSummaryLayout(event);
        }}
        className="px-4 mt-6"
      >
        <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
          Performance Summary
        </Text>
        <View
          style={{
            backgroundColor: isDarkColorScheme ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
          }}
        >
          <View className="flex-row items-center mb-3">
            <Ionicons name="trending-up" size={20} color="#8B5CF6" />
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
              Monthly Highlights
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Average Monthly Return
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              ${averageMonthly.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Best Performer
            </Text>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
              {bestProperty?.property.title || 'N/A'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Active Properties
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
              {investments.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Properties Header */}
      <View className="px-4 mb-2 mt-6">
        <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
          Your Properties
        </Text>
      </View>

      {/* Overlapping Property Cards */}
      <View 
        ref={propertyCardsRef}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          storeSectionPosition('propertyCards', y);
          onPropertyCardsLayout(event);
        }}
        className="px-4 mb-6"
      >
        <PropertyCardStack data={investments} />
      </View>

      {/* Saved Plans Section */}
      <View 
        ref={savedPlansRef}
        onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          storeSectionPosition('savedPlans', y);
          onSavedPlansLayout(event);
        }}
      >
        <SavedPlansSection />
      </View>
    </>
  );

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      <FlatList
        ref={flatListRef}
        data={[]}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCardStack data={[item]} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Bottom Actions */}
      <View 
        ref={bottomActionsRef}
        onLayout={onBottomActionsLayout}
        className="mb-16 left-0 right-0 z-10 px-4 pb-6"
      >
        <View
          style={{
            backgroundColor: isDarkColorScheme 
              ? 'rgba(11, 61, 54, 0.95)' 
              : '#FFFFFF',
            borderWidth: isDarkColorScheme ? 0 : 1,
            borderColor: colors.border,
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
            <Ionicons name="add" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
              Deposit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/portfolio/myassets/assets-first')}
            className="flex-col items-center justify-center p-2 flex-1"
          >
            <Ionicons name="cube" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
             My Assets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('../portfolio/guidance/guidance-one')}
            className="flex-col items-center justify-center p-2 flex-1"
          >
            <Ionicons name="document-text-outline" size={24} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium mt-0.5">
              Guidance
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}