import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

/* =========================
   CONFIGURATION
========================= */

const PIN_LENGTH = 4;
const VALIDATION_DELAY = 600; // ms before validation check
const ERROR_SHAKE_DURATION = 500;

/* =========================
   TYPES
========================= */

type ValidationStatus = "idle" | "validating" | "error" | "success";

/* =========================
   MAIN COMPONENT
========================= */

export default function PinVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    mode?: 'create' | 'verify';
    token?: string;
    refreshToken?: string;
  }>();
  const { setDevicePin, unlockWithPin, isPinSet, signIn, isBiometricSupported, isBiometricEnrolled, loginWithBiometrics, enableBiometrics } = useAuth();
  const mode = params.mode || (isPinSet ? 'verify' : 'create');
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [firstPin, setFirstPin] = useState(""); // Store the first PIN before clearing
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const biometricAutoTriggeredRef = useRef(false);

  // Handle biometric authentication
  const handleBiometricAuth = useCallback(async () => {
    if (mode === 'create' || isBiometricLoading || status !== 'idle') return;
    
    setIsBiometricLoading(true);
    
    try {
      // If biometric is not enrolled yet, enable it first
      if (!isBiometricEnrolled) {
        const enabled = await enableBiometrics();
        if (!enabled) {
          setIsBiometricLoading(false);
          return;
        }
      }
      
      // Now use biometric to log in
      const success = await loginWithBiometrics();
      
      if (success) {
        setStatus("success");
        // Navigation handled by AuthContext
      } else {
        // Biometric failed, user can try PIN
        setIsBiometricLoading(false);
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setIsBiometricLoading(false);
    }
  }, [mode, isBiometricLoading, status, isBiometricEnrolled, enableBiometrics, loginWithBiometrics]);

  const handleBiometricAuthRef = useRef(handleBiometricAuth);
  handleBiometricAuthRef.current = handleBiometricAuth;

  // Auto-trigger biometric once when screen opens (verify mode only). Never re-trigger if user cancels.
  useEffect(() => {
    if (biometricAutoTriggeredRef.current) return;
    if (mode !== 'verify' || !isBiometricSupported || !isBiometricEnrolled) return;

    biometricAutoTriggeredRef.current = true;
    const timer = setTimeout(() => {
      handleBiometricAuthRef.current();
    }, 500);

    return () => clearTimeout(timer);
  }, [mode, isBiometricSupported, isBiometricEnrolled]);

  // Auto-validate when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !isConfirmStep) {
      if (mode === 'create') {
        // Move to confirm step - save the first PIN before clearing
        setFirstPin(pin);
        setIsConfirmStep(true);
        setPin("");
      } else {
        // Verify mode - validate immediately
        validatePin();
      }
    }
    if (confirmPin.length === PIN_LENGTH && isConfirmStep && mode === 'create') {
      validatePin();
    }
  }, [pin, confirmPin, isConfirmStep, mode]);

  const validatePin = async () => {
    setStatus("validating");

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, VALIDATION_DELAY));

    if (mode === 'create') {
      // Create mode: check if PINs match
      if (firstPin === confirmPin) {
        try {
          await setDevicePin(firstPin);
          
          // If we have auth tokens from signup, sign in now
          if (params.token && params.refreshToken) {
            await signIn(params.token, params.refreshToken);
          }
          
          setStatus("success");
          setTimeout(() => {
            router.replace("/(tabs)/home" as any);
          }, 800);
        } catch (error) {
          setStatus("error");
          setTimeout(() => {
            setPin("");
            setConfirmPin("");
            setFirstPin("");
            setIsConfirmStep(false);
            setStatus("idle");
          }, ERROR_SHAKE_DURATION);
        }
      } else {
        setStatus("error");
        setTimeout(() => {
          setPin("");
          setConfirmPin("");
          setFirstPin("");
          setIsConfirmStep(false);
          setStatus("idle");
        }, ERROR_SHAKE_DURATION);
      }
    } else {
      // Verify mode: unlock with PIN
      const isValid = await unlockWithPin(pin);
      if (isValid) {
        setStatus("success");
        setTimeout(() => {
          router.replace("/(tabs)/home" as any);
        }, 800);
      } else {
        setStatus("error");
        setTimeout(() => {
          setPin("");
          setStatus("idle");
        }, ERROR_SHAKE_DURATION);
      }
    }
  };

  const handleNumberPress = (num: number) => {
    if (status === "idle") {
      if (isConfirmStep && mode === 'create') {
        if (confirmPin.length < PIN_LENGTH) {
          setConfirmPin((prev) => prev + num.toString());
        }
      } else {
        if (pin.length < PIN_LENGTH) {
          setPin((prev) => prev + num.toString());
        }
      }
    }
  };

  const handleBackspace = () => {
    if (status === "idle") {
      if (isConfirmStep && mode === 'create') {
        if (confirmPin.length > 0) {
          setConfirmPin((prev) => prev.slice(0, -1));
        } else {
          // Go back to first PIN entry - restore the first PIN
          setPin(firstPin);
          setIsConfirmStep(false);
        }
      } else {
        if (pin.length > 0) {
          setPin((prev) => prev.slice(0, -1));
        }
      }
    }
  };

  const handleBack = () => {
    if (mode === 'create') {
      router.back();
    } else {
      router.replace("/onboarding/auth" as any);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#020617", "#052E16", "#14532D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

    

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'create' 
              ? isConfirmStep 
                ? "Confirm PIN" 
                : "Create PIN"
              : "Enter PIN"}
          </Text>
          <Text style={styles.subtitle}>
            {status === "error"
              ? mode === 'create' && isConfirmStep
                ? "PINs don't match. Try again."
                : "Incorrect PIN. Try again."
              : mode === 'create'
              ? isConfirmStep
                ? "Re-enter your 4-digit PIN to confirm"
                : "Create a 4-digit PIN to unlock the app on this device"
              : "Enter your 4-digit PIN to unlock"}
          </Text>
        </View>

        {/* PIN Dots */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const currentValue = isConfirmStep && mode === 'create' ? confirmPin : pin;
            return (
              <PinDot
                key={index}
                filled={index < currentValue.length}
                status={status}
                index={index}
              />
            );
          })}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {/* Rows 1-3 */}
          {[
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((num) => {
                const currentValue = isConfirmStep && mode === 'create' ? confirmPin : pin;
                return (
                  <KeypadButton
                    key={num}
                    value={num}
                    onPress={() => handleNumberPress(num)}
                    disabled={currentValue.length >= PIN_LENGTH || status !== "idle"}
                  />
                );
              })}
            </View>
          ))}

          {/* Last Row: Biometric/Empty, 0, Backspace */}
          <View style={styles.keypadRow}>
            {isBiometricSupported && mode === 'verify' ? (
              <BiometricButton 
                onPress={handleBiometricAuth} 
                disabled={isBiometricLoading || status !== "idle"}
                isLoading={isBiometricLoading}
              />
            ) : (
              <View style={styles.keypadButton} />
            )}
            <KeypadButton
              value={0}
              onPress={() => handleNumberPress(0)}
              disabled={(isConfirmStep && mode === 'create' ? confirmPin : pin).length >= PIN_LENGTH || status !== "idle"}
            />
            <BackspaceButton 
              onPress={handleBackspace} 
              disabled={(isConfirmStep && mode === 'create' ? confirmPin : pin).length === 0} 
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* =========================
   PIN DOT COMPONENT
