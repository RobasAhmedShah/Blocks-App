import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/lib/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

interface AccountRestrictedScreenProps {
  title?: string;
  message?: string;
  restrictionType?: 'deposits' | 'withdrawals' | 'trading' | 'transfers' | 'investment' | 'general';
}

export function AccountRestrictedScreen({
  title,
  message,
  restrictionType = 'general',
}: AccountRestrictedScreenProps) {
  const { colors, isDarkColorScheme } = useColorScheme();

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

  return (
    <LinearGradient
      colors={isDarkColorScheme 
        ? ['#0a0a0a', '#1a1a1a'] 
        : ['#f5f5f5', '#ffffff']
      }
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { }]}>
          <MaterialIcons 
            name="block" 
            size={64} 
            color={colors.destructive} 
          />
        </View>
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title || getDefaultTitle()}
        </Text>
        
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message || getDefaultMessage()}
        </Text>
        
        <View style={[styles.contactBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialIcons name="support-agent" size={24} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.textPrimary }]}>
            Contact Blocks Support
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
