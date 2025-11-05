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

export default function CardDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const quickAmounts = [100, 250, 500, 1000];

  const handleDeposit = () => {
    if (!amount || !cardNumber || !expiryDate || !cvv || !cardHolder) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

   router.push('/wallet/deposit/card-successfull');
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className={`px-4 pt-12 pb-4 ${isDark ? 'bg-blocks-bg-dark/80' : 'bg-blocks-bg-light/80'}`}
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-blocks-card-dark/60' : 'bg-gray-200'
            }`}
          >
            <MaterialIcons name="arrow-back" size={24} color={isDark ? '#E0E0E0' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Card Deposit
          </Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Amount Input */}
        <View className="mb-6">
          <Text className={`text-base font-medium mb-2 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Amount
          </Text>
          <View
            className={`flex-row items-center px-4 py-4 rounded-xl ${
              isDark ? 'bg-blocks-card-dark border border-teal/20' : 'bg-gray-100'
            }`}
          >
            <MaterialIcons name="attach-money" size={24} color="#0fa0bd" />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
              className={`flex-1 ml-3 text-2xl font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}
            />
            <Text className={`text-sm ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              USDC
            </Text>
          </View>

          {/* Quick Amount Buttons */}
          <View className="flex-row gap-2 mt-3">
            {quickAmounts.map((qa) => (
              <TouchableOpacity
                key={qa}
                onPress={() => setAmount(qa.toString())}
                className={`flex-1 py-2 rounded-full ${
                  amount === qa.toString()
                    ? 'bg-teal'
                    : isDark
                    ? 'bg-blocks-card-dark/40 border border-teal/20'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    amount === qa.toString()
                      ? 'text-white'
                      : isDark
                      ? 'text-blocks-text-dark'
                      : 'text-blocks-text-light'
                  }`}
                >
                  ${qa}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Details */}
        <Text className={`text-base font-medium mb-3 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
          Card Details
        </Text>

        <View className="gap-3 mb-6">
          {/* Card Number */}
          <View>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              keyboardType="numeric"
              placeholder="Card Number"
              maxLength={19}
              placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
              className={`px-4 py-4 rounded-xl text-base ${
                isDark
                  ? 'bg-blocks-card-dark text-blocks-text-dark border border-teal/20'
                  : 'bg-gray-100 text-blocks-text-light'
              }`}
            />
          </View>

          {/* Expiry and CVV */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextInput
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="MM/YY"
                maxLength={5}
                keyboardType="numeric"
                placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
                className={`px-4 py-4 rounded-xl text-base ${
                  isDark
                    ? 'bg-blocks-card-dark text-blocks-text-dark border border-teal/20'
                    : 'bg-gray-100 text-blocks-text-light'
                }`}
              />
            </View>
            <View className="flex-1">
              <TextInput
                value={cvv}
                onChangeText={setCvv}
                placeholder="CVV"
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
                className={`px-4 py-4 rounded-xl text-base ${
                  isDark
                    ? 'bg-blocks-card-dark text-blocks-text-dark border border-teal/20'
                    : 'bg-gray-100 text-blocks-text-light'
                }`}
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
              placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
              className={`px-4 py-4 rounded-xl text-base ${
                isDark
                  ? 'bg-blocks-card-dark text-blocks-text-dark border border-teal/20'
                  : 'bg-gray-100 text-blocks-text-light'
              }`}
            />
          </View>

          {/* Save Card Option */}
          <TouchableOpacity
            onPress={() => setSaveCard(!saveCard)}
            className="flex-row items-center"
          >
            <View
              className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                saveCard ? 'bg-teal border-teal' : isDark ? 'border-gray-600' : 'border-gray-300'
              }`}
            >
              {saveCard && <MaterialIcons name="check" size={16} color="white" />}
            </View>
            <Text className={isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}>
              Save card for future deposits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fee Info */}
        <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark' : 'bg-gray-100'}`}>
          <View className="flex-row justify-between mb-2">
            <Text className={isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}>
              Deposit Amount
            </Text>
            <Text className={`font-medium ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
              ${parseFloat(amount || '0').toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}>
              Processing Fee (2.9%)
            </Text>
            <Text className={`font-medium ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
              ${(parseFloat(amount || '0') * 0.029).toFixed(2)}
            </Text>
          </View>
          <View className={`h-px my-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          <View className="flex-row justify-between">
            <Text className={`font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
              You'll Receive
            </Text>
            <Text className="font-bold text-teal">
              ${(parseFloat(amount || '0') * 0.971).toFixed(2)} USDC
            </Text>
          </View>
        </View>

        {/* Security Note */}
        <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark/40' : 'bg-gray-100'}`}>
          <View className="flex-row items-start">
            <MaterialIcons name="lock" size={20} color="#10B981" />
            <Text className={`flex-1 ml-3 text-xs leading-relaxed ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
              Your card details are encrypted and secure. We use industry-standard security measures to protect your information.
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className={`px-4 py-4 border-t ${
          isDark ? 'bg-blocks-bg-dark/80 border-gray-700' : 'bg-blocks-bg-light/80 border-gray-200'
        }`}
      >
        <TouchableOpacity
          onPress={handleDeposit}
          className="bg-teal py-4 rounded-xl items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">Deposit Funds</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

