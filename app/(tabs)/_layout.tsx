import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform, useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useSharedValue,
  withSequence,
  withRepeat,
  Easing,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

// Your app's color theme
const APP_COLORS = {
  light: {
    primary: "#16A34A", // Green
    primaryLight: "rgba(22, 163, 74, 0.1)",
    primaryGlow: "rgba(22, 163, 74, 0.3)",
    background: "#FFFFFF",
    backgroundSecondary: "#F8FAFC",
    border: "rgba(229, 231, 235, 0.3)",
    tabInactive: "#9CA3AF",
    tabActive: "#FFFFFF",
    gradientStart: "#16A34A",
    gradientMid: "#15803D",
    gradientEnd: "#166534",
  },
  dark: {
    primary: "#22C55E", // Lighter green for dark mode
    primaryLight: "rgba(34, 197, 94, 0.15)",
    primaryGlow: "rgba(34, 197, 94, 0.4)",
    background: "#111827",
    backgroundSecondary: "#1F2937",
    border: "rgba(55, 65, 81, 0.3)",
    tabInactive: "#9CA3AF",
    tabActive: "#FFFFFF",
    gradientStart: "#22C55E",
    gradientMid: "#16A34A",
    gradientEnd: "#15803D",
  },
};

// Ultra-smooth spring config
const SMOOTH_SPRING = {
  damping: 20,
  stiffness: 180,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Silky timing config
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? APP_COLORS.dark : APP_COLORS.light;

  const tabs = [
    { name: "home", icon: "home-outline", activeIcon: "home", title: "Home" },
    { name: "portfolio", icon: "briefcase-outline", activeIcon: "briefcase", title: "Portfolio" },
    { name: "property", icon: "business-outline", activeIcon: "business", title: "Property" },
    { name: "wallet", icon: "wallet-outline", activeIcon: "wallet", title: "Wallet" },
    { name: "profile", icon: "person-outline", activeIcon: "person", title: "Profile" },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          overflow: "visible",
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          backgroundColor: "transparent",
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <AnimatedTabBarBackground isDark={isDark} colors={colors} />
        ),
      }}
    >
      {tabs.map((tab, index) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon 
                name={tab.icon as any}
                activeName={tab.activeIcon as any}
                color={color} 
                focused={focused}
                isDark={isDark}
                colors={colors}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

function AnimatedTabBarBackground({ 
  isDark, 
  colors,
}: { 
  isDark: boolean;
  colors: typeof APP_COLORS.light | typeof APP_COLORS.dark;
}) {
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.bezier(0.4, 0.0, 0.2, 1)
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerAnimation.value,
            [0, 1],
            [-120, 120],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        shimmerAnimation.value,
        [0, 0.25, 0.5, 0.75, 1],
        [0.15, 0.35, 0.4, 0.35, 0.15],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <View
      style={{
        flex: 1,
        overflow: "hidden",
      }}
    >
      <BlurView
        intensity={isDark ? 100 : 80}
        tint={isDark ? "dark" : "light"}
        style={{
          flex: 1,
        }}
      >
        {/* Base gradient background */}
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(17, 24, 39, 0.97)",
                  "rgba(31, 41, 55, 0.99)",
                ]
              : [
                  "rgba(255, 255, 255, 0.97)",
                  "rgba(248, 250, 252, 0.99)",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Animated shimmer layer */}
        <Animated.View 
          style={[
            shimmerStyle, 
            { 
              position: "absolute", 
              width: "250%", 
              height: "100%",
              left: "-75%",
            }
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? [
                    "transparent",
                    "rgba(34, 197, 94, 0.06)",
                    "rgba(22, 163, 74, 0.1)",
                    "rgba(16, 185, 129, 0.08)",
                    "rgba(22, 163, 74, 0.1)",
                    "rgba(34, 197, 94, 0.06)",
                    "transparent",
                  ]
                : [
                    "transparent",
                    "rgba(22, 163, 74, 0.04)",
                    "rgba(16, 185, 129, 0.07)",
                    "rgba(5, 150, 105, 0.06)",
                    "rgba(16, 185, 129, 0.07)",
                    "rgba(22, 163, 74, 0.04)",
                    "transparent",
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
            }}
          />
        </Animated.View>

        {/* Top shine effect */}
        <LinearGradient
          colors={
            isDark
              ? [
                  "rgba(55, 65, 81, 0.25)",
                  "transparent",
                ]
              : [
                  "rgba(255, 255, 255, 0.9)",
                  "transparent",
                ]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.35 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "35%",
            top: 0,
          }}
        />

        {/* Bottom gradient for depth */}
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(0, 0, 0, 0.15)"]
              : ["transparent", "rgba(0, 0, 0, 0.03)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "45%",
            bottom: 0,
          }}
        />
      </BlurView>
    </View>
  );
}

