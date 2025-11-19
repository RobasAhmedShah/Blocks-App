import React, { useState, useEffect } from "react";
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
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/auth.api";
import { useNotifications } from "@/services/useNotifications";
import * as Notifications from "expo-notifications";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

// Validation Rules & Regex
const VALIDATION_RULES = {
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    REGEX: /^[a-zA-Z\s'-]+$/,
  },
  EMAIL: {
    MAX_LENGTH: 100,
    REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    UPPERCASE_REGEX: /[A-Z]/,
    LOWERCASE_REGEX: /[a-z]/,
    NUMBER_REGEX: /[0-9]/,
    SPECIAL_CHAR_REGEX: /[!@#$%^&*(),.?":{}|<>]/,
  },
};

// Validation Helper Functions
const validateFullName = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: "Full name is required" };
  }
  
  if (value.trim().length < VALIDATION_RULES.FULL_NAME.MIN_LENGTH) {
    return { isValid: false, error: `Full name must be at least ${VALIDATION_RULES.FULL_NAME.MIN_LENGTH} characters` };
  }
  
  if (value.trim().length > VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
    return { isValid: false, error: `Full name must be less than ${VALIDATION_RULES.FULL_NAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.FULL_NAME.REGEX.test(value.trim())) {
    return { isValid: false, error: "Full name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
};

const validateEmail = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: "Email is required" };
  }
  
  if (value.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
    return { isValid: false, error: "Email is too long" };
  }
  
  if (!VALIDATION_RULES.EMAIL.REGEX.test(value.trim())) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  
  return { isValid: true };
};

const validatePassword = (value: string): { isValid: boolean; error?: string; strength?: number } => {
  if (!value) {
    return { isValid: false, error: "Password is required", strength: 0 };
  }
  
  if (value.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`, strength: 0 };
  }
  
  if (value.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return { isValid: false, error: "Password is too long", strength: 0 };
  }
  
  let strength = 0;
  const hasUppercase = VALIDATION_RULES.PASSWORD.UPPERCASE_REGEX.test(value);
  const hasLowercase = VALIDATION_RULES.PASSWORD.LOWERCASE_REGEX.test(value);
  const hasNumber = VALIDATION_RULES.PASSWORD.NUMBER_REGEX.test(value);
  const hasSpecialChar = VALIDATION_RULES.PASSWORD.SPECIAL_CHAR_REGEX.test(value);
  
  if (!hasUppercase || !hasLowercase) {
    return { isValid: false, error: "Password must contain uppercase and lowercase letters", strength: 1 };
  }
  
  if (hasUppercase) strength++;
  if (hasLowercase) strength++;
  if (hasNumber) strength++;
  if (hasSpecialChar) strength++;
  if (value.length >= 12) strength++;
  
  return { isValid: true, strength };
};

const validateConfirmPassword = (password: string, confirmPassword: string): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  
  return { isValid: true };
};

