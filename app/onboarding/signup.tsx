import React, { useState, useEffect, useRef } from "react";
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
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/lib/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/auth.api";
import { useNotifications } from "@/services/useNotifications";
import { AppAlert } from "@/components/AppAlert";
import * as Notifications from "expo-notifications";
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { MotiView } from "moti";

// Create animated RadialGradient component
const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

const { width } = Dimensions.get('window');

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
const validateFirstName = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: "First name is required" };
  }
  
  if (value.trim().length < VALIDATION_RULES.FULL_NAME.MIN_LENGTH) {
    return { isValid: false, error: `First name must be at least ${VALIDATION_RULES.FULL_NAME.MIN_LENGTH} characters` };
  }
  
  if (value.trim().length > VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
    return { isValid: false, error: `First name must be less than ${VALIDATION_RULES.FULL_NAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.FULL_NAME.REGEX.test(value.trim())) {
    return { isValid: false, error: "First name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  return { isValid: true };
};

const validateLastName = (value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: "Last name is required" };
  }
  
  if (value.trim().length < VALIDATION_RULES.FULL_NAME.MIN_LENGTH) {
    return { isValid: false, error: `Last name must be at least ${VALIDATION_RULES.FULL_NAME.MIN_LENGTH} characters` };
  }
  
  if (value.trim().length > VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
    return { isValid: false, error: `Last name must be less than ${VALIDATION_RULES.FULL_NAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION_RULES.FULL_NAME.REGEX.test(value.trim())) {
    return { isValid: false, error: "Last name can only contain letters, spaces, hyphens, and apostrophes" };
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

// Helper function to convert error messages to user-friendly messages for signup
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
  if (errorString.includes('HTTP 409') || errorMessage.includes('conflict') || errorMessage.includes('already exists') || errorMessage.includes('already registered') || errorMessage.includes('email taken')) {
    return 'This email is already registered. Please sign in or use a different email address.';
  }

  if (errorString.includes('HTTP 400') || errorMessage.includes('bad request')) {
    // Check for specific 400 error messages
    if (errorMessage.includes('email') && (errorMessage.includes('exist') || errorMessage.includes('already') || errorMessage.includes('taken') || errorMessage.includes('registered'))) {
      return 'This email is already registered. Please sign in or use a different email address.';
    }
    if (errorMessage.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('password')) {
      return 'Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.';
    }
    return 'Invalid information provided. Please check your details and try again.';
  }

  if (errorString.includes('HTTP 422') || errorMessage.includes('unprocessable entity') || errorMessage.includes('validation')) {
    return 'Please check your information and ensure all fields are filled correctly.';
  }

  if (errorString.includes('HTTP 500') || errorMessage.includes('internal server error')) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  if (errorString.includes('HTTP 401') || errorMessage.includes('unauthorized')) {
    return 'Authentication failed. Please try again.';
  }

  if (errorString.includes('HTTP 403') || errorMessage.includes('forbidden')) {
    return 'Access denied. Please contact support if you believe this is an error.';
  }

  if (errorString.includes('HTTP 429') || errorMessage.includes('too many requests')) {
    return 'Too many sign-up attempts. Please wait a moment before trying again.';
  }

  // Specific error messages from backend
  if (errorMessage.includes('email') && (errorMessage.includes('exist') || errorMessage.includes('already') || errorMessage.includes('taken') || errorMessage.includes('registered'))) {
    return 'This email is already registered. Please sign in or use a different email address.';
  }

  if (errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('requirement'))) {
    return 'Password does not meet requirements. Please ensure it has at least 8 characters with uppercase, lowercase, number, and special character.';
  }

  if (errorMessage.includes('full name') || errorMessage.includes('name')) {
    return 'Please enter a valid full name.';
  }

  // If error message is already user-friendly, use it
  if (
    !errorString.includes('HTTP') &&
    !errorString.includes('404') &&
    !errorString.includes('401') &&
    !errorString.includes('500') &&
    !errorString.includes('409') &&
    !errorString.includes('400') &&
    !errorString.includes('422') &&
    errorString.length < 100
  ) {
    return error.message;
  }

  // Default fallback
  return 'Unable to create account. Please check your information and try again.';
};

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { signIn, enableBiometrics, isBiometricSupported } = useAuth();
  const { requestPermissions: requestNotificationPermissions, checkPermissions: checkNotificationPermissions, expoPushToken } = useNotifications();
  const insets = useSafeAreaInsets();
  
  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(params.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Step slide animations
  const step1TranslateX = useSharedValue(0);
  const step2TranslateX = useSharedValue(width);
  const step3TranslateX = useSharedValue(width);
  const step4TranslateX = useSharedValue(width);
  
  // Progress bar animation
  const progressValue = useSharedValue(0);
  
  // Gradient horizontal position (0 = left, 1 = right)
  // Step 1 → 10%, Step 2 → 35%, Step 3 → 60%, Step 4 → 90%
  const gradientX = useSharedValue(0.1);
  
  // Alert state
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    onConfirm?: () => void;
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'error',
  });

  const buttonScale = useSharedValue(1);

  // Pre-fill email from params if provided
  useEffect(() => {
    if (params.email) {
      setEmail(params.email);
      // Mark email as touched if it's pre-filled
      setTouched(prev => ({ ...prev, email: true }));
    }
  }, [params.email]);

  // Animate step transitions
  useEffect(() => {
    if (currentStep === 1) {
      step1TranslateX.value = withTiming(0, { duration: 300 });
      step2TranslateX.value = withTiming(width, { duration: 300 });
      step3TranslateX.value = withTiming(width, { duration: 300 });
      step4TranslateX.value = withTiming(width, { duration: 300 });
      progressValue.value = withTiming(25, { duration: 300 });
      gradientX.value = withTiming(0.1, { duration: 300 }); // 10%
    } else if (currentStep === 2) {
      step1TranslateX.value = withTiming(-width, { duration: 300 });
      step2TranslateX.value = withTiming(0, { duration: 300 });
      step3TranslateX.value = withTiming(width, { duration: 300 });
      step4TranslateX.value = withTiming(width, { duration: 300 });
      progressValue.value = withTiming(50, { duration: 300 });
      gradientX.value = withTiming(0.35, { duration: 300 }); // 35%
    } else if (currentStep === 3) {
      step1TranslateX.value = withTiming(-width, { duration: 300 });
      step2TranslateX.value = withTiming(-width, { duration: 300 });
      step3TranslateX.value = withTiming(0, { duration: 300 });
      step4TranslateX.value = withTiming(width, { duration: 300 });
      progressValue.value = withTiming(75, { duration: 300 });
      gradientX.value = withTiming(0.6, { duration: 300 }); // 60%
    } else if (currentStep === 4) {
      step1TranslateX.value = withTiming(-width, { duration: 300 });
      step2TranslateX.value = withTiming(-width, { duration: 300 });
      step3TranslateX.value = withTiming(-width, { duration: 300 });
      step4TranslateX.value = withTiming(0, { duration: 300 });
      progressValue.value = withTiming(100, { duration: 300 });
      gradientX.value = withTiming(0.9, { duration: 300 }); // 90%
    }
  }, [currentStep]);

  // Real-time validation
  useEffect(() => {
    if (touched.firstName) {
      const validation = validateFirstName(firstName);
      setErrors(prev => ({ ...prev, firstName: validation.error }));
    }
  }, [firstName, touched.firstName]);

  useEffect(() => {
    if (touched.lastName) {
      const validation = validateLastName(lastName);
      setErrors(prev => ({ ...prev, lastName: validation.error }));
    }
  }, [lastName, touched.lastName]);

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

  const step1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: step1TranslateX.value }],
  }));

  const step2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: step2TranslateX.value }],
  }));

  const step3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: step3TranslateX.value }],
  }));

  const step4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: step4TranslateX.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  // Animated props for RadialGradient
  const animatedGradientProps = useAnimatedProps(() => {
    // Convert gradientX (0-1) to percentage string for cx and fx
    const cxPercent = `${gradientX.value * 100}%`;
    const fxPercent = `${Math.min(100, (gradientX.value * 100) + 10)}%`; // fx slightly ahead of cx for better effect
    
    return {
      cx: cxPercent,
      fx: fxPercent,
    };
  });

  const handleFirstNameChange = (text: string) => {
    const cleanText = text.replace(/[^a-zA-Z\s'-]/g, '');
    if (cleanText.length <= VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
      setFirstName(cleanText);
    }
  };

  const handleLastNameChange = (text: string) => {
    const cleanText = text.replace(/[^a-zA-Z\s'-]/g, '');
    if (cleanText.length <= VALIDATION_RULES.FULL_NAME.MAX_LENGTH) {
      setLastName(cleanText);
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

  const validateStep1 = () => {
    // Step 1: Email only
    const emailValidation = validateEmail(email);

    const newErrors: typeof errors = {};
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    setErrors(newErrors);
    setTouched({
      ...touched,
      email: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // Step 2: First Name and Last Name
    const firstNameValidation = validateFirstName(firstName);
    const lastNameValidation = validateLastName(lastName);

    const newErrors: typeof errors = {};
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error;
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error;

    setErrors(newErrors);
    setTouched({
      ...touched,
      firstName: true,
      lastName: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    // Step 3: Password
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);

    const newErrors: typeof errors = {};
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error;
    if (!confirmPasswordValidation.isValid) newErrors.confirmPassword = confirmPasswordValidation.error;

    setErrors(newErrors);
    setTouched({
      ...touched,
      password: true,
      confirmPassword: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentStep === 1) {
      if (validateStep1()) {
        Keyboard.dismiss();
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        Keyboard.dismiss();
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (validateStep3()) {
        Keyboard.dismiss();
        setCurrentStep(4);
      }
    }
  };

  const handleBack = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (currentStep > 1) {
      Keyboard.dismiss();
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle input focus - scroll input above keyboard
  const handleInputFocus = (inputRef: React.RefObject<TextInput | null>, offset: number = 150) => {
    setTimeout(() => {
      if (inputRef.current && scrollViewRef.current) {
        inputRef.current.measureInWindow((x, y, width, height) => {
          // Get keyboard height (approximate)
          const keyboardHeight = Platform.OS === 'ios' ? 300 : 250;
          const screenHeight = Dimensions.get('window').height;
          const inputBottom = y + height;
          const visibleAreaBottom = screenHeight - keyboardHeight;
          
          // If input is below visible area, scroll up
          if (inputBottom > visibleAreaBottom - offset) {
            const scrollAmount = inputBottom - visibleAreaBottom + offset;
            scrollViewRef.current?.scrollTo({
              y: scrollAmount,
              animated: true,
            });
          }
        });
      }
    }, 100);
  };

  const handleSignUp = async () => {
    // Final validation - all steps must be valid
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setIsLoading(true);
    setApiError(null);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const response = await authApi.register({
        email: email.trim(),
        password: password,
        fullName: fullName,
        expoToken: expoPushToken || undefined,
      });
      
      await signIn(response.token, response.refreshToken);
      
      // After successful signup, request permissions
      await requestPermissionsOnSignup();
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      setAlertState({
        visible: true,
        title: 'Sign Up Failed',
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

  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({
          visible: true,
          title: 'Permission Required',
          message: 'Photo library access is required to upload a profile photo.',
          type: 'warning',
          onConfirm: () => {
            setAlertState(prev => ({ ...prev, visible: false }));
          },
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setAlertState({
        visible: true,
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
        type: 'error',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, visible: false }));
        },
      });
    }
  };

  const getPasswordRequirements = () => {
    const hasMinLength = password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH;
    const hasNumber = VALIDATION_RULES.PASSWORD.NUMBER_REGEX.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    return [
      { text: `At least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`, met: hasMinLength },
      { text: 'At least 1 number', met: hasNumber },
      { text: 'Passwords are a match', met: passwordsMatch },
    ];
  };

  const requestPermissionsOnSignup = async () => {
    // Small delay to ensure sign-in is complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Request Biometric Permission
    if (isBiometricSupported) {
      setAlertState({
        visible: true,
        title: 'Enable Biometric Login',
        message: 'Would you like to enable Face ID or Touch ID for faster and more secure login? You can enable this later in settings.',
        type: 'info',
        confirmText: 'Enable',
        onConfirm: async () => {
          setAlertState(prev => ({ ...prev, visible: false }));
          try {
            const success = await enableBiometrics();
            if (success) {
              setAlertState({
                visible: true,
                title: 'Success',
                message: 'Biometric login has been enabled!',
                type: 'success',
                onConfirm: () => {
                  setAlertState(prev => ({ ...prev, visible: false }));
                  requestNotificationPermission();
                },
              });
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
        onClose: () => {
          // User closed without enabling, skip biometric and go to notifications
          setAlertState(prev => ({ ...prev, visible: false }));
          requestNotificationPermission();
        },
      });
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
        setAlertState({
          visible: true,
          title: 'Enable Notifications',
          message: 'Stay updated with investment opportunities, property updates, and important account alerts. You can enable this later in settings.',
          type: 'info',
          confirmText: 'Enable',
          onConfirm: async () => {
            setAlertState(prev => ({ ...prev, visible: false }));
            try {
              await requestNotificationPermissions();
              // Permission request completed, user can continue
            } catch (error) {
              console.error('Error requesting notification permissions:', error);
            }
          },
          onClose: () => {
            // User closed without enabling, that's fine
            setAlertState(prev => ({ ...prev, visible: false }));
          },
        });
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

  const isStep1Valid = () => {
    return validateEmail(email).isValid;
  };

  const isStep2Valid = () => {
    return validateFirstName(firstName).isValid &&
           validateLastName(lastName).isValid;
  };

  const isStep3Valid = () => {
    return validatePassword(password).isValid &&
           validateConfirmPassword(password, confirmPassword).isValid;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      
    {/* <LinearGradient
      colors={
        isDarkColorScheme
          ? ["#0B3D36", "#102222", "#0B1F1C"]
          : [colors.background, colors.card, colors.background]
      }
      style={{ flex: 1 }}
    > */}
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />
      
      {/* App Alert */}
      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm || (() => {
          setAlertState(prev => ({ ...prev, visible: false }));
        })}
        onClose={alertState.onClose}
      />
      
      <View style={{ flex: 1,backgroundColor:isDarkColorScheme ? "rgba(22,22,22,1)" : "#f0fdf4" }}>
        {/* Radial Gradient Background */}
      <MotiView 
      // animate={{left:currentStep === 1 ? "0%" : currentStep === 2 ? "33%" : currentStep === 3 ? "60%" : currentStep === 4 ? "100%" : "0%"}}
      transition={{ type: "timing", duration: 300}}
      style={{ position: 'absolute', inset: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            {isDarkColorScheme ? (
              <>
                {/* Dark Mode - Animated Horizontal Glow */}
                <AnimatedRadialGradient 
                  id="grad1" 
                  cy="0%" 
                  r="80%" 
                  fy="10%"
                  animatedProps={animatedGradientProps}
                >
                  <Stop offset="0%" stopColor="rgb(226, 223, 34)" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
                </AnimatedRadialGradient>
              </>
            ) : (
              <>
                {/* Light Mode - Animated Horizontal Glow */}
                <AnimatedRadialGradient 
                  id="grad1" 
                  cy="10%" 
                  r="80%" 
                  fy="10%"
                  animatedProps={animatedGradientProps}
                >
                  <Stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </AnimatedRadialGradient>
              </>
            )}
          </Defs>

          {/* Base Layer */}
          <Rect 
            width="100%" 
            height="100%" 
            fill={isDarkColorScheme ? "rgba(22,22,22,0)" : "#f0fdf4"} 
          />

          {/* Layer the gradients on top of the base */}
          <Rect width="100%" height="50%" fill="url(#grad1)" />
        </Svg>
      </MotiView>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ 
              flexGrow: 1,
              paddingBottom: 120 + insets.bottom, // Space for fixed bottom bar
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
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

            {/* Progress Bar */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap:8, marginBottom: 12}}>
                {[1, 2, 3, 4].map((step) => (
                  <View
                    key={step}
                    style={{
                      flex:1,
                      // width: 8,
                      height: 4,
                      borderRadius: 4,
                      backgroundColor: currentStep >= step ? colors.primary : (isDarkColorScheme ? "rgba(255, 255, 255, 0.2)" : colors.border),
                    }}
                  />
                ))}
              </View>
              {/* Animated Progress Bar */}
              {/* <View
                style={{
                  height: 4,
                  backgroundColor: isDarkColorScheme ? "rgba(255, 255, 255, 0.1)" : colors.border,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Animated.View
                  style={[
                    {
                      height: '100%',
                      backgroundColor: colors.primary,
                      borderRadius: 2,
                    },
                    progressAnimatedStyle,
                  ]}
                />
              </View> */}
            </View>

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
                {currentStep === 1 && "Enter your Email"}
                {currentStep === 2 && "Set up your Profile"}
                {currentStep === 3 && "Create a Password"}
                {currentStep === 4 && "Add a Photo"}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {currentStep === 1 && "We'll use this to keep your account secure."}
                {currentStep === 2 && "Enter your first and last name."}
                {currentStep === 3 && "Secure your account with a strong password."}
                {currentStep === 4 && "Add a profile photo so your friends know it's you!"}
              </Text>
            </View>

            {/* Steps Container */}
            <View style={{ minHeight: 400, position: 'relative' }}>
              {/* Step 1: Email Only */}
              <Animated.View
                style={[
                  step1AnimatedStyle,
                  {
                    position: 'absolute',
                    width: width - 48,
                    paddingRight: 0,
                  },
                ]}
              >
                <View style={{ gap: 24 }}>
                  {/* Email Input */}
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
                        ref={emailRef}
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                        onFocus={() => handleInputFocus(emailRef)}
                        placeholder="Email"
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
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      {!errors.email && touched.email && email && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                    {errors.email && touched.email && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                        <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 12, marginLeft: 4 }}>
                          {errors.email}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Step 2: First Name and Last Name */}
              <Animated.View
                style={[
                  step2AnimatedStyle,
                  {
                    position: 'absolute',
                    width: width - 48,
                    paddingRight: 0,
                  },
                ]}
              >
                <View style={{ gap: 24 }}>
                  {/* First Name Input */}
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      First Name
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
                        borderColor: errors.firstName && touched.firstName
                          ? colors.destructive
                          : !errors.firstName && touched.firstName && firstName
                          ? colors.primary
                          : 'transparent',
                        paddingHorizontal: 16,
                        height: 56,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={errors.firstName && touched.firstName ? colors.destructive : colors.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        ref={firstNameRef}
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                        onFocus={() => handleInputFocus(firstNameRef)}
                        placeholder="First Name"
                        placeholderTextColor={colors.textMuted}
                        maxLength={VALIDATION_RULES.FULL_NAME.MAX_LENGTH}
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: colors.textPrimary,
                        }}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="next"
                        onSubmitEditing={() => lastNameRef.current?.focus()}
                      />
                      {!errors.firstName && touched.firstName && firstName && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                    {errors.firstName && touched.firstName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                        <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 12, marginLeft: 4 }}>
                          {errors.firstName}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Last Name Input */}
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      Last Name
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
                        borderColor: errors.lastName && touched.lastName
                          ? colors.destructive
                          : !errors.lastName && touched.lastName && lastName
                          ? colors.primary
                          : 'transparent',
                        paddingHorizontal: 16,
                        height: 56,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={errors.lastName && touched.lastName ? colors.destructive : colors.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        ref={lastNameRef}
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                        onFocus={() => handleInputFocus(firstNameRef)}
                        placeholder="Last Name"
                        placeholderTextColor={colors.textMuted}
                        maxLength={VALIDATION_RULES.FULL_NAME.MAX_LENGTH}
                        style={{
                          flex: 1,
                          fontSize: 16,
                          color: colors.textPrimary,
                        }}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      {!errors.lastName && touched.lastName && lastName && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                    {errors.lastName && touched.lastName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                        <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 12, marginLeft: 4 }}>
                          {errors.lastName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Step 3: Password */}
              <Animated.View
                style={[
                  step3AnimatedStyle,
                  {
                    position: 'absolute',
                    width: width - 48,
                    paddingRight: 0,
                  },
                ]}
              >
                <View style={{ gap: 24 }}>
                  {/* Password Input */}
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
                        ref={passwordRef}
                        value={password}
                        onChangeText={handlePasswordChange}
                        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                        onFocus={() => handleInputFocus(passwordRef)}
                        placeholder="Password"
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
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
                    {errors.password && touched.password && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                        <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 12, marginLeft: 4 }}>
                          {errors.password}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password Input */}
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
                        color={errors.confirmPassword && touched.confirmPassword ? colors.destructive : colors.textMuted}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        ref={confirmPasswordRef}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                        onFocus={() => handleInputFocus(firstNameRef)}
                        placeholder="Confirm Password"
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
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4 }}>
                        <Ionicons name="alert-circle" size={14} color={colors.destructive} />
                        <Text style={{ color: colors.destructive, fontSize: 12, marginLeft: 4 }}>
                          {errors.confirmPassword}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      {getPasswordRequirements().map((req, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: req.met ? colors.primary : colors.border,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              color: req.met ? colors.primary : colors.textMuted,
                            }}
                          >
                            {req.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Step 4: Photo */}
              <Animated.View
                style={[
                  step4AnimatedStyle,
                  {
                    position: 'absolute',
                    width: width - 48,
                    paddingRight: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 40,
                  },
                ]}
              >
                <View style={{ alignItems: 'center', gap: 32, width: '100%' }}>
                  {/* Profile Photo Placeholder */}
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: isDarkColorScheme
                        ? "rgba(255, 255, 255, 0.1)"
                        : colors.input,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: colors.border,
                    }}
                  >
                    {profilePhoto ? (
                      <Image
                        source={{ uri: profilePhoto }}
                        style={{ width: 120, height: 120, borderRadius: 60 }}
                      />
                    ) : (
                      <Ionicons name="person" size={60} color={colors.textMuted} />
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={{ width: '100%', gap: 12 }}>
                    <TouchableOpacity
                      onPress={pickProfilePhoto}
                      style={{
                        backgroundColor: colors.primary,
                        height: 56,
                        borderRadius: 28,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={{
                          color: colors.primaryForeground,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Choose a Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSignUp}
                      disabled={isLoading}
                      style={{
                        backgroundColor: 'transparent',
                        height: 56,
                        borderRadius: 28,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: colors.border,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Maybe Later
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* API Error Message (inside scrollable area) */}
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
                  marginTop: 24,
                  marginBottom: 24,
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
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed Bottom Action Bar - Outside KeyboardAvoidingView to stay fixed */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 24,
            // backgroundColor: isDarkColorScheme
            //   ? "rgba(11, 31, 28, 0.98)"
            //   : "rgba(255, 255, 255, 0.98)",
            borderTopWidth: 1,
            borderTopColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            // elevation: 12,
          }}
        >
          <View style={{ gap: 12 }}>
            {/* Next/Back Buttons */}
            {currentStep < 4 && (
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleNext}
                  onPressIn={() => {
                    buttonScale.value = withSpring(0.96, { damping: 15 });
                  }}
                  onPressOut={() => {
                    buttonScale.value = withSpring(1, { damping: 15 });
                  }}
                    disabled={isLoading || (currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid())}
                    style={{
                      backgroundColor: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid()) || isLoading) ? colors.border : colors.primary,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid()) || isLoading) ? 'transparent' : colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid()) || isLoading) ? 0 : 0.3,
                    shadowRadius: 8,
                    elevation: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid()) || isLoading) ? 0 : 6,
                  }}
                  activeOpacity={1}
                >
                  <Text
                    style={{
                        color: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || (currentStep === 3 && !isStep3Valid()) || isLoading) ? colors.textMuted : colors.primaryForeground,
                      fontSize: 16,
                      fontWeight: "bold",
                      letterSpacing: 0.5,
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Back Button (only show on step 2, 3, and 4) */}
            {currentStep > 1 && currentStep < 4 && (
              <TouchableOpacity
                onPress={handleBack}
                onPressIn={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={isLoading}
                style={{
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: 'transparent',
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    {/* </LinearGradient> */}
    </SafeAreaView>
  );
}