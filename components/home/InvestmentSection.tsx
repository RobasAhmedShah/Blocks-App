import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { useColorScheme } from "@/lib/useColorScheme";

export default function InvestmentSection({ data, title }: { data: any[]; title: string }) {
  const { colors, isDarkColorScheme } = useColorScheme();
  
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 40, backgroundColor: 'transparent' }}>
      <Text style={{ 
        color: colors.textPrimary, 
        fontSize: 20, 
        fontWeight: 'bold', 
        paddingBottom: 16 
      }}>
        {title}
      </Text>
      {data.map((item, idx) => (
        <View key={idx} style={{
          backgroundColor: isDarkColorScheme ? `${colors.card}DD` : `${colors.card}E6`,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View>
              <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Total Value: {item.value}</Text>
            </View>
            <Image
              source={{ uri: item.image }}
              style={{ width: 56, height: 56, borderRadius: 16 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '500', marginBottom: 4 }}>ROI (1Y)</Text>
          <View style={{ 
            width: '100%', 
            height: 65, 
            overflow: 'hidden', 
            // backgroundColor: isDarkColorScheme ? `${colors.muted}40` : `${colors.muted}80`,
            borderRadius: 12 
          }}>
            <Svg width="100%" height="65" viewBox="0 0 100 40" preserveAspectRatio="none">
              <Defs>
                <SvgGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                </SvgGradient>
              </Defs>
              <Path d={item.path} fill="none" stroke={colors.primary} strokeWidth={2.4} />
              <Path d={`${item.path} V40 H0 Z`} fill={`url(#grad-${idx})`} />
            </Svg>
          </View>
          <TouchableOpacity 
            style={{ 
              width: '100%', 
              marginTop: 12, 
              borderRadius: 9999, 
              borderWidth: 1, 
              borderColor: `${colors.primary}40`, 
              // backgroundColor: `${colors.primary}15`, 
              padding: 12, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>View Insights</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