export default function SignUpScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn, enableBiometrics, isBiometricSupported } = useAuth();
  const { requestPermissions: requestNotificationPermissions, checkPermissions: checkNotificationPermissions } = useNotifications();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const fullNameOpacity = useSharedValue(0);
  const emailOpacity = useSharedValue(0);
  const passwordOpacity = useSharedValue(0);
  const confirmPasswordOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    fullNameOpacity.value = withTiming(1, { duration: 300 });
    emailOpacity.value = withTiming(1, { duration: 400 });
    passwordOpacity.value = withTiming(1, { duration: 600 });
    confirmPasswordOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // Real-time validation
  useEffect(() => {
    if (touched.fullName) {
      const validation = validateFullName(fullName);
      setErrors(prev => ({ ...prev, fullName: validation.error }));
    }
  }, [fullName, touched.fullName]);

  useEffect(() => {
    if (touched.email) {
      const validation = validateEmail(email);
      setErrors(prev => ({ ...prev, email: validation.error }));
    }
  }, [email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      const validation = validatePassword(password);
      setErrors(prev => ({ ...prev, password: validation.error }));
      setPasswordStrength(validation.strength || 0);
    }
  }, [password, touched.password]);

  useEffect(() => {
    if (touched.confirmPassword) {
      const validation = validateConfirmPassword(password, confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: validation.error }));
    }
  }, [password, confirmPassword, touched.confirmPassword]);

  const fullNameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fullNameOpacity.value,
    transform: [{ translateY: withSpring((1 - fullNameOpacity.value) * 20) }],
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailOpacity.value,
    transform: [{ translateY: withSpring((1 - emailOpacity.value) * 20) }],
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    opacity: passwordOpacity.value,
    transform: [{ translateY: withSpring((1 - passwordOpacity.value) * 20) }],
  }));

  const confirmPasswordAnimatedStyle = useAnimatedStyle(() => ({
    opacity: confirmPasswordOpacity.value,
    transform: [{ translateY: withSpring((1 - confirmPasswordOpacity.value) * 20) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleFullNameChange = (text: string) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    const cleanText = text.replace(/[^a-zA-Z\s'-]/g, '');
    if (cleanText.length <= VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
      setFullName(cleanText);
    }
  };

  const handleEmailChange = (text: string) => {
    // Remove spaces and limit length
    const cleanText = text.trim();
    if (cleanText.length <= VALIDATION_RULES.EMAIL.MAX_LENGTH) {
      setEmail(cleanText);
    }
  };

  const handlePasswordChange = (text: string) => {
    if (text.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
      setPassword(text);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    if (text.length <= VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
      setConfirmPassword(text);
    }
  };

  const validateForm = () => {
    const fullNameValidation = validateFullName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

    const newErrors: typeof errors = {};
    if (!fullNameValidation.isValid) newErrors.fullName = fullNameValidation.error;
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error;
    if (!confirmPasswordValidation.isValid) newErrors.confirmPassword = confirmPasswordValidation.error;

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      const response = await authApi.register({
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
      });
      
      await signIn(response.token, response.refreshToken);
      
      // After successful signup, request permissions
      await requestPermissionsOnSignup();
    } catch (error) {
      console.error('Sign up error:', error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissionsOnSignup = async () => {
    // Small delay to ensure sign-in is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Request Biometric Permission
    if (isBiometricSupported) {
      Alert.alert(
        "Enable Biometric Login",
        "Would you like to enable Face ID or Touch ID for faster and more secure login?",
        [
          {
            text: "Not Now",
            style: "cancel",
            onPress: () => {
              // Continue to notification permission
              requestNotificationPermission();
            },
          },
          {
            text: "Enable",
            onPress: async () => {
              try {
                const success = await enableBiometrics();
                if (success) {
                  Alert.alert(
                    "Success",
                    "Biometric login has been enabled!",
                    [{ text: "OK", onPress: () => requestNotificationPermission() }]
                  );
                } else {
                  // User cancelled or failed, continue anyway
                  requestNotificationPermission();
                }
              } catch (error) {
                console.error('Error enabling biometrics:', error);
                // Continue to notification permission even if biometric fails
                requestNotificationPermission();
              }
            },
          },
        ]
      );
    } else {
      // Skip biometric if not supported, go straight to notifications
      requestNotificationPermission();
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const currentPermissions = await checkNotificationPermissions();
      
      // Only ask if not already granted
      if (!currentPermissions.granted && currentPermissions.ios?.status !== Notifications.IosAuthorizationStatus.AUTHORIZED) {
        Alert.alert(
          "Enable Notifications",
          "Stay updated with investment opportunities, property updates, and important account alerts. Enable notifications?",
          [
            {
              text: "Not Now",
              style: "cancel",
            },
            {
              text: "Enable",
              onPress: async () => {
                try {
                  await requestNotificationPermissions();
                  // Permission request completed, user can continue
                } catch (error) {
                  console.error('Error requesting notification permissions:', error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const handleSignIn = () => {
    router.push("/onboarding/signin" as any);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#EF4444';
    if (passwordStrength <= 2) return '#F59E0B';
    if (passwordStrength <= 3) return '#10B981';
    return '#22C55E';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength <= 2) return 'Fair';
    if (passwordStrength <= 3) return 'Good';
    return 'Strong';
  };

  const isFormValid = () => {
    return validateFullName(fullName).isValid &&
           validateEmail(email).isValid &&
           validatePassword(password).isValid &&
           validateConfirmPassword(password, confirmPassword).isValid;
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
                Create Account
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                Sign up to start investing in real estate
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 24 }}>
              {/* Full Name Input */}
              <Animated.View style={fullNameAnimatedStyle}>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Full Name
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkColorScheme
                        ? "rgba(255, 255, 255, 0.1)"
                        : colors.input,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: errors.fullName && touched.fullName
                        ? colors.destructive
                        : !errors.fullName && touched.fullName && fullName
                        ? colors.primary
                        : 'transparent',
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={errors.fullName && touched.fullName ? colors.destructive : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={fullName}
                      onChangeText={handleFullNameChange}
                      onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.textMuted}
                      maxLength={VALIDATION_RULES.FULL_NAME.MAX_LENGTH}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                    {!errors.fullName && touched.fullName && fullName && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                  {errors.fullName && touched.fullName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                      <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                      <Text
                        style={{
                          color: colors.destructive,
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        {errors.fullName}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

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
                      borderWidth: 2,
                      borderColor: errors.email && touched.email
                        ? colors.destructive
                        : !errors.email && touched.email && email
                        ? colors.primary
                        : 'transparent',
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={errors.email && touched.email ? colors.destructive : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={email}
                      onChangeText={handleEmailChange}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textMuted}
                      maxLength={VALIDATION_RULES.EMAIL.MAX_LENGTH}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {!errors.email && touched.email && email && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                  {errors.email && touched.email && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                      <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                      <Text
                        style={{
                          color: colors.destructive,
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        {errors.email}
                      </Text>
                    </View>
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
                      borderWidth: 2,
                      borderColor: errors.password && touched.password
                        ? colors.destructive
                        : !errors.password && touched.password && password
                        ? colors.primary
                        : 'transparent',
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={errors.password && touched.password ? colors.destructive : colors.textMuted}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                      placeholder="Create a password"
                      placeholderTextColor={colors.textMuted}
                      maxLength={VALIDATION_RULES.PASSWORD.MAX_LENGTH}
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
                  
                  {/* Password Strength Indicator */}
                  {touched.password && password && (
                    <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          Password Strength:
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: getPasswordStrengthColor() }}>
                          {getPasswordStrengthText()}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4, height: 4 }}>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <View
                            key={level}
                            style={{
                              flex: 1,
                              backgroundColor: level <= passwordStrength ? getPasswordStrengthColor() : colors.border,
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {errors.password && touched.password ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                      <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                      <Text
                        style={{
                          color: colors.destructive,
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        {errors.password}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 12,
                        marginTop: 6,
                        marginLeft: 4,
                      }}
                    >
                      Min 8 chars, uppercase, lowercase, number & special char recommended
                    </Text>
                  )}
                </View>
              </Animated.View>

              {/* Confirm Password Input */}
              <Animated.View style={confirmPasswordAnimatedStyle}>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 8,
                    }}
                  >
                    Confirm Password
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkColorScheme
                        ? "rgba(255, 255, 255, 0.1)"
                        : colors.input,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: errors.confirmPassword && touched.confirmPassword
                        ? colors.destructive
                        : !errors.confirmPassword && touched.confirmPassword && confirmPassword
                        ? colors.primary
                        : 'transparent',
                      paddingHorizontal: 16,
                      height: 56,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        errors.confirmPassword && touched.confirmPassword ? colors.destructive : colors.textMuted
                      }
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textMuted}
                      maxLength={VALIDATION_RULES.PASSWORD.MAX_LENGTH}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ padding: 4, marginRight: 4 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {!errors.confirmPassword && touched.confirmPassword && confirmPassword && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                      <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                      <Text
                        style={{
                          color: colors.destructive,
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        {errors.confirmPassword}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Sign Up Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={isLoading || !isFormValid()}
                  style={{
                    backgroundColor: (!isFormValid() || isLoading) ? colors.border : colors.primary,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 8,
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
                        Creating account...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: (!isFormValid() || isLoading) ? colors.textMuted : colors.primaryForeground,
                        fontSize: 16,
                        fontWeight: "bold",
                        letterSpacing: 0.5,
                      }}
                    >
                      Create Account
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
            </View>

            {/* Terms */}
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                textAlign: "center",
                lineHeight: 18,
                marginTop: 24,
                marginBottom: 32,
                paddingHorizontal: 20,
              }}
            >
              By creating an account, you agree to our{" "}
              <Text style={{ color: colors.primary }}>Terms of Service</Text> and{" "}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>

            {/* Divider */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 32,
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

            {/* Sign In Link */}
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
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}