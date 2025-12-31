import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useApp } from '@/contexts/AppContext';
import { propertyFilters } from '@/data/mockCommon';
import PropertyFilterModal, { PropertyFilterState, SortOption } from '@/components/property/PropertyFilterModal';


const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on each side + 16px gap

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

  // Filter modal state
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filterState, setFilterState] = useState<PropertyFilterState>({
    sortBy: 'newest',
    tokenPriceRange: [0, 1000], // Keep for backward compatibility
    tokenPriceValue: null, // Single investment amount
    roiRange: [0, 30], // Keep for backward compatibility
    roiValue: null, // Single ROI target
    selectedPropertyTypes: [],
    selectedLocations: [],
    activeOnly: false,
  });

  // Add "All" filter at the beginning
  const filters = ['All', ...propertyFilters, 'Bookmarks'] as const;

  // Calculate min/max values from properties for sliders
  const { minTokenPrice, maxTokenPrice, minROI, maxROI, availableCities, availablePropertyTypes } = useMemo(() => {
    if (state.properties.length === 0) {
      return {
        minTokenPrice: 0,
        maxTokenPrice: 1000,
        minROI: 0,
        maxROI: 30,
        availableCities: [],
        availablePropertyTypes: [],
      };
    }

    const tokenPrices = state.properties.map(p => p.tokenPrice).filter(p => p > 0);
    const rois = state.properties.map(p => p.estimatedROI).filter(r => r > 0);
    const cities = Array.from(new Set(state.properties.map(p => p.city).filter(Boolean))) as string[];
    const types = Array.from(new Set(state.properties.map(p => p.type).filter(Boolean))) as string[];

    return {
      minTokenPrice: tokenPrices.length > 0 ? Math.floor(Math.min(...tokenPrices)) : 0,
      maxTokenPrice: tokenPrices.length > 0 ? Math.ceil(Math.max(...tokenPrices)) : 1000,
      minROI: rois.length > 0 ? Math.floor(Math.min(...rois)) : 0,
      maxROI: rois.length > 0 ? Math.ceil(Math.max(...rois)) : 30,
      availableCities: cities.sort(),
      availablePropertyTypes: types.sort(),
    };
  }, [state.properties]);

  // Initialize ranges when properties load (for backward compatibility)
  React.useEffect(() => {
    if (state.properties.length > 0 && filterState.tokenPriceRange[1] === 1000) {
      setFilterState((prev) => ({
        ...prev,
        tokenPriceRange: [minTokenPrice, maxTokenPrice],
        roiRange: [minROI, maxROI],
      }));
    }
  }, [state.properties.length, minTokenPrice, maxTokenPrice, minROI, maxROI]);

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

  // Apply advanced filters
  let filteredProperties = propertiesToShow.filter((property) => {
    // Search filter
    const matchesSearch = 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.city && property.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (property.location && property.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Token price value filter - check if tokens are buyable at this investment amount
    if (filterState.tokenPriceValue !== null && filterState.tokenPriceValue > 0) {
      const MINIMUM_TOKENS = 0.1; // Minimum tokens required to invest
      const tokensBuyable = filterState.tokenPriceValue / property.tokenPrice;
      const availableTokens = property.totalTokens - property.soldTokens;
      
      // Property is buyable if:
      // 1. We can buy at least minimum tokens with the investment
      // 2. Property has available tokens
      if (tokensBuyable < MINIMUM_TOKENS || availableTokens <= 0) {
        return false;
      }
    }
    // If tokenPriceValue is null, don't filter by token price (show all)

    // ROI value filter - check if property ROI matches target
    if (filterState.roiValue !== null && filterState.roiValue > 0) {
      // Allow some tolerance (e.g., ±0.5%)
      const tolerance = 0.5;
      if (Math.abs(property.estimatedROI - filterState.roiValue) > tolerance) {
        return false;
      }
    }
    // If roiValue is null, don't filter by ROI (show all)

    // Property type filter
    if (filterState.selectedPropertyTypes.length > 0 && property.type) {
      if (!filterState.selectedPropertyTypes.includes(property.type)) {
        return false;
      }
    }

    // Location filter
    if (filterState.selectedLocations.length > 0 && property.city) {
      if (!filterState.selectedLocations.includes(property.city)) {
        return false;
      }
    }

    // Active only filter
    if (filterState.activeOnly) {
      if (property.status !== 'funding' && property.status !== 'construction') {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  filteredProperties = [...filteredProperties].sort((a, b) => {
    switch (filterState.sortBy) {
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'price-low':
        return a.tokenPrice - b.tokenPrice;
      case 'price-high':
        return b.tokenPrice - a.tokenPrice;
      case 'roi-high':
        return b.estimatedROI - a.estimatedROI;
      default:
        return 0;
    }
  });

  // Calculate property investment details based on filter values (similar to guidance-two)
  const calculatePropertyDetails = (property: any) => {
    const tokenPrice = property.tokenPrice;
    const estimatedROI = property.estimatedROI;
    const estimatedYield = property.estimatedYield;

    // Check if specific values are set
    const isTokenValueSet = filterState.tokenPriceValue !== null && filterState.tokenPriceValue > 0;
    const isROIValueSet = filterState.roiValue !== null && filterState.roiValue > 0;

    let tokensCount: number | null = null;
    let investmentAmount: number | null = null;
    let monthlyEarnings: number | null = null;
    let investmentNeeded: number | null = null;

    // Priority: ROI value takes precedence if both are set
    if (isROIValueSet) {
      // ROI-based calculation (similar to goal-based mode in guidance-two)
      // Calculate investment needed to achieve monthly earning based on ROI target
      // Formula from guidance-two: investment = (monthlyGoal * 12 * 100) / estimatedYield
      const referenceMonthlyEarning = 100; // Reference monthly earning to calculate from
      
      // Calculate investment needed using the ROI target
      investmentNeeded = (referenceMonthlyEarning * 12 * 100) / filterState.roiValue!;
      
      // Calculate tokens for this investment
      tokensCount = investmentNeeded / tokenPrice;
      
      // Calculate actual monthly earnings using the property's actual yield
      // Formula from guidance-two: monthlyIncome = (investment * estimatedYield) / 100 / 12
      monthlyEarnings = (investmentNeeded * estimatedYield) / 100 / 12;
    } else if (isTokenValueSet) {
      // Token price value-based calculation (similar to amount-based mode in guidance-two)
      investmentAmount = filterState.tokenPriceValue!;
      
      // Calculate tokens you can buy with this specific investment
      tokensCount = investmentAmount / tokenPrice;
      
      // Calculate monthly earnings from this investment
      // Formula from guidance-two: monthlyIncome = (investment * estimatedYield) / 100 / 12
      monthlyEarnings = (investmentAmount * estimatedYield) / 100 / 12;
    }

    return {
      tokensCount,
      investmentAmount,
      monthlyEarnings,
      investmentNeeded,
      isTokenValueSet,
      isROIValueSet,
    };
  };

  const renderPropertyCard = ({ item: property,index }: { item: any,index: number }) => {
    const propertyImage = (property.images && property.images.length > 0 && property.images[0]) 
      ? property.images[0] 
      : property.image 
      ? property.image
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';

    // Calculate investment details based on filter ranges
    const investmentDetails = calculatePropertyDetails(property);

    // Get area in square meters
    const area = property.features?.area || 0;
    const areaText = area > 0 ? `${area.toLocaleString('en-US', { maximumFractionDigits: 0 })} M²` : '';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/property/${property.id}`)}
        style={{
          width: CARD_WIDTH,
          borderRadius: 16,
          marginBottom: 16,
          paddingHorizontal: 10,
          marginTop: index % 2 === 0 ? -20 : 20,
        }}
        activeOpacity={0.9}
      >
        {/* Property Image - Rounded corners */}
        <View style={{ position: 'relative', height: CARD_WIDTH * 1 }}>
          <Image
            source={{ uri: propertyImage }}
            style={{ width: '100%', height: '100%', borderRadius: 30 }}
            resizeMode="cover"
            defaultSource={require('@/assets/blank.png')}
            onError={(error) => {
              console.log('Image load error for property:', property.title, error.nativeEvent);
            }}
          />
        </View>

        {/* Price Block - Directly below image, largest text */}
        <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 }}>
          {(investmentDetails.isTokenValueSet || investmentDetails.isROIValueSet) ? (
            <>
              {/* Investment Amount - Largest text */}
              <Text style={{ color: '#FFFFFF', fontFamily: 'sans-serif-thin', fontWeight: 'bold', fontStyle: 'italic', fontSize: 24, marginBottom: 2 }}>
                ${investmentDetails.isROIValueSet && investmentDetails.investmentNeeded !== null
                  ? investmentDetails.investmentNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : investmentDetails.investmentAmount !== null
                  ? investmentDetails.investmentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : property.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
              {/* Starting price label */}
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, marginBottom: 8 }}>
                Starting price
              </Text>
            </>
          ) : (
            <>
              {/* Price - Largest text */}
              <Text style={{ color: '#FFFFFF', fontFamily: 'sans-serif-thin', fontWeight: 'bold', fontStyle: 'italic', fontSize: 24, marginBottom: 2 }}>
                ${property.tokenPrice.toFixed(2)}
              </Text>
              {/* Starting price label */}
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 12,fontWeight:'bold', marginBottom: 0 }}>
                Starting price
              </Text>
            </>
          )}
        </View>

        {/* Card Content */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          {/* Property Name - Below price, smaller font */}
          <Text 
            style={{ color: 'rgba(255, 255, 255)', fontSize: 14, fontWeight: 'bold',includeFontPadding:true, marginBottom: 0 }}
            numberOfLines={2}
          >
            {property.title}
          </Text>

          {/* Tokens display when filters are active */}
          {(investmentDetails.isTokenValueSet || investmentDetails.isROIValueSet) && investmentDetails.tokensCount !== null && (
            <Text 
              style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, fontFamily: 'sans-serif-thin', marginBottom: 0 }}
            >
              {investmentDetails.tokensCount.toFixed(3)} tokens
            </Text>
          )}
          
          {/* Size - Small gray with arrow icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {areaText ? (
              <Text style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}>
                {areaText}
              </Text>
            ) : (
              <View />
            )}
            <Ionicons name="arrow-forward" size={16} color="rgba(255, 255, 255, 0.55)" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(22, 22, 22, 1)' }}>
    {/* // <View style={{ flex: 1, backgroundColor: colors.background }}> */}
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View
        style={{ 
          backgroundColor: 'rgba(22, 22, 22, 1)',
          paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
          paddingBottom: 16,
        }}
        className="px-4"
      >
        <View className="flex-row items-center justify-between mb-3">

          <View className="flex-1 mt-4 ml-4">
            <Text style={{ color: 'rgba(255, 255, 255, 0.55)' }} className="text-lg font-light">
              Find Your
            </Text>
            <Text style={{ color: '#FFFFFF' }} className="text-2xl font-bold">
              Investment
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsFilterModalVisible(true)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {/* <View
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' }}
          className="flex-row items-center rounded-xl px-4 py-3"
        >
          <MaterialIcons
            name="search"
            size={20}
            color="rgba(255, 255, 255, 0.55)"
          />
          <TextInput
            placeholder="Search by city, address..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            style={{ color: '#FFFFFF' }}
            className="flex-1 ml-3 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View> */}
      </View>

      {/* Filter Pills - Reduced Prominence */}
      {/* <View style={{ backgroundColor: 'rgba(22, 22, 22, 1)', paddingVertical: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            gap: 8 
          }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={{
                backgroundColor: activeFilter === filter ? '#9EDC5A' : 'rgba(255, 255, 255, 0.06)',
                borderWidth: activeFilter === filter ? 0 : 1,
                borderColor: 'rgba(255, 255, 255, 0.10)',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: activeFilter === filter ? '#0B1A12' : 'rgba(255, 255, 255, 0.55)',
                  fontWeight: activeFilter === filter ? '600' : '400',
                  fontSize: 12,
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}

      {/* Property Cards - 2 Column Grid */}
      {isLoadingProperties && !refreshing && filteredProperties.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
          <ActivityIndicator size="large" color="#9EDC5A" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: 16, fontSize: 15 }}>
            Loading properties...
          </Text>
        </View>
      ) : propertiesError && !isLoadingProperties && filteredProperties.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 16 }}>
          <MaterialIcons name="error-outline" size={48} color="rgba(255, 255, 255, 0.55)" />
          <Text style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: 16, fontSize: 15, textAlign: 'center' }}>
            {propertiesError}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{ backgroundColor: '#9EDC5A', marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}
          >
            <Text style={{ color: '#0B1A12', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !isLoadingProperties && !propertiesError && filteredProperties.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 16 }}>
          <MaterialIcons 
            name={activeFilter === 'Bookmarks' ? 'bookmark-border' : 'search-off'} 
            size={48} 
            color="rgba(255, 255, 255, 0.55)" 
          />
          <Text style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: 16, fontSize: 15, textAlign: 'center' }}>
            {searchQuery 
              ? 'No properties found matching your search' 
              : activeFilter === 'Bookmarks' 
                ? 'No bookmarked properties yet' 
                : 'No properties available'}
          </Text>
          {activeFilter === 'Bookmarks' && (
            <Text style={{ color: 'rgba(255, 255, 255, 0.35)', marginTop: 8, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 }}>
              Tap the bookmark icon on properties to save them here
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          renderItem={renderPropertyCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ 
            paddingHorizontal: 16,
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{
            marginTop: 20,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isLoadingProperties}
              onRefresh={onRefresh}
              tintColor="#9EDC5A"
            />
          }
        />
      )}

      {/* Filter Modal */}
      <PropertyFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        filterState={filterState}
        onFilterChange={setFilterState}
        onClearFilters={() => {
          setFilterState({
            sortBy: 'newest',
            tokenPriceRange: [minTokenPrice, maxTokenPrice],
            tokenPriceValue: null, // Reset to null so slider uses default middle value
            roiRange: [minROI, maxROI],
            roiValue: null, // Reset to null so slider uses default middle value
            selectedPropertyTypes: [],
            selectedLocations: [],
            activeOnly: false,
          });
        }}
        minTokenPrice={minTokenPrice}
        maxTokenPrice={maxTokenPrice}
        minROI={minROI}
        maxROI={maxROI}
        availableCities={availableCities}
        availablePropertyTypes={availablePropertyTypes}
      />
    </View>
  );
}