import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useApp } from '@/contexts/AppContext';
import { useWallet } from '@/services/useWallet';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRestrictionModal } from '@/hooks/useRestrictionModal';
import { RestrictionModal } from '@/components/restrictions/RestrictionModal';
import { AppAlert } from '@/components/AppAlert';
import EmeraldLoader from '@/components/EmeraldLoader';

const BALANCE_EPSILON = 0.01;

export default function InvestmentReviewScreen() {
  const {
    id,
    tokenCount,
    totalAmount,
    transactionFee,
    totalInvestment,
    propertyTitle,
    propertyId,
    tokenId,
    tokenName,
    tokenSymbol,
    tokenPrice,
  } = useLocalSearchParams<any>();

  const router = useRouter();
  const { property } = useProperty(id || propertyId || '');
  const { invest } = useApp();
  const { balance } = useWallet();
  const { checkAndBlock, modalProps } = useRestrictionModal();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false); // NEW: Track gesture state
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  /* ================== VALUES ================== */
  const tokens = parseFloat(tokenCount || '0');
  const amount = parseFloat(totalAmount || '0');
  const fee = parseFloat(transactionFee || '0');
  const investment = parseFloat(totalInvestment || '0');
  const title = propertyTitle || property?.title || 'Property';
  
  // Get token info - use params first, then try to find from property
  const selectedToken = tokenId && property?.tokens 
    ? property.tokens.find(t => t.id === tokenId)
    : null;
  
  const displayTokenName = tokenName || selectedToken?.name || '';
  const displayTokenSymbol = tokenSymbol || selectedToken?.tokenSymbol || property?.tokenSymbol || '';
  const displayTokenPrice = tokenPrice ? parseFloat(tokenPrice) : (selectedToken?.pricePerTokenUSDT || property?.tokenPrice || 0);

  const API_BASE_URL =
    Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

  const getImage = () => {
    if (!property?.images) return null;
    const imgs = normalizePropertyImages(property.images);
    if (!imgs.length) return null;
    const img = imgs[0];
    return img.startsWith('http') ? img : `${API_BASE_URL}${img}`;
  };

  /* ================== SWIPE LOGIC (PERFECT FIX) ================== */
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SLIDER_WIDTH = SCREEN_WIDTH - 32;
  const THUMB_SIZE = 52;
  const MAX_X = SLIDER_WIDTH - THUMB_SIZE - 4;
  const TRIGGER_X = MAX_X * 0.7; // Easier trigger point

  const translateX = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(THUMB_SIZE)).current;
  
  // Track states properly
  const isAnimating = useRef(false);
  const isResetting = useRef(false);
  const gestureState = useRef({ dx: 0, vx: 0 });

  // PERFECT FIX: Single animation controller
  const resetThumb = (immediate = false) => {
    if (isResetting.current) return; // Prevent double resets
    isResetting.current = true;
    
    if (immediate) {
      translateX.setValue(0);
      progressWidth.setValue(THUMB_SIZE);
      setIsGestureActive(false);
      isAnimating.current = false;
      isResetting.current = false;
      gestureState.current = { dx: 0, vx: 0 };
      return;
    }

    // Use spring for smoother reset
    isAnimating.current = true;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(({ finished }) => {
      if (finished) {
        translateX.setValue(0);
        progressWidth.setValue(THUMB_SIZE);
        isAnimating.current = false;
        isResetting.current = false;
        setIsGestureActive(false);
        gestureState.current = { dx: 0, vx: 0 };
      }
    });
  };

  // FIX 2: Cleanup on unmount
  useEffect(() => {
    return () => {
      translateX.stopAnimation();
      progressWidth.stopAnimation();
      translateX.setValue(0);
      progressWidth.setValue(THUMB_SIZE);
    };
  }, []);

  // FIX 3: Reset if processing state changes unexpectedly
  useEffect(() => {
    if (!isProcessing && isGestureActive) {
      resetThumb(true);
    }
  }, [isProcessing]);

  const panResponder = useRef(
    PanResponder.create({
      // PERFECT: Always allow gesture start, check conditions in move
      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (_, g) => {
        if (isProcessing || isAnimating.current || isResetting.current) {
          return false;
        }
        
        const insufficientBalance = investment > balance.usdc + BALANCE_EPSILON;
        if (insufficientBalance) return false;
        
        // Require clear horizontal movement (5px minimum)
        const isHorizontalSwipe = Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy);
        return isHorizontalSwipe;
      },

      onPanResponderGrant: () => {
        // Stop any existing animations
        translateX.stopAnimation();
        progressWidth.stopAnimation();
        
        setIsGestureActive(true);
        isAnimating.current = false;
        isResetting.current = false;
        
        // Store initial state
        gestureState.current = { dx: 0, vx: 0 };
      },

      onPanResponderMove: (_, g) => {
        if (isProcessing || isAnimating.current || isResetting.current) {
          return;
        }
        
        gestureState.current = { dx: g.dx, vx: g.vx };
        
        // Only allow right swipe
        let dx = Math.max(0, g.dx);

        // Smooth resistance curve
        if (dx > MAX_X * 0.85) {
          const overDrag = dx - MAX_X * 0.85;
          dx = MAX_X * 0.85 + overDrag * 0.2;
        }

        const clampedDx = Math.min(dx, MAX_X);
        
        // Update both animations smoothly
        translateX.setValue(clampedDx);
        // CRITICAL: Sync progress width with translate
        const newWidth = THUMB_SIZE + clampedDx;
        progressWidth.setValue(newWidth);
      },

      onPanResponderRelease: (_, g) => {
        const { dx, vx } = gestureState.current;
        
        if (isProcessing || isResetting.current) {
          resetThumb(true);
          return;
        }

        // Consider velocity for better UX
        const hasVelocity = vx > 0.5;
        const pastTrigger = dx >= TRIGGER_X;
        const shouldComplete = pastTrigger || (hasVelocity && dx > TRIGGER_X * 0.5);
        
        if (shouldComplete && !isProcessing) {
          // Complete the swipe
          isAnimating.current = true;
          setIsGestureActive(true);
          
          // Animate to end
          Animated.spring(translateX, {
            toValue: MAX_X,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start(async ({ finished }) => {
            if (finished && !isProcessing) {
              // Keep the button at the end while processing
              await handleConfirmInvestment();
            }
          });
        } else {
          // Reset back
          resetThumb();
        }
      },

      onPanResponderTerminate: () => {
        if (!isProcessing) {
          resetThumb(true);
        }
      },

      onPanResponderTerminationRequest: () => false, // Don't allow termination during swipe
    })
  ).current;

  /* ================== INVEST ================== */
  const handleConfirmInvestment = async () => {
    // Check if investment is blocked
    if (!checkAndBlock('investment')) {
      setIsGestureActive(false);
      resetThumb(true);
      return; // Modal will show, don't proceed
    }

    // FIX 10: Double-check balance
    if (investment > balance.usdc + BALANCE_EPSILON) {
      const shortfall = investment - balance.usdc;
      setIsGestureActive(false);
      resetThumb(true);
      
      setAlertState({
        visible: true,
        title: 'Insufficient Balance',
        message: `You need $${shortfall.toFixed(2)} more.`,
        type: 'warning',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          router.push({
            pathname: '/wallet/deposit/card',
            params: { amount: shortfall.toFixed(2) },
          } as any);
        },
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Pass tokenId if available
      const tokenIdToPass = tokenId || selectedToken?.id || undefined;
      await invest(investment, propertyId || id, tokens, tokenIdToPass);
      
      // FIX 11: Navigate without resetting (we're leaving the screen)
      router.replace({
        pathname: `/invest/${id}/confirm`,
        params: {
          tokenCount: tokens.toString(),
          totalAmount: amount.toFixed(2),
          totalInvestment: investment.toFixed(2),
          propertyTitle: title,
        },
      } as any);
    } catch (error: any) {
      console.error('Investment error:', error);
      setIsProcessing(false);
      setIsGestureActive(false);
      resetThumb(true);
      
      // Extract error message from backend response
      let errorMessage = 'Please try again.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setAlertState({
        visible: true,
        title: 'Investment Failed',
        message: errorMessage,
        type: 'error',
        onConfirm: () => setAlertState((prev) => ({ ...prev, visible: false })),
      });
    }
  };

  // FIX 12: Calculate if button should be disabled
  const isDisabled = investment > balance.usdc + BALANCE_EPSILON || isProcessing;

  /* ================== UI ================== */
  return (
    <LinearGradient colors={['#064E3B', '#022C22', '#064E3B']} style={{ flex: 1 }}>
      <View className="flex-1">
        {/* HEADER */}
        <View className="flex-row items-center px-4 pt-12 pb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-white font-semibold">
            Review Investment
          </Text>
          <View className="w-6" />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isGestureActive} // FIX 13: Disable scroll during gesture
        >
          {/* PROPERTY */}
          <View className="mx-4 mb-6 rounded-2xl overflow-hidden">
            {getImage() && (
              <Image source={{ uri: getImage()! }} className="h-44 w-full" />
            )}
            <View className="absolute bottom-0 w-full p-4 bg-black/70">
              <Text className="text-gray-300 text-xs">Investing in</Text>
              <Text className="text-white text-lg font-semibold">{title}</Text>
            </View>
          </View>

          {/* HERO */}
          <View className="mx-4 mb-8">
            <Text className="text-gray-400 text-sm">Total investment</Text>
            <Text className="text-white text-4xl font-bold">
              ${investment.toFixed(2)}
            </Text>
            <View className="mt-2 flex-row items-center gap-2">
              <Text className="text-emerald-400">
                {tokens.toFixed(2)} {displayTokenSymbol || 'property'} tokens
              </Text>
              {displayTokenName && (
                <>
                  <Text className="text-gray-500">•</Text>
                  <Text className="text-gray-400 text-sm">
                    {displayTokenName}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* BREAKDOWN */}
          <View className="mx-4 mb-8 rounded-xl bg-zinc-900 p-4">
            {[
              ['Token price', `$${displayTokenPrice.toFixed(2)}`],
              ['Subtotal', `$${amount.toFixed(2)}`],
              ['Transaction fee', `$${fee.toFixed(2)}`],
            ].map(([k, v]) => (
              <View key={k} className="flex-row justify-between py-2">
                <Text className="text-gray-400">{k}</Text>
                <Text className="text-white">{v}</Text>
              </View>
            ))}
          </View>

          {/* WALLET */}
          <View className="mx-4 mb-10">
            <Text className="text-gray-400 text-sm">Paying from</Text>
            <Text className="text-white font-medium">USDC Wallet</Text>
            <Text className="text-gray-400 text-sm">
              Balance: ${balance.usdc.toFixed(2)}
            </Text>
          </View>
        </ScrollView>

        {/* SWIPE CONFIRM - PERFECT VERSION */}
        <View className="px-4 pb-10">
          <View 
            className="h-14 rounded-full bg-zinc-900 justify-center overflow-hidden relative"
            style={{ opacity: isDisabled ? 0.6 : 1 }}
          >
            {/* Progress fill - separate from thumb for better performance */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                backgroundColor: 'transparent',
                overflow: 'hidden',
              }}
              pointerEvents="none"
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: progressWidth,
                  backgroundColor: isDisabled 
                    ? 'rgba(127,127,127,0.3)' 
                    : 'rgba(16,185,129,0.3)',
                }}
              />
            </View>

            {/* Swipable thumb with FULL touch area */}
            <Animated.View
              {...(!isDisabled ? panResponder.panHandlers : {})}
              style={{
                transform: [{ translateX }],
                position: 'absolute',
                left: 2,
                top: 2,
                bottom: 2,
                width: THUMB_SIZE,
                height: THUMB_SIZE - 4,
                borderRadius: 25,
                backgroundColor: isDisabled ? '#6b7280' : '#10b981',
                alignItems: 'center',
                justifyContent: 'center',
                // CRITICAL: Ensure touch events work
                zIndex: 10,
              }}
            >
              {isProcessing ? (
                <EmeraldLoader />
              ) : (
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color="#fff"
                  style={{ pointerEvents: 'none' }} 
                />
              )}
            </Animated.View>

            {/* Text label - must not block touches */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <Text 
                className="text-center text-white font-semibold"
                style={{ 
                  marginLeft: 20, // Offset for thumb
                  pointerEvents: 'none',
                }}
              >
                {isDisabled
                  ? investment > balance.usdc 
                    ? 'Insufficient balance'
                    : 'Processing...'
                  : isGestureActive
                  ? 'Keep swiping...'
                  : 'Swipe to confirm investment'}
              </Text>
            </View>
          </View>
          
          {/* Helper text */}
          {!isDisabled && (
            <Text className="text-center text-gray-400 text-xs mt-2">
              Swipe the button right to complete your investment
            </Text>
          )}
        </View>
      </View>
      <RestrictionModal {...modalProps} />
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm || (() => setAlertState((prev) => ({ ...prev, visible: false })))}
      />
    </LinearGradient>
  );
}