import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

export default function InvestmentSection({ data, title }: { data: any[]; title: string }) {
  return (
    <View className="px-4 pt-10 bg-transparent">
      <Text className="text-gray-900 text-xl font-bold pb-4">{title}</Text>
      {data.map((item, idx) => (
        <View key={idx}
        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        className="border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-gray-900 font-semibold text-base">{item.name}</Text>
              <Text className="text-gray-600 text-sm">Total Value: {item.value}</Text>
            </View>
            <Image
              source={{ uri: item.image }}
              className="w-14 h-14 rounded-2xl"
              resizeMode="cover"
            />
          </View>
          <Text className="text-sm text-gray-900 font-medium mb-1">ROI (1Y)</Text>
          <View className="w-full h-[65px] overflow-hidden bg-gray-50/50 rounded-xl">
            <Svg width="100%" height="65" viewBox="0 0 100 40" preserveAspectRatio="none">
              <Defs>
                <SvgGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#10B981" stopOpacity="0.3" />
                  <Stop offset="1" stopColor="#10B981" stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path d={item.path} fill="none" stroke="#10B981" strokeWidth={2.4} />
              <Path d={`${item.path} V40 H0 Z`} fill={`url(#grad-${idx})`} />
            </Svg>
          </View>
          <TouchableOpacity 
          className="w-full mt-3 rounded-full border border-emerald-200 bg-emerald-50 p-3 items-center">
            <Text className="text-emerald-700 text-sm font-semibold">View Insights</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
