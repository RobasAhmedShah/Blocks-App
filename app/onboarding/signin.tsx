import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { authApi, WalletAuthResponse } from "@/services/api/auth.api";
import { useNotifications } from "@/services/useNotifications";
import { AppAlert } from "@/components/AppAlert";
import { useWalletConnect } from "@/src/wallet/WalletConnectProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { signInWithGoogle } from "@/src/lib/googleSignin";
import EmeraldLoader from "@/components/EmeraldLoader";
import { SvgXml } from "react-native-svg";

// Google SVG Logo
const googleLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>`;

// Validation Rules & Regex
const VALIDATION_RULES = {
  EMAIL: {
    MAX_LENGTH: 100,
    REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
};

// Validation Helper Functions
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

const validatePassword = (value: string): { isValid: boolean; error?: string } => {
  if (!value) {
    return { isValid: false, error: "Password is required" };
  }
  
  if (value.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters` };
  }
  
  if (value.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    return { isValid: false, error: "Password is too long" };
  }
  
  return { isValid: true };
};

// Helper function to convert error messages to user-friendly messages
const getFriendlyErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Something went wrong. Please try again.';
  }

  const errorMessage = error.message.toLowerCase();
  const errorString = error.message;

  // Network/Connection errors
  if (
    errorMessage.includes('network request failed') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('networkerror') ||
    errorMessage.includes('connection')
  ) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // HTTP Status Code errors
  if (errorString.includes('HTTP 401') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (errorString.includes('HTTP 404') || errorMessage.includes('not found')) {
    return 'Account not found. Please check your email address or sign up for a new account.';
  }

  if (errorString.includes('HTTP 500') || errorMessage.includes('internal server error')) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  if (errorString.includes('HTTP 400') || errorMessage.includes('bad request')) {
    return 'Invalid request. Please check your information and try again.';
  }

  if (errorString.includes('HTTP 403') || errorMessage.includes('forbidden')) {
    return 'Access denied. Please contact support if you believe this is an error.';
  }

  if (errorString.includes('HTTP 429') || errorMessage.includes('too many requests')) {
    return 'Too many sign-in attempts. Please wait a moment before trying again.';
  }

  // Specific error messages from backend
  if (errorMessage.includes('invalid email') || errorMessage.includes('email')) {
    return 'Please enter a valid email address.';
  }

  if (errorMessage.includes('password') && errorMessage.includes('incorrect')) {
    return 'Incorrect password. Please try again or use "Forgot Password" to reset it.';
  }

  if (errorMessage.includes('user not found') || errorMessage.includes('account')) {
    return 'No account found with this email. Please sign up or check your email address.';
  }

  if (errorMessage.includes('account locked') || errorMessage.includes('suspended')) {
    return 'Your account has been temporarily locked. Please contact support for assistance.';
  }

  // If error message is already user-friendly, use it
  if (
    !errorString.includes('HTTP') &&
    !errorString.includes('404') &&
    !errorString.includes('401') &&
    !errorString.includes('500') &&
    errorString.length < 100
  ) {
    return error.message;
  }

  // Default fallback
  return 'Unable to sign in. Please check your credentials and try again.';
};

