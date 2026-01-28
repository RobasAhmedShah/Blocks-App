import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { marketplaceAPI, MarketplaceListing } from '@/services/api/marketplace.api';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { authApi } from '@/services/api/auth.api';
import * as SecureStore from 'expo-secure-store';
import { BuyTokenModal } from '@/components/marketplace/BuyTokenModal';
import EmeraldLoader from '@/components/EmeraldLoader';

export default function MarketplaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyListings, setLoadingMyListings] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'created_at_desc' | 'roi_desc'>('created_at_desc');
  const [filterProperty, setFilterProperty] = useState<string | undefined>(params.propertyId);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [myListingsCategory, setMyListingsCategory] = useState<'active' | 'sold' | 'cancelled'>('active');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  
  const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

  // Helper function to get property image URL
  const getPropertyImageUrl = (images: any): string | null => {
    if (!images) return null;
    
    // Normalize images to array of strings
    const imageArray = normalizePropertyImages(images);
    if (imageArray.length === 0) return null;
    
    const firstImage = imageArray[0];
    if (!firstImage) return null;
    
    // If it's already a full URL, return as-is
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      return firstImage;
    }
    
    // If it's a relative path starting with /, prepend API base URL
    if (firstImage.startsWith('/')) {
      return `${API_BASE_URL}${firstImage}`;
    }
    
    // Otherwise, assume it's a relative path
    return `${API_BASE_URL}/${firstImage}`;
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getListings({
        sortBy,
        propertyId: filterProperty,
        limit: 50,
      });
      setListings(response.listings);
    } catch (error: any) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyListings = async () => {
    try {
      setLoadingMyListings(true);
      const myListingsData = await marketplaceAPI.getMyListings();
      setMyListings(myListingsData);
    } catch (error: any) {
      console.error('Failed to load my listings:', error);
    } finally {
      setLoadingMyListings(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const user = await authApi.getMe(token);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      loadListings();
      loadMyListings();
      loadCurrentUser();
    }
  }, [isAuthenticated, isGuest, sortBy, filterProperty]);

  // Update filterProperty when URL param changes
  useEffect(() => {
    if (params.propertyId) {
      setFilterProperty(params.propertyId);
    }
  }, [params.propertyId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
    loadMyListings();
  };

  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

  const filteredListings = listings.filter((listing) => {
    // Filter out user's own listings from "All Listings" tab
    // They should only appear in "My Listings" tab
    if (currentUserId && listing.sellerId === currentUserId) {
      return false;
    }
    
    // Apply search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      listing.property.title.toLowerCase().includes(query) ||
      listing.property.city?.toLowerCase().includes(query) ||
      listing.displayCode.toLowerCase().includes(query)
    );
  });

  // Group listings by property and find lowest price for each group
  const groupedListings = useMemo(() => {
    const groups = new Map<string, {
      property: MarketplaceListing['property'];
      listings: MarketplaceListing[];
      lowestPrice: number;
      listingCount: number;
    }>();

    filteredListings.forEach((listing) => {
      const propertyId = listing.propertyId;
      
      if (!groups.has(propertyId)) {
        groups.set(propertyId, {
          property: listing.property,
          listings: [listing],
          lowestPrice: listing.pricePerToken,
          listingCount: 1,
        });
      } else {
        const group = groups.get(propertyId)!;
        group.listings.push(listing);
        group.listingCount = group.listings.length;
        // Update lowest price if this listing has a lower price
        if (listing.pricePerToken < group.lowestPrice) {
          group.lowestPrice = listing.pricePerToken;
        }
      }
    });

    // Convert map to array and sort by lowest price
    return Array.from(groups.values()).sort((a, b) => a.lowestPrice - b.lowestPrice);
  }, [filteredListings]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>

         {/* Linear Gradient Background - Marketplace Theme */}
         <LinearGradient
        colors={
          isDarkColorScheme
            ? [
                '#0A4D3A', // Deep forest green (top)
                '#064E3B', // Deep emerald
                '#022C22', // Darker green
                '#011F1A', // Very dark green
                '#022C22', // Darker green
              ]
            : [
              '#F0FDF4', // Very light green tint
              '#ECFDF5', // Light mint
              '#F9FAFB', // Light gray
              '#FFFFFF', // Pure white
            ]
        }
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Slim Header */}
      <View
        
        className="px-4 mt-8 "
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40, paddingBottom: 12 }}
      >
        <View className="flex-row items-center justify-between mb-3">
        <Ionicons
         onPress={() => router.back()}
         style={{
          // backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderRadius: 16,
        }}
         name="arrow-back" size={24} color={colors.textPrimary} />

          <View className="">
            
            <Text
              style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
              className="text-xl font-bold "
            >
              Marketplace
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/marketplace/sell')}
            style={{
              // backgroundColor: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 8,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#ffffff' }} className="text-sm font-semibold">
            <Ionicons name="add-circle" size={24} color={colors.textPrimary} />

            </Text>
          </TouchableOpacity>
        </View>

        {/* Compact Search Bar */}
        <View
          style={{ backgroundColor: colors.card }}
          className="flex-row items-center rounded-xl px-3 py-2 mb-2"
        >
          <MaterialIcons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search properties..."
            placeholderTextColor={colors.textMuted}
            style={{ color: colors.textPrimary, flex: 1, marginLeft: 8, fontSize: 14 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Compact Sort Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5">
            {[
              { label: 'Newest', value: 'created_at_desc' as const },
              { label: 'Price: Low', value: 'price_asc' as const },
              { label: 'Price: High', value: 'price_desc' as const },
              { label: 'Best ROI', value: 'roi_desc' as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSortBy(option.value)}
                style={{
                  backgroundColor: sortBy === option.value ? colors.primary + '20' : colors.card,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: sortBy === option.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: sortBy === option.value ? colors.textPrimary : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

    {/* Heading-style Tabs with Bottom Border Indicator */}
<View
  style={{
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }}
  className='ml-2'
>
  <View style={{ flexDirection: 'row', gap: 24 }}
  className='flex-row items-center justify-around'>
    
    {/* All Listings Tab */}
    <TouchableOpacity
      onPress={() => setActiveTab('all')}
      style={{
        paddingVertical: 12,
        borderBottomWidth: 2,
        width: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomColor:
          activeTab === 'all' ? colors.primary : 'transparent',
      }}
    >
      <Text
        style={{
          color:
            activeTab === 'all'
              ? colors.primary
              : colors.textMuted,
          fontSize: 15,
          fontWeight: activeTab === 'all' ? '700' : '500',
        }}
      >
        All Listings
      </Text>
    </TouchableOpacity>

    {/* My Listings Tab */}
    <TouchableOpacity
      onPress={() => setActiveTab('my')}
      style={{
        paddingVertical: 12,
        borderBottomWidth: 2,
        width: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomColor:
          activeTab === 'my' ? colors.primary : 'transparent',
        // flexDirection: 'row',
        // gap: 6,
      }}
    >
      <Text
        style={{
          color:
            activeTab === 'my'
              ? colors.primary
              : colors.textMuted,
          fontSize: 15,
          fontWeight: activeTab === 'my' ? '700' : '500',
        }}
      >
        My Listings
      </Text>

      
    </TouchableOpacity>

  </View>
</View>


      {/* Listings */}
      {loading || (activeTab === 'my' && loadingMyListings) ? (
        <View className="flex-1 items-center justify-center">
          <EmeraldLoader />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View className="py-4">
            {/* Show listings based on active tab */}
            {activeTab === 'my' ? (
              // My Listings Tab
              <>
                {/* Compact Category Tabs for My Listings */}
                <View 
                  style={{
                    flexDirection: 'row',
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    padding: 3,
                    marginBottom: 12,
                  }}
                >
                  {[
                    { key: 'active' as const, label: 'Active', count: myListings.filter(l => l.status === 'active').length },
                    { key: 'sold' as const, label: 'Sold', count: myListings.filter(l => l.status === 'sold').length },
                    { key: 'cancelled' as const, label: 'Unpublished', count: myListings.filter(l => l.status === 'cancelled').length },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      onPress={() => setMyListingsCategory(category.key)}
                      style={{
                        flex: 1,
                        backgroundColor: myListingsCategory === category.key ? colors.primary : 'transparent',
                        paddingVertical: 6,
                        borderRadius: 8,
                        alignItems: 'center',
                        position: 'relative',
                      }}
                    >
                      <Text
                        style={{
                          color: myListingsCategory === category.key ? '#ffffff' : colors.textPrimary,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {category.label}
                      </Text>
                      {category.count > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: 4,
                            backgroundColor: myListingsCategory === category.key ? '#ffffff' : colors.primary,
                            borderRadius: 8,
                            minWidth: 16,
                            height: 16,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: myListingsCategory === category.key ? colors.primary : '#ffffff',
                              fontSize: 9,
                              fontWeight: 'bold',
                            }}
                          >
                            {category.count}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filtered My Listings by Category - Grid Layout */}
                {(() => {
                  const filteredMyListings = myListings.filter(listing => listing.status === myListingsCategory);
                  
                  return filteredMyListings.length === 0 ? (
                    <View className="items-center justify-center py-12">
                      <MaterialIcons 
                        name={
                          myListingsCategory === 'active' ? 'store' :
                          myListingsCategory === 'sold' ? 'check-circle' :
                          'cancel'
                        } 
                        size={64} 
                        color={colors.textMuted} 
                      />
                      <Text style={{ color: colors.textSecondary }} className="text-lg font-semibold mt-4">
                        {myListingsCategory === 'active' ? 'No active listings' :
                         myListingsCategory === 'sold' ? 'No sold listings' :
                         'No unpublished listings'}
                      </Text>
                      <Text style={{ color: colors.textMuted }} className="text-sm text-center mt-2">
                        {myListingsCategory === 'active' 
                          ? 'Start selling your tokens to see them here'
                          : `You don't have any ${myListingsCategory === 'sold' ? 'sold' : 'unpublished'} listings yet`}
                      </Text>
                      {myListingsCategory === 'active' && (
                        <TouchableOpacity
                          onPress={() => router.push('/marketplace/sell')}
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 20,
                            marginTop: 16,
                          }}
                        >
                          <Text style={{ color: '#ffffff' }} className="font-semibold">
                            Sell Tokens
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      {filteredMyListings.map((listing) => {
                        const propertyImage = getPropertyImageUrl(listing.property.images);

                        return (
                          <TouchableOpacity
                            key={listing.id}
                            onPress={() => router.push(`/marketplace/${listing.id}`)}
                            style={{
                              width: '48%',
                              borderRadius: 14,
                              marginBottom: 12,
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: colors.border,
                              opacity: listing.status !== 'active' ? 0.85 : 1,
                            }}
                          >
                            {/* Card Gradient Background */}
                            <LinearGradient
                              colors={
                                isDarkColorScheme
                                  ? listing.status === 'active'
                                    ? [
                                        'rgba(34, 197, 94, 0.15)', // Subtle green tint
                                        'rgba(6, 78, 59, 0.25)', // Deep emerald
                                        'rgba(15, 23, 42, 0.95)', // Dark slate
                                        'rgba(2, 6, 23, 0.98)', // Almost black
                                      ]
                                    : listing.status === 'sold'
                                    ? [
                                        'rgba(16, 185, 129, 0.12)', // Subtle teal
                                        'rgba(5, 150, 105, 0.20)', // Darker teal
                                        'rgba(15, 23, 42, 0.95)', // Dark slate
                                        'rgba(2, 6, 23, 0.98)', // Almost black
                                      ]
                                    : [
                                        'rgba(107, 114, 128, 0.10)', // Subtle gray
                                        'rgba(55, 65, 81, 0.20)', // Darker gray
                                        'rgba(15, 23, 42, 0.95)', // Dark slate
                                        'rgba(2, 6, 23, 0.98)', // Almost black
                                      ]
                                  : [
                                      'rgba(255, 255, 255, 0.98)', // Almost white
                                      'rgba(249, 250, 251, 0.95)', // Light gray
                                      'rgba(243, 244, 246, 0.98)', // Lighter gray
                                    ]
                              }
                              locations={[0, 0.3, 0.7, 1]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 14,
                              }}
                            />
                            {/* Image */}
                            {propertyImage ? (
                              <Image
                                source={{ uri: propertyImage }}
                                style={{ width: '100%', height: 110 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={{
                                  width: '100%',
                                  height: 110,
                                  backgroundColor: colors.primary + '20',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                              >
                                <MaterialIcons name="home" size={28} color={colors.primary} />
                              </View>
                            )}

                            <View style={{ padding: 10, position: 'relative', zIndex: 1 }}>
                              {/* Title & Status Row */}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <Text
                                  style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1, marginRight: 4 }}
                                  numberOfLines={1}
                                >
                                  {listing.property.title}
                                </Text>
                                <Text
                                  style={{ 
                                    color: listing.status === 'active' 
                                      ? colors.primary 
                                      : listing.status === 'sold' 
                                        ? '#10b981'
                                        : colors.textMuted,
                                    fontSize: 9, 
                                    fontWeight: '700' 
                                  }}
                                >
                                  {listing.status === 'active' ? 'ACTIVE' : listing.status === 'sold' ? 'SOLD' : 'UNPUB'}
                                </Text>
                              </View>

                              {/* Location */}
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons
                                  name="location-outline"
                                  size={10}
                                  color={colors.textMuted}
                                />
                                <Text
                                  style={{ color: colors.textMuted, fontSize: 10, marginLeft: 3 }}
                                  numberOfLines={1}
                                >
                                  {listing.property.city || 'Location'}
                                </Text>
                              </View>

                              {/* Price - Primary Focus */}
                              <Text
                                style={{ color: colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 2 }}
                              >
                                {formatPrice(listing.pricePerToken)}
                              </Text>
                              <Text
                                style={{ color: colors.textMuted, fontSize: 9, marginBottom: 6 }}
                              >
                                per token
                              </Text>

                              {/* Action Buttons */}
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    router.push(`/marketplace/${listing.id}`);
                                  }}
                                  style={{
                                    flex: 1,
                                    backgroundColor: listing.status === 'active' ? colors.primary : 'transparent',
                                    borderRadius: 8,
                                    paddingVertical: 6,
                                    alignItems: 'center',
                                    borderWidth: listing.status === 'active' ? 0 : 1,
                                    borderColor: colors.border,
                                  }}
                                >
                                  <Text 
                                    style={{ 
                                      color: listing.status === 'active' ? '#ffffff' : colors.textPrimary,
                                      fontSize: 11, 
                                      fontWeight: '600' 
                                    }}
                                  >
                                    View
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })()}
              </>
            ) : (
              // All Listings Tab - Grid Layout (Grouped by Property)
              groupedListings.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <MaterialIcons name="store" size={64} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary }} className="text-lg font-semibold mt-4">
                    No listings available
                  </Text>
                  <Text style={{ color: colors.textMuted }} className="text-sm text-center mt-2">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Be the first to list tokens for sale'}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {groupedListings.map((group) => {
                    const propertyImage = getPropertyImageUrl(group.property.images);
                    // Find the listing with the lowest price for navigation
                    const lowestPriceListing = group.listings.find(l => l.pricePerToken === group.lowestPrice) || group.listings[0];

                    return (
                      <TouchableOpacity
                        key={group.property.id}
                        onPress={() => router.push({
                          pathname: `/marketplace/${lowestPriceListing.id}`,
                          params: {
                            propertyListings: JSON.stringify(group.listings),
                          },
                        } as any)}
                        style={{
                          width: '48%',
                          borderRadius: 14,
                          marginBottom: 12,
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        {/* Card Gradient Background */}
                        <LinearGradient
                          colors={
                            isDarkColorScheme
                              ? [
                                  'rgba(34, 197, 94, 0.15)', // Subtle green tint
                                  'rgba(6, 78, 59, 0.25)', // Deep emerald
                                  'rgba(15, 23, 42, 0.95)', // Dark slate
                                  'rgba(2, 6, 23, 0.98)', // Almost black
                                ]
                              : [
                                  'rgba(255, 255, 255, 0.98)', // Almost white
                                  'rgba(249, 250, 251, 0.95)', // Light gray
                                  'rgba(243, 244, 246, 0.98)', // Lighter gray
                                ]
                          }
                          locations={[0, 0.3, 0.7, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 14,
                          }}
                        />
                        {/* Image */}
                        {propertyImage ? (
                          <Image
                            source={{ uri: propertyImage }}
                            style={{ width: '100%', height: 110 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: '100%',
                              height: 110,
                              backgroundColor: colors.primary + '20',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <MaterialIcons name="home" size={28} color={colors.primary} />
                          </View>
                        )}

                        <View style={{ padding: 10, position: 'relative', zIndex: 1 }}>
                          {/* Property Title & ROI Badge Row */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <Text
                              style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flex: 1, marginRight: 4 }}
                              numberOfLines={1}
                            >
                              {group.property.title}
                            </Text>
                            <Text
                              style={{ 
                                color: colors.primary, 
                                fontSize: 9, 
                                fontWeight: '700' 
                              }}
                            >
                              {typeof group.property.expectedROI === 'number' 
                                ? group.property.expectedROI.toFixed(0) 
                                : (group.property.expectedROI || 0)}% ROI
                            </Text>
                          </View>

                          {/* Location & Status */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons
                              name="location-outline"
                              size={10}
                              color={colors.textMuted}
                            />
                            <Text
                              style={{ color: colors.textMuted, fontSize: 10, marginLeft: 3 }}
                              numberOfLines={1}
                            >
                              {group.property.city || 'Location'}
                            </Text>
                            <View
                              style={{
                                width: 3,
                                height: 3,
                                borderRadius: 1.5,
                                backgroundColor: colors.primary,
                                marginLeft: 5,
                                marginRight: 3,
                              }}
                            />
                            <Text
                              style={{ color: colors.primary, fontSize: 9, fontWeight: '600' }}
                            >
                              {group.listingCount} {group.listingCount === 1 ? 'listing' : 'listings'}
                            </Text>
                          </View>

                          {/* Price - Primary Focus (Lowest Price) */}
                          <Text
                            style={{ color: colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 2 }}
                          >
                            {formatPrice(group.lowestPrice)}
                          </Text>
                          <Text
                            style={{ color: colors.textMuted, fontSize: 9, marginBottom: 6 }}
                          >
                            from per token
                          </Text>

                          {/* Action Buttons */}
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                setSelectedListing(lowestPriceListing);
                                setShowBuyModal(true);
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: colors.primary,
                                borderRadius: 8,
                                paddingVertical: 6,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                                Buy
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                router.push(`/marketplace/${lowestPriceListing.id}`);
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                borderRadius: 8,
                                paddingVertical: 6,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            >
                              <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                                View
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </View>
        </ScrollView>
      )}

      {/* Buy Token Modal */}
      <BuyTokenModal
        visible={showBuyModal}
        listing={selectedListing}
        allPropertyListings={selectedListing ? groupedListings.find(g => g.property.id === selectedListing.propertyId)?.listings || [] : []}
        onClose={() => {
          setShowBuyModal(false);
          setSelectedListing(null);
        }}
        onSuccess={() => {
          setShowBuyModal(false);
          setSelectedListing(null);
          loadListings(); // Refresh listings after purchase
        }}
      />
    </View>
  );
}

