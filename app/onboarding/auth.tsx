import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/services/useNotifications";
import { AppAlert } from "@/components/AppAlert";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { signInWithGoogle } from "@/src/lib/googleSignin";
import { authApi, WalletAuthResponse } from "@/services/api/auth.api";
import LottieView from "lottie-react-native";
import EmeraldLoader from "@/components/EmeraldLoader";
import { useWalletConnect } from "@/src/wallet/WalletConnectProvider";

const { width, height } = Dimensions.get("window");

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

export default function AuthScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn, enterGuestMode, isAuthenticated } = useAuth();
  const { expoPushToken } = useNotifications();
  const { connect, isConnected, address } = useWalletConnect();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<'email' | 'password'>('email');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [pendingWalletAuth, setPendingWalletAuth] = useState(false);
  
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  // Email is visible by default (0), password starts off-screen to the right
  const emailSlideX = useSharedValue(0);
  const passwordSlideX = useSharedValue(width);
  
  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

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

  // Animate content on mount
  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  // Auto-authenticate when wallet address becomes available after connection
  useEffect(() => {
    if (pendingWalletAuth && address && isConnected && !isAuthenticated) {
      const authenticateWallet = async () => {
        try {
          setIsWalletConnecting(true);
          console.log('[Wallet Auth] Authenticating with wallet address:', address);
          
          const response = await authApi.walletConnect({
            walletAddress: address,
            expoToken: expoPushToken || undefined,
          });
          
          console.log('[Wallet Auth] Authentication successful, signing in...');
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
          console.error('[Wallet Auth] Authentication error:', error);
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

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 20 }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: emailSlideX.value }],
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: passwordSlideX.value }],
  }));

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
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
          },
        });
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
        },
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailNext = async () => {
    // Validate email before proceeding
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setAlertState({
        visible: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    try {
      // Check if email exists in database
      const result = await authApi.checkEmail(email.trim());
      
      if (result.exists) {
        // Email exists - proceed to password step for login
        setAuthMode('signin');
        emailSlideX.value = withTiming(-width, { duration: 300 });
        passwordSlideX.value = withTiming(0, { duration: 300 });
        setCurrentStep('password');
      } else {
        // Email doesn't exist - route to signup with email pre-filled
        router.push({
          pathname: "/onboarding/signup" as any,
          params: { email: email.trim() },
        });
      }
    } catch (error) {
      // If check fails, assume email doesn't exist and route to signup
      console.error('Error checking email:', error);
      router.push({
        pathname: "/onboarding/signup" as any,
        params: { email: email.trim() },
      });
    }
  };

  const handlePasswordBack = () => {
    // Slide password right and email back from left
    passwordSlideX.value = withTiming(width, { duration: 300 });
    emailSlideX.value = withTiming(0, { duration: 300 });
    setCurrentStep('email');
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim() || password.length < 6) {
      setAlertState({
        visible: true,
        title: 'Invalid Password',
        message: 'Password must be at least 6 characters.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    // Determine if signin or signup based on authMode
    // If authMode is null, check if user exists (signin) or create new (signup)
    if (authMode === 'signin') {
      // Handle sign in
      try {
        const response = await authApi.login({
          email: email.trim(),
          password: password,
          expoToken: expoPushToken || undefined,
        });
        await signIn(response.token, response.refreshToken);
      } catch (error) {
        const friendlyMessage = getFriendlyErrorMessage(error);
        setAlertState({
          visible: true,
          title: 'Sign In Failed',
          message: friendlyMessage,
          type: 'error',
          onConfirm: () => {
            setAlertState(prev => ({ ...prev, visible: false }));
          },
        });
      }
    } else if (authMode === 'signup') {
      // Navigate to signup with email pre-filled
      router.push({
        pathname: "/onboarding/signup" as any,
        params: { email: email.trim() },
      });
    } else {
      // Try signin first, if fails, go to signup
      try {
        const response = await authApi.login({
          email: email.trim(),
          password: password,
          expoToken: expoPushToken || undefined,
        });
        await signIn(response.token, response.refreshToken);
      } catch (error: any) {
        // If user not found, go to signup
        if (error.message?.includes('not found') || error.message?.includes('404')) {
          router.push({
            pathname: "/onboarding/signup" as any,
            params: { email: email.trim(), password: password },
          });
        } else {
          const friendlyMessage = getFriendlyErrorMessage(error);
          setAlertState({
            visible: true,
            title: 'Sign In Failed',
            message: friendlyMessage,
            type: 'error',
            onConfirm: () => {
              setAlertState(prev => ({ ...prev, visible: false }));
            },
          });
        }
      }
    }
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setCurrentStep('email');
    emailSlideX.value = withTiming(0, { duration: 300 });
    passwordSlideX.value = withTiming(width, { duration: 300 });
    setEmail('');
    setPassword('');
  };

  const handleGuestMode = () => {
    enterGuestMode();
    router.replace('/(tabs)/home' as any);
  };

  const handleButtonPress = (callback: () => void) => {
    buttonScale.value = withTiming(0.95, { duration: 100 }, () => {
      buttonScale.value = withTiming(1, { duration: 100 });
    });
    callback();
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      
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

      {/* Full-Screen Background Image */}
      {/* <ImageBackground
        source={require("@/assets/house.jpg")}
        style={{
          width: width,
          height: height,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        resizeMode="cover"
      > */}
        {/* Dark Gradient Overlay */}
        {/* <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        /> */}

         {/* <LinearGradient
          colors={['rgb(0, 0, 0)', 'rgb(0, 0, 0)', 'rgba(32, 134, 29, 0.78)', 'rgba(115, 194, 24, 0.92)']}
          locations={[0, 0.5, 0.8, 1]}
          style={{
            position: 'absolute',
            top: '0%',
            left: '0%',
            right: '0%',
            bottom: '0%',
          }}
        /> */}

          <LottieView
            source={require("@/assets/Gradient-Animation.json")}
            autoPlay
            loop={true}
            style={{
              position: 'absolute',
              width: height,
              height: width,
              top: (width - height),
              left: (height - width) / 2,
              transform: [
                { rotate: '90deg' },
                { scale: Math.max(width/100 , height/1000) }
              ]
            }}
          />

        {/* Content Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                {
                  flex: 1,
                  minHeight: height - 100,
                  justifyContent: 'flex-end',
                },
                contentAnimatedStyle,
              ]}
            >
              {/* Top Section - Brand Area - Fixed */}
              <View
                style={{
                  minHeight: 280,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: '20%',
                  marginTop: '10%',
                 
                }}
              >
            <Animated.View
              entering={FadeIn.delay(200).duration(600)}
              style={{
                alignItems: 'center',
              }}
            >
              {/* Logo */}
              <Image
                source={require("@/assets/icon.png")}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  marginBottom: 16,
                  borderWidth: 2,
                  padding: 10,
                  borderColor: 'rgb(62, 255, 24)',
                  shadowColor: 'rgb(62, 255, 24)',
                  shadowOffset: { width: 20, height: 20 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
   
                }}
                resizeMode="contain"
              />

              {/* App Name */}
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  marginBottom: 8,
                  letterSpacing: 0.5,
                }}
              >
                Blocks
              </Text>

              {/* Tagline */}
              <Text
                style={{
                  fontSize: 16,
                  color: 'rgba(255, 255, 255, 0.85)',
                  textAlign: 'center',
                  paddingHorizontal: 40,
                  lineHeight: 22,
                }}
              >
                Your gateway to real estate investing
              </Text>
            </Animated.View>
          </View>




          {/* Bottom Section - Authentication Actions - Moves with keyboard */}
          <Animated.View
             entering={FadeInDown.delay(400).duration(600)}
             style={{
               paddingBottom: 40,
               gap: 12,
               marginTop: '20%',
             }}>
             {/* Email/Password Input Section - Visible by default above buttons */}
             <View
               style={{
                flexDirection:'column',
                width: '100%',
                marginBottom: 12,
                
               }}
             >
                
            {/* Email Input - Slides Left */}
            <Animated.View style={emailAnimatedStyle}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 28,
                    paddingHorizontal: 20,
                    height: 56,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Ionicons name="mail-outline" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
                  <TextInput
                    ref={emailInputRef}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    maxLength={255}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: '#FFFFFF',
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleEmailNext}
                  disabled={!email.trim()}
                  style={{
                    backgroundColor: colors.primary,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: email.trim() ? 1 : 0.5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward" size={24} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: 8 }}>We’ll check if you already have an account.</Text>
            </Animated.View>

            {/* Password Input - Slides in from Right */}
            <Animated.View style={passwordAnimatedStyle}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center',marginTop:-80 }}>
                <TouchableOpacity
                  onPress={handlePasswordBack}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 28,
                    paddingHorizontal: 20,
                    height: 56,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                        <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
                        <TextInput
                          ref={passwordInputRef}
                          value={password}
                          onChangeText={setPassword}
                          placeholder="Enter your password"
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                          maxLength={128}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={{
                            flex: 1,
                            fontSize: 16,
                            color: '#FFFFFF',
                          }}
                        />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={handlePasswordSubmit}
                  disabled={!password.trim() || password.length < 6}
                  style={{
                    backgroundColor: colors.primary,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: password.trim() && password.length >= 6 ? 1 : 0.5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={24} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
            </Animated.View>
               </View>
             {/* Primary Button - Continue with Google */}
             
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={() => handleButtonPress(handleGoogleLogin)}
                disabled={isGoogleLoading}
                style={{
                  backgroundColor: '#000000',
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: '#000000',
                  opacity: isGoogleLoading ? 0.7 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                    <Text
                      style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 16,
                        fontWeight: '500',
                        letterSpacing: 0.3,
                      }}
                    >
                      Sign in with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Connect Wallet Button (No KYC Required) */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={async () => {
                  console.log('[Auth] Connect Wallet button pressed');
                  console.log('[Auth] Current state:', { isConnected, address: address ? `${address.slice(0, 10)}...` : null });
                  
                  try {
                    // If already connected, authenticate immediately
                    if (isConnected && address) {
                      console.log('[Auth] Already connected, authenticating...');
                      setIsWalletConnecting(true);
                      
                      try {
                        console.log('[Auth] Calling walletConnect API with address:', address);
                        const response = await Promise.race([
                          authApi.walletConnect({
                            walletAddress: address,
                            expoToken: expoPushToken || undefined,
                          }),
                          new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
                          ),
                        ]) as WalletAuthResponse;
                        
                        console.log('[Auth] API response received:', { 
                          hasToken: !!response.token, 
                          isNewUser: response.isNewUser 
                        });
                        
                        console.log('[Auth] Signing in with token...');
                        await signIn(response.token, response.refreshToken);
                        console.log('[Auth] Sign in successful');
                        
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
                        console.error('[Auth] Authentication API error:', apiError);
                        setIsWalletConnecting(false);
                        throw apiError; // Re-throw to be caught by outer catch
                      }
                    }
                    
                    // Set flag to trigger authentication when wallet connects
                    // Do this BEFORE opening modal so useEffect can catch the connection
                    setPendingWalletAuth(true);
                    
                    // Simply open WalletConnect modal (same as wallet screen)
                    console.log('[Auth] Opening WalletConnect modal...');
                    await connect();
                    console.log('[Auth] WalletConnect modal opened');
                    // Note: Authentication will happen automatically via useEffect when address becomes available
                  } catch (error: any) {
                    console.error('[Auth] Wallet connect error:', error);
                    console.error('[Auth] Error details:', {
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
                disabled={isWalletConnecting || pendingWalletAuth}
                style={{
                  height: 56,
                  borderRadius: 28,
                  marginTop: 12,
                  opacity: (isWalletConnecting || pendingWalletAuth) ? 0.6 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                  overflow: 'hidden',
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3b82f6', '#60a5fa', '#93c5fd']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 12,
                  }}
                >
                  {(isWalletConnecting || pendingWalletAuth) ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 16,
                          fontWeight: '600',
                          letterSpacing: 0.3,
                        }}
                      >
                        {pendingWalletAuth ? 'Connecting...' : 'Authenticating...'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 16,
                          fontWeight: '600',
                          letterSpacing: 0.3,
                        }}
                      >
                        Continue With Wallet
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Tertiary Button - Create an account */}
          {/*  <TouchableOpacity
            //   onPress={() => {
            //     setAuthMode('signup');
            //     setEmail('');
            //     setPassword('');
            //     setCurrentStep('email');
            //     emailSlideX.value = withTiming(0, { duration: 300 });
            //     passwordSlideX.value = withTiming(width, { duration: 300 });
            //   }}
            onPress={() => router.push("/onboarding/signup")}
              style={{
                backgroundColor: 'transparent',
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }}
              >
                Create an account
              </Text>
            </TouchableOpacity>
            */}

            {/* Optional - Continue as Guest */}
            <TouchableOpacity
              onPress={() => handleButtonPress(handleGuestMode)}
              style={{
                backgroundColor: 'transparent',
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 15,
                  fontWeight: '500',
                }}
              >
                Continue as Guest
              </Text>
            </TouchableOpacity>

            {/* Legal / Footer Text */}
            <Text
              style={{
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginTop: 24,
                paddingHorizontal: 20,
                lineHeight: 16,
              }}
            >
              By continuing, you agree to our{' '}
              <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
            </Text>
          </Animated.View>
          </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      {/* </ImageBackground> */}
    </View>
  );
}
