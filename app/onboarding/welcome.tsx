import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
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
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/onboarding/onboard-one" as any);
            }
          }}
          style={{
            position: "absolute",
            top: 60,
            left: 24,
            zIndex: 10,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDarkColorScheme
              ? "rgba(255, 255, 255, 0.1)"
              : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Top Section */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* Logo */}
          <Image
            source={require("@/assets/icon.png")}
            style={{
              width: 100,
              height: 100,
              borderRadius: 25,
              marginBottom: 24,
            }}
            resizeMode="contain"
          />

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
            onPress={() => router.push("/onboarding/signin" as any)}
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

          {/* Info Note */}
          <View
            style={{
              backgroundColor: isDarkColorScheme
                ? "rgba(13, 165, 165, 0.1)"
                : "rgba(13, 165, 165, 0.05)",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 20,
              }}
            >
              No signup needed! Simply enter your email and we'll send you a secure login code.
            </Text>
          </View>

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