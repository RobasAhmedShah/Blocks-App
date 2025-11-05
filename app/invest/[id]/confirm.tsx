import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';

export default function InvestmentConfirmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { property } = useProperty(id || '');

  if (!property) {
    return (
      <View className="flex-1 bg-[#f6f8f8] dark:bg-[#101f22] items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

  const transactionId = `#A4B2${Math.random().toString(36).substring(2, 6).toUpperCase()}C9D8`;

  return (
    <View className="flex-1 bg-[#f6f8f8] dark:bg-[#101f22]">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-12">
        <Text className="flex-1 text-center text-lg font-bold text-zinc-900 dark:text-white">
          Investment Successful
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/portfolio')}
          className="w-12 items-end"
        >
          <Ionicons name="close" size={28} color="#71717A" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="items-center justify-center px-4 pb-8">
        {/* Success Icon */}
        <View className="w-24 h-24 rounded-full bg-[#0fa0bd]/20 items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={60} color="#0fa0bd" />
        </View>

        {/* Headline */}
        <Text className="text-zinc-900 dark:text-white text-[32px] font-bold tracking-tight text-center pb-2">
          All Set!
        </Text>

        {/* Body Text */}
        <Text className="text-zinc-600 dark:text-zinc-400 text-base text-center pb-8 px-4 max-w-md">
          You have successfully purchased 250 shares in {property.title}.
        </Text>

        {/* Summary Card */}
        <View className="w-full max-w-md bg-white/50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 gap-5">
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-500 dark:text-zinc-400 text-base">Invested In</Text>
            <Text className="text-zinc-900 dark:text-white font-bold text-base">{property.title}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-500 dark:text-zinc-400 text-base">Shares Purchased</Text>
            <Text className="text-zinc-900 dark:text-white font-bold text-base">250.00</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-500 dark:text-zinc-400 text-base">Total Amount</Text>
            <Text className="text-zinc-900 dark:text-white font-bold text-base">$5,000.00 USD</Text>
          </View>
          <View className="border-t border-zinc-200 dark:border-zinc-800" />
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-500 dark:text-zinc-400 text-base">Transaction ID</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-zinc-900 dark:text-white font-bold text-base">{transactionId}</Text>
              <TouchableOpacity>
                <Ionicons name="copy-outline" size={20} color="#71717A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* CTA Buttons */}
        <View className="w-full max-w-md gap-4 pt-8">
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/portfolio')}
            className="w-full h-12 bg-[#0fa0bd] rounded-lg items-center justify-center"
          >
            <Text className="text-white text-base font-bold">View Portfolio</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-full h-12 bg-transparent rounded-lg items-center justify-center">
            <Text className="text-[#0fa0bd] text-base font-bold">Share Investment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

