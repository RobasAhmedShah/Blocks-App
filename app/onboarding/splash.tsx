import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isPinSet, isLoading } = useAuth();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const shimmerTranslate = useSharedValue(-width);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Start animations
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
    );

    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    textTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Shimmer effect
    shimmerTranslate.value = withDelay(
      800,
      withTiming(width, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      })
    );

    // Rotating loading indicator
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1
    );

    // Navigate after animation and auth check
    const timer = setTimeout(() => {
      // Don't navigate if still loading auth state
      if (isLoading) return;
      
      // If authenticated, go to home
      if (isAuthenticated) {
        router.replace("/(tabs)/home" as any);
      } 
      // If has PIN set (logged in, needs to unlock), go to PIN screen
      else if (isPinSet) {
        router.replace("/onboarding/pin-verification" as any);
      } 
      // Otherwise, show onboarding/auth
      else {
        router.replace("/onboarding/onboard-one" as any);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isPinSet, isLoading]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const rotationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <LinearGradient
      colors={isDarkColorScheme ? ["#0B3D36", "#102222", "#0B1F1C"] : [colors.background, colors.card, colors.background]}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background Pattern */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.05,
        }}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 80 + Math.random() * 40,
              height: 80 + Math.random() * 40,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.primary,
              transform: [
                { rotate: `${i * 24}deg` },
                { translateX: (Math.random() - 0.5) * width },
                { translateY: (Math.random() - 0.5) * height },
              ],
            }}
          />
        ))}
      </View>

      {/* Main Content */}
      <View style={{ alignItems: "center", position: "relative" }}>
        {/* Logo Container with Shimmer */}
        <View style={{ position: "relative", marginBottom: 24 }}>
          <Animated.View
            style={[
              logoAnimatedStyle,
              {
                width: 120,
                height: 120,
                borderRadius: 30,
                backgroundColor: isDarkColorScheme ? "rgba(13, 165, 165, 0.2)" : `${colors.primary}20`,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.primary,
                overflow: "hidden",
              },
            ]}
          >
            {/* Shimmer Effect */}
            <Animated.View
              style={[
                shimmerAnimatedStyle,
                {
                  position: "absolute",
                  width: 100,
                  height: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  transform: [{ skewX: "-20deg" }],
                },
              ]}
            />

            {/* Logo Icon */}
            <Ionicons name="apps" size={60} color={colors.primary} />
          </Animated.View>

          {/* Glow Effect */}
          <View
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: colors.primary,
              opacity: 0.2,
              top: -10,
              left: -10,
              zIndex: -1,
            }}
          />
        </View>

        {/* App Name */}
        <Animated.View style={textAnimatedStyle}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: colors.textPrimary,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            Blocks
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={textAnimatedStyle}>
          <Text
            style={{
              fontSize: 16,
              color: colors.primary,
              letterSpacing: 1,
              fontWeight: "600",
            }}
          >
            Build Your Future
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={[textAnimatedStyle, { marginTop: 4 }]}>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              letterSpacing: 0.5,
            }}
          >
            Real Estate Investment Made Easy
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Loading Indicator */}
      <View
        style={{
          position: "absolute",
          bottom: 60,
          alignItems: "center",
        }}
      >
        <Animated.View
          style={[
            rotationAnimatedStyle,
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 3,
              borderColor: `${colors.primary}30`,
              borderTopColor: colors.primary,
            },
          ]}
        />
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 12,
            marginTop: 16,
            letterSpacing: 1,
          }}
        >
          Loading...
        </Text>
      </View>

      {/* Version */}
      <Text
        style={{
          position: "absolute",
          bottom: 24,
          color: colors.textMuted,
          fontSize: 10,
          letterSpacing: 1,
        }}
      >
        Version 1.0.0
      </Text>
    </LinearGradient>
  );
}