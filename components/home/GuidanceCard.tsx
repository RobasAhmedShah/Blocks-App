import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GuidanceCardProps {
  onPress?: () => void;
}

export default function GuidanceCard({ onPress }: GuidanceCardProps) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/portfolio/guidance/guidance-one' as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={{
        marginHorizontal: 20,
        marginVertical: 16,
        borderRadius: 24,
        overflow: 'hidden',
     
     
      }}
    >
      <LinearGradient
        colors={
          isDarkColorScheme
            ? ['rgba(16, 185, 129, 0.25)', 'rgba(5, 150, 105, 0.2)', 'rgba(4, 120, 87, 0.15)']
            : ['rgba(16, 185, 129, 0.15)', 'rgba(5, 150, 105, 0.12)', 'rgba(4, 120, 87, 0.08)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 24,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: isDarkColorScheme
            ? 'rgba(16, 185, 129, 0.4)'
            : 'rgba(16, 185, 129, 0.3)',
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isDarkColorScheme
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(16, 185, 129, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              borderWidth: 2,
              borderColor: isDarkColorScheme
                ? 'rgba(16, 185, 129, 0.5)'
                : 'rgba(16, 185, 129, 0.4)',
            }}
          >
            <Ionicons name="bulb" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 4,
                letterSpacing: -0.5,
              }}
            >
              Need Guidance?
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 20,
              }}
            >
              Let's help you reach your goals
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 20,
            fontWeight: '500',
          }}
        >
          Not sure where to invest? We'll help you create a personalized investment plan based on
          your monthly rental income goal or savings target.
        </Text>

        {/* Features */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(16, 185, 129, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                flex: 1,
              }}
            >
              Set your monthly income goal
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(16, 185, 129, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                flex: 1,
              }}
            >
              Get personalized property recommendations
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: isDarkColorScheme
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(16, 185, 129, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                flex: 1,
              }}
            >
              Build your portfolio step by step
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 26,
            paddingVertical: 16,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontSize: 16,
              fontWeight: 'bold',
              marginRight: 8,
            }}
          >
            Get Started
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