========================= */

interface PinDotProps {
  filled: boolean;
  status: ValidationStatus;
  index: number;
}

function PinDot({ filled, status, index }: PinDotProps) {
    const isError = status === "error";
    const isSuccess = status === "success";
  
    return (
      <MotiView
        animate={{
          translateX: isError ? [-8, 8, -8, 8, 0] : 0,
        }}
        transition={{
          type: "timing",
          duration: 60,
          loop: isError,
        }}
        style={styles.dotWrapper}
      >
        <MotiView
          animate={{
            // Shape morph
            height: filled ? 20 : 4,
            width: 20,
            borderRadius: filled ? 10 : 2,
  
            // Water drop motion
            translateY: filled ? [-6, 0] : 0,
  
            // Colors
            backgroundColor: filled
              ? isError
                ? "#ef4444"
                : isSuccess
                ? "#4ade80"
                : "#d0e8d0"
              : "transparent",
  
            borderColor: isError
              ? "#ef4444"
              : isSuccess
              ? "#4ade80"
              : "#475569",
  
            opacity: filled ? 1 : 0.6,
          }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 180,
          }}
          style={styles.dot}
        />
      </MotiView>
    );
  }
  

/* =========================
   KEYPAD BUTTON COMPONENT
========================= */

interface KeypadButtonProps {
  value: number;
  onPress: () => void;
  disabled?: boolean;
}

function KeypadButton({ value, onPress, disabled = false }: KeypadButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={disabled}
      style={styles.keypadButton}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.9 : 1,
          opacity: disabled ? 0.3 : 1,
        }}
        transition={{
          type: "timing",
          duration: 100,
        }}
        style={styles.keypadButtonInner}
      >
        <Text style={styles.keypadButtonText}>{value}</Text>
      </MotiView>
    </Pressable>
  );
}

/* =========================
   BACKSPACE BUTTON COMPONENT
========================= */

interface BackspaceButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

function BackspaceButton({ onPress, disabled = false }: BackspaceButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={disabled}
      style={styles.keypadButton}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.9 : 1,
          opacity: disabled ? 0.3 : 1,
        }}
        transition={{
          type: "timing",
          duration: 100,
        }}
        style={styles.keypadButtonInner}
      >
        <Ionicons name="backspace-outline" size={28} color="#d0e8d0" />
      </MotiView>
    </Pressable>
  );
}

/* =========================
   BIOMETRIC BUTTON COMPONENT
========================= */

interface BiometricButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function BiometricButton({ onPress, disabled = false, isLoading = false }: BiometricButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      disabled={disabled}
      style={styles.keypadButton}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.9 : 1,
          opacity: disabled ? 0.3 : 1,
          rotate: isLoading ? "360deg" : "0deg",
        }}
        transition={{
          type: isLoading ? "timing" : "timing",
          duration: isLoading ? 1000 : 100,
          loop: isLoading,
        }}
        style={styles.keypadButtonInner}
      >
        <Ionicons 
          name="finger-print" 
          size={32} 
          color={isLoading ? "#4ade80" : "#d0e8d0"} 
        />
      </MotiView>
    </Pressable>
  );
}

/* =========================
   STYLES
========================= */

const { width } = Dimensions.get("window");
const KEYPAD_BUTTON_SIZE = Math.min(width * 0.2, 80);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#d0e8d0",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginVertical: 60,
  },
  dotWrapper: {
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  
  dot: {
    width: 20,
    borderWidth: 2,
  },
  
  keypad: {
    alignItems: "center",
    gap: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  keypadButton: {
    width: KEYPAD_BUTTON_SIZE,
    height: KEYPAD_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonInner: {
    width: KEYPAD_BUTTON_SIZE,
    height: KEYPAD_BUTTON_SIZE,
    borderRadius: KEYPAD_BUTTON_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(208,232,208,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#d0e8d0",
  },
});
