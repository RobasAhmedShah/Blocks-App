import React, { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProperty } from "@/services/useProperty";
import { useWallet } from "@/services/useWallet";
import { useColorScheme } from "@/lib/useColorScheme";
import { useApp } from "@/contexts/AppContext";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import InvestScreen from "@/app/invest/[id]";
import PropertyChatbot from "@/components/chatbot/PropertyChatbot";

const { width } = Dimensions.get("window");

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { property, loading, error } = useProperty(id || "");
  const { balance } = useWallet();
  const { toggleBookmark, isBookmarked } = useApp();
  const [activeTab, setActiveTab] = useState("Financials");
  const [imageIndex, setImageIndex] = useState(0);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDarkColorScheme } = useColorScheme();
  
  const bookmarked = id ? isBookmarked(id) : false;
  
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="mt-4 text-base">
          Loading property...
        </Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={{ color: colors.textSecondary }} className="mt-4 text-base text-center">
          {error || 'Property not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.primary }}
          className="mt-6 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
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
      setShowInvestModal(true);
    }
  };

  const handleBookmark = async () => {
    if (!id) return;
    try {
      await toggleBookmark(id);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!id || !property) return;
    
    try {
      // Create a deep link URL to the property
      const propertyUrl = Linking.createURL(`/property/${id}`);
      const shareMessage = `Check out ${property.title} - ${property.location}\n\nEstimated ROI: ${property.estimatedROI}%\nToken Price: $${property.tokenPrice.toFixed(2)}\n\nView property: ${propertyUrl}`;
      
      if (Platform.OS === 'web') {
        // For web, try to use Web Share API
        if (navigator.share) {
          await navigator.share({
            title: property.title,
            text: shareMessage,
            url: propertyUrl,
          });
        } else {
          // Fallback: copy to clipboard
          await Clipboard.setStringAsync(shareMessage);
          Alert.alert('Copied!', 'Property link copied to clipboard.');
        }
      } else {
        // Use React Native Share API for native platforms
        const result = await Share.share({
          message: shareMessage,
          title: property.title,
          url: propertyUrl, // iOS only, but doesn't hurt on Android
        });
        
        if (result.action === Share.sharedAction) {
          // User shared successfully
          console.log('Shared successfully');
        } else if (result.action === Share.dismissedAction) {
          // User dismissed share dialog
          console.log('Share dismissed');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Don't show error alert if user cancelled
      if (error instanceof Error && !error.message.includes('cancelled') && !error.message.includes('dismissed')) {
        Alert.alert('Error', 'Failed to share property. Please try again.');
      }
    }
  };

  return (
    <View className="flex-1 bg-[#f6f8f8]" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
        {/* Image Gallery */}
        <View className="relative h-[60vh]">
          {property.images && property.images.length > 0 ? (
            <>
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
                    defaultSource={require('@/assets/blank.png')}
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
            </>
          ) : (
            <View className="w-full h-full items-center justify-center bg-gray-200">
              <Ionicons name="image-outline" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted }} className="mt-4 text-base">
                No images available
              </Text>
            </View>
          )}

          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 px-4 flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/1 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={{
              backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              padding: 8,
              borderRadius: 9999,
            }}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Dark gradient overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
            }}
          />

          {/* Property Info Overlay with Glassmorphism */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 9999,
              alignSelf: 'flex-start',
              marginBottom: 8,
              backgroundColor: 
                property.status === 'funding' ? `${colors.primary}E6` :
                property.status === 'construction' ? 'rgba(59, 130, 246, 0.9)' :
                property.status === 'completed' ? 'rgba(168, 85, 247, 0.9)' :
                `${colors.primary}E6`,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
                {property.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            <Text 
              style={{
                color: '#FFFFFF',
                fontSize: 30,
                fontWeight: 'bold',
                marginBottom: 4,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              {property.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="location" size={18} color={colors.primarySoft} />
              <Text 
                style={{
                  color: '#FFFFFF',
                  marginLeft: 6,
                  fontWeight: '500',
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {property.location}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text 
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 14,
                    fontWeight: '500',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  Annual ROI
                </Text>
                <Text 
                  style={{
                    color: colors.primarySoft,
                    fontSize: 24,
                    fontWeight: 'bold',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                  }}
                >
                  {property.estimatedROI}%
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text 
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 14,
                    fontWeight: '500',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  Token Price
                </Text>
                <Text 
                  style={{
                    color: '#FFFFFF',
                    fontSize: 24,
                    fontWeight: 'bold',
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
        <View className="-mt-3 bg-white rounded-t-3xl -ml-1 p-6" style={{ backgroundColor: colors.card }}>
          {/* Key Stats */}
          <View className="flex-row flex-wrap gap-6 mb-6" style={{ backgroundColor: colors.card }}>
            <View className="flex-1 min-w-[140px]" style={{ backgroundColor: colors.card }}>
              <Text className="text-gray-500 text-sm" style={{ color: colors.textPrimary }}>Min. Investment</Text>
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                ${property.minInvestment.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 min-w-[140px]" style={{ backgroundColor: colors.card }}>
              <Text className="text-gray-500 text-sm" style={{ color: colors.textPrimary }}>Expected Yield</Text>
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {property.estimatedYield}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Funding Progress</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {Math.round((property.soldTokens / property.totalTokens) * 100)}%
              </Text>
            </View>
            <View style={{ 
              width: '100%', 
              backgroundColor: colors.muted, 
              borderRadius: 9999, 
              height: 10 
            }}>
              <View 
                style={{ 
                  backgroundColor: colors.primary, 
                  height: 10, 
                  borderRadius: 9999,
                  width: `${(property.soldTokens / property.totalTokens) * 100}%` 
                }}
              />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6, textAlign: 'right' }}>
              {property.soldTokens.toLocaleString()} /{" "}
              {property.totalTokens.toLocaleString()} Tokens
            </Text>
          </View>

          {/* Tabs */}
          <View style={{ 
            flexDirection: 'row', 
            borderBottomWidth: 1, 
            borderBottomColor: colors.border, 
            marginBottom: 24 
          }}>
            {["Financials", "Documents", "Location"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingBottom: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: activeTab === tab ? 2 : 0,
                  borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
                }}
              >
                <Text 
                  style={{
                    fontSize: 14,
                    fontWeight: activeTab === tab ? '600' : '500',
                    color: activeTab === tab ? colors.primary : colors.textMuted,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "Financials" && (
            <View>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
                Property Overview
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
                {property.description}
              </Text>

              <View style={{ flexDirection: 'column', gap: 16, marginBottom: 64 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                  <View style={{ 
                     
                    padding: 10, 
                    borderRadius: 12 
                  }}>
                    <Ionicons name="business" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Developer</Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {property.builder.name}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
                  <View style={{ 
                     
                    padding: 10, 
                    borderRadius: 12 
                  }}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                      Completion Timeline
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {property.completionDate}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "Documents" && (
            <View style={{ marginBottom: 64 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                Documents & Verification
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row', gap: 16 }}
              >
                {property.documents.map((doc) => (
                  <View
                    key={doc.name}
                    style={{
                      width: 240,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginHorizontal: 8,
                      padding: 20,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                      alignItems: 'center',
                      marginBottom: 64,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={42}
                      color={colors.primary}
                    />
                    <Text style={{ fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>
                      {doc.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {doc.verified ? 'Verified & On-Chain' : 'Pending Verification'}
                    </Text>
                    <TouchableOpacity style={{ 
                      marginTop: 12, 
                       
                      paddingHorizontal: 16, 
                      paddingVertical: 6, 
                      borderRadius: 9999 
                    }}>
                      <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                        View {doc.type}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {activeTab === "Location" && (
            <View style={{ marginBottom: 64 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                Location
              </Text>
              <View style={{ 
                height: 192, 
                width: '100%', 
                backgroundColor: colors.muted, 
                borderWidth: 1, 
                borderColor: colors.border, 
                borderRadius: 16, 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Ionicons name="map-outline" size={60} color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                  {property.location || "Location not available"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  (Map integration placeholder)
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDarkColorScheme ? `${colors.card}E6` : `${colors.card}E6`,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={handleInvest}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontSize: 18, fontWeight: 'bold' }}>
            Invest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBookmark}
          style={{
            width: 48,
            height: 48,
            backgroundColor: bookmarked ? colors.primary : colors.muted,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons 
            name={bookmarked ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={bookmarked ? colors.primaryForeground : colors.textMuted} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.muted,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="share-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowChatbot(true)}
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.muted,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Investment Modal */}
      {showInvestModal && (
        <InvestScreen 
          propertyId={id} 
          onClose={() => setShowInvestModal(false)} 
        />
      )}

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
