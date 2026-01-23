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
import { LinearGradient } from "expo-linear-gradient";
import EmeraldLoader from "@/components/EmeraldLoader";

// Validation interfaces
interface ValidationError {
  [key: string]: string;
}

export default function AddCardScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { returnTo, returnAmount } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError>({});

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

  // Validation Functions
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    
    // Check minimum length for first 4 digits
    if (cleaned.length < 4) {
      setErrors(prev => ({ ...prev, cardNumber: 'Enter at least 4 digits' }));
      return false;
    }

    // Validate card type from first 4 digits
    const cardType = detectCardType(cleaned);
    if (cardType === 'Unknown') {
      setErrors(prev => ({ ...prev, cardNumber: 'Unsupported card type (first 4 digits)' }));
      return false;
    }

    // Check full length only if user has entered more than 4 digits
    if (cleaned.length > 4) {
      if (cleaned.length < 13 || cleaned.length > 16) {
        setErrors(prev => ({ ...prev, cardNumber: 'Card number must be 13-16 digits total' }));
        return false;
      }
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cardNumber;
      return newErrors;
    });
    return true;
  };

  const validateCardholderName = (name: string): boolean => {
    if (name.trim().length < 3) {
      setErrors(prev => ({ ...prev, cardholderName: 'Name must be at least 3 characters' }));
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setErrors(prev => ({ ...prev, cardholderName: 'Name can only contain letters and spaces' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cardholderName;
      return newErrors;
    });
    return true;
  };

  const validateExpiryMonth = (month: string): boolean => {
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setErrors(prev => ({ ...prev, expiryMonth: 'Invalid month (01-12)' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.expiryMonth;
      return newErrors;
    });
    return true;
  };

  const validateExpiryYear = (year: string): boolean => {
    const currentYear = new Date().getFullYear();
    const yearNum = year.length === 2 ? parseInt(`20${year}`, 10) : parseInt(year, 10);
    
    if (isNaN(yearNum)) {
      setErrors(prev => ({ ...prev, expiryYear: 'Invalid year' }));
      return false;
    }
    if (yearNum < currentYear || yearNum > currentYear + 20) {
      setErrors(prev => ({ ...prev, expiryYear: 'Card expired or invalid year' }));
      return false;
    }

    // Check if card is expired (month + year)
    if (expiryMonth && yearNum === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      const monthNum = parseInt(expiryMonth, 10);
      if (monthNum < currentMonth) {
        setErrors(prev => ({ ...prev, expiryYear: 'Card has expired' }));
        return false;
      }
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.expiryYear;
      return newErrors;
    });
    return true;
  };

  const validateCVV = (cvvValue: string): boolean => {
    if (cvvValue.length < 3 || cvvValue.length > 4) {
      setErrors(prev => ({ ...prev, cvv: 'CVV must be 3 or 4 digits' }));
      return false;
    }
    if (!/^\d+$/.test(cvvValue)) {
      setErrors(prev => ({ ...prev, cvv: 'CVV must contain only digits' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cvv;
      return newErrors;
    });
    return true;
  };

  const validateBillingAddress = (address: string): boolean => {
    if (address.trim().length < 5) {
      setErrors(prev => ({ ...prev, billingAddress: 'Address must be at least 5 characters' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.billingAddress;
      return newErrors;
    });
    return true;
  };

  const validateCity = (city: string): boolean => {
    if (city.trim().length < 2) {
      setErrors(prev => ({ ...prev, billingCity: 'City must be at least 2 characters' }));
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(city)) {
      setErrors(prev => ({ ...prev, billingCity: 'City can only contain letters' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.billingCity;
      return newErrors;
    });
    return true;
  };

  const validateState = (state: string): boolean => {
    if (state.trim().length < 2) {
      setErrors(prev => ({ ...prev, billingState: 'State must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.billingState;
      return newErrors;
    });
    return true;
  };

  const validatePostalCode = (code: string): boolean => {
    if (code.trim().length < 3) {
      setErrors(prev => ({ ...prev, billingPostalCode: 'Postal code must be at least 3 characters' }));
      return false;
    }
    // Allow alphanumeric for international support
    if (!/^[a-zA-Z0-9\s-]+$/.test(code)) {
      setErrors(prev => ({ ...prev, billingPostalCode: 'Invalid postal code format' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.billingPostalCode;
      return newErrors;
    });
    return true;
  };

  const validateCountry = (country: string): boolean => {
    if (country.trim().length < 2) {
      setErrors(prev => ({ ...prev, billingCountry: 'Country must be at least 2 characters' }));
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(country)) {
      setErrors(prev => ({ ...prev, billingCountry: 'Country can only contain letters' }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.billingCountry;
      return newErrors;
    });
    return true;
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    // Allow up to 16 digits + 3 spaces = 19 characters
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
      if (formatted.replace(/\s/g, '').length >= 4) {
        validateCardNumber(formatted);
      }
    }
  };

  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    const firstFourDigits = cleaned.substring(0, 4);
    
    // Visa: starts with 4
    if (firstFourDigits.startsWith('4')) {
      return 'Visa';
    }
    
    // Mastercard: starts with 51-55 or 2221-2720
    if (firstFourDigits.startsWith('5')) {
      const firstTwo = parseInt(firstFourDigits.substring(0, 2));
      if (firstTwo >= 51 && firstTwo <= 55) {
        return 'Mastercard';
      }
    }
    if (firstFourDigits.startsWith('2')) {
      const firstFour = parseInt(firstFourDigits);
      if (firstFour >= 2221 && firstFour <= 2720) {
        return 'Mastercard';
      }
    }
    
    // American Express: starts with 34 or 37
    if (firstFourDigits.startsWith('34') || firstFourDigits.startsWith('37')) {
      return 'American Express';
    }
    
    // Discover: starts with 6011, 644-649, or 65
    if (firstFourDigits.startsWith('6011')) {
      return 'Discover';
    }
    if (firstFourDigits.startsWith('6')) {
      const firstThree = parseInt(firstFourDigits.substring(0, 3));
      if (firstThree >= 644 && firstThree <= 649) {
        return 'Discover';
      }
      if (firstFourDigits.startsWith('65')) {
        return 'Discover';
      }
    }
    
    return 'Unknown';
  };

  const getCardIcon = (number: string) => {
    const cardType = detectCardType(number.replace(/\s/g, ''));
    switch (cardType) {
      case 'Visa':
        return 'card';
      case 'Mastercard':
        return 'card';
      case 'American Express':
        return 'card';
      case 'Discover':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isCardNumberValid = validateCardNumber(cardNumber);
    const isCardholderNameValid = validateCardholderName(cardholderName);
    const isExpiryMonthValid = validateExpiryMonth(expiryMonth);
    const isExpiryYearValid = validateExpiryYear(expiryYear);
    const isCVVValid = validateCVV(cvv);
    const isBillingAddressValid = validateBillingAddress(billingAddress);
    const isBillingCityValid = validateCity(billingCity);
    const isBillingStateValid = validateState(billingState);
    const isBillingPostalCodeValid = validatePostalCode(billingPostalCode);
    const isBillingCountryValid = validateCountry(billingCountry);

    if (
      !isCardNumberValid ||
      !isCardholderNameValid ||
      !isExpiryMonthValid ||
      !isExpiryYearValid ||
      !isCVVValid ||
      !isBillingAddressValid ||
      !isBillingCityValid ||
      !isBillingStateValid ||
      !isBillingPostalCodeValid ||
      !isBillingCountryValid
    ) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    // Additional check: ensure card number is complete (13-16 digits)
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13) {
      Alert.alert('Validation Error', 'Please enter a complete card number (13-16 digits)');
      return;
    }

    try {
      setLoading(true);
      
      const cardType = detectCardType(cardNumber);

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
          cardCategory: 'Credit',
          billingAddress,
          billingCity,
          billingState,
          billingPostalCode,
          billingCountry,
        },
      };

      const newMethod = await paymentMethodsApi.createPaymentMethod(dto);
      
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Linear Gradient Background */}
      <LinearGradient
        colors={isDarkColorScheme 
          ? [
            '#00C896',           // Teal green (top)
            '#064E3B',           // Deep emerald (40% mark)
            '#032822',
            '#021917',
            ]
          : [
              '#ECFDF5',
              '#D1FAE5',
              '#A7F3D0',
              '#FFFFFF',
            ]
        }
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
      <View
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Add Card
            </Text>
          </View>

          <View className="w-10" />
        </View>

       
      </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="px-4 py-6">
            {/* Card Number */}
            <View className="mb-4">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Card Number *
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  onBlur={() => validateCardNumber(cardNumber)}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={19}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    paddingRight: 50,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.cardNumber ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                <View style={{ position: 'absolute', right: 16, top: 14 }}>
                  <Ionicons name={getCardIcon(cardNumber)} size={24} color={colors.primary} />
                </View>
              </View>
              {errors.cardNumber && (
                <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
                  {errors.cardNumber}
                </Text>
              )}
              {cardNumber && !errors.cardNumber && cardNumber.replace(/\s/g, '').length >= 4 && (
                <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4 }}>
                  ✓ {detectCardType(cardNumber.replace(/\s/g, ''))} detected
                </Text>
              )}
            </View>

            {/* Cardholder Name */}
            <View className="mb-4">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Cardholder Name *
              </Text>
              <TextInput
                value={cardholderName}
                onChangeText={(text) => {
                  setCardholderName(text);
                  if (text.length >= 3) validateCardholderName(text);
                }}
                onBlur={() => validateCardholderName(cardholderName)}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1.5,
                  borderColor: errors.cardholderName ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                }}
              />
              {errors.cardholderName && (
                <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
                  {errors.cardholderName}
                </Text>
              )}
            </View>

            {/* Expiry and CVV */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  Month *
                </Text>
                <TextInput
                  value={expiryMonth}
                  onChangeText={(text) => {
                    if (text.length <= 2 && /^\d*$/.test(text)) {
                      setExpiryMonth(text);
                      if (text.length === 2) validateExpiryMonth(text);
                    }
                  }}
                  onBlur={() => validateExpiryMonth(expiryMonth)}
                  placeholder="MM"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.expiryMonth ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.expiryMonth && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.expiryMonth}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  Year *
                </Text>
                <TextInput
                  value={expiryYear}
                  onChangeText={(text) => {
                    if (text.length <= 4 && /^\d*$/.test(text)) {
                      setExpiryYear(text);
                      if (text.length >= 2) validateExpiryYear(text);
                    }
                  }}
                  onBlur={() => validateExpiryYear(expiryYear)}
                  placeholder="YYYY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.expiryYear ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.expiryYear && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.expiryYear}
                  </Text>
                )}
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
                      if (text.length >= 3) validateCVV(text);
                    }
                  }}
                  onBlur={() => validateCVV(cvv)}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.cvv ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.cvv && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.cvv}
                  </Text>
                )}
              </View>
            </View>

            {/* Billing Address Section */}
            <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-3 mt-2">
              Billing Address
            </Text>

            <View className="mb-4">
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                Street Address *
              </Text>
              <TextInput
                value={billingAddress}
                onChangeText={(text) => {
                  setBillingAddress(text);
                  if (text.length >= 5) validateBillingAddress(text);
                }}
                onBlur={() => validateBillingAddress(billingAddress)}
                placeholder="123 Main St"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                  color: colors.textPrimary,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 16,
                  borderWidth: 1.5,
                  borderColor: errors.billingAddress ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                }}
              />
              {errors.billingAddress && (
                <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 4 }}>
                  {errors.billingAddress}
                </Text>
              )}
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  City *
                </Text>
                <TextInput
                  value={billingCity}
                  onChangeText={(text) => {
                    setBillingCity(text);
                    if (text.length >= 2) validateCity(text);
                  }}
                  onBlur={() => validateCity(billingCity)}
                  placeholder="City"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.billingCity ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.billingCity && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.billingCity}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  State *
                </Text>
                <TextInput
                  value={billingState}
                  onChangeText={(text) => {
                    setBillingState(text);
                    if (text.length >= 2) validateState(text);
                  }}
                  onBlur={() => validateState(billingState)}
                  placeholder="State"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.billingState ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.billingState && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.billingState}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  Postal Code *
                </Text>
                <TextInput
                  value={billingPostalCode}
                  onChangeText={(text) => {
                    setBillingPostalCode(text);
                    if (text.length >= 3) validatePostalCode(text);
                  }}
                  onBlur={() => validatePostalCode(billingPostalCode)}
                  placeholder="12345"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.billingPostalCode ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.billingPostalCode && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.billingPostalCode}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-2">
                  Country *
                </Text>
                <TextInput
                  value={billingCountry}
                  onChangeText={(text) => {
                    setBillingCountry(text);
                    if (text.length >= 2) validateCountry(text);
                  }}
                  onBlur={() => validateCountry(billingCountry)}
                  placeholder="USA"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                    color: colors.textPrimary,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 12,
                    fontSize: 16,
                    borderWidth: 1.5,
                    borderColor: errors.billingCountry ? colors.destructive : isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
                {errors.billingCountry && (
                  <Text style={{ color: colors.destructive, fontSize: 10, marginTop: 2 }}>
                    {errors.billingCountry}
                  </Text>
                )}
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
                  borderColor: isDefault ? colors.primary : isDarkColorScheme ? 'rgba(34, 197, 94, 0.4)' : colors.border,
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
                backgroundColor: isDarkColorScheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
                borderWidth: 1.5,
                borderColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
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
            // backgroundColor: isDarkColorScheme ? 'rgba(9, 156, 107, 0.75)' : 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
            // borderTopWidth: 1,
            // borderTopColor: isDarkColorScheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          }}
          className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4"
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || Object.keys(errors).length > 0}
            style={{ 
              backgroundColor: loading || Object.keys(errors).length > 0 ? colors.textMuted : colors.primary,
              opacity: loading || Object.keys(errors).length > 0 ? 0.6 : 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            className="h-14 rounded-xl flex-row items-center justify-center gap-2"
            activeOpacity={0.8}
          >
            {loading ? (
              <EmeraldLoader />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                <Text className="text-white text-base font-bold">
                  Add Payment Method
                </Text>
              </>
            )}
          </TouchableOpacity>
          {Object.keys(errors).length > 0 && (
            <Text style={{ color: colors.destructive, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              Please fix all errors before submitting
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}