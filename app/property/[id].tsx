import React, { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProperty } from "@/services/useProperty";
import { useWallet } from "@/services/useWallet";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { property, loading } = useProperty(id || "");
  const { balance } = useWallet();
  const [activeTab, setActiveTab] = useState("Financials");
  const [imageIndex, setImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  if (loading || !property) {
    return (
      <View className="flex-1 bg-[#f6f8f8] items-center justify-center">
        <Text className="text-black">Loading...</Text>
      </View>
    );
  }

  const handleInvest = () => {
    const minRequired = property.minInvestment;
    if (balance.usdc < minRequired) {
      router.push({
        pathname: "/wallet/deposit/debit-card",
        params: { requiredAmount: minRequired.toString() },
      } as any);
    } else {
      router.push(`/invest/${property.id}`);
    }
  };

  return (
    <View className="flex-1 bg-[#f6f8f8]">
      <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
        {/* Image Gallery */}
        <View className="relative h-[60vh]">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {property.images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={{ width, height: '100%' }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Image Indicators */}
          {property.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {property.images.map((_, idx) => (
                <View
                  key={idx}
                  className={`h-1.5 rounded-full ${
                    imageIndex === idx ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                  }`}
                />
              ))}
            </View>
          )}

          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 px-4 flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/70 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white/70 p-2 rounded-full">
              <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
            </TouchableOpacity>
          </View>


          {/* Dark gradient overlay for better text visibility */}
        

          {/* Property Info Overlay with Glassmorphism */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <View className={`px-3 py-1 rounded-full self-start mb-2 ${
              property.status === 'funding' ? 'bg-emerald-500/90' :
              property.status === 'construction' ? 'bg-blue-500/90' :
              property.status === 'completed' ? 'bg-purple-500/90' :
              'bg-green-500/90'
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text className="text-white text-sm font-bold">
                {property.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            <Text 
              className="text-white text-3xl font-bold mb-1"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              {property.title}
            </Text>
            <View className="flex-row items-center mb-3">
              <Ionicons name="location" size={18} color="#34D399" />
              <Text 
                className="text-white ml-1.5 font-medium"
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {property.location}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text 
                  className="text-gray-300 text-sm font-medium"
                  style={{
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  Annual ROI
                </Text>
                <Text 
                  className="text-emerald-400 text-2xl font-bold"
                  style={{
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  {property.estimatedROI}%
                </Text>
              </View>
              <View className="items-end">
                <Text 
                  className="text-gray-300 text-sm font-medium"
                  style={{
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  Token Price
                </Text>
                <Text 
                  className="text-white text-2xl font-bold"
                  style={{
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  ${property.tokenPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="mt-12 bg-white rounded-t-3xl p-6">
          {/* Key Stats */}
          <View className="flex-row flex-wrap gap-6 mb-6">
            <View className="flex-1 min-w-[140px]">
              <Text className="text-gray-500 text-sm">Min. Investment</Text>
              <Text className="text-black text-lg font-bold">
                ${property.minInvestment.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 min-w-[140px]">
              <Text className="text-gray-500 text-sm">Expected Yield</Text>
              <Text className="text-green-600 text-lg font-bold">
                {property.estimatedYield}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mb-6">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500 text-sm">Funding Progress</Text>
              <Text className="text-gray-800 text-sm font-semibold">
                {Math.round((property.soldTokens / property.totalTokens) * 100)}%
              </Text>
            </View>
            <View className="w-full bg-gray-200 rounded-full h-2.5">
              <View
                className="bg-teal h-2.5 rounded-full"
                style={{ width: `${(property.soldTokens / property.totalTokens) * 100}%` }}
              />
            </View>
            <Text className="text-gray-500 text-xs mt-1.5 text-right">
              {property.soldTokens.toLocaleString()} /{" "}
              {property.totalTokens.toLocaleString()} Tokens
            </Text>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200 mb-6">
            {["Financials", "Documents", "Location"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`pb-3 px-4 ${
                  activeTab === tab ? "border-b-2 border-[#00b5ad]" : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeTab === tab
                      ? "font-semibold text-[#00b5ad]"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "Financials" && (
            <View>
              <Text className="text-black text-xl font-bold mb-3">
                Property Overview
              </Text>
              <Text className="text-gray-700 text-base leading-relaxed mb-6">
                {property.description}
              </Text>

              <View className="flex-col gap-4 mb-16">
                <View className="flex-row items-start gap-4">
                  <View className="bg-teal/10 p-2.5 rounded-xl">
                    <Ionicons name="business" size={20} color="#00b5ad" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-black">Developer</Text>
                    <Text className="text-sm text-gray-600">
                      {property.builder.name}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start gap-4">
                  <View className="bg-teal/10 p-2.5 rounded-xl">
                    <Ionicons name="calendar" size={20} color="#00b5ad" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-black">
                      Completion Timeline
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {property.completionDate}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "Documents" && (
            <View className="mb-16 ">
              <Text className="text-black text-xl font-bold mb-4">
                Documents & Verification
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-4"
              >
                {property.documents.map((doc) => (
                  <View
                    key={doc.name}
                    className="w-60 bg-white rounded-2xl border border-gray-200 mx-2 p-5 shadow-sm items-center mb-16"
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={42}
                      color="#00b5ad"
                    />
                    <Text className="font-semibold text-black mt-2">
                      {doc.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {doc.verified ? 'Verified & On-Chain' : 'Pending Verification'}
                    </Text>
                    <TouchableOpacity className="mt-3 bg-teal/10 px-4 py-1.5 rounded-full">
                      <Text className="text-[#00b5ad] font-semibold text-sm">
                        View {doc.type}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {activeTab === "Location" && (
            <View className="mb-16">
              <Text className="text-black text-xl font-bold mb-4">Location</Text>
              <View className="h-48 w-full bg-gray-100 border border-gray-200 rounded-2xl items-center justify-center">
                <Ionicons name="map-outline" size={60} color="#00b5ad" />
                <Text className="text-gray-600 mt-2">
                  {property.location || "Location not available"}
                </Text>
                <Text className="text-xs text-gray-500">
                  (Map integration placeholder)
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t border-gray-200 flex-row items-center gap-2">
        <TouchableOpacity
          onPress={handleInvest}
          className="flex-1 bg-teal h-12 rounded-xl items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">Invest</Text>
        </TouchableOpacity>
        {["bookmark-outline", "share-outline", "chatbubble-outline"].map(
          (icon) => (
            <TouchableOpacity
              key={icon}
              className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"
            >
              <Ionicons name={icon as any} size={22} color="#4B5563" />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}
