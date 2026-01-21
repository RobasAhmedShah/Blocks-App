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
  Keyboard,
  Image,
  Dimensions,
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

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
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
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
    } else if (currentStep === 2) {
      step1TranslateX.value = withTiming(-width, { duration: 300 });
      step2TranslateX.value = withTiming(0, { duration: 300 });
      step3TranslateX.value = withTiming(width, { duration: 300 });
    } else if (currentStep === 3) {
      step1TranslateX.value = withTiming(-width, { duration: 300 });
      step2TranslateX.value = withTiming(-width, { duration: 300 });
      step3TranslateX.value = withTiming(0, { duration: 300 });
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

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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
    const firstNameValidation = validateFirstName(firstName);
    const lastNameValidation = validateLastName(lastName);
    const emailValidation = validateEmail(email);

    const newErrors: typeof errors = {};
    if (!firstNameValidation.isValid) newErrors.firstName = firstNameValidation.error;
    if (!lastNameValidation.isValid) newErrors.lastName = lastNameValidation.error;
    if (!emailValidation.isValid) newErrors.email = emailValidation.error;

    setErrors(newErrors);
    setTouched({
      ...touched,
      firstName: true,
      lastName: true,
      email: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
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
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSignUp = async () => {
    // Final validation
    if (!validateStep1() || !validateStep2()) {
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
    return validateFirstName(firstName).isValid &&
           validateLastName(lastName).isValid &&
           validateEmail(email).isValid;
  };

  const isStep2Valid = () => {
    return validatePassword(password).isValid &&
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

            {/* Step Indicator */}
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textMuted,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Step {currentStep}/{totalSteps}
              </Text>
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
                {currentStep === 1 && "Set up your Profile"}
                {currentStep === 2 && "Create a Password"}
                {currentStep === 3 && "Add a Photo"}
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {currentStep === 1 && "Enter essential details for your account."}
                {currentStep === 2 && "Secure your account with a password."}
                {currentStep === 3 && "Add a profile photo so your friends know it's you!"}
              </Text>
            </View>

            {/* Steps Container */}
            <ScrollView style={{ flex: 1}}>
              {/* Step 1: Profile Setup */}
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
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
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
                        onSubmitEditing={() => Keyboard.dismiss()}
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
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
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
                        returnKeyType="next"
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
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
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

                {/* Legal Text */}
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    textAlign: "center",
                    lineHeight: 18,
                    marginTop: 24,
                    paddingHorizontal: 20,
                  }}
                >
                  By agreeing to the <Text style={{ color: colors.primary }}>terms & conditions</Text>, you are entering into a legally binding contract with the service provider.
                </Text>
              </Animated.View>

              {/* Step 2: Password */}
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
                        value={password}
                        onChangeText={handlePasswordChange}
                        onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
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
                        onSubmitEditing={() => Keyboard.dismiss()}
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
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
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

              {/* Step 3: Photo */}
              <Animated.View
                style={[
                  step3AnimatedStyle,
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
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={{ marginTop: 32, gap: 12 }}>
              {/* Next/Back Buttons */}
              {currentStep < 3 && (
                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={isLoading || (currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
                    style={{
                      backgroundColor: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || isLoading) ? colors.border : colors.primary,
                      height: 56,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        color: ((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid()) || isLoading) ? colors.textMuted : colors.primaryForeground,
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

              {/* Back Button (only show on step 2 and 3) */}
              {currentStep > 1 && currentStep < 3 && (
                <TouchableOpacity
                  onPress={handleBack}
                  disabled={isLoading}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: 'transparent',
                  }}
                  activeOpacity={0.8}
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

         
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}