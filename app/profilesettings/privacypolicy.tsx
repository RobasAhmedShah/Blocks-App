import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { privacyPolicySections } from "@/data/mockProfile";




export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"]);

 const policySections = privacyPolicySections;

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

       {/* Header */}
       <View
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      className="flex-row items-center px-4 py-4 mt-8"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Privacy Policy
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-6">
          {/* Header Info */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.1)' 
                : 'rgba(13, 165, 165, 0.05)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(13, 165, 165, 0.3)' 
                : 'rgba(13, 165, 165, 0.2)'
            }}
            className="rounded-xl p-4 mb-6"
          >
            <View className="items-center">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-14 h-14 items-center justify-center rounded-full mb-3"
              >
                <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-2 text-center">
                Your Privacy Matters
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm text-center leading-relaxed">
                Last updated: November 06, 2025
              </Text>
            </View>
          </View>

          {/* Policy Sections */}
          <View className="mb-4">
            {policySections.map((section, index) => {
              const isExpanded = expandedSections.includes(section.id);
              
              return (
                <View 
                  key={section.id}
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                  }}
                  className="rounded-xl mb-3 overflow-hidden"
                >
                  <TouchableOpacity
                    onPress={() => toggleSection(section.id)}
                    className="px-4 py-4"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View 
                          style={{ 
                            backgroundColor: isDarkColorScheme 
                              ? 'rgba(13, 165, 165, 0.15)' 
                              : 'rgba(13, 165, 165, 0.1)' 
                          }}
                          className="w-8 h-8 items-center justify-center rounded-lg"
                        >
                          <Text style={{ color: colors.primary }} className="text-sm font-bold">
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={{ color: colors.textPrimary }} className="text-base font-semibold flex-1">
                          {section.title}
                        </Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="px-4 pb-4">
                      <View style={{ height: 1, backgroundColor: colors.border }} className="mb-4" />
                      {section.content.map((paragraph, idx) => (
                        <Text 
                          key={idx}
                          style={{ color: colors.textSecondary }}
                          className="text-sm leading-relaxed mb-3"
                        >
                          {paragraph}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Download PDF Button */}
          <TouchableOpacity
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="flex-row items-center justify-center gap-2 py-4 rounded-xl mb-4"
            activeOpacity={0.7}
          >
            <Ionicons name="download" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="text-base font-semibold">
              Download Privacy Policy (PDF)
            </Text>
          </TouchableOpacity>

          {/* Contact Card */}
          <View 
            style={{ 
              backgroundColor: colors.card,
              borderWidth: isDarkColorScheme ? 0 : 1,
              borderColor: colors.border,
            }}
            className="rounded-xl p-4 mb-4"
          >
            <View className="flex-row items-start gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.15)' 
                    : 'rgba(13, 165, 165, 0.1)' 
                }}
                className="w-10 h-10 items-center justify-center rounded-full"
              >
                <Ionicons name="help-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  Questions About Your Privacy?
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed mb-3">
                  If you have any questions or concerns about our privacy practices, we're here to help.
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                    Contact Privacy Team
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}