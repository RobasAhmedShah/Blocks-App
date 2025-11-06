import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useColorScheme } from '@/lib/useColorScheme';

export default function InvestmentConfirmScreen() {
  const { id, tokenCount, totalAmount, totalInvestment, propertyTitle } = useLocalSearchParams<{ 
    id: string;
    tokenCount: string;
    totalAmount: string;
    totalInvestment: string;
    propertyTitle: string;
  }>();
  const router = useRouter();
  const { property } = useProperty(id || '');
  const { colors } = useColorScheme();

  const tokens = tokenCount ? parseFloat(tokenCount) : 250;
  const amount = totalAmount ? parseFloat(totalAmount) : 5000;
  const investment = totalInvestment ? parseFloat(totalInvestment) : 5000;
  const title = propertyTitle || property?.title || 'Property';

  const transactionId = `#A4B2${Math.random().toString(36).substring(2, 6).toUpperCase()}C9D8`;

  const handleCopyTransactionId = () => {
    Clipboard.setString(transactionId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        paddingTop: 48 
      }}>
        <Text style={{ 
          flex: 1, 
          textAlign: 'center', 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: colors.textPrimary 
        }}>
          Investment Successful
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/portfolio')}
          style={{ width: 48, alignItems: 'flex-end' }}
        >
          <Ionicons name="close" size={28} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingHorizontal: 16, 
          paddingBottom: 32 
        }}
      >
        {/* Success Icon */}
        <View style={{ 
          width: 96, 
          height: 96, 
          borderRadius: 9999, 
      
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: 24 
        }}>
          <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
        </View>

        {/* Headline */}
        <Text style={{ 
          color: colors.textPrimary, 
          fontSize: 32, 
          fontWeight: 'bold', 
          letterSpacing: -0.5, 
          textAlign: 'center', 
          paddingBottom: 8 
        }}>
          All Set!
        </Text>

        {/* Body Text */}
        <Text style={{ 
          color: colors.textSecondary, 
          fontSize: 16, 
          textAlign: 'center', 
          paddingBottom: 32, 
          paddingHorizontal: 16, 
          maxWidth: 384 
        }}>
          You have successfully purchased {tokens} tokens in {title}.
        </Text>

        {/* Summary Card */}
        <View style={{ 
          width: '100%', 
          maxWidth: 384, 
          backgroundColor: colors.card, 
          borderRadius: 12, 
          borderWidth: 1, 
          borderColor: colors.border, 
          padding: 24, 
          gap: 20 
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Invested In</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16, flex: 1, textAlign: 'right' }} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Tokens Purchased</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
              {tokens.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Total Investment</Text>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
              ${investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Transaction ID</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>
                {transactionId}
              </Text>
              <TouchableOpacity onPress={handleCopyTransactionId}>
                <Ionicons name="copy-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA Buttons */}
        <View style={{ width: '100%', maxWidth: 384, gap: 16, paddingTop: 32 }}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/portfolio')}
            style={{ 
              width: '100%', 
              height: 48, 
              backgroundColor: colors.primary, 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: 'bold' }}>
              View Portfolio
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')}
            style={{ 
              width: '100%', 
              height: 48, 
              backgroundColor: 'transparent', 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>
              Explore More Properties
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

