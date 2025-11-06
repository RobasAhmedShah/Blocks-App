import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";

export default function FeaturedSection({ featured }: { featured: any[] }) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  return (
    <View style={{ paddingTop: 24, backgroundColor: 'transparent' }}>
      <Text style={{ 
        color: colors.textPrimary, 
        fontSize: 20, 
        fontWeight: 'bold', 
        paddingHorizontal: 16, 
        paddingBottom: 16 
      }}>
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

              {/* Overlay Gradient - for text readability */}
              <LinearGradient
                colors={
                  isDarkColorScheme
                    ? ["rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.7)"]
                    : ["rgba(255, 255, 255, 0.1)", "rgba(0, 0, 0, 0.5)"]
                }
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />

              {/* Content */}
              <View style={{ position: 'absolute', bottom: 0, padding: 24, width: '100%' }}>
                {/* Title */}
                <Text style={{ 
                  color: '#FFFFFF', 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  marginBottom: 16,
                  textShadowColor: 'rgba(0, 0, 0, 0.8)', 
                  textShadowOffset: { width: 0, height: 2 }, 
                  textShadowRadius: 4 
                }}>
                  {item.title}
                </Text>

                {/* Stats Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                  <Stat label="Expected ROI" value={item.roi} />
                  <Stat label="Funded" value={item.funded} />
                  <Stat label="Min Investment" value={item.minInvestment} />
                </View>

                {/* CTA Button */}
                <TouchableOpacity 
                  style={{ marginTop: 8, width: '100%', borderRadius: 9999, overflow: 'hidden' }}
                  onPress={() => item.id && router.push(`/property/${item.id}`)}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primarySoft]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 9999 }}
                  >
                    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                      <Text style={{ color: colors.primaryForeground, fontWeight: 'bold', letterSpacing: 0.5 }}>
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
  <View style={{ 
    flex: 1, 
    borderRadius: 16, 
    padding: 12, 
    marginHorizontal: 4, 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <Text style={{ 
      color: 'rgba(229, 231, 235, 0.9)', 
      fontSize: 12, 
      fontWeight: '500', 
      letterSpacing: 0.5, 
      marginBottom: 4 
    }}>
      {label}
    </Text>
    <Text style={{ 
      color: '#FFFFFF', 
      fontSize: 18, 
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.5)', 
      textShadowOffset: { width: 0, height: 1 }, 
      textShadowRadius: 2 
    }}>
      {value}
    </Text>
  </View>
);
