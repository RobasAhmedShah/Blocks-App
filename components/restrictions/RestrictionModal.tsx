import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';

interface RestrictionModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  restrictionType?: 'deposits' | 'withdrawals' | 'trading' | 'transfers' | 'investment' | 'general';
}

export function RestrictionModal({
  visible,
  onClose,
  title,
  message,
  restrictionType = 'general',
}: RestrictionModalProps) {
  const { colors, isDarkColorScheme } = useColorScheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getDefaultTitle = () => {
    switch (restrictionType) {
      case 'deposits':
        return 'Deposits Blocked';
      case 'withdrawals':
        return 'Withdrawals Blocked';
      case 'trading':
        return 'Trading Blocked';
      case 'investment':
        return 'Investment Blocked';
      case 'transfers':
        return 'Transfers Blocked';
      default:
        return 'Account Restricted';
    }
  };

  const getDefaultMessage = () => {
    switch (restrictionType) {
      case 'deposits':
        return 'Your deposits have been blocked kindly contact blocks team';
      case 'withdrawals':
        return 'Your withdrawals are blocked. Please contact Blocks team for assistance.';
      case 'trading':
        return 'Trading is blocked for your account. Please contact Blocks team for assistance.';
      case 'investment':
        return 'Investment is blocked for your account. Please contact Blocks team for assistance.';
      case 'transfers':
        return 'Token transfers are blocked for your account. Please contact Blocks team for assistance.';
      default:
        return 'Your account is under review/restricted. Please contact Blocks team for assistance.';
    }
  };

  // Use warning icon for restrictions (amber/yellow) to differentiate from errors
  const iconColor = '#F59E0B'; // Amber color for warnings
  const iconBg = isDarkColorScheme ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
  const buttonColor = colors.primary; // Green button

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          opacity: opacityAnim,
        }}
      >
        <Pressable 
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          onPress={onClose}
        />
        
        <Animated.View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 12,
            borderWidth: 1,
            borderColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="warning" size={36} color={iconColor} />
          </View>

          {/* Title */}
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {title || getDefaultTitle()}
          </Text>

          {/* Message */}
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            {message || getDefaultMessage()}
          </Text>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: buttonColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              OK
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
