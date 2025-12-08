import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/contexts/AppContext';
import { propertyFilters } from '@/data/mockCommon';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { 
    state, 
    isBookmarked, 
    toggleBookmark,
    getBookmarkedProperties, 
    isLoadingProperties, 
    propertiesError,
    refreshProperties 
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Add "All" filter at the beginning
  const filters = ['All', ...propertyFilters, 'Bookmarks'] as const;

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProperties();
    } catch (error) {
      console.error('Error refreshing properties:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (propertyId: string, e: any) => {
    e.stopPropagation();
    toggleBookmark(propertyId);
  };

  // Get properties based on filter
  let propertiesToShow = state.properties;
  
  if (activeFilter === 'All') {
    // Show all properties
    propertiesToShow = state.properties;
  } else if (activeFilter === 'Bookmarks') {
    propertiesToShow = getBookmarkedProperties();
  } else if (activeFilter === 'Trending') {
    // Show all properties for trending (or filter by sold percentage > 30%)
    propertiesToShow = state.properties.filter(
      p => p.totalTokens > 0 && (p.soldTokens / p.totalTokens) > 0.3
    );
  } else if (activeFilter === 'High Yield') {
    propertiesToShow = state.properties.filter(p => p.estimatedYield >= 10);
  } else if (activeFilter === 'New Listings') {
    // Properties created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    propertiesToShow = state.properties.filter(p => {
      const createdDate = new Date(p.createdAt || 0);
      return createdDate >= thirtyDaysAgo;
    });
  } else if (activeFilter === 'Completed') {
    propertiesToShow = state.properties.filter(
      p => p.status === 'completed' || p.status === 'generating-income'
    );
  }

  const filteredProperties = propertiesToShow.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.city && property.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (property.location && property.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      
      
      {/* Header */}
      <View
        style={{ 
          backgroundColor: isDarkColorScheme ? 'rgba(1, 42, 36, 0.8)' : 'rgba(248, 247, 245, 0.8)',
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        }}
        className="px-4 pb-3"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View className="flex-1 items-center">
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
              Properties
            </Text>
          </View>

          <View className="w-10" />
        </View>

        {/* Search Bar */}
        <View
          style={{ backgroundColor: colors.card }}
          className="flex-row items-center rounded-2xl px-4 py-2 shadow-sm"
        >
          <MaterialIcons
            name="search"
            size={20}
            color={colors.textMuted}
          />
          <TextInput
            placeholder="Search by city, address..."
            placeholderTextColor={colors.textMuted}
            style={{ color: colors.textPrimary }}
            className="flex-1 ml-3 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View className="mx-auto">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8 
          }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={{
                backgroundColor: activeFilter === filter ? colors.primary : colors.card,
                borderWidth: activeFilter === filter ? 0 : 1,
                borderColor: colors.border,
              }}
              className="px-5 py-2 rounded-full"
            >
              <Text
                style={{
                  color: activeFilter === filter ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: activeFilter === filter ? '600' : '400',
                }}
                className="text-sm"
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Property Cards */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoadingProperties}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Loading State */}
        {isLoadingProperties && !refreshing && filteredProperties.length === 0 && (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary }} className="mt-4 text-base">
              Loading properties...
            </Text>
          </View>
        )}

        {/* Error State */}
        {propertiesError && !isLoadingProperties && filteredProperties.length === 0 && (
          <View className="flex-1 items-center justify-center py-20 px-4">
            <MaterialIcons name="error-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary }} className="mt-4 text-base text-center">
              {propertiesError}
            </Text>
            <TouchableOpacity
              onPress={onRefresh}
              style={{ backgroundColor: colors.primary }}
              className="mt-6 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoadingProperties && !propertiesError && filteredProperties.length === 0 && (
          <View className="flex-1 items-center justify-center py-20 px-4">
            <MaterialIcons 
              name={activeFilter === 'Bookmarks' ? 'bookmark-border' : 'search-off'} 
              size={48} 
              color={colors.textMuted} 
            />
            <Text style={{ color: colors.textSecondary }} className="mt-4 text-base text-center">
              {searchQuery 
                ? 'No properties found matching your search' 
                : activeFilter === 'Bookmarks' 
                  ? 'No bookmarked properties yet' 
                  : 'No properties available'}
            </Text>
            {activeFilter === 'Bookmarks' && (
              <Text style={{ color: colors.textMuted }} className="mt-2 text-sm text-center px-8">
                Tap the bookmark icon on properties to save them here
              </Text>
            )}
          </View>
        )}

        {/* Properties List */}
        {filteredProperties.map((property) => (
          <TouchableOpacity
            key={property.id}
            onPress={() => router.push(`/property/${property.id}`)}
            style={{ backgroundColor: colors.card }}
            className="mb-6 rounded-2xl overflow-hidden shadow-lg"
            activeOpacity={0.9}
          >
            {/* Property Image */}
            <View className="relative">
              <Image
                source={{ 
                  uri: (property.images && property.images.length > 0 && property.images[0]) 
                    ? property.images[0] 
                    : property.image 
                    ? property.image
                    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
                }}
                className="w-full h-56"
                resizeMode="cover"
                defaultSource={require('@/assets/blank.png')}
                onError={(error) => {
                  console.log('Image load error for property:', property.title, error.nativeEvent);
                }}
              />
              {/* Status Badge */}
              <View 
                style={{ backgroundColor: isDarkColorScheme ? 'rgba(22, 163, 74, 0.9)' : 'rgba(22, 163, 74, 0.9)' }}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-full"
              >
                <Text className="text-white text-xs font-semibold capitalize">
                  {property.status.replace('-', ' ')}
                </Text>
              </View>
              
              {/* Bookmark Button with functionality */}
              <TouchableOpacity 
                className="absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isBookmarked(property.id) 
                    ? 'rgba(13, 165, 165, 0.9)' 
                    : 'rgba(0, 0, 0, 0.4)',
                }}
                onPress={(e) => handleBookmarkToggle(property.id, e)}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name={isBookmarked(property.id) ? "bookmark" : "bookmark-border"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            {/* Property Details */}
            <View className="p-4">
              <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
                {property.title}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
                ${typeof property.valuation === 'number' 
                  ? property.valuation.toLocaleString() 
                  : property.valuation} Valuation
              </Text>

              {/* Investment Info */}
              <View
                style={{ borderTopColor: colors.border }}
                className="flex-row justify-between items-center pt-3 border-t"
              >
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    Tokens from
                  </Text>
                  <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                    ${property.tokenPrice.toFixed(2)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    Est. Return
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-lg font-bold">
                    {property.estimatedROI}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              {property.totalTokens > 0 && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1.5">
                    <Text style={{ color: colors.textSecondary }} className="text-xs">
                      Funding Progress
                    </Text>
                    <Text style={{ color: colors.textPrimary }} className="text-xs font-semibold">
                      {((property.soldTokens / property.totalTokens) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View 
                    style={{ backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                    className="w-full h-2 rounded-full"
                  >
                    <View
                      style={{ 
                        backgroundColor: colors.primary,
                        width: `${Math.min((property.soldTokens / property.totalTokens) * 100, 100)}%`
                      }}
                      className="h-2 rounded-full"
                    />
                  </View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs mt-1.5">
                    {property.soldTokens.toLocaleString()} / {property.totalTokens.toLocaleString()} Tokens
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}