import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { useProperty } from '@/services/useProperty';
import { PropertyToken } from '@/types/property';
import { normalizePropertyImages } from '@/utils/propertyUtils';

export default function App() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  // Handle id as string or array (Expo Router can return arrays)
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { property, loading, error } = useProperty(id || '');
  
  // Debug logging
  useEffect(() => {
    if (id) {
      console.log('[Tier List] Property ID from route:', id);
    }
    if (property) {
      console.log('[Tier List] Property loaded:', property.title);
      console.log('[Tier List] Property has tokens?', !!property.tokens);
      console.log('[Tier List] Tokens count:', property.tokens?.length || 0);
      if (property.tokens && property.tokens.length > 0) {
        console.log('[Tier List] Token details:', property.tokens.map(t => ({
          id: t.id,
          name: t.name,
          isActive: t.isActive,
          displayOrder: t.displayOrder,
        })));
      } else {
        console.log('[Tier List] ⚠️ No tokens found in property object');
      }
    }
    if (error) {
      console.log('[Tier List] Error loading property:', error);
    }
  }, [id, property, error]);
  
  // Get property image - use first image from array or fallback
  const getPropertyImageUrl = (images: any): string => {
    const normalized = normalizePropertyImages(images);
    if (normalized && normalized.length > 0) {
      return normalized[0];
    }
    // Fallback image
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuACDQbbNvAtyiFaN2b51tD46KZ5QAvgi0ew1uNn1oiQg3ZYQoOzyroQD8inxQ5YUQPtTQ__gVAKb9jT8yLydi8FRWTE8sLDv8Lkw2-8axLWIp8Pzwym0wK6reiLpmUnNiBIWR65Vtw2Uxrka3Ok70GMUuRggSA-Hi-p9iV6CLcWYJ_v85zCSgp1XX2F0CaJ_D_PhsGkcm0nWfsq2GEzBqacbEt2pXVmyYYoqSS3FNbIy95yv6RbkNyiVOl4tlbNMkWSDSagi1WUrmg';
  };

  // Get active tokens sorted by display order
  const activeTokens = useMemo(() => {
    if (!property?.tokens) {
      console.log('[Tier List] No tokens array in property');
      return [];
    }
    
    const tokens = property.tokens.filter(t => t.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    console.log('[Tier List] Active tokens after filtering:', tokens.length);
    return tokens;
  }, [property?.tokens]);

  // Helper to extract bedrooms and bathrooms from apartmentFeatures
  const getApartmentFeatures = (token: PropertyToken) => {
    const features = token.apartmentFeatures;
    if (typeof features === 'object' && features !== null) {
      return {
        bedrooms: features.bedrooms || features.bedroom || 0,
        bathrooms: features.bathrooms || features.bathroom || 0,
      };
    }
    return { bedrooms: 0, bathrooms: 0 };
  };

  // Helper to format price
  const formatPrice = (price: number) => {
    return `$${price.toFixed(0)}`;
  };

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient - Same as Home Section */}
      <LinearGradient
        colors={['rgba(11, 26, 18, 1)', 'rgba(9, 20, 15, 1)', 'rgba(5, 10, 8, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Radial Gradient Glow */}
      <View style={{ position: 'absolute', inset: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="grad1" cx="0%" cy="0%" r="80%" fx="90%" fy="10%">
              <Stop offset="0%" stopColor="rgb(226, 223, 34)" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="rgb(226, 223, 34)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="rgba(22,22,22,0)" />
          <Rect width="100%" height="50%" fill="url(#grad1)" />
        </Svg>
      </View>
      
     

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-6 mt-4">
        <View className="flex-row items-center gap-2 flex-1">
          <View className="bg-[#E67E22]/20 p-1.5 rounded-lg">
            <MaterialIcons name="apartment" size={24} color="#E67E22" />
          </View>
          <Text className="text-xl font-bold tracking-tight text-white" numberOfLines={1}>
            {property?.title || 'Property Tiers'}
          </Text>
        </View>
        <TouchableOpacity className="w-12 h-12 items-center justify-center rounded-full bg-[#3B3D3F]">
          <MaterialIcons name="tune" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 w-full max-w-[430px]">{/* Main ScrollView */}

        <ScrollView 
          className="flex-1 px-6 pb-24"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#E67E22" />
              <Text className="text-white mt-4">Loading tiers...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text className="text-white mt-4 text-center">{error}</Text>
            </View>
          ) : activeTokens.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Ionicons name="home-outline" size={48} color="#94a3b8" />
              <Text className="text-white mt-4 text-center text-lg font-semibold">
                No token tiers available
              </Text>
              {property && (
                <Text className="text-white/60 mt-2 text-center text-sm">
                  Property: {property.title}
                  {property.tokens ? `\nTotal tokens in response: ${property.tokens.length}` : '\nNo tokens array in property response'}
                </Text>
              )}
              <Text className="text-white/40 mt-4 text-center text-xs">
                Check console logs for debugging information
              </Text>
            </View>
          ) : (
            <>
              {/* Token Tier Cards - Repeated based on property tokens */}
              {activeTokens.map((token: PropertyToken, index: number) => {
                const features = getApartmentFeatures(token);
                const propertyImage = property ? getPropertyImageUrl(property.images) : '';
                const location = property?.location || property?.city || 'Location';
                
                // Calculate price variations (you can adjust this logic based on your needs)
                const basePrice = token.pricePerTokenUSDT;
                const prices = [
                  formatPrice(basePrice * 0.9), // Lower price
                  formatPrice(basePrice),      // Current price (highlighted)
                  formatPrice(basePrice * 1.1), // Higher price
                ];

                return (
                  <View key={token.id} className="mt-8">
                    <View className="rounded-3xl overflow-hidden min-h-[340px] relative shadow-xl">
                      <ImageBackground
                        source={{ uri: propertyImage }}
                        className="min-h-[340px] p-6 flex-col justify-between"
                        resizeMode="cover"
                        imageStyle={{ opacity: 0.8 }}
                        style={{ backgroundColor: '#4A3B2E' }}
                      >
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                          <Text className="text-sm text-white/80">{location}</Text>
                        </View>

                        <View>
                          <Text className="text-3xl font-bold text-white mb-2">{token.name}</Text>
                          {token.description && (
                            <Text className="text-sm text-white/70 mb-3" numberOfLines={2}>
                              {token.description}
                            </Text>
                          )}
                          {(features.bedrooms > 0 || features.bathrooms > 0) && (
                            <View className="flex-row gap-3 text-white/90 text-sm">
                              {features.bedrooms > 0 && (
                                <View className="flex-row items-center gap-1">
                                  <View className="w-4 h-4 bg-[#E67E22] rounded-full flex items-center justify-center">
                                    <Text className="text-[10px] text-white">●</Text>
                                  </View>
                                  <Text className="text-sm text-white/90">{features.bedrooms} Bedroom{features.bedrooms > 1 ? 's' : ''}</Text>
                                </View>
                              )}
                              {features.bathrooms > 0 && (
                                <View className="flex-row items-center gap-1">
                                  <View className="w-4 h-4 bg-[#E67E22] rounded-full flex items-center justify-center">
                                    <Text className="text-[10px] text-white">●</Text>
                                  </View>
                                  <Text className="text-sm text-white/90">{features.bathrooms} Bathroom{features.bathrooms > 1 ? 's' : ''}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>

                        {/* Price Tags - Positioned on right */}
                        <View className="absolute right-6 top-1/2 -translate-y-1/2 gap-4" style={{ transform: [{ translateY: -50 }] }}>
                          <View className="bg-slate-800/60 px-4 py-1.5 rounded-full">
                            <Text className="text-white text-xs">{prices[0]}</Text>
                          </View>
                          <View className="bg-[#E67E22] px-4 py-1.5 rounded-full">
                            <Text className="text-white text-xs font-bold">{prices[1]}</Text>
                          </View>
                          <View className="bg-slate-800/60 px-4 py-1.5 rounded-full">
                            <Text className="text-white text-xs">{prices[2]}</Text>
                          </View>
                        </View>

                        <TouchableOpacity 
                          onPress={() => router.push({
                            pathname: '/property/tier/tierDetail' as any,
                            params: { 
                              id: property?.id,
                              tokenId: token.id 
                            }
                          })}
                          style={{backgroundColor:'rgba(238, 134, 16, 0.39)',borderWidth:2,borderColor:'orange',borderRadius:10,padding:10,display:'flex'}}
                        >
                            <Text className="font-bold text-white">{token.apartmentType}</Text>
                        </TouchableOpacity>

                        {/* Decorative circles */}
                        <View className="absolute right-0 bottom-0 w-48 h-48 border border-white/10 rounded-full" style={{ right: -64, bottom: -64 }} />
                        <View className="absolute right-0 bottom-0 w-64 h-64 border border-white/5 rounded-full" style={{ right: -80, bottom: -80 }} />
                      </ImageBackground>
                    </View>
                  </View>
                );
              })}
              
              {/* Bottom spacing */}
              <View className="h-4" />
            </>
          )}
        </ScrollView>

        {/* Floating Home Button */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
                  </View>

        {/* Home Indicator Bar */}
        <View className="absolute bottom-2 self-center w-32 h-1.5 bg-slate-700 rounded-full" />
      </View>
    </View>
  );
}