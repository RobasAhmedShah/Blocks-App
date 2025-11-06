import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ExploreButton() {
  const router = useRouter();
  const { colors } = useColorScheme();
  
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 96, marginTop: 32 }}>
      <TouchableOpacity 
        onPress={() => router.push("/(tabs)/property")} 
        activeOpacity={0.9} 
        style={{ borderRadius: 9999, overflow: 'hidden' }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primarySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 9999,
            paddingVertical: 16,
            paddingHorizontal: 32,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text style={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            color: colors.primaryForeground, 
            fontSize: 16, 
            letterSpacing: 0.5 
          }}>
              Explore All Properties
            </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
