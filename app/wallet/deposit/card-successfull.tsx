import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function DepositConfirmationLight() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f8]">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity>
          <Ionicons name="close" size={28} color="#0b3d36" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-[#0b3d36] text-lg font-bold tracking-tight pr-8">
          Confirmation
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        {/* Check Icon */}
        <View className="items-center mb-6">
          <View className="relative">
            {/* <LinearGradient
              colors={["#00bfa5", "#00ffc6"]}
              className="absolute inset-0 rounded-full opacity-20 blur-2xl"
            /> */}
            <View className="h-20 w-20 items-center justify-center rounded-full bg-[#0da5a533]">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#0da5a5]">
                <Ionicons name="checkmark" size={32} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        {/* Title & Description */}
        <Text className="text-[#0da5a5] text-3xl font-bold text-center leading-tight">
          Deposit Confirmed!
        </Text>
        <Text className="text-gray-600 text-base text-center mt-2">
          Your funds of $1,000.00 are now available.
        </Text>

        {/* Info Card */}
        <View className="mt-8 w-full rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <InfoRow label="Amount Deposited" value="$1,000.00 USD" bold />
          <Divider />
          <InfoRow
            label="Deposit Method"
            value="Debit Card **** 1234"
            bold={false}
          />
          <Divider />
          <View className="flex-row justify-between items-center py-3">
            <Text className="text-gray-500 text-sm">Transaction ID</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-gray-700 text-sm">A1B2-C3D4-E5F6</Text>
              <TouchableOpacity>
                <Ionicons name="copy-outline" size={16} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
          <Divider />
          <InfoRow
            label="Date & Time"
            value="Oct 26, 2023, 10:05 AM"
            bold={false}
          />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="border-t border-gray-200 bg-white px-4 pb-6 pt-2 shadow-md">
        <View className="max-w-md w-full mx-auto items-center gap-3">
          <TouchableOpacity
          onPress={() => router.push('/(tabs)/wallet')}
          className="w-full rounded-full overflow-hidden">
            <LinearGradient
              colors={["#0da5a5", "#0da5a5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-full"
            >
              <View className="py-3 items-center">
                <Text className="text-white font-bold text-base">
                  View Wallet
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
          onPress={() => router.push('/(tabs)/home')}
          className="w-full rounded-full border border-[#0da5a5] py-3 items-center">
            <Text className="text-[#0da5a5] font-bold text-base">
              Return to Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('../wallet/deposit/card')}>
            <Text className="text-gray-500 text-sm font-bold mt-1">
              Make Another Deposit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
 
  );
}

function InfoRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center py-3">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text
        className={`text-sm text-right ${
          bold ? "text-gray-800 font-bold" : "text-gray-700"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-200" />;
}
