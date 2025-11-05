import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AffordableSection({ affordable }: { affordable: any[] }) {
  const router = useRouter();
  
  return (
    <View className="pt-10 bg-transparent">
      <Text className="text-gray-900 text-xl font-bold px-4 pb-4">
        Affordable Investments
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
        {affordable.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
            className="w-[260px] mr-4 border border-gray-200 rounded-3xl p-3 py-4 shadow-sm"
            onPress={() => item.id && router.push(`/property/${item.id}`)}
            activeOpacity={0.8}
          >
            <View className="h-28 overflow-hidden mb-3">
              <Image
                source={{ uri: item.image }}
                className="w-full h-full rounded-2xl"
                resizeMode="cover"
              />
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-900 font-semibold">{item.name}</Text>
              <View className="flex-row items-center bg-emerald-100 px-2 py-0.5 rounded-full">
                <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              </View>
            </View>
            <View className="flex-row justify-between items-end">
              <Text className="text-gray-600 text-sm">
                Entry {"\n"}
                <Text className="text-gray-900 text-lg font-bold">{item.entry}</Text>
              </Text>
              <Text className="text-gray-600 text-sm">
                ROI {"\n"}
                <Text className="text-emerald-600 text-lg font-bold">{item.roi}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
