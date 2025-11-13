import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { paymentMethodsApi, CreatePaymentMethodDto } from "@/services/api/paymentMethods.api";

export default function AddCardScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { returnTo, returnAmount } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // Card Details
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    if (formatted.length <= 19) { // Max length with spaces
      setCardNumber(formatted);
    }
  };

  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'American Express';
    return 'Unknown';
  };

  const handleSubmit = async () => {
    // Validation
    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      Alert.alert('Error', 'Please fill in all required card fields');
      return;
    }

    if (!billingAddress || !billingCity || !billingState || !billingPostalCode || !billingCountry) {
      Alert.alert('Error', 'Please fill in all billing address fields');
      return;
    }

    try {
      setLoading(true);
      
      const cardType = detectCardType(cardNumber);
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');

      const dto: CreatePaymentMethodDto = {
        type: 'card',
        provider: cardType,
        isDefault,
        cardDetails: {
          cardNumber: cleanedCardNumber,
          cardholderName,
          expiryMonth: expiryMonth.padStart(2, '0'),
          expiryYear: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
          cvv,
          cardType,
          cardCategory: 'Credit', // Could be determined or asked from user
          billingAddress,
          billingCity,
          billingState,
          billingPostalCode,
          billingCountry,
        },
      };

      const newMethod = await paymentMethodsApi.createPaymentMethod(dto);
      
      // If returnTo is specified, navigate back with the new method ID
      if (returnTo) {
        router.replace({
          pathname: `../${returnTo}`,
          params: {
            selectedMethodId: newMethod.id,
            amount: returnAmount,
          },
        } as any);
      } else {
        Alert.alert('Success', 'Payment method added successfully and ready to use!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', error.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Add Payment Method
        </Text>

        <View className="w-12" />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-4 py-6">
          {/* Card Number */}
          <View className="mb-4">
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
              Card Number *
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={19}
              style={{
                backgroundColor: colors.card,
                color: colors.textPrimary,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Cardholder Name */}
          <View className="mb-4">
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
              Cardholder Name *
            </Text>
            <TextInput
              value={cardholderName}
              onChangeText={setCardholderName}
              placeholder="John Doe"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              style={{
                backgroundColor: colors.card,
                color: colors.textPrimary,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Expiry and CVV */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Expiry Month *
              </Text>
              <TextInput
                value={expiryMonth}
                onChangeText={(text) => {
                  if (text.length <= 2 && /^\d*$/.test(text)) {
                    setExpiryMonth(text);
                  }
                }}
                placeholder="MM"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={2}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Expiry Year *
              </Text>
              <TextInput
                value={expiryYear}
                onChangeText={(text) => {
                  if (text.length <= 4 && /^\d*$/.test(text)) {
                    setExpiryYear(text);
                  }
                }}
                placeholder="YYYY"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                CVV *
              </Text>
              <TextInput
                value={cvv}
                onChangeText={(text) => {
                  if (text.length <= 4 && /^\d*$/.test(text)) {
                    setCvv(text);
                  }
                }}
                placeholder="123"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          {/* Billing Address */}
          <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-3 mt-2">
            Billing Address
          </Text>

          <View className="mb-4">
            <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
              Street Address *
            </Text>
            <TextInput
              value={billingAddress}
              onChangeText={setBillingAddress}
              placeholder="123 Main St"
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.card,
                color: colors.textPrimary,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                City *
              </Text>
              <TextInput
                value={billingCity}
                onChangeText={setBillingCity}
                placeholder="City"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                State *
              </Text>
              <TextInput
                value={billingState}
                onChangeText={setBillingState}
                placeholder="State"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Postal Code *
              </Text>
              <TextInput
                value={billingPostalCode}
                onChangeText={setBillingPostalCode}
                placeholder="12345"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Country *
              </Text>
              <TextInput
                value={billingCountry}
                onChangeText={setBillingCountry}
                placeholder="USA"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
            </View>
          </View>

          {/* Set as Default */}
          <TouchableOpacity
            onPress={() => setIsDefault(!isDefault)}
            className="flex-row items-center mb-6"
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                backgroundColor: isDefault ? colors.primary : 'transparent',
                borderColor: isDefault ? colors.primary : colors.border,
              }}
            >
              {isDefault && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={{ color: colors.textPrimary }} className="text-sm">
              Set as default payment method
            </Text>
          </TouchableOpacity>

          {/* Security Note */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme ? `${colors.card}66` : colors.muted,
              borderWidth: 1,
              borderColor: colors.border
            }}
            className="rounded-xl p-4 mb-6"
          >
            <View className="flex-row items-start gap-3">
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  Secure & Encrypted
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  Your card details are encrypted and stored securely. We use industry-standard security measures to protect your information.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View 
        style={{ 
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDarkColorScheme ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
        className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4"
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ 
            backgroundColor: loading ? colors.textMuted : colors.primary,
            opacity: loading ? 0.6 : 1,
          }}
          className="h-14 rounded-xl flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <Text className="text-white text-base font-bold">
                Add Payment Method
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

