import React from "react";
import {
  View,
  Text,
  Dimensions,
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
import Svg, { Defs, Pattern, Rect, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import FeaturedSection, { Stat as FeaturedStat} from "@/components/home/FeaturedSection";
import AffordableSection from "@/components/home/AffordableSection";
import InvestmentSection from "@/components/home/InvestmentSection";
import CTAButton from "@/components/home/CTAButton";
import { mockProperties } from "@/data/mockProperties";

const { width, height } = Dimensions.get("window");

// Minimal Pattern Background - Subtle gradient squares
const SubtlePattern = () => (
  <Svg
    height="100%"
    width="100%"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}
    preserveAspectRatio="xMidYMid slice"
  >
    <Defs>
      {/* Very subtle gradient - emerald tint */}
      <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="rgba(236, 253, 245, 0.4)" stopOpacity="1" />
        <Stop offset="100%" stopColor="rgba(209, 250, 229, 0.2)" stopOpacity="1" />
      </SvgLinearGradient>
      <Pattern
        id="subtlePattern"
        patternUnits="userSpaceOnUse"
        width="80"
        height="80"
      >
        <Rect 
          width="80" 
          height="80" 
          fill="url(#grad)"
          stroke="rgba(22, 163, 74, 0.04)"
          strokeWidth="0.5"
        />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="#FAFAFA" />
    <Rect width="100%" height="100%" fill="url(#subtlePattern)" />
  </Svg>
);

export default function BlocksHomeScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);

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

  // Get featured properties (first 2 properties)
  const featured = mockProperties.slice(0, 2).map((property) => ({
    id: property.id,
    title: property.title,
    roi: `${property.estimatedROI}%`,
    funded: `${Math.round((property.soldTokens / property.totalTokens) * 100)}%`,
    minInvestment: `$${property.minInvestment}`,
    image: property.images[0],
  }));

  // Get affordable properties (properties with lower token prices, limit to 2)
  const affordable = mockProperties
    .sort((a, b) => a.tokenPrice - b.tokenPrice)
    .slice(0, 2)
    .map((property) => ({
      id: property.id,
      name: property.title,
      entry: `$${property.tokenPrice.toFixed(2)}`,
      roi: `${property.estimatedROI}%`,
      image: property.images[0],
    }));

  const midrange = [
    {
      name: "Lakeside Cabin",
      value: "$750k",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBdyw4jM184KQ8Xn2y7WHR-f-zuNA-Va91wnxQEfaK4oGCYEsEiB0efAJMa4jMyW00WUb2drtyFBSilrs9iPqcLBnjJ37T9wM55V-6M8a7YSLqk_B2nTNfG7BuNvsAcqB_mOzHp4eaAbULUz35JwkZeWXAcRkXha0dgW1hybNWkOftAOBtoBQh8RaKmHXTQLBZL3ScEMFld_2iubxsoTcIGJVq6g9TLDUjObm_A04RghVxwxH7-YLyrirQIvAzN-pACSw9MVci1gnY",
      path: "M0 30 L10 25 L20 28 L30 20 L40 22 L50 15 L60 18 L70 12 L80 15 L90 10 L100 8",
    },
    {
      name: "Cityscape Tower",
      value: "$1.2M",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVQf2cwzc5Lc-WDA1uyza5tMFulDlQ2pyWdoVy3_GA-9iQORKU4p7IqIXKaPGlJVABJs6Kfh7WuByAIn0TtBNhXTpmAJx2IbGod2Tuqg3BgexXbHftijDYDWAJQZUty0tCX5tZKdNFx4GOj7Ybosw_JBeQf2dF24ckB_9SUNgnpMuZ9tG1JcaQWokqpD5O4cTzBtIiE8mXKaY-Mu8-aXTVi3EzgnfdG-CyGHCgKh5WvGNdg1XQr1HXWJnNnJPImw2cJ0txlCZb2_M",
      path: "M0 25 L10 28 L20 22 L30 24 L40 18 L50 20 L60 15 L70 18 L80 12 L90 14 L100 10",
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Subtle pattern background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <SubtlePattern />
      </View>

      {/* Scrollable content with parallax */}
      <Animated.ScrollView 
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with parallax */}
        <Animated.View 
          style={[headerParallaxStyle]}
          className="flex-row justify-between items-center p-4 pt-12 bg-transparent"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="apps" size={28} color="#16A34A" />
            <Text className="text-gray-900 text-xl font-bold">Blocks</Text>
          </View>
          <View className="bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <Text className="text-amber-700 text-base font-bold">$15,430</Text>
          </View>
        </Animated.View>

        {/* Hero Section - Typography Focus with Parallax */}
        <Animated.View 
          style={[heroParallaxStyle]}
          className="pt-12 pb-16 items-center justify-center px-6"
        >
          {/* Background gradient overlay */}
          <LinearGradient
            colors={['rgba(236, 253, 245, 0.6)', 'rgba(209, 250, 229, 0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 32,
            }}
          />

          {/* Oversized Typography */}
          <View className="items-center z-10">
            {/* Small eyebrow text */}
            <Text 
              className="text-emerald-600 text-sm font-bold tracking-widest uppercase mb-4"
              style={{
                letterSpacing: 3,
              }}
            >
              Real Estate. Reimagined.
            </Text>

            {/* Main headline with gradient effect */}
            <View className="mb-2">
              <Text 
                className="text-6xl font-black text-center leading-tight"
                style={{
                  color: '#111827',
                  fontWeight: '900',
                  letterSpacing: -2,
                }}
              >
                Build Your
              </Text>
            </View>
            
            <View className="relative">
              <Text 
                className="text-6xl font-black text-center leading-tight"
                style={{
                  color: '#16A34A',
                  fontWeight: '900',
                  letterSpacing: -2,
                }}
              >
                Future
              </Text>
            </View>

            {/* Subtitle with gradient underline */}
            <View className="mt-6 items-center">
              <Text 
                className="text-2xl font-bold text-center leading-relaxed"
                style={{
                  color: '#374151',
                  letterSpacing: -0.5,
                }}
              >
                Block by Block
              </Text>
              <LinearGradient
                colors={['#16A34A', '#15803D', '#14532D']}
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

            {/* Description */}
            <Text 
              className="text-base text-center leading-relaxed mt-8 max-w-sm"
              style={{
                color: '#6B7280',
                lineHeight: 24,
              }}
            >
              Invest in tokenized real estate with as little as{' '}
              <Text className="font-bold text-emerald-600">$10</Text>
              . Own fractional shares of premium properties worldwide.
            </Text>

            {/* Minimal stats */}
            <View className="flex-row gap-8 mt-10">
              <View className="items-center">
                <Text className="text-3xl font-black text-emerald-600">50+</Text>
                <Text className="text-xs text-gray-500 uppercase tracking-wider mt-1">Properties</Text>
              </View>
              <View className="w-px h-12 bg-gray-300" />
              <View className="items-center">
                <Text className="text-3xl font-black text-emerald-600">$2M+</Text>
                <Text className="text-xs text-gray-500 uppercase tracking-wider mt-1">Invested</Text>
              </View>
              <View className="w-px h-12 bg-gray-300" />
              <View className="items-center">
                <Text className="text-3xl font-black text-emerald-600">12%</Text>
                <Text className="text-xs text-gray-500 uppercase tracking-wider mt-1">Avg ROI</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Content sections with smooth entrance */}
        <Animated.View style={[contentParallaxStyle]}>
          <FeaturedSection featured={featured} />
          <AffordableSection affordable={affordable} />
          <InvestmentSection title="Mid-Range Investments" data={midrange} />
          <CTAButton />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}