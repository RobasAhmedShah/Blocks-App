import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/lib/useColorScheme";
import { languages } from "@/data/mockProfile";
import { Language } from "@/types/profilesettings";

export default function LanguageScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()
     
    )
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    console.log("Language selected:", code);
    // You might want to save this to storage or context
    // setTimeout(() => router.back(), 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? "light-content" : "dark-content"} />

      {/* Header */}
      <View 
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        className="flex-row items-center px-4 py-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={{ color: colors.textPrimary }} className="flex-1 text-center text-lg font-bold">
          Language
        </Text>

        <View className="w-12" />
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
                placeholder="Search languages..."
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

          {/* Current Language Info */}
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
            <View className="flex-row items-start gap-3">
              <View 
                style={{ 
                  backgroundColor: isDarkColorScheme 
                    ? 'rgba(13, 165, 165, 0.2)' 
                    : 'rgba(13, 165, 165, 0.15)' 
                }}
                className="w-10 h-10 items-center justify-center rounded-full"
              >
                <Ionicons name="globe" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold mb-1">
                  Current Language
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs leading-relaxed">
                  {languages.find(lang => lang.code === selectedLanguage)?.name} - The app will restart to apply language changes.
                </Text>
              </View>
            </View>
          </View>

          {/* Popular Languages Section */}
          <View className="mb-6">
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              Popular Languages
            </Text>
            
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl"
            >
              {languages.slice(0, 5).map((language, index) => (
                <View key={language.code}>
                  <TouchableOpacity
                    onPress={() => handleSelectLanguage(language.code)}
                    className="flex-row items-center justify-between px-4 py-4"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-4 flex-1">
                      <View 
                        style={{ 
                          backgroundColor: isDarkColorScheme 
                            ? 'rgba(13, 165, 165, 0.15)' 
                            : 'rgba(13, 165, 165, 0.1)' 
                        }}
                        className="w-12 h-12 items-center justify-center rounded-lg"
                      >
                        <Text className="text-2xl">{language.flag}</Text>
                      </View>
                      <View className="flex-1">
                        <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                          {language.name}
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">
                          {language.nativeName}
                        </Text>
                      </View>
                    </View>
                    {selectedLanguage === language.code && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {index < 4 && (
                    <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* All Languages Section */}
          <View>
            <Text style={{ color: colors.textPrimary }} className="px-2 text-sm font-bold uppercase tracking-wider mb-3">
              {searchQuery ? 'Search Results' : 'All Languages'}
            </Text>
            
            <View 
              style={{ 
                backgroundColor: colors.card,
                borderWidth: isDarkColorScheme ? 0 : 1,
                borderColor: colors.border 
              }}
              className="overflow-hidden rounded-xl"
            >
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((language, index) => (
                  <View key={language.code}>
                    <TouchableOpacity
                      onPress={() => handleSelectLanguage(language.code)}
                      className="flex-row items-center justify-between px-4 py-4"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-4 flex-1">
                        <View 
                          style={{ 
                            backgroundColor: isDarkColorScheme 
                              ? 'rgba(13, 165, 165, 0.15)' 
                              : 'rgba(13, 165, 165, 0.1)' 
                          }}
                          className="w-12 h-12 items-center justify-center rounded-lg"
                        >
                          <Text className="text-2xl">{language.flag}</Text>
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: colors.textPrimary }} className="text-base font-medium">
                            {language.name}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">
                            {language.nativeName}
                          </Text>
                        </View>
                      </View>
                      {selectedLanguage === language.code && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                    {index < filteredLanguages.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border }} className="mx-4" />
                    )}
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <View 
                    style={{ backgroundColor: colors.card }}
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  >
                    <Ionicons name="search" size={32} color={colors.textMuted} />
                  </View>
                  <Text style={{ color: colors.textSecondary }} className="text-base text-center">
                    No languages found
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-sm text-center mt-1">
                    Try a different search term
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Help Text */}
          <View className="mt-6 mb-4">
            <Text style={{ color: colors.textMuted }} className="text-xs text-center leading-relaxed px-4">
              Can't find your language? We're constantly adding new languages. Contact support to request a new language.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}