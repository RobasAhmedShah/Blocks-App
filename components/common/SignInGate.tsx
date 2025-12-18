import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export const SignInGate: React.FC = () => {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { exitGuestMode } = useAuth();

  const handleSignIn = () => {
    exitGuestMode();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: 400,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isDarkColorScheme
              ? 'rgba(22, 163, 74, 0.15)'
              : 'rgba(22, 163, 74, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="lock-closed" size={40} color={colors.primary} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.textPrimary,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Sign in to continue
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          Please sign in to access this feature and manage your investments.
        </Text>

        <TouchableOpacity
          onPress={handleSignIn}
          style={{
            backgroundColor: colors.primary,
            height: 56,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
            minWidth: 200,
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: 'bold',
              letterSpacing: 0.5,
            }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

