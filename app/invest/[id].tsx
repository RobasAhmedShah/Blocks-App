import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { useWallet } from '@/services/useWallet';

export default function InvestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { property, loading } = useProperty(id || '');
  const { balance, invest } = useWallet();
  const [tokenCount, setTokenCount] = useState(10);
  const [showModal, setShowModal] = useState(true);

  if (loading || !property) {
    return (
      <View className="flex-1 bg-[#1d2c2f] items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  const totalAmount = tokenCount * property.tokenPrice;
  const transactionFee = totalAmount * 0.02; // 2% fee
  const totalInvestment = totalAmount + transactionFee;
  const sliderValue = Math.min((totalAmount / Math.max(balance.usdc, 1)) * 100, 100);

  const handleConfirm = async () => {
    if (balance.usdc < totalInvestment) {
      router.push({
        pathname: '/wallet/deposit/debit-card',
        params: { requiredAmount: totalInvestment.toString() },
      });
      return;
    }

    await invest(totalInvestment, property.id);
    router.push(`/invest/${id}/confirm`);
  };

  return (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => router.back()}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-[#1d2c2f] dark:bg-[#1A1A1D] rounded-t-xl">
          {/* Handle */}
          <View className="h-5 items-center justify-center pt-3 pb-2">
            <View className="h-1 w-9 rounded-full bg-[#3b4f54]" />
          </View>

          {/* Header */}
          <View className="px-5 pt-4 pb-2">
            <Text className="text-white text-[28px] font-bold tracking-tight">
              Invest in {property.title}
            </Text>
            <Text className="text-[#9db4b9] text-sm pt-1">
              {property.tokenSymbol} - ${property.tokenPrice.toFixed(2)}/token
            </Text>
          </View>

          {/* Token Input */}
          <View className="px-5 pt-6 pb-4">
            <View className="flex-row items-center gap-4 bg-[#2c3f44] dark:bg-[#2C2F36] px-4 min-h-14 justify-between rounded-lg">
              <View className="flex-row items-center gap-4 flex-1">
                <Ionicons name="cash-outline" size={24} color="#fff" />
                <Text className="text-white text-base flex-1">Number of Tokens</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setTokenCount(Math.max(1, tokenCount - 1))}
                  className="w-8 h-8 items-center justify-center rounded-full bg-[#3b4f54] dark:bg-[#3E424B]"
                >
                  <Text className="text-white text-xl font-medium">-</Text>
                </TouchableOpacity>
                <Text className="text-white text-base font-medium w-12 text-center">{tokenCount}</Text>
                <TouchableOpacity
                  onPress={() => setTokenCount(tokenCount + 1)}
                  className="w-8 h-8 items-center justify-center rounded-full bg-[#3b4f54] dark:bg-[#3E424B]"
                >
                  <Text className="text-white text-xl font-medium">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Slider */}
            <View className="pt-2">
              <View className="flex-row items-center gap-4">
                <View className="flex-1 h-1.5 rounded-full bg-[#3b4f54]">
                  <View
                    className="h-full rounded-full bg-[#0fa0bd]"
                    style={{ width: `${sliderValue}%` }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Financial Summary */}
          <View className="px-5 py-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-[#9db4b9] text-sm">Available Balance</Text>
              <Text className="text-white text-sm font-medium">${balance.usdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[#9db4b9] text-sm">Transaction Fee</Text>
              <Text className="text-white text-sm font-medium">${transactionFee.toFixed(2)}</Text>
            </View>
            <View className="h-px bg-[#3b4f54] my-2" />
            <View className="flex-row justify-between">
              <Text className="text-white text-base font-bold">Total Investment</Text>
              <Text className="text-[#0fa0bd] text-xl font-bold">${totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {/* CTA Button */}
          <View className="px-5 pt-4 pb-8">
            <TouchableOpacity
              onPress={handleConfirm}
              className={`w-full py-4 px-4 rounded-xl ${
                balance.usdc >= totalInvestment
                  ? 'bg-[#0fa0bd]'
                  : 'bg-[#3b4f54] opacity-50'
              }`}
              disabled={balance.usdc < totalInvestment}
            >
              <Text className="text-white text-base font-bold text-center">
                {balance.usdc >= totalInvestment
                  ? 'Confirm Investment'
                  : 'Insufficient Balance'}
              </Text>
            </TouchableOpacity>
            {balance.usdc < totalInvestment && (
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/wallet/deposit/debit-card',
                    params: { requiredAmount: totalInvestment.toString() },
                  });
                }}
                className="mt-3"
              >
                <Text className="text-[#0fa0bd] text-center text-sm font-semibold">
                  Add ${(totalInvestment - balance.usdc).toFixed(2)} to your wallet
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

