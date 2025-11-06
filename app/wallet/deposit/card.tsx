import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { quickAmounts } from '@/data/mockWallet';
import { useWallet } from '@/services/useWallet';

export default function CardDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { deposit } = useWallet();

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || !cardNumber || !expiryDate || !cvv || !cardHolder) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsProcessing(true);
      const depositAmount = parseFloat(amount);
      await deposit(depositAmount, 'Debit Card');
      router.push({
        pathname: '/wallet/deposit/card-successfull',
        params: {
          amount: depositAmount.toString(),
          method: 'Debit Card',
          cardLast4: cardNumber.slice(-4),
        },
      } as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
          backgroundColor: `${colors.background}CC`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkColorScheme ? `${colors.card}99` : colors.muted,
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>
            Card Deposit
          </Text>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
            Amount
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
              borderWidth: isDarkColorScheme ? 1 : 0,
              borderColor: `${colors.primary}33`,
            }}
          >
            <MaterialIcons name="attach-money" size={24} color={colors.primary} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.textPrimary,
              }}
            />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              USDC
            </Text>
          </View>

          {/* Quick Amount Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {quickAmounts.map((qa) => (
              <TouchableOpacity
                key={qa}
                onPress={() => setAmount(qa.toString())}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 9999,
                  backgroundColor: amount === qa.toString()
                    ? colors.primary
                    : isDarkColorScheme
                    ? `${colors.card}66`
                    : colors.muted,
                  borderWidth: amount === qa.toString() ? 0 : 1,
                  borderColor: amount === qa.toString() ? 'transparent' : `${colors.primary}33`,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: '600',
                    color: amount === qa.toString()
                      ? colors.primaryForeground
                      : colors.textPrimary,
                  }}
                >
                  ${qa}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Details */}
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 12 }}>
          Card Details
        </Text>

        <View style={{ gap: 12, marginBottom: 24 }}>
          {/* Card Number */}
          <View>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              placeholder="Card Number"
              maxLength={19}
              placeholderTextColor={colors.textMuted}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: 12,
                fontSize: 16,
                backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                color: colors.textPrimary,
                borderWidth: isDarkColorScheme ? 1 : 0,
                borderColor: `${colors.primary}33`,
              }}
            />
          </View>

          {/* Expiry and CVV */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="MM/YY"
                maxLength={5}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                  color: colors.textPrimary,
                  borderWidth: isDarkColorScheme ? 1 : 0,
                  borderColor: `${colors.primary}33`,
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                placeholder="CVV"
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                placeholderTextColor={colors.textMuted}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderRadius: 12,
                  fontSize: 16,
                  backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                  color: colors.textPrimary,
                  borderWidth: isDarkColorScheme ? 1 : 0,
                  borderColor: `${colors.primary}33`,
                }}
              />
            </View>
          </View>

          {/* Cardholder Name */}
          <View>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder="Cardholder Name"
              autoCapitalize="words"
              placeholderTextColor={colors.textMuted}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                borderRadius: 12,
                fontSize: 16,
                backgroundColor: isDarkColorScheme ? colors.card : colors.muted,
                color: colors.textPrimary,
                borderWidth: isDarkColorScheme ? 1 : 0,
                borderColor: `${colors.primary}33`,
              }}
            />
          </View>

          {/* Save Card Option */}
          <TouchableOpacity
            onPress={() => setSaveCard(!saveCard)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                backgroundColor: saveCard ? colors.primary : 'transparent',
                borderColor: saveCard ? colors.primary : colors.border,
              }}
            >
              {saveCard && <MaterialIcons name="check" size={16} color={colors.primaryForeground} />}
            </View>
            <Text style={{ color: colors.textPrimary }}>
              Save card for future deposits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fee Info */}
        <View style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: colors.card,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary }}>
              Deposit Amount
            </Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
              ${parseFloat(amount || '0').toFixed(2)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.textSecondary }}>
              Processing Fee (2.9%)
            </Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>
              ${(parseFloat(amount || '0') * 0.029).toFixed(2)}
            </Text>
          </View>
          <View style={{ height: 1, marginVertical: 8, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
              You'll Receive
            </Text>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
              ${(parseFloat(amount || '0') * 0.971).toFixed(2)} USDC
            </Text>
          </View>
        </View>

        {/* Security Note */}
        <View style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 24,
          backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <MaterialIcons name="lock" size={20} color={colors.primary} />
            <Text style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 12,
              lineHeight: 18,
              color: colors.textSecondary,
            }}>
              Your card details are encrypted and secure. We use industry-standard security measures to protect your information.
            </Text>
          </View>
        </View>

        <View style={{ height: 128 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: `${colors.background}CC`,
        }}
      >
        <TouchableOpacity
          onPress={handleDeposit}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: 'bold' }}>
            Deposit Funds
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

