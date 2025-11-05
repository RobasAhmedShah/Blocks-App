import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function FeaturedSection({ featured }: { featured: any[] }) {
  const router = useRouter();
  return (
    <View className="pt-6 bg-transparent">
      <Text className="text-gray-900 text-xl font-bold px-4 pb-4">
        Featured Properties
      </Text>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {featured.map((item, idx) => (
          <View key={idx} className="w-screen px-4">
            <View className="relative h-[420px] rounded-2xl overflow-hidden">
              {/* Background Image */}
              <Image
                source={{ uri: item.image }}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />

              {/* Overlay Gradient - Light theme with subtle dark overlay for text readability */}
              <LinearGradient
                colors={["rgba(255, 255, 255, 0.1)", "rgba(0, 0, 0, 0.5)"]}
                className="absolute inset-0"
              />

              {/* Content */}
              <View className="absolute bottom-0 p-6 w-full">
                {/* Title */}
                <Text className="text-white text-2xl font-bold mb-4" style={{ textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                  {item.title}
                </Text>

                {/* Stats Row */}
                <View className="flex-row justify-between items-center w-full mb-5">
                  <Stat label="Expected ROI" value={item.roi} />
                  <Stat label="Funded" value={item.funded} />
                  <Stat label="Min Investment" value={item.minInvestment} />
                </View>

                {/* CTA Button */}
                <TouchableOpacity 
                  className="mt-2 w-full rounded-full overflow-hidden"
                  onPress={() => item.id && router.push(`/property/${item.id}`)}
                >
                  <LinearGradient
                    colors={["#16A34A", "#15803D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="rounded-full"
                  >
                    <View className="py-3 items-center">
                      <Text className="text-white font-bold tracking-wide">
                        View Property
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const Stat = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View className="flex-1  rounded-2xl p-3 mx-1 items-center justify-center">
    <Text className="text-gray-200 text-xs font-medium tracking-wide mb-1">
      {label}
    </Text>
    <Text className="text-white text-lg font-bold" style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{value}</Text>
  </View>
);
