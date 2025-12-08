import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { faqs, quickActions } from "@/data/mockProfile";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpFAQScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  
  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItem = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleQuickAction = (action: string) => {
    console.log("Quick action:", action);
    switch (action) {
      case "chat":
        // Open live chat
        break;
      case "email":
        // Open email client
        break;
      case "call":
        // Initiate call
        break;
      case "guide":
        // Navigate to guide
        break;
    }
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
              Help & FAQ
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
          {/* Search Bar */}
          <View className="mb-6">
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="flex-row items-center px-4 py-3 rounded-xl"
            >
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={{ 
                  color: colors.textPrimary,
                  flex: 1,
                }}
                className="ml-3 text-base"
                placeholder="Search FAQs..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Quick Actions
            </Text>
            
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.action}
                  onPress={() => handleQuickAction(action.action)}
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border,
                    width: '48%',
                  }}
                  className="rounded-xl p-4 items-center"
                  activeOpacity={0.7}
                >
                  <View 
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(13, 165, 165, 0.15)' 
                        : 'rgba(13, 165, 165, 0.1)' 
                    }}
                    className="w-12 h-12 items-center justify-center rounded-full mb-2"
                  >
                    <Ionicons name={action.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.textPrimary }} className="text-sm font-medium text-center">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Popular Questions */}
          {!searchQuery && (
            <View className="mb-6">
              <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
                Popular Questions
              </Text>
              
              <View 
                style={{ 
                  backgroundColor: colors.card,
                  borderWidth: isDarkColorScheme ? 0 : 1,
                  borderColor: colors.border 
                }}
                className="overflow-hidden rounded-xl"
              >
                {faqs.slice(0, 3).map((faq, index) => {
                  const isExpanded = expandedItems.includes(faq.id);
                  
                  return (
                    <View key={faq.id}>
                      <TouchableOpacity
                        onPress={() => toggleItem(faq.id)}
                        className="px-4 py-4"
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-start justify-between gap-3">
                          <View 
                            style={{ 
                              backgroundColor: isDarkColorScheme 
                                ? 'rgba(13, 165, 165, 0.15)' 
                                : 'rgba(13, 165, 165, 0.1)' 
                            }}
                            className="w-8 h-8 items-center justify-center rounded-lg mt-0.5"
                          >
                            <Ionicons 
                              name="help-circle" 
                              size={18} 
                              color={colors.primary} 
                            />
                          </View>
                          <View className="flex-1">
                            <Text style={{ color: colors.textPrimary }} className="text-base font-medium leading-snug">
                              {faq.question}
                            </Text>
                            {isExpanded && (
                              <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed mt-3">
                                {faq.answer}
                              </Text>
                            )}
                          </View>
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={colors.textMuted}
                            style={{ marginTop: 2 }}
                          />
                        </View>
                      </TouchableOpacity>
                      {index < 2 && (
                        <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* FAQs by Category or Search Results */}
          {searchQuery ? (
            <View className="mb-6">
              <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
                Search Results ({filteredFAQs.length})
              </Text>
              
              {filteredFAQs.length > 0 ? (
                <View 
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border 
                  }}
                  className="overflow-hidden rounded-xl"
                >
                  {filteredFAQs.map((faq, index) => {
                    const isExpanded = expandedItems.includes(faq.id);
                    
                    return (
                      <View key={faq.id}>
                        <TouchableOpacity
                          onPress={() => toggleItem(faq.id)}
                          className="px-4 py-4"
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-start justify-between gap-3">
                            <View 
                              style={{ 
                                backgroundColor: isDarkColorScheme 
                                  ? 'rgba(13, 165, 165, 0.15)' 
                                  : 'rgba(13, 165, 165, 0.1)' 
                              }}
                              className="w-8 h-8 items-center justify-center rounded-lg mt-0.5"
                            >
                              <Ionicons 
                                name="help-circle" 
                                size={18} 
                                color={colors.primary} 
                              />
                            </View>
                            <View className="flex-1">
                              <View className="mb-1">
                                <Text style={{ color: colors.textMuted }} className="text-xs font-medium">
                                  {faq.category}
                                </Text>
                              </View>
                              <Text style={{ color: colors.textPrimary }} className="text-base font-medium leading-snug">
                                {faq.question}
                              </Text>
                              {isExpanded && (
                                <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed mt-3">
                                  {faq.answer}
                                </Text>
                              )}
                            </View>
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color={colors.textMuted}
                              style={{ marginTop: 2 }}
                            />
                          </View>
                        </TouchableOpacity>
                        {index < filteredFAQs.length - 1 && (
                          <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View 
                  style={{ 
                    backgroundColor: colors.card,
                    borderWidth: isDarkColorScheme ? 0 : 1,
                    borderColor: colors.border 
                  }}
                  className="items-center justify-center py-12 rounded-xl"
                >
                  <View 
                    style={{ 
                      backgroundColor: isDarkColorScheme 
                        ? 'rgba(13, 165, 165, 0.15)' 
                        : 'rgba(13, 165, 165, 0.1)' 
                    }}
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  >
                    <Ionicons name="search" size={32} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-1">
                    No results found
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-sm text-center">
                    Try a different search term
                  </Text>
                </View>
              )}
            </View>
          ) : (
            categories.map((category) => {
              const categoryFAQs = faqs.filter(faq => faq.category === category);
              
              return (
                <View key={category} className="mb-6">
                  <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
                    {category}
                  </Text>
                  
                  <View 
                    style={{ 
                      backgroundColor: colors.card,
                      borderWidth: isDarkColorScheme ? 0 : 1,
                      borderColor: colors.border 
                    }}
                    className="overflow-hidden rounded-xl"
                  >
                    {categoryFAQs.map((faq, index) => {
                      const isExpanded = expandedItems.includes(faq.id);
                      
                      return (
                        <View key={faq.id}>
                          <TouchableOpacity
                            onPress={() => toggleItem(faq.id)}
                            className="px-4 py-4"
                            activeOpacity={0.7}
                          >
                            <View className="flex-row items-start justify-between gap-3">
                              <View 
                                style={{ 
                                  backgroundColor: isDarkColorScheme 
                                    ? 'rgba(13, 165, 165, 0.15)' 
                                    : 'rgba(13, 165, 165, 0.1)' 
                                }}
                                className="w-8 h-8 items-center justify-center rounded-lg mt-0.5"
                              >
                                <Ionicons 
                                  name="help-circle" 
                                  size={18} 
                                  color={colors.primary} 
                                />
                              </View>
                              <View className="flex-1">
                                <Text style={{ color: colors.textPrimary }} className="text-base font-medium leading-snug">
                                  {faq.question}
                                </Text>
                                {isExpanded && (
                                  <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed mt-3">
                                    {faq.answer}
                                  </Text>
                                )}
                              </View>
                              <Ionicons 
                                name={isExpanded ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color={colors.textMuted}
                                style={{ marginTop: 2 }}
                              />
                            </View>
                          </TouchableOpacity>
                          {index < categoryFAQs.length - 1 && (
                            <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}

          {/* Still Need Help */}
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
            className="rounded-xl p-4 mb-4"
          >
            <View className="items-center">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-12 h-12 items-center justify-center rounded-full mb-3"
              >
                <Ionicons name="headset" size={24} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary }} className="text-base font-semibold mb-2 text-center">
                Still Need Help?
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-4 leading-relaxed">
                Our support team is available 24/7 to assist you with any questions or issues.
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary }}
                className="px-6 py-3 rounded-lg"
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm font-bold">
                  Contact Support
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}