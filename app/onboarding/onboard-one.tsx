import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
// import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  illustration: string; // You can replace with actual images
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Welcome to Blocks",
    subtitle: "Build Your Real Estate Portfolio",
    description: "Invest in premium properties starting from just $100. Make real estate investment accessible and affordable.",
    icon: "home",
    color: "#0da5a5",
    illustration: "🏢",
  },
  {
    id: "2",
    title: "Fractional Ownership",
    subtitle: "Own a Piece of Premium Properties",
    description: "Buy tokens representing fractional ownership in real properties. Each token gives you a share of rental income and appreciation.",
    icon: "apps",
    color: "#10B981",
    illustration: "🪙",
  },
  {
    id: "3",
    title: "Passive Income",
    subtitle: "Earn Monthly Rental Income",
    description: "Receive your share of rental payments directly to your wallet every month. Start earning from day one.",
    icon: "wallet",
    color: "#3B82F6",
    illustration: "💰",
  },
  {
    id: "4",
    title: "Portfolio Growth",
    subtitle: "Watch Your Investments Grow",
    description: "Track performance in real-time and diversify across multiple properties. Professional portfolio management at your fingertips.",
    icon: "trending-up",
    color: "#8B5CF6",
    illustration: "📈",
  },
  {
    id: "5",
    title: "Secure & Transparent",
    subtitle: "Your Investments Are Protected",
    description: "Bank-level security with regulated real estate investments. All properties are professionally managed and insured.",
    icon: "shield-checkmark",
    color: "#D4AF37",
    illustration: "🔒",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSkip = async () => {
    // await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(tabs)" as any);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSkip();
    }
  };

  const handleGetStarted = async () => {
    // await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(tabs)" as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkColorScheme ? "#102222" : colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Back Button */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={() => {
            if (currentIndex > 0) {
              flatListRef.current?.scrollToIndex({
                index: currentIndex - 1,
                animated: true,
              });
              setCurrentIndex(currentIndex - 1);
            } else {
              // If on first slide, go back to splash or welcome
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/onboarding/splash" as any);
              }
            }
          }}
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkColorScheme ? "rgba(255, 255, 255, 0.1)" : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            position: "absolute",
            top: 60,
            right: 20,
            zIndex: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isDarkColorScheme ? "rgba(255, 255, 255, 0.1)" : colors.muted,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "600" }}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Bottom Section */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 20,
        }}
      >
        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          {slides.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const widthValue = interpolate(
                scrollX.value,
                inputRange,
                [8, 24, 8],
                Extrapolate.CLAMP
              );

              const opacityValue = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                Extrapolate.CLAMP
              );

              return {
                width: widthValue,
                opacity: opacityValue,
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  {
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    marginHorizontal: 4,
                  },
                  dotStyle,
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        {currentIndex === slides.length - 1 ? (
          // Last slide - Show CTA buttons
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/onboarding/signup" as any)}
              style={{
                backgroundColor: colors.primary,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 16,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                Create Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/onboarding/signin" as any)}
              style={{
                backgroundColor: "transparent",
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.primary,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                I Already Have an Account
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Other slides - Show Next button with optional Back button
          <View style={{ flexDirection: "row", gap: 12 }}>
            {currentIndex > 0 && (
              <TouchableOpacity
                onPress={() => {
                  flatListRef.current?.scrollToIndex({
                    index: currentIndex - 1,
                    animated: true,
                  });
                  setCurrentIndex(currentIndex - 1);
                }}
                style={{
                  backgroundColor: "transparent",
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.primary,
                  flex: 1,
                  flexDirection: "row",
                  gap: 8,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 16,
                    fontWeight: "bold",
                    letterSpacing: 0.5,
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              style={{
                backgroundColor: colors.primary,
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                flex: currentIndex > 0 ? 1 : undefined,
                minWidth: currentIndex > 0 ? undefined : "100%",
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 16,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                Next
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function SlideItem({
  item,
  index,
  scrollX,
}: {
  item: OnboardingSlide;
  index: number;
  scrollX: any;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolate.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View
      style={{
        width,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
        paddingTop: 100,
        paddingBottom: 200,
      }}
    >
      <Animated.View style={[{ alignItems: "center" }, animatedStyle]}>
        {/* Icon/Illustration */}
        <Animated.View style={iconAnimatedStyle}>
          <View
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: `${item.color}15`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              borderWidth: 2,
              borderColor: `${item.color}30`,
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: `${item.color}25`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Emoji Illustration */}
              <Text style={{ fontSize: 72 }}>{item.illustration}</Text>
              
              {/* Or use Icon instead */}
              {/* <Ionicons name={item.icon} size={80} color={item.color} /> */}
            </View>

            {/* Glow Effect */}
            <View
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: item.color,
                opacity: 0.1,
                zIndex: -1,
              }}
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: 12,
            letterSpacing: 0.5,
          }}
        >
          {item.title}
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: item.color,
            textAlign: "center",
            marginBottom: 16,
            letterSpacing: 0.3,
          }}
        >
          {item.subtitle}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 15,
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            lineHeight: 24,
            letterSpacing: 0.2,
          }}
        >
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );
}