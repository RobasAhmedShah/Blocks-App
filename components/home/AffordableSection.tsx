import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";

export default function AffordableSection({ affordable }: { affordable: any[] }) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  return (
    <View style={{ paddingTop: 40, backgroundColor: 'transparent' }}>
      <Text style={{ 
        color: colors.textPrimary, 
        fontSize: 20, 
        fontWeight: 'bold', 
        paddingHorizontal: 16, 
        paddingBottom: 16 
      }}>
        Affordable Investments
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
        {affordable.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={{ 
              backgroundColor: isDarkColorScheme ? `${colors.card}DD` : `${colors.card}E6`,
              width: 260,
              marginRight: 16,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 24,
              padding: 12,
              paddingVertical: 16,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => item.id && router.push(`/property/${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={{ height: 112, overflow: 'hidden', marginBottom: 12 }}>
              <Image
                source={{ uri: item.image }}
                style={{ width: '100%', height: '100%', borderRadius: 16 }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                // backgroundColor: `${colors.primary}20`, 
                paddingHorizontal: 8, 
                paddingVertical: 2, 
                borderRadius: 9999 
              }}>
                <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Entry {"\n"}
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>{item.entry}</Text>
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                ROI {"\n"}
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold' }}>{item.roi}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