function AnimatedTabIcon({
  name,
  activeName,
  color,
  focused,
  isDark,
  colors,
}: {
  name: keyof typeof Ionicons.glyphMap;
  activeName: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  isDark: boolean;
  colors: typeof APP_COLORS.light | typeof APP_COLORS.dark;
}) {
  const slideUpAnimation = useSharedValue(focused ? 1 : 0);
  const scaleAnimation = useSharedValue(focused ? 1 : 0);
  const iconScale = useSharedValue(1);
  const rotateAnimation = useSharedValue(0);
  const rippleAnimation = useSharedValue(0);

  useEffect(() => {
    // Smooth slide-up animation for entire tab
    slideUpAnimation.value = withSpring(focused ? 1 : 0, {
      damping: 18,
      stiffness: 160,
      mass: 0.7,
    });

    // Smooth scale animation for gradient background
    scaleAnimation.value = withSpring(focused ? 1 : 0, {
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    });
    
    if (focused) {
      // Icon bounce effect
      iconScale.value = withSequence(
        withSpring(1.25, { 
          damping: 10, 
          stiffness: 250,
          mass: 0.6,
        }),
        withSpring(1, { 
          damping: 12, 
          stiffness: 180,
          mass: 0.8,
        })
      );

      // Icon rotation
      rotateAnimation.value = withSequence(
        withTiming(10, { duration: 180, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
        withTiming(-10, { duration: 180, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
        withSpring(0, { 
          damping: 10, 
          stiffness: 150,
          mass: 0.5,
        })
      );

      // Ripple effect
      rippleAnimation.value = withSequence(
        withDelay(
          50,
          withTiming(1, { duration: 500, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) })
        ),
        withTiming(0, { duration: 250, easing: SMOOTH_EASING })
      );
    } else {
      iconScale.value = withSpring(1, SMOOTH_SPRING);
      rotateAnimation.value = withSpring(0, SMOOTH_SPRING);
    }
  }, [focused]);

  // Container slides up (moves entire tab unit)
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            slideUpAnimation.value,
            [0, 1],
            [0, -10], // Slides up 10px
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // Icon animation
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: iconScale.value,
        },
        {
          rotate: `${rotateAnimation.value}deg`,
        },
      ],
    };
  });

  // Gradient background scale animation
  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scaleAnimation.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            scaleAnimation.value,
            [0, 1],
            [0.7, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // Glow ring animation
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scaleAnimation.value,
        [0, 1],
        [0, 0.25],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            scaleAnimation.value,
            [0, 1],
            [0.5, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // Ripple animation
  const rippleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        rippleAnimation.value,
        [0, 0.4, 1],
        [0, 0.25, 0],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            rippleAnimation.value,
            [0, 1],
            [0.4, 2.2],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // ACTIVE TAB - slides up with gradient background
  if (focused) {
    return (
      <Animated.View
        style={[
          containerAnimatedStyle,
          {
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
          }
        ]}
      >
        {/* Ripple effect on tap */}
        <Animated.View
          style={[
            rippleStyle,
            {
              position: "absolute",
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
            },
          ]}
        />

        {/* Outer glow ring */}
        <Animated.View
          style={[
            glowStyle,
            {
              position: "absolute",
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "transparent",
              borderWidth: 2,
              borderColor: colors.primary,
            },
          ]}
        />

        {/* Premium gradient button */}
        <Animated.View
          style={[
            backgroundStyle,
            {
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
              shadowColor: colors.primary,
              shadowOpacity: 0.45,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 12,
              elevation: 12,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 28,
            }}
          >
            <Animated.View style={[animatedIconStyle]}>
              <Ionicons
                name={activeName}
                size={24}
                color="white"
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    );
  }

  // INACTIVE TAB - simple gray icon (stays in place)
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 50,
        height: 50,
      }}
    >
      <Ionicons
        name={name}
        size={24}
        color={colors.tabInactive}
      />
    </View>
  );
}