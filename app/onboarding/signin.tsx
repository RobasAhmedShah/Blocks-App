import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/auth.api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

export default function SignInScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn, loginWithBiometrics, isBiometricEnrolled, isBiometricSupported, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const hasAttemptedAutoLogin = useRef(false);

  const emailOpacity = useSharedValue(0);
  const passwordOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    emailOpacity.value = withTiming(1, { duration: 400 });
    passwordOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  // Auto-login with biometrics if enrolled - only when screen is focused and user is not authenticated
  useFocusEffect(
    React.useCallback(() => {
      // Reset the flag when screen is focused
      hasAttemptedAutoLogin.current = false;
      
      const attemptBiometricLogin = async () => {
        // Only attempt if:
        // 1. User is NOT already authenticated
        // 2. Biometric is enrolled and supported
        // 3. We haven't already attempted auto-login
        if (!isAuthenticated && isBiometricEnrolled && isBiometricSupported && !hasAttemptedAutoLogin.current) {
          hasAttemptedAutoLogin.current = true;
          setIsBiometricLoading(true);
          try {
            const success = await loginWithBiometrics();
            if (!success) {
              console.log('Biometric authentication failed or was cancelled');
            }
          } catch (error) {
            console.error('Auto biometric login error:', error);
          } finally {
            setIsBiometricLoading(false);
          }
        }
      };

      // Small delay to ensure screen is fully mounted
      const timer = setTimeout(() => {
        attemptBiometricLogin();
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }, [isAuthenticated, isBiometricEnrolled, isBiometricSupported, loginWithBiometrics])
  );

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailOpacity.value,
    transform: [{ translateY: withSpring((1 - emailOpacity.value) * 20) }],
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    opacity: passwordOpacity.value,
    transform: [{ translateY: withSpring((1 - passwordOpacity.value) * 20) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      // Call the real API
      const response = await authApi.login({
        email: email.trim(),
        password: password,
      });
      
      // Call signIn from AuthContext with both tokens
      await signIn(response.token, response.refreshToken);
      
      // The AuthContext will handle the navigation to /(tabs)/home
    } catch (error) {
      console.error('Sign in error:', error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'Failed to sign in. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/onboarding/signup" as any);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot Password",
      "Password reset functionality will be available soon.",
      [{ text: "OK" }]
    );
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    setApiError(null);
    try {
      const success = await loginWithBiometrics();
      if (!success) {
        setApiError('Biometric authentication failed. Please try again or use your password.');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setApiError('Failed to authenticate with biometrics. Please try again.');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDarkColorScheme
          ? ["#0B3D36", "#102222", "#0B1F1C"]
          : [colors.background, colors.card, colors.background]
      }
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/onboarding/welcome" as any);
                }
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkColorScheme
                  ? "rgba(255, 255, 255, 0.1)"
                  : colors.muted,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Header */}
            <View style={{ marginBottom: 40 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                  marginBottom: 12,
                }}
              >
                Welcome Back
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                Sign in to continue to Blocks
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 24 }}>
              {/* Email Input */}
              <Animated.View style={emailAnimatedStyle}>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Email
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkColorScheme
                        ? "rgba(255, 255, 255, 0.1)"
                        : colors.input,
                      borderRadius: 12,
                      borderWidth: errors.email ? 1 : 0,
                      borderColor: colors.destructive,
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={errors.email ? colors.destructive : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors({ ...errors, email: undefined });
                        }
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && (
                    <Text
                      style={{
                        color: colors.destructive,
                        fontSize: 12,
                        marginTop: 6,
                        marginLeft: 4,
                      }}
                    >
                      {errors.email}
                    </Text>
                  )}
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={passwordAnimatedStyle}>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Password
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkColorScheme
                        ? "rgba(255, 255, 255, 0.1)"
                        : colors.input,
                      borderRadius: 12,
                      borderWidth: errors.password ? 1 : 0,
                      borderColor: colors.destructive,
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={errors.password ? colors.destructive : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors({ ...errors, password: undefined });
                        }
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Text
                      style={{
                        color: colors.destructive,
                        fontSize: 12,
                        marginTop: 6,
                        marginLeft: 4,
                      }}
                    >
                      {errors.password}
                    </Text>
                  )}
                </View>
              </Animated.View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{ alignSelf: "flex-end" }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={isLoading}
                  style={{
                    backgroundColor: colors.primary,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          color: colors.primaryForeground,
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        Signing in...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: colors.primaryForeground,
                        fontSize: 16,
                        fontWeight: "bold",
                        letterSpacing: 0.5,
                      }}
                    >
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* API Error Message */}
              {apiError && (
                <View
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(239, 68, 68, 0.05)",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.destructive,
                    padding: 16,
                    marginTop: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="alert-circle" size={20} color={colors.destructive} />
                    <Text
                      style={{
                        flex: 1,
                        color: colors.destructive,
                        fontSize: 14,
                        lineHeight: 20,
                      }}
                    >
                      {apiError}
                    </Text>
                  </View>
                </View>
              )}

              {/* Biometric Login Button */}
              {isBiometricSupported && isBiometricEnrolled && (
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={isBiometricLoading}
                  style={{
                    backgroundColor: isDarkColorScheme
                      ? "rgba(22, 163, 74, 0.15)"
                      : "rgba(22, 163, 74, 0.1)",
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 12,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    opacity: isBiometricLoading ? 0.7 : 1,
                    marginTop: 16,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="finger-print"
                    size={24}
                    color={colors.primary}
                  />
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: "bold",
                      letterSpacing: 0.5,
                    }}
                  >
                    {isBiometricLoading ? "Authenticating..." : "Login with Biometric"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 32,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  marginHorizontal: 16,
                }}
              >
                OR
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Sign Up Link */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 40,
              }}
            >
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                }}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