export default function SignInScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn, loginWithBiometrics, isBiometricEnrolled, isBiometricSupported, isAuthenticated, enterGuestMode, isGuest, setInitialGuestMode } = useAuth();
  const { expoPushToken } = useNotifications();
  const { connect, isConnected, address } = useWalletConnect();
  
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [pendingWalletAuth, setPendingWalletAuth] = useState(false);
  
  // Auto-authenticate when wallet address becomes available after connection
  useEffect(() => {
    if (pendingWalletAuth && address && isConnected && !isAuthenticated) {
      const authenticateWallet = async () => {
        try {
          setIsWalletConnecting(true);
          console.log('[Wallet Sign-In] Authenticating with wallet address:', address);
          
          const response = await authApi.walletConnect({
            walletAddress: address,
            expoToken: expoPushToken || undefined,
          });
          
          console.log('[Wallet Sign-In] Authentication successful, signing in...');
          await signIn(response.token, response.refreshToken);
          setPendingWalletAuth(false);
          
          if (response.isNewUser) {
            setAlertState({
              visible: true,
              title: 'Welcome!',
              message: 'Your wallet account has been created. You can now use all features without KYC.',
              type: 'success',
              onConfirm: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
              },
            });
          }
        } catch (error: any) {
          console.error('[Wallet Sign-In] Authentication error:', error);
          setPendingWalletAuth(false);
          const friendlyMessage = getFriendlyErrorMessage(error);
          setAlertState({
            visible: true,
            title: 'Wallet Authentication Failed',
            message: friendlyMessage,
            type: 'error',
            onConfirm: () => {
              setAlertState(prev => ({ ...prev, visible: false }));
            },
          });
        } finally {
          setIsWalletConnecting(false);
        }
      };
      
      // Small delay to ensure connection is fully established
      const timer = setTimeout(() => {
        authenticateWallet();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [address, isConnected, pendingWalletAuth, isAuthenticated, expoPushToken, signIn]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  
  const [apiError, setApiError] = useState<string | null>(null);
  const hasAttemptedAutoLogin = useRef(false);
  
  // Alert state
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const emailOpacity = useSharedValue(0);
  const passwordOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    emailOpacity.value = withTiming(1, { duration: 400 });
    passwordOpacity.value = withTiming(1, { duration: 600 });
    setInitialGuestMode();
  }, []);
  // Real-time validation
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
    }
  }, [password, touched.password]);

  // Auto-login with biometrics if enrolled
  useFocusEffect(
    React.useCallback(() => {
      hasAttemptedAutoLogin.current = false;
      
      const attemptBiometricLogin = async () => {
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

  const handleEmailChange = (text: string) => {
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

  const validateForm = () => {
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    const newErrors: { email?: string; password?: string } = {};
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error;

    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
    });

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
      const response = await authApi.login({
        email: email.trim(),
        password: password,
        expoToken: expoPushToken || undefined, // Include Expo push token if available
      });
      
      await signIn(response.token, response.refreshToken);
    } catch (error) {
      // console.error('Sign in error:', error);
      const friendlyMessage = getFriendlyErrorMessage(error);
      setAlertState({
        visible: true,
        title: 'Sign In Failed',
        message: friendlyMessage,
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
          setApiError(null);
        },
      });
      // Also set apiError for inline display (optional, can be removed if using only alerts)
      setApiError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setApiError(null);
    
    try {
      // Use native Google Sign-In (Android only)
      const userInfo = await signInWithGoogle();
      
      // Extract idToken from the response
      const idToken = userInfo.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Google Sign-In userInfo:', {
        email: userInfo.user.email,
        name: userInfo.user.name,
        id: userInfo.user.id,
      });
  
      // Send ID token to backend for verification and session creation
      const response = await authApi.googleLogin({
        idToken: idToken,
        expoToken: expoPushToken || undefined,
      });
  
      await signIn(response.token, response.refreshToken);
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      
      // Handle user cancellation gracefully (not an error)
      if (error.message === 'Sign-in was cancelled') {
        setIsGoogleLoading(false);
        return;
      }
      
      // Check for Expo Go / native module errors
      if (
        error.message?.includes('TurboModuleRegistry') ||
        error.message?.includes('RNGoogleSignin') ||
        error.message?.includes('requires a dev build') ||
        error.message?.includes('Expo Go does not support')
      ) {
        setAlertState({
          visible: true,
          title: 'Dev Build Required',
          message:
            'Google Sign-In requires a dev build and cannot run in Expo Go.\n\n' +
            'To use this feature:\n' +
            '1. Build a dev client:\n   eas build --profile development --platform android\n' +
            '2. Install the APK on your device\n' +
            '3. Run: expo start --dev-client\n\n' +
            'Native modules like Google Sign-In are not available in Expo Go.',
          type: 'error',
          onConfirm: () => {
            setAlertState(prev => ({ ...prev, visible: false }));
            setApiError(null);
          },
        });
        setApiError('Google Sign-In requires a dev build');
        setIsGoogleLoading(false);
        return;
      }
      
      const friendlyMessage = getFriendlyErrorMessage(error);
      setAlertState({
        visible: true,
        title: 'Google Sign-In Failed',
        message: friendlyMessage,
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
          setApiError(null);
        },
      });
      setApiError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/onboarding/signup" as any);
  };

  const handleForgotPassword = () => {
    setAlertState({
      visible: true,
      title: 'Forgot Password',
      message: 'Password reset functionality will be available soon. Please contact support if you need assistance.',
      type: 'info',
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    setApiError(null);
    try {
      const success = await loginWithBiometrics();
      if (!success) {
        setAlertState({
          visible: true,
          title: 'Biometric Authentication Failed',
          message: 'Unable to verify your identity. Please try again or use your password to sign in.',
          type: 'error',
          onConfirm: () => {
            setAlertState(prev => ({ ...prev, visible: false }));
          },
        });
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setAlertState({
        visible: true,
        title: 'Authentication Error',
        message: 'Failed to authenticate with biometrics. Please try again or use your password.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const isFormValid = () => {
    return validateEmail(email).isValid && validatePassword(password).isValid;
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
      
      {/* App Alert */}
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm || (() => {
          setAlertState(prev => ({ ...prev, visible: false }));
        })}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="never"
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
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        // Focus password input or dismiss keyboard
                        Keyboard.dismiss();
                      }}
                      blurOnSubmit={false}
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
                      placeholder="Enter your password"
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
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        Keyboard.dismiss();
                        if (email && password && !errors.email && !errors.password) {
                          handleSignIn();
                        }
                      }}
                      blurOnSubmit={true}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ padding: 4, marginRight: 4 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {!errors.password && touched.password && password && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                  {errors.password && touched.password && (
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
                  disabled={isLoading || !isFormValid()}
                  style={{
                    backgroundColor: (!isFormValid() || isLoading) ? colors.border : colors.primary,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
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
                        color: (!isFormValid() || isLoading) ? colors.textMuted : colors.primaryForeground,
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

              {/* Continue with Google Button */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading}
                style={{
                  backgroundColor: 'transparent',
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "flex-start",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 12,
                  flexDirection: "row",
                  paddingHorizontal: 20,
                  opacity: isGoogleLoading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  </View>
                ) : (
                  <>
                    <SvgXml xml={googleLogoSvg} width={24} height={24} />
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: 0.5,
                        marginLeft: 12,
                        flex: 1,
                        textAlign: "center",
                        marginRight: 36,
                      }}
                    >
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Connect Wallet Button (No KYC Required) */}
              <TouchableOpacity
                onPress={async () => {
                  console.log('[Sign-In] Connect Wallet button pressed');
                  console.log('[Sign-In] Current state:', { isConnected, address: address ? `${address.slice(0, 10)}...` : null });
                  
                  try {
                    // If already connected, authenticate immediately
                    if (isConnected && address) {
                      console.log('[Sign-In] Already connected, authenticating...');
                      setIsWalletConnecting(true);
                      
                      try {
                        console.log('[Sign-In] Calling walletConnect API with address:', address);
                        const response = await Promise.race([
                          authApi.walletConnect({
                            walletAddress: address,
                            expoToken: expoPushToken || undefined,
                          }),
                          new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
                          ),
                        ]) as WalletAuthResponse;
                        
                        console.log('[Sign-In] API response received:', { 
                          hasToken: !!response.token, 
                          isNewUser: response.isNewUser 
                        });
                        
                        console.log('[Sign-In] Signing in with token...');
                        await signIn(response.token, response.refreshToken);
                        console.log('[Sign-In] Sign in successful');
                        
                        if (response.isNewUser) {
                          setAlertState({
                            visible: true,
                            title: 'Welcome!',
                            message: 'Your wallet account has been created. You can now use all features without KYC.',
                            type: 'success',
                            onConfirm: () => {
                              setAlertState(prev => ({ ...prev, visible: false }));
                            },
                          });
                        }
                        setIsWalletConnecting(false);
                        return;
                      } catch (apiError: any) {
                        console.error('[Sign-In] Authentication API error:', apiError);
                        setIsWalletConnecting(false);
                        throw apiError; // Re-throw to be caught by outer catch
                      }
                    }
                    
                    // Set flag to trigger authentication when wallet connects
                    // Do this BEFORE opening modal so useEffect can catch the connection
                    setPendingWalletAuth(true);
                    
                    // Simply open WalletConnect modal (same as wallet screen)
                    console.log('[Sign-In] Opening WalletConnect modal...');
                    await connect();
                    console.log('[Sign-In] WalletConnect modal opened');
                    // Note: Authentication will happen automatically via useEffect when address becomes available
                  } catch (error: any) {
                    console.error('[Sign-In] Wallet connect error:', error);
                    console.error('[Sign-In] Error details:', {
                      message: error?.message,
                      stack: error?.stack,
                      name: error?.name,
                    });
                    setPendingWalletAuth(false);
                    setIsWalletConnecting(false);
                    
                    // Show all errors to help debug
                    const errorMessage = error?.message || 'Unknown error occurred';
                    setAlertState({
                      visible: true,
                      title: 'Wallet Connection Failed',
                      message: `Failed to open wallet connection: ${errorMessage}\n\nPlease try again or check your wallet app.`,
                      type: 'error',
                      onConfirm: () => {
                        setAlertState(prev => ({ ...prev, visible: false }));
                      },
                    });
                  }
                }}
                disabled={isWalletConnecting}
                style={{
                  backgroundColor: isDarkColorScheme
                    ? "rgba(139, 92, 246, 0.15)"
                    : "rgba(139, 92, 246, 0.1)",
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: '#8b5cf6',
                  marginTop: 12,
                  flexDirection: "row",
                  gap: 12,
                  opacity: (isWalletConnecting || pendingWalletAuth) ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {(isWalletConnecting || pendingWalletAuth) ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#8b5cf6" />
                    <Text
                      style={{
                        color: '#8b5cf6',
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: 0.5,
                      }}
                    >
                      {pendingWalletAuth ? 'Connecting...' : 'Authenticating...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="wallet-outline" size={24} color="#8b5cf6" />
                    <Text
                      style={{
                        color: '#8b5cf6',
                        fontSize: 16,
                        fontWeight: "600",
                        letterSpacing: 0.5,
                      }}
                    >
                      Connect Wallet (No KYC)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Continue as Guest Button */}
              <TouchableOpacity
                onPress={() => {
                  enterGuestMode();
                  router.replace('/(tabs)/home' as any);
                }}
                style={{
                  backgroundColor: 'transparent',
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 4,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                  }}
                >
                  Continue as Guest
                </Text>
              </TouchableOpacity>

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