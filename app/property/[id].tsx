// PropertyDetailHero.tsx (Expo + React Native + NativeWind)
// Requires:
//   expo install expo-blur expo-linear-gradient
//   (NativeWind already set up in your project)
// Uses @expo/vector-icons (comes with Expo)

import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Share,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProperty } from "@/services/useProperty";
import { normalizePropertyImages } from "@/utils/propertyUtils";
import { useApp } from "@/contexts/AppContext";
import PropertyChatbot from "@/components/chatbot/PropertyChatbot";
import * as Linking from "expo-linking";

export default function PropertyDetailHero() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { property, loading, error } = useProperty(id || "");
  const { toggleBookmark, isBookmarked } = useApp();
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Get property image - use first image from array or fallback
  const getPropertyImageUrl = (images: any): string => {
    const normalized = normalizePropertyImages(images);
    if (normalized && normalized.length > 0) {
      return normalized[0];
    }
    // Fallback image
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuBvSmTHsy4oFDiaqJhIGpSqaadP2VrkPJMgoIEtvm26eT3hoOC4icUzU21Q8rT_nYXuakvygLh8N0KARjz-t3P1sRGL3Es6y3rx-3shxpjLI4vtgQguOXkmXm7oKfitVhZjfuB71iFgSyt-PeYxe5kxyimxvU1KnraBtspDdAl1YZCpg3UEuwkIxAty7tenEkAvu2Sf9Bi6ZTg8zmSj562mMRd0E3BD64wgc27ab6Skf5M_02j95munj06saJYAeSwcZI4YlgzOh6U";
  };

  // Map property data to component props
  const imageUrl = property ? getPropertyImageUrl(property.images) : "";
  const title = property?.title || "Property";
  const builderName = property?.builder?.name || property?.displayCode || "Property";
  const builderLogo = property?.builder?.logo || "";
  const rating = property?.builder?.rating || 5.0;
  const reviews = property?.builder?.projectsCompleted || 0;
  const location = property?.location || property?.city || "Location not available";
  const bookmarked = id ? isBookmarked(id) : false;

  // Navigation handlers
  const handleBack = () => {
    router.back();
  };

  const handleBookmark = async () => {
    if (!id) return;
    try {
      await toggleBookmark(id);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark. Please try again.");
    }
  };

  const handleChatbotPress = () => {
    if (property) {
      setShowChatbot(true);
    }
  };

  const handleSharePress = async () => {
    if (!id || !property) return;

    try {
      const propertyUrl = Linking.createURL(`/property/${id}`);
      const shareMessage = `Check out ${property.title} - ${property.location}\n\nEstimated ROI: ${
        property.estimatedROI
      }%\nToken Price: $${property.tokenPrice.toFixed(2)}\n\nView property: ${propertyUrl}`;

      if (Platform.OS === "web") {
        if ((navigator as any).share) {
          await (navigator as any).share({
            title: property.title,
            text: shareMessage,
            url: propertyUrl,
          });
        } else {
          // Fallback for web browsers without share API
          await navigator.clipboard.writeText(shareMessage);
          Alert.alert("Copied!", "Property link copied to clipboard.");
        }
      } else {
        const result = await Share.share({
          message: shareMessage,
          title: property.title,
          url: propertyUrl,
        });

        if (result.action === Share.sharedAction) {
          console.log("Shared successfully");
        } else if (result.action === Share.dismissedAction) {
          console.log("Share dismissed");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      if (error instanceof Error && !error.message.includes("cancelled") && !error.message.includes("dismissed")) {
        Alert.alert("Error", "Failed to share property. Please try again.");
      }
    }
  };

  const handleBoltPress = () => {
    // Quick invest action
    if (property?.id) {
      router.push(`/invest/${property.id}` as any);
    }
  };

  // Check if property has tier tokens
  const hasTierTokens = property?.tokens && property.tokens.length > 0 && 
    property.tokens.some(token => token.isActive !== false);

  const handleTakeTourPress = () => {
    // Navigate based on whether property has tiers
    if (property?.id) {
      if (hasTierTokens) {
        // Property has tiers - navigate to tier selection screen
        router.push(`/property/tier/${property.id}` as any);
      } else {
        // Property has no tiers - navigate directly to details screen
        router.push(`/property/details/${property.id}` as any);
      }
    }
  };
  const { width, height } = useWindowDimensions();

  // Responsive sizing (keeps a "hero card" feel on tablets too)
  const maxW = Math.min(430, Math.max(360, width));
  const heroH = Math.min(932, Math.max(720, height));

  const iconBtn = 48;
  const bigBtn = 56;

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-[#0B1220] items-center justify-center">
        <ActivityIndicator size="large" color="#D97706" />
        <Text className="text-white/60 mt-4 text-sm">Loading property...</Text>
      </View>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          {error || "Property not found"}
        </Text>
        <Pressable
          onPress={handleBack}
          className="mt-6 px-6 py-3 rounded-full"
          style={{ backgroundColor: "#D97706" }}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <View
        style={{ width: maxW, height: '100%' }}
        className="overflow-hidden bg-black"
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          resizeMode="cover"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.55, 1]}
            style={{ position: "absolute", inset: 0 }}
          />

          <SafeAreaView className="flex-1">
            {/* Top bar with back button */}
            <View className="px-6 pt-2 flex-row items-center justify-between">
              <Pressable
                onPress={handleBack}
                className="items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </Pressable>
              <View className="flex-row items-center gap-3">
                <GlassIconButton 
                  size={iconBtn} 
                  icon={bookmarked ? "bookmark" : "bookmark-border"} 
                  onPress={handleBookmark} 
                />
              </View>
            </View>

            {/* Notch pill (mock) */}
            {/* <View className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-9 bg-black/80 rounded-full" /> */}

            {/* Header row */}
            <View className="mt-10 px-6 flex-row items-center justify-between">
              <View className="flex-row items-end justify-end gap-3">
                <View
                  className="items-center justify-center rounded-full"
                  style={{
                    width: bigBtn,
                    height: bigBtn,
                    backgroundColor: "#D97706",
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.18)",
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                  }}
                >
                  {/* <MaterialIcons name="bar-chart" size={26} color="#fff" /> */}
                  <Image
                    source={{ uri: builderLogo }}
                    className="w-12 h-12 rounded-full"
                    resizeMode="cover"
                  ></Image>
                </View>

                <View>
                  <Text className="text-white text-lg text-lg font-semibold leading-tight">
                    {builderName}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    <Text className="text-white/75 text-xs font-medium">Verified agents</Text>
                    <MaterialIcons name="verified" size={14} color="#D97706" />
                  </View>
                </View>
              </View>
            </View>

            {/* Middle content */}
            <View className="flex-1 justify-end px-8 pb-32">
              <Text
                className="text-white font-bold leading-[1.05]"
                style={{ fontSize: Math.max(38, Math.min(50, maxW * 0.115)) }}
              >
                {title}
              </Text>

              <View className="mt-3 gap-1">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="star" size={14} color="#FACC15" />
                  <Text className="text-white font-semibold">{rating.toFixed(1)}</Text>
                  <Text className="text-white/60">•</Text>

                  <Pressable onPress={() => {}}>
                    <Text className="text-white font-semibold underline">
                      {reviews} reviews
                    </Text>
                  </Pressable>
                </View>

                <Text className="text-white/80 font-medium">{location}</Text>
              </View>
            </View>

            {/* Bottom actions */}
            <View className="px-6 pb-7">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row items-center gap-3">
                  <GlassIconButton size={bigBtn} icon="chat-bubble" onPress={handleChatbotPress} />
                  <GlassIconButton size={bigBtn} icon="share" onPress={handleSharePress} />
                </View>

                <View className="flex-row items-center gap-3 flex-1 justify-end">
                  {/* <Pressable
                    onPress={handleBoltPress}
                    className="items-center justify-center rounded-full"
                    style={{
                      width: bigBtn,
                      height: bigBtn,
                      backgroundColor: "#D97706",
                      shadowColor: "#D97706",
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 10 },
                      elevation: 10,
                    }}
                  >
                    <MaterialIcons name="bolt" size={24} color="#fff" />
                  </Pressable> */}

                  <Pressable
                    onPress={handleTakeTourPress}
                    className="flex-row items-center justify-center gap-2 rounded-full px-4"
                    style={{
                      height: bigBtn,
                      minWidth: 140,
                      maxWidth: 180,
                      flexGrow: 1,
                      backgroundColor: "rgba(255,255,255,0.85)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                      overflow: "hidden",
                    }}
                  >
                    <MaterialIcons 
                      name={hasTierTokens ? "token" : "info"} 
                      size={20} 
                      color="rgba(24,24,27,0.65)" 
                    />
                    <Text className="text-zinc-900 font-extrabold">
                      {hasTierTokens ? "View Appartments" : "View Details"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Home indicator (mock) */}
              {/* <View className="mt-5 items-center">
                <View className="w-[134px] h-[5px] bg-white/35 rounded-full" />
              </View> */}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>

      {/* Chatbot Modal */}
      {property && (
        <PropertyChatbot
          property={property}
          visible={showChatbot}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </View>
  );
}

function GlassIconButton({
  size,
  icon,
  onPress,
}: {
  size: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
}) {
  const intensity = Platform.OS === "ios" ? 22 : 18;

  return (
    <Pressable
      onPress={onPress}
      className="active:scale-95"
      style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.35)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <MaterialIcons name={icon} size={22} color="#fff" />
      </BlurView>
    </Pressable>
  );
}
