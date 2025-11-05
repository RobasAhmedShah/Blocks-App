import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform } from "react-native";
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
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFD700", // Luxury gold accent
        tabBarInactiveTintColor: "#8B8B8B",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "700",
          marginTop: 5,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          fontFamily: Platform.select({
            ios: "Helvetica Neue",
            android: "sans-serif-medium",
          }),
          textShadowColor: "rgba(0, 0, 0, 0.5)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 20,
          right: 20,
          height: 75,
          borderRadius: 30,
          overflow: "hidden",
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 20,
          backgroundColor: "transparent",
          borderWidth: 0.5,
          borderColor: "rgba(255, 215, 0, 0.15)", // Subtle gold border
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarBackground: () => <PremiumTabBarBackground />,
      }}
    >
      {[
        { name: "home", icon: "home-outline", title: "Home" },
        { name: "portfolio", icon: "diamond-outline", title: "Portfolio" },
        { name: "property", icon: "business-outline", title: "Property" },
        { name: "wallet", icon: "wallet-outline", title: "Wallet" },
        { name: "profile", icon: "person-outline", title: "Profile" },
      ].map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <LuxuryTabIcon 
                name ={tab.icon as any} 
                color={color} 
                focused={focused}
                isCenter={tab.name === "property"} // Center icon special treatment
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

function PremiumTabBarBackground() {
  const flowAnimation = useSharedValue(0);
  const rippleAnimation = useSharedValue(0);

  useEffect(() => {
    // Continuous flowing animation
    flowAnimation.value = withSequence(
      withTiming(1, { duration: 4000 }),
      withTiming(0, { duration: 4000 })
    );
    
    // Repeating animation
    const interval = setInterval(() => {
      flowAnimation.value = withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 })
      );
    }, 8000);

    // Ripple effect
    rippleAnimation.value = withSequence(
      withDelay(500, withTiming(1, { duration: 2000 })),
      withTiming(0, { duration: 2000 })
    );

    const rippleInterval = setInterval(() => {
      rippleAnimation.value = withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      );
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(rippleInterval);
    };
  }, []);

  const flowingGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            flowAnimation.value,
            [0, 1],
            [-50, 50],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        flowAnimation.value,
        [0, 0.5, 1],
        [0.6, 1, 0.6],
        Extrapolate.CLAMP
      ),
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        rippleAnimation.value,
        [0, 0.3, 1],
        [0, 0.4, 0],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            rippleAnimation.value,
            [0, 1],
            [0.8, 1.5],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 30,
        overflow: "hidden",
      }}
    >
      <BlurView
        intensity={60}
        tint="dark"
        style={{
          flex: 1,
        }}
      >
        {/* Base liquid gradient - deep glossy blacks */}
        <LinearGradient
          colors={[
            "rgba(10, 10, 15, 0.95)",   // Rich black
            "rgba(20, 20, 25, 0.92)",   // Deep charcoal
            "rgba(15, 15, 20, 0.94)",   // Midnight
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Liquid flowing gradient */}
        <Animated.View style={[flowingGradientStyle, { position: "absolute", width: "200%", height: "100%" }]}>
          <LinearGradient
            colors={[
              "rgba(255, 215, 0, 0.08)",   // Gold flow
              "rgba(218, 165, 32, 0.12)",  // Brighter center
              "rgba(184, 134, 11, 0.06)",  // Dark edge
              "rgba(255, 215, 0, 0.08)",   // Gold flow
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flex: 1,
            }}
          />
        </Animated.View>

        {/* Glossy top reflection - like liquid surface */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.12)",
            "rgba(255, 255, 255, 0.04)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "40%",
            top: 0,
          }}
        />

        {/* Liquid ripple effect */}
        <Animated.View style={[rippleStyle, { position: "absolute", width: "100%", height: "100%" }]}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255, 215, 0, 0.15)",
              "rgba(255, 255, 255, 0.08)",
              "rgba(255, 215, 0, 0.15)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
            }}
          />
        </Animated.View>

        {/* Bottom depth shadow - liquid depth effect */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0, 0, 0, 0.3)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "30%",
            bottom: 0,
          }}
        />

        {/* Edge highlights for 3D liquid effect */}
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
      </BlurView>
    </View>
  );
}

function LuxuryTabIcon({
  name,
  color,
  focused,
  isCenter = false,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  isCenter?: boolean;
}) {
  const scaleAnimation = useSharedValue(focused ? 1 : 0);
  const rotateAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);

  useEffect(() => {
    scaleAnimation.value = withSpring(focused ? 1 : 0, {
      damping: 12,
      stiffness: 150,
    });
    
    if (focused) {
      rotateAnimation.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withSpring(0, { damping: 10 })
      );
      
      glowAnimation.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(100, withTiming(0.7, { duration: 500 }))
      );
    } else {
      glowAnimation.value = withTiming(0, { duration: 300 });
    }
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            scaleAnimation.value,
            [0, 1],
            [1, isCenter ? 1.25 : 1.15],
            Extrapolate.CLAMP
          ),
        },
        {
          rotate: `${rotateAnimation.value}deg`,
        },
      ],
      opacity: interpolate(
        scaleAnimation.value,
        [0, 1],
        [0.6, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scaleAnimation.value,
        [0, 1],
        [0, 0.15],
        Extrapolate.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            scaleAnimation.value,
            [0, 1],
            [0.8, 1.2],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowAnimation.value,
      transform: [
        {
          scale: interpolate(
            glowAnimation.value,
            [0, 1],
            [0.8, 1.5],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const accentDotStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(focused ? 1 : 0, {
        damping: 15,
        stiffness: 200,
      }),
      transform: [
        {
          scale: withSpring(focused ? 1 : 0, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: isCenter ? 60 : 50,
        height: isCenter ? 60 : 50,
      }}
    >
     

      {/* Subtle background circle */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: isCenter ? 25 : 25,
            height: isCenter ? 25 : 25,
            borderRadius: isCenter ? 24 : 20,
            backgroundColor: "rgba(255, 215, 0, 0.1)",
            borderWidth: focused ? 1 : 0,
            borderColor: "rgba(255, 215, 0, 0.2)",
          },
          backgroundStyle,
        ]}
      />

      {/* Main icon */}
      <Animated.View style={[animatedIconStyle]}>
        <Ionicons
          name={focused ? (name.replace("-outline", "") as any) : name}
          size={isCenter ? 28 : 24}
          color={color}
          style={{
            shadowColor: focused ? "#FFD700" : "#000",
            shadowOpacity: focused ? 0.5 : 0.3,
            shadowOffset: { width: 0, height: focused ? 3 : 2 },
            shadowRadius: focused ? 8 : 4,
          }}
        />
      </Animated.View>

      {/* Premium accent dot for active state */}
      {focused && (
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: isCenter ? -8 : -11,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#FFD700",
              shadowColor: "#FFD700",
              shadowOpacity: 0.8,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 4,
            },
            accentDotStyle,
          ]}
        />
      )}
    </View>
  );
}