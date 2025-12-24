import React, { useState, useEffect } from 'react';
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
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <LinearGradient
        colors={
          isDarkColorScheme
            ? ['#022c22', '#064e3b']
            : ['#ecfdf5', '#d1fae5']
        }
        className="px-4 pb-4"
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text
              style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
              className="text-2xl font-bold mb-1"
            >
              Marketplace
            </Text>
            <Text
              style={{ color: isDarkColorScheme ? 'rgba(255,255,255,0.7)' : 'rgba(6,78,59,0.7)' }}
              className="text-sm"
            >
              Buy and sell property tokens
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/marketplace/sell')}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#ffffff' }} className="font-semibold">
              Sell Tokens
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={{ backgroundColor: colors.card }}
          className="flex-row items-center rounded-2xl px-4 py-3 shadow-sm mb-3"
        >
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Search properties..."
            placeholderTextColor={colors.textMuted}
            style={{ color: colors.textPrimary, flex: 1, marginLeft: 12 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Sort & Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
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
                  backgroundColor: sortBy === option.value ? colors.primary : colors.card,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: sortBy === option.value ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: sortBy === option.value ? '#ffffff' : colors.textPrimary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Tab Capsules */}
      <View
        style={{
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'all' ? colors.primary : colors.card,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: activeTab === 'all' ? colors.primary : colors.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: activeTab === 'all' ? '#ffffff' : colors.textPrimary,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              All Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my')}
            style={{
              flex: 1,
              backgroundColor: activeTab === 'my' ? colors.primary : colors.card,
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: activeTab === 'my' ? colors.primary : colors.border,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: activeTab === 'my' ? '#ffffff' : colors.textPrimary,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              My Listings
            </Text>
            {myListings.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>
                  {myListings.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Listings */}
      {loading || (activeTab === 'my' && loadingMyListings) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
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
                {/* Category Tabs for My Listings */}
                <View className="flex-row gap-2 mb-4">
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
                        backgroundColor: myListingsCategory === category.key ? colors.primary : colors.card,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: myListingsCategory === category.key ? colors.primary : colors.border,
                        alignItems: 'center',
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
                            top: -6,
                            right: -6,
                            backgroundColor: myListingsCategory === category.key ? '#ffffff' : colors.primary,
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 6,
                          }}
                        >
                          <Text
                            style={{
                              color: myListingsCategory === category.key ? colors.primary : '#ffffff',
                              fontSize: 10,
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

                {/* Filtered My Listings by Category */}
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
                    filteredMyListings.map((listing) => {
                  const propertyImage = getPropertyImageUrl(listing.property.images);

                  return (
                    <TouchableOpacity
                      key={listing.id}
                      onPress={() => router.push(`/marketplace/${listing.id}`)}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 20,
                        marginBottom: 12,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: listing.status === 'active' 
                          ? colors.primary 
                          : listing.status === 'sold' 
                            ? '#10b981' 
                            : colors.textMuted,
                        opacity: listing.status !== 'active' ? 0.8 : 1,
                      }}
                    >
                      {/* Status Badge */}
                      {listing.status !== 'active' && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            backgroundColor: listing.status === 'sold' ? '#10b981' : colors.textMuted,
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            zIndex: 10,
                          }}
                        >
                          <View className="flex-row items-center">
                            <MaterialIcons 
                              name={listing.status === 'sold' ? 'check-circle' : 'cancel'} 
                              size={14} 
                              color="#ffffff" 
                              style={{ marginRight: 4 }}
                            />
                            <Text style={{ color: '#ffffff' }} className="text-xs font-bold">
                              {listing.status === 'sold' ? 'SOLD' : 'UNPUBLISHED'}
                            </Text>
                          </View>
                        </View>
                      )}
                      {/* Property Image */}
                      {propertyImage ? (
                        <Image
                          source={{ uri: propertyImage }}
                          style={{ width: '100%', height: 200 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: 200,
                            backgroundColor: colors.primary + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <MaterialIcons name="home" size={48} color={colors.primary} />
                        </View>
                      )}

                      <View className="p-4">
                        {/* Property Title & Location */}
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="text-lg font-bold mb-1"
                          numberOfLines={1}
                        >
                          {listing.property.title}
                        </Text>
                        <View className="flex-row items-center mb-3">
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text
                            style={{ color: colors.textMuted }}
                            className="text-xs ml-1"
                          >
                            {listing.property.city || 'Location'}
                          </Text>
                        </View>

                        {/* Price & ROI */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text
                              style={{ color: colors.textMuted }}
                              className="text-xs mb-1"
                            >
                              Price per Token
                            </Text>
                            <Text
                              style={{ color: colors.primary }}
                              className="text-xl font-bold"
                            >
                              {formatPrice(listing.pricePerToken)}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text
                              style={{ color: colors.textMuted }}
                              className="text-xs mb-1"
                            >
                              Expected ROI
                            </Text>
                            <View
                              style={{
                                backgroundColor: colors.primary + '20',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 12,
                              }}
                            >
                              <Text
                                style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
                                className="text-sm font-bold"
                              >
                                {typeof listing.property.expectedROI === 'number' 
                                  ? listing.property.expectedROI.toFixed(1) 
                                  : (listing.property.expectedROI || 0)}%
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Available Tokens & Order Limits */}
                        <View
                          style={{
                            backgroundColor: isDarkColorScheme
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(6,78,59,0.05)',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 12,
                          }}
                        >
                          <View className="flex-row justify-between items-center mb-2">
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              Available
                            </Text>
                            <Text
                              style={{ color: colors.textPrimary }}
                              className="text-sm font-semibold"
                            >
                              {(() => {
                                const tokens = listing.remainingTokens;
                                if (typeof tokens === 'number') {
                                  return tokens.toFixed(2);
                                }
                                const tokensNum = parseFloat(String(tokens || '0')) || 0;
                                return tokensNum.toFixed(2);
                              })()} tokens
                            </Text>
                          </View>
                        </View>

                        {/* View/Edit Button */}
                        <TouchableOpacity
                          onPress={() => router.push(`/marketplace/${listing.id}`)}
                          style={{
                            backgroundColor: listing.status === 'active' 
                              ? colors.primary + '20' 
                              : colors.card,
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: listing.status === 'active' 
                              ? colors.primary 
                              : colors.border,
                            opacity: listing.status === 'active' ? 1 : 0.6,
                          }}
                        >
                          <Text 
                            style={{ 
                              color: listing.status === 'active' 
                                ? colors.primary 
                                : colors.textMuted 
                            }} 
                            className="font-bold text-base"
                          >
                            View Listing
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
                  );
                })()}
              </>
            ) : (
              // All Listings Tab
              filteredListings.length === 0 ? (
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
                filteredListings.map((listing) => {
                  const propertyImage = getPropertyImageUrl(listing.property.images);

                  return (
                    <TouchableOpacity
                      key={listing.id}
                      onPress={() => router.push(`/marketplace/${listing.id}`)}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 20,
                        marginBottom: 16,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {/* Property Image */}
                      {propertyImage ? (
                        <Image
                          source={{ uri: propertyImage }}
                          style={{ width: '100%', height: 200 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: 200,
                            backgroundColor: colors.primary + '20',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <MaterialIcons name="home" size={48} color={colors.primary} />
                        </View>
                      )}

                      <View className="p-4">
                        {/* Property Title & Location */}
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="text-lg font-bold mb-1"
                          numberOfLines={1}
                        >
                          {listing.property.title}
                        </Text>
                        <View className="flex-row items-center mb-3">
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text
                            style={{ color: colors.textMuted }}
                            className="text-xs ml-1"
                          >
                            {listing.property.city || 'Location'}
                          </Text>
                        </View>

                        {/* Price & ROI */}
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text
                              style={{ color: colors.textMuted }}
                              className="text-xs mb-1"
                            >
                              Price per Token
                            </Text>
                            <Text
                              style={{ color: colors.primary }}
                              className="text-xl font-bold"
                            >
                              {formatPrice(listing.pricePerToken)}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text
                              style={{ color: colors.textMuted }}
                              className="text-xs mb-1"
                            >
                              Expected ROI
                            </Text>
                            <View
                              style={{
                                backgroundColor: colors.primary + '20',
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                                borderRadius: 12,
                              }}
                            >
                              <Text
                                style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
                                className="text-sm font-bold"
                              >
                                {typeof listing.property.expectedROI === 'number' 
                                  ? listing.property.expectedROI.toFixed(1) 
                                  : (listing.property.expectedROI || 0)}%
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Available Tokens & Order Limits */}
                        <View
                          style={{
                            backgroundColor: isDarkColorScheme
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(6,78,59,0.05)',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 12,
                          }}
                        >
                          <View className="flex-row justify-between items-center mb-2">
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              Available
                            </Text>
                            <Text
                              style={{ color: colors.textPrimary }}
                              className="text-sm font-semibold"
                            >
                              {(() => {
                                const tokens: any = listing.remainingTokens;
                                if (typeof tokens === 'number') {
                                  return tokens.toFixed(2);
                                }
                                const tokensNum = parseFloat(String(tokens || '0')) || 0;
                                return tokensNum.toFixed(2);
                              })()} tokens
                            </Text>
                          </View>
                        </View>

                        {/* Buy Button */}
                        <TouchableOpacity
                          onPress={() => router.push(`/marketplace/${listing.id}`)}
                          style={{
                            backgroundColor: colors.primary,
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff' }} className="font-bold text-base">
                            Buy Tokens
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

