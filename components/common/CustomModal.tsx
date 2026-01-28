import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  BackHandler,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CustomModalProps extends React.PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  height?: number; // Height as fraction of screen (0-1) or absolute pixels
  showDragHandle?: boolean;
  enableSwipeToClose?: boolean;
  enableBackdropPress?: boolean;
  backgroundColor?: string;
  borderTopRadius?: number;
  onScroll?: (event: any) => void;
  scrollEventThrottle?: number;
  isDarkColorScheme?: boolean;
  colors?: {
    background?: string;
    border?: string;
    muted?: string;
  };
}

export function CustomModal({
  visible,
  onClose,
  children,
  height = 0.82,
  showDragHandle = true,
  enableSwipeToClose = true,
  enableBackdropPress = true,
  backgroundColor,
  borderTopRadius = 32,
  onScroll,
  scrollEventThrottle = 16,
  isDarkColorScheme = false,
  colors,
}: CustomModalProps) {
  // Animation values
  const modalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalScale = useRef(new Animated.Value(0.95)).current;
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const isModalAtTop = useRef(false);

  // Calculate modal height
  const modalHeight = typeof height === 'number' && height <= 1 
    ? SCREEN_HEIGHT * height 
    : height;

  // Animate in when visible changes to true
  useEffect(() => {
    if (visible) {
      // Reset values
      modalTranslateY.setValue(SCREEN_HEIGHT);
      modalScale.setValue(0.95);
      modalBackgroundOpacity.setValue(0);
      scrollY.setValue(0);
      isModalAtTop.current = false;

      // Animate in
      Animated.parallel([
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(modalBackgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Track scroll position to determine if modal is at top
  useEffect(() => {
    if (!visible) return;

    const listenerId = scrollY.addListener(({ value }) => {
      isModalAtTop.current = value <= 0;
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [visible]);

  const closeModal = useCallback(() => {
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
      modalTranslateY.setValue(SCREEN_HEIGHT);
      modalScale.setValue(0.95);
      modalBackgroundOpacity.setValue(0);
      scrollY.setValue(0);
      onClose();
    });
  }, [onClose]);

  // Handle back button press
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeModal();
      return true;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Track if we're currently dragging (to disable scroll)
  const isDraggingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Pan responder for drag handle - always active when enabled
  const dragHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          if (!enableSwipeToClose) return false;
          // Always allow starting from drag handle
          return true;
        },
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!enableSwipeToClose) return false;
          // Only respond to downward vertical gestures
          return (
            gestureState.dy > 5 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
            gestureState.dy > 0
          );
        },
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          // Stop any ongoing scroll animations
          if (scrollViewRef.current) {
            scrollViewRef.current.setNativeProps({ scrollEnabled: false });
          }
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0 && enableSwipeToClose) {
            const progress = Math.min(gestureState.dy / SCREEN_HEIGHT, 1);
            modalTranslateY.setValue(gestureState.dy);
            modalBackgroundOpacity.setValue(1 - progress * 0.8);
            const scale = 1 - progress * 0.08;
            modalScale.setValue(Math.max(scale, 0.92));
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          isDraggingRef.current = false;
          // Re-enable scrolling
          if (scrollViewRef.current) {
            scrollViewRef.current.setNativeProps({ scrollEnabled: true });
          }

          if (!enableSwipeToClose) return;

          const threshold = 100; // Threshold in pixels
          if (gestureState.dy > threshold || gestureState.vy > 0.5) {
            // Close modal
            closeModal();
          } else {
            // Spring back to original position
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
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          // Re-enable scrolling
          if (scrollViewRef.current) {
            scrollViewRef.current.setNativeProps({ scrollEnabled: true });
          }
          // Spring back
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
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [enableSwipeToClose, closeModal]
  );

  // Handle scroll events
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
    if (onScroll) {
      onScroll(event);
    }
  };

  if (!visible) return null;

  const bgColor = backgroundColor || colors?.background || (isDarkColorScheme ? 'rgba(22, 22, 22, 1)' : '#FFFFFF');
  const borderColor = colors?.border || (isDarkColorScheme ? 'transparent' : 'rgba(0, 0, 0, 0.1)');
  const mutedColor = colors?.muted || (isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');

  return (
    <>
      {/* Dimmed Background */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.5)',
          opacity: modalBackgroundOpacity,
        }}
        pointerEvents={enableBackdropPress ? 'auto' : 'none'}
      >
        {enableBackdropPress && (
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeModal}
          />
        )}
      </Animated.View>

      {/* Modal Container */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: modalHeight,
          transform: [
            { translateY: modalTranslateY },
            { scale: modalScale },
          ],
          backgroundColor: bgColor,
          borderTopLeftRadius: borderTopRadius,
          borderTopRightRadius: borderTopRadius,
          borderTopWidth: isDarkColorScheme ? 0 : 1,
          borderTopColor: borderColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkColorScheme ? 0.3 : 0.15,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Drag Handle - Always draggable when enabled */}
          {showDragHandle && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                paddingTop: 16,
                minHeight: 44, // Make it easier to grab
              }}
              {...(enableSwipeToClose ? dragHandlePanResponder.panHandlers : {})}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: mutedColor,
                }}
              />
            </View>
          )}

          {/* Scrollable Content */}
          <Animated.ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={scrollEventThrottle}
            bounces={true}
            nestedScrollEnabled={true}
            scrollEnabled={!isDraggingRef.current}
          >
            {children}
          </Animated.ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

