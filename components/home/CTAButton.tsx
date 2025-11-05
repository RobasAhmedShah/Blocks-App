import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function ExploreButton() {
  const router = useRouter();
  return (
    <View className="px-4 mb-24 mt-8">
      <TouchableOpacity 
        onPress={() => router.push("/(tabs)/property")} 
        activeOpacity={0.9} 
        className="rounded-full overflow-hidden"
      >
        <LinearGradient
          colors={["#16A34A", "#15803D"]} // emerald-600 to emerald-700
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-full py-4 px-8"
          style={{
            shadowColor: "#16A34A",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-center font-bold text-white text-base tracking-wide">
            Explore All Properties
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
