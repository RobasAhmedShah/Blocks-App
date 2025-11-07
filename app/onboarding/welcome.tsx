import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();

  return (
    <LinearGradient
      colors={isDarkColorScheme ? ["#0B3D36", "#102222", "#0B1F1C"] : [colors.background, colors.card, colors.background]}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "space-between" }}>
        {/* Top Section */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* Logo */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 25,
              backgroundColor: isDarkColorScheme ? "rgba(13, 165, 165, 0.2)" : `${colors.primary}20`,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.primary,
              marginBottom: 24,
            }}
          >
            <Ionicons name="apps" size={50} color={colors.primary} />
          </View>

          {/* Welcome Text */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: colors.textPrimary,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Welcome to Blocks
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 20,
            }}
          >
            Start building your real estate portfolio with as little as $100
          </Text>
        </View>

        {/* Bottom Buttons */}
        <View style={{ paddingBottom: 40, gap: 16 }}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)" as any)}
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
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)" as any)}
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

          {/* Terms */}
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            By continuing, you agree to our{" "}
            <Text style={{ color: colors.primary }}>Terms of Service</Text> and{" "}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}