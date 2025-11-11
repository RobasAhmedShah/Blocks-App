import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { getMagicInstance, getUserInfo, getStoredDIDToken } from "@/services/magicService";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

export default function SignInScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; otp?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const magicLoginHandleRef = React.useRef<any>(null);

  const emailOpacity = useSharedValue(0);
  const otpOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    emailOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  React.useEffect(() => {
    if (otpSent) {
      otpOpacity.value = withTiming(1, { duration: 600 });
    }
  }, [otpSent]);

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailOpacity.value,
    transform: [{ translateY: withSpring((1 - emailOpacity.value) * 20) }],
  }));

  const otpAnimatedStyle = useAnimatedStyle(() => ({
    opacity: otpOpacity.value,
    transform: [{ translateY: withSpring((1 - otpOpacity.value) * 20) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const validateEmail = () => {
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setErrors({});
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      const magic = getMagicInstance();
      
      // Initiate OTP login with Magic - this sends the OTP email
      magicLoginHandleRef.current = magic.auth.loginWithEmailOTP({ 
        email,
        showUI: false,
        deviceCheckUI: false 
      });

      // Set up event listeners - DON'T AWAIT, let it run asynchronously
      magicLoginHandleRef.current
        .on('email-otp-sent', () => {
          console.log('📧 OTP sent to email');
          setOtpSent(true);
          setIsLoading(false);
          Alert.alert("Code Sent", `A verification code has been sent to ${email}`);
        })
        .on('invalid-email-otp', () => {
          console.log('❌ Invalid OTP');
          setErrors({ otp: 'Invalid verification code. Please try again.' });
          setOtp('');
          setIsLoading(false);
          setRetryCount(prev => prev + 1);
        })
        .on('done', async (didToken: string | null) => {
          console.log('✅ Login successful');
          
          if (didToken) {
            try {
              // Get user info and sign in
              const userInfo = await getUserInfo();
              await signIn(didToken, false, {
                email: userInfo.email,
                publicAddress: userInfo.publicAddress,
              });
              // AuthContext will handle navigation
            } catch (error) {
              console.error('Error getting user info:', error);
              // Still sign in with the token
              await signIn(didToken, false);
            }
          } else {
            setApiError('Authentication failed: No token received.');
            setIsLoading(false);
          }
        })
        .on('error', (error: any) => {
          console.error('🚫 Magic login error:', error);
          setApiError(error?.message || 'Failed to send verification code. Please try again.');
          setIsLoading(false);
          setOtpSent(false);
        })
        .on('settled', () => {
          console.log('🏁 Magic login process settled');
        })
        // Device verification events (optional but recommended)
        .on('device-needs-approval', () => {
          console.log('📱 Device needs approval');
          Alert.alert("Device Verification", "Please check your email to approve this device.");
        })
        .on('device-verification-email-sent', () => {
          console.log('📧 Device verification email sent');
        })
        .on('device-approved', () => {
          console.log('✅ Device approved');
        })
        .on('device-verification-link-expired', () => {
          console.log('⏰ Device verification link expired');
          Alert.alert("Link Expired", "The device verification link has expired. Please try again.");
          setIsLoading(false);
          setOtpSent(false);
        });

      // DON'T await - the promise resolves when authentication is complete (after OTP verification)
      // The event listeners above handle the flow
    } catch (error) {
      console.error('Error initiating Magic login:', error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'Failed to send verification code. Please try again.'
      );
      setIsLoading(false);
      setOtpSent(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a 6-digit code' });
      return;
    }

    if (!magicLoginHandleRef.current) {
      setApiError('Login session not initialized. Please send a new code.');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setErrors({});
    
    try {
      // Emit the OTP verification event to the Magic login handle
      magicLoginHandleRef.current.emit('verify-email-otp', otp);
      // The event listeners set up in handleSendOTP will handle the response
      // (done, invalid-email-otp, or error events)
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setApiError(
        error instanceof Error 
          ? error.message 
          : 'Failed to verify code. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setErrors({});
    setOtpSent(false);
    setRetryCount(0);
    await handleSendOTP();
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
                {otpSent ? "Verify Code" : "Welcome Back"}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {otpSent
                  ? `We sent a verification code to ${email}`
                  : "Sign in with your email - no password needed"}
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 24 }}>
              {/* Email Input */}
              {!otpSent && (
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
                        editable={!isLoading}
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
              )}

              {/* OTP Input */}
              {otpSent && (
                <Animated.View style={otpAnimatedStyle}>
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      Verification Code
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isDarkColorScheme
                          ? "rgba(255, 255, 255, 0.1)"
                          : colors.input,
                        borderRadius: 12,
                        borderWidth: errors.otp ? 1 : 0,
                        borderColor: colors.destructive,
                        paddingHorizontal: 16,
                        height: 56,
                      }}
                    >
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color={errors.otp ? colors.destructive : colors.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        value={otp}
                        onChangeText={(text) => {
                          // Only allow numbers
                          const numericOtp = text.replace(/[^0-9]/g, '');
                          setOtp(numericOtp);
                          if (errors.otp) {
                            setErrors({ ...errors, otp: undefined });
                          }
                          // Auto-submit when 6 digits entered
                          if (numericOtp.length === 6) {
                            handleVerifyOTP();
                          }
                        }}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor={colors.textMuted}
                        style={{
                          flex: 1,
                          fontSize: 20,
                          letterSpacing: 8,
                          color: colors.textPrimary,
                          fontWeight: "bold",
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                        editable={!isLoading}
                      />
                    </View>
                    {errors.otp && (
                      <Text
                        style={{
                          color: colors.destructive,
                          fontSize: 12,
                          marginTop: 6,
                          marginLeft: 4,
                        }}
                      >
                        {errors.otp}
                      </Text>
                    )}

                    {/* Resend OTP */}
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      disabled={isLoading}
                      style={{ marginTop: 12, alignSelf: "flex-end" }}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        Didn't receive code? Resend
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Submit Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  onPress={otpSent ? handleVerifyOTP : handleSendOTP}
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <ActivityIndicator color={colors.primaryForeground} />
                      <Text
                        style={{
                          color: colors.primaryForeground,
                          fontSize: 16,
                          fontWeight: "bold",
                        }}
                      >
                        {otpSent ? "Verifying..." : "Sending code..."}
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
                      {otpSent ? "Verify Code" : "Send Verification Code"}
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

              {/* Info Box */}
              <View
                style={{
                  backgroundColor: isDarkColorScheme
                    ? "rgba(13, 165, 165, 0.1)"
                    : "rgba(13, 165, 165, 0.05)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDarkColorScheme
                    ? "rgba(13, 165, 165, 0.3)"
                    : "rgba(13, 165, 165, 0.2)",
                  padding: 16,
                  marginTop: 16,
                }}
              >
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  <Text
                    style={{
                      flex: 1,
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 20,
                    }}
                  >
                    {otpSent
                      ? "Enter the 6-digit code sent to your email. The code will expire in 10 minutes."
                      : "We'll send a one-time code to your email. No password required - secure and simple!"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer Note */}
            <View
              style={{
                marginTop: "auto",
                paddingBottom: 40,
                paddingTop: 32,
              }}
            >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
