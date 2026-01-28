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

interface AppAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  title,
  message,
  type,
  confirmText = 'OK',
  onConfirm,
  onClose,
}) => {
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

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'error':
        return { name: 'close-circle' as const, color: colors.destructive, bg: isDarkColorScheme ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' };
      case 'warning':
        return { name: 'warning' as const, color: colors.warning, bg: isDarkColorScheme ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)' };
      case 'info':
      default:
        return { name: 'information-circle' as const, color: colors.primary, bg: isDarkColorScheme ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.1)' };
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
        };
      case 'error':
        return {
          backgroundColor: colors.destructive,
          textColor: '#FFFFFF',
        };
      case 'warning':
        return {
          backgroundColor: colors.warning,
          textColor: '#FFFFFF',
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.primary,
          textColor: '#FFFFFF',
        };
    }
  };

  const iconConfig = getIconConfig();
  const buttonStyle = getButtonStyle();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose || onConfirm}
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
          onPress={onClose || onConfirm}
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
              backgroundColor: iconConfig.bg,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name={iconConfig.name} size={36} color={iconConfig.color} />
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
            {title}
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
            {message}
          </Text>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={() => {
              onConfirm();
            }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: buttonStyle.backgroundColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: buttonStyle.textColor,
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {confirmText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

