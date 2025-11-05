import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';

export default function BinancePayDepositScreen() {
  const router = useRouter();
  const { amount: suggestedAmount } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toString() : '');
  const [showQR, setShowQR] = useState(false);

  const quickAmounts = [100, 250, 500, 1000];
  const payId = 'BLOCKS_' + Math.random().toString(36).substring(7).toUpperCase();

  const handleGenerateQR = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setShowQR(true);
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
            Binance Pay
          </Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Binance Logo */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-yellow-500/20 items-center justify-center mb-3">
            <Text className="text-4xl">💳</Text>
          </View>
          <Text className={`text-xl font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
            Pay with Binance
          </Text>
          <Text className={`text-sm ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
            Fast and secure payment
          </Text>
        </View>

        {!showQR ? (
          <>
            {/* Amount Input */}
            <View className="mb-6">
              <Text className={`text-base font-medium mb-2 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Amount to Deposit
              </Text>
              <View
                className={`flex-row items-center px-4 py-4 rounded-xl ${
                  isDark ? 'bg-blocks-card-dark border border-teal/20' : 'bg-gray-100'
                }`}
              >
                <MaterialIcons name="attach-money" size={24} color="#F0B90B" />
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
                        ? 'bg-yellow-500'
                        : isDark
                        ? 'bg-blocks-card-dark/40 border border-yellow-500/20'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        amount === qa.toString()
                          ? 'text-black'
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

            {/* Benefits */}
            <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}>
              <Text className={`font-bold mb-3 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Why Binance Pay?
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center">
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <Text className={`ml-3 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Instant deposits
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <Text className={`ml-3 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Low transaction fees
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  <Text className={`ml-3 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Secure and verified
                  </Text>
                </View>
              </View>
            </View>

            {/* Fee Info */}
            <View className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark/40' : 'bg-gray-100'}`}>
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
                  Processing Fee
                </Text>
                <Text className="font-medium text-green-500">$0.00</Text>
              </View>
              <View className={`h-px my-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
              <View className="flex-row justify-between">
                <Text className={`font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                  You'll Receive
                </Text>
                <Text className="font-bold text-yellow-500">
                  ${parseFloat(amount || '0').toFixed(2)} USDC
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* QR Code Screen */}
            <View className={`items-center p-6 rounded-2xl mb-6 ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}>
              <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Scan to Pay
              </Text>
              <View className="w-56 h-56 bg-white p-3 rounded-xl mb-4">
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=binancepay://${payId}`,
                  }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
              <View className={`w-full p-3 rounded-xl ${isDark ? 'bg-blocks-bg-dark' : 'bg-gray-100'}`}>
                <Text className={`text-center font-mono text-sm ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                  {payId}
                </Text>
              </View>
              <Text className={`text-center mt-4 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                Open Binance app and scan this QR code to complete payment
              </Text>
            </View>

            {/* Status */}
            <View className={`flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-blocks-card-dark' : 'bg-white'}`}>
              <View className="w-2 h-2 rounded-full bg-yellow-500 mr-3" />
              <Text className="text-yellow-500 font-medium">Waiting for payment...</Text>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowQR(false)}
              className="mt-4 py-3 rounded-xl items-center"
            >
              <Text className="text-teal font-semibold">Cancel Payment</Text>
            </TouchableOpacity>
          </>
        )}

        <View className="h-32" />
      </ScrollView>

      {/* Bottom CTA */}
      {!showQR && (
        <View
          className={`px-4 py-4 border-t ${
            isDark ? 'bg-blocks-bg-dark/80 border-gray-700' : 'bg-blocks-bg-light/80 border-gray-200'
          }`}
        >
          <TouchableOpacity
            onPress={handleGenerateQR}
            className="bg-yellow-500 py-4 rounded-xl items-center justify-center"
          >
            <Text className="text-black text-lg font-bold">Generate Payment QR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

