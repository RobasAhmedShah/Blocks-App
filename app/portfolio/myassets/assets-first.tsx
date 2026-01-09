import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ViewToken,
  Animated,
  PanResponder,
  BackHandler,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePortfolio } from '@/services/usePortfolio';
import { PropertyCard } from '@/components/assets/PropertyCard';
import { AssetDetailModal } from '@/components/assets/AssetDetailModal';
import { ASSETS_CONSTANTS } from '@/components/assets/constants';
import { formatCurrency } from '@/components/assets/utils';
import EmeraldLoader from '@/components/EmeraldLoader';
import { useKycCheck } from '@/hooks/useKycCheck';

const { SCREEN_HEIGHT, CARD_WIDTH, SPACING } = ASSETS_CONSTANTS;

export default function AssetsFirstScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ id?: string; propertyId?: string }>();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { investments, loading } = usePortfolio();
  const { isVerified, handleInvestPress } = useKycCheck();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolledToProperty, setHasScrolledToProperty] = useState(false);
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

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isModalVisible) {
        closeModal();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isModalVisible]);

  // Scroll to specific property when navigating from confirmation screen
  useEffect(() => {
    if (!loading && investments.length > 0 && (routeParams.id || routeParams.propertyId) && !hasScrolledToProperty) {
      // Find the investment index that matches the property ID
      const propertyId = routeParams.propertyId || routeParams.id;
      const investmentIndex = investments.findIndex(
        (inv) => inv.property?.id === propertyId
      );

      if (investmentIndex !== -1 && investmentIndex !== activeIndex) {
        setActiveIndex(investmentIndex);
        setHasScrolledToProperty(true);

        // Scroll to the investment after a short delay to ensure FlatList is ready
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: investmentIndex,
            animated: true,
            viewPosition: 0.5, // Center the item
          });
        }, 300);
      } else if (investmentIndex === -1) {
        // Property not found, mark as scrolled to prevent infinite loops
        setHasScrolledToProperty(true);
      }
    }
  }, [loading, investments, routeParams.id, routeParams.propertyId, activeIndex, hasScrolledToProperty]);

  // Pan responder for swipe down to close modal
  const modalPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
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
        message: `Check out my investment in ${property.title}! 🏢\n\nOwnership: ${ownershipPercentage}%\nCurrent Value: ${formatCurrency(investment.currentValue)}\nROI: ${investment.roi.toFixed(1)}%\n\nInvest in real estate with Blocks!`,
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
        message: `📊 My Investment Performance:\n\n🏢 ${prop.title}\n📍 ${prop.location}\n\n💰 Current Value: ${formatCurrency(selectedInvestment.currentValue)}\n📈 ROI: ${selectedInvestment.roi.toFixed(1)}%\n💵 Monthly Income: $${selectedInvestment.monthlyRentalIncome.toFixed(2)}\n🎯 Ownership: ${ownershipPercentage}%\n\nInvest in real estate with Blocks!`,
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

  const renderItem = ({ item }: { item: any }) => {
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
      <View className="flex-row justify-center items-center py-2 gap-2">
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

  if (loading) {
    return (
      <View 
        className="flex-1 justify-center items-center px-8"
        style={{ backgroundColor: colors.background }} >
      <EmeraldLoader size={48} color={colors.primary} />
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

 

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1">
        {/* Fixed Header */}
        <View 
          className="flex-row justify-between items-center px-6 mt-[1rem] h-[10vh]"
          style={{ 
            backgroundColor: colors.background,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
            <TouchableOpacity 
            onPress={() => router.push('/portfolio')} 
            className="flex-row items-center"
            style={{ flex: 1 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text 
              className="text-lg w-full text-center font-semibold"
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

        {/* Content Area - with padding for fixed header */}
        <View className="flex-1" style={{ paddingTop: 20, marginTop: 26 }}>
        {/* Carousel */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',height: '200%' }}>
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
              justifyContent: 'center',
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + SPACING * 2,
              offset: (CARD_WIDTH + SPACING * 2) * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              // Handle scroll to index failure gracefully
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            />
        </View>

        {/* Pagination Dots */}
        {renderDots()}

        {/* Action Buttons */}
        <View className="flex-row px-4 pt-2 pb-2 gap-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl"
              style={{ backgroundColor: colors.primary }}
            onPress={() => {
              if (currentInvestment) {
                handleInvestPress(() => {
                  // Navigate to invest screen instead of showing modal
                  router.push({
                    pathname: `/invest/${currentInvestment.property.id}` as any,
                  });
                });
              }
            }}
              activeOpacity={0.8}
            >
            <Ionicons name="add-circle" size={24} color={colors.primaryForeground} />
            <Text 
              className="text-[15px] font-semibold"
              style={{ color: colors.primaryForeground }}
            >
                {isVerified ? 'Invest More':'Submit KYC to Invest More'}
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
        <View className="flex-row items-center justify-center gap-2 py-2">
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          <Text 
            className="text-[13px] font-medium"
            style={{ color: colors.textMuted }}
          >
              Swipe to navigate
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
                  </View>
                </SafeAreaView>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        visible={isModalVisible}
        investment={selectedInvestment}
        colors={colors} 
        isDarkColorScheme={isDarkColorScheme}
        modalTranslateY={modalTranslateY}
        modalScale={modalScale}
        modalBackgroundOpacity={modalBackgroundOpacity}
        modalHeaderOpacity={modalHeaderOpacity}
        modalScrollY={modalScrollY}
        isModalAtTop={isModalAtTop}
        selectedRange={selectedRange}
        onClose={closeModal}
        onShare={handleModalShare}
        onScroll={handleModalScroll}
        onRangeChange={setSelectedRange}
        modalPanResponder={modalPanResponder}
      />

      
    </View>
  );
}
