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
import { termsOfServiceSections } from "@/data/mockProfile";



const termsSections = termsOfServiceSections;

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"]);

 
  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedSections(termsSections.map(section => section.id));
  };

  const collapseAll = () => {
    setExpandedSections([]);
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
              Terms of Service
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
                <Ionicons name="document-text" size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-base font-bold mb-2 text-center">
                Terms of Service Agreement
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm text-center leading-relaxed mb-2">
                Last updated: November 06, 2025
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-xs text-center leading-relaxed">
                Please read these terms carefully before using our platform
              </Text>
            </View>
          </View>

          {/* Important Notice */}
          <View 
            style={{ 
              backgroundColor: isDarkColorScheme 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(254, 242, 242, 1)',
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(239, 68, 68, 0.3)' 
                : 'rgba(254, 226, 226, 1)',
            }}
            className="rounded-xl p-4 mb-6"
          >
            <View className="flex-row items-start gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : 'rgba(239, 68, 68, 0.1)' 
                }}
                className="w-10 h-10 items-center justify-center rounded-full flex-shrink-0"
              >
                <Ionicons name="warning" size={24} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-bold mb-1">
                  Important Investment Notice
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  Real estate investments carry risks. You may lose some or all of your capital. Please read Section 3 (Investment Risks) carefully before proceeding.
                </Text>
              </View>
            </View>
          </View>

          {/* Expand/Collapse All */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={expandAll}
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
              className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg"
              activeOpacity={0.7}
            >
              <Ionicons name="expand" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                Expand All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={collapseAll}
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border,
              }}
              className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-lg"
              activeOpacity={0.7}
            >
              <Ionicons name="contract" size={18} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary }} className="text-sm font-semibold">
                Collapse All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms Sections */}
          <View className="mb-4">
            {termsSections.map((section, index) => {
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
                      <View className="flex-row items-center gap-3 flex-1 pr-3">
                        <View 
                          style={{ 
                            backgroundColor: isDarkColorScheme 
                              ? 'rgba(13, 165, 165, 0.15)' 
                              : 'rgba(13, 165, 165, 0.1)' 
                          }}
                          className="w-8 h-8 items-center justify-center rounded-lg flex-shrink-0"
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
              Download Terms of Service (PDF)
            </Text>
          </TouchableOpacity>

          {/* Acceptance Card */}
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
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  By Using Our Platform
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  You acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please discontinue use of our platform immediately.
                </Text>
              </View>
            </View>
          </View>

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
                  Questions About These Terms?
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed mb-3">
                  Our legal team is available to clarify any questions about these terms.
                </Text>
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                    Contact Legal Team
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