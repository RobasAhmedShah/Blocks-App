import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { CustomModal } from '@/components/common/CustomModal';

const { height } = Dimensions.get('window');
const SCREEN_HEIGHT = height;

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'roi-high';

export interface PropertyFilterState {
  sortBy: SortOption;
  tokenPriceRange: [number, number]; // Keep for backward compatibility, but use tokenPriceValue
  tokenPriceValue: number | null; // Single investment amount
  filterMode: 'amount' | 'tokens'; // Filter by investment amount or token count
  tokenCount: number | null; // Token count when filtering by tokens
  roiRange: [number, number]; // Keep for backward compatibility
  roiValue: number | null; // Keep for backward compatibility
  returnPeriod: 'monthly' | 'yearly'; // Expected return period
  selectedPropertyTypes: string[];
  selectedLocations: string[];
  activeOnly: boolean;
}

interface PropertyFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filterState: PropertyFilterState;
  onFilterChange: (filters: PropertyFilterState) => void;
  onClearFilters: () => void;
  minTokenPrice: number;
  maxTokenPrice: number;
  minTokenCount: number;
  maxTokenCount: number;
  availableCities: string[];
  availablePropertyTypes: string[];
  averageTokenPrice?: number; // Optional: average token price for conversion
}

export default function PropertyFilterModal({
  visible,
  onClose,
  filterState,
  onFilterChange,
  onClearFilters,
  minTokenPrice,
  maxTokenPrice,
  minTokenCount,
  maxTokenCount,
  availableCities,
  availablePropertyTypes,
  averageTokenPrice: propAverageTokenPrice,
}: PropertyFilterModalProps) {
  const {
    sortBy,
    tokenPriceRange,
    tokenPriceValue,
    filterMode = 'amount',
    tokenCount,
    returnPeriod,
    selectedPropertyTypes,
    selectedLocations,
    activeOnly,
  } = filterState;

  // Use slider values, defaulting to middle of range if not set
  // These are just for display - filter only applies when user explicitly sets a value
  const currentTokenPriceValue = tokenPriceValue ?? (minTokenPrice + maxTokenPrice) / 2;
  const currentTokenCount = tokenCount ?? 1;
  
  // Track if user has interacted with slider/input
  const [hasSetTokenValue, setHasSetTokenValue] = useState(tokenPriceValue !== null || tokenCount !== null);
  const [manualInput, setManualInput] = useState<string>('');
  
  // Calculate average token price for conversion
  // Use provided average or calculate from min/max
  const averageTokenPrice = propAverageTokenPrice ?? (minTokenPrice + maxTokenPrice) / 2;
  
  // Sync interaction state when filter state changes
  useEffect(() => {
    setHasSetTokenValue(tokenPriceValue !== null || tokenCount !== null);
    if (filterMode === 'amount' && tokenPriceValue !== null) {
      setManualInput(tokenPriceValue.toFixed(0));
    } else if (filterMode === 'tokens' && tokenCount !== null) {
      setManualInput(tokenCount.toFixed(2));
    } else {
      setManualInput('');
    }
  }, [tokenPriceValue, tokenCount, filterMode]);

  const updateFilter = (updates: Partial<PropertyFilterState>) => {
    onFilterChange({ ...filterState, ...updates });
  };

  const handleClearFilters = () => {
    setHasSetTokenValue(false);
    setManualInput('');
    onClearFilters();
  };

  // Handle manual input change
  const handleManualInputChange = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setManualInput(cleaned);
    
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && numValue >= 0) {
      if (filterMode === 'amount') {
        // Amount mode: Store investment amount ONLY, clear token count
        const clampedValue = Math.max(minTokenPrice, Math.min(maxTokenPrice, numValue));
        setHasSetTokenValue(true);
        updateFilter({ 
          tokenPriceValue: clampedValue, 
          tokenCount: null // Clear token count - they work independently
        });
      } else {
        // Token mode: Store token count ONLY, clear investment amount
        const clampedTokens = Math.max(minTokenCount, Math.min(maxTokenCount, numValue));
        setHasSetTokenValue(true);
        updateFilter({ 
          tokenCount: clampedTokens, 
          tokenPriceValue: null // Clear investment amount - they work independently
        });
      }
    } else if (cleaned === '' || cleaned === '.') {
      setHasSetTokenValue(false);
      updateFilter({ tokenPriceValue: null, tokenCount: null });
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number) => {
    setHasSetTokenValue(true);
    if (filterMode === 'amount') {
      // Amount mode: Store investment amount ONLY, clear token count
      setManualInput(value.toFixed(0));
      updateFilter({ 
        tokenPriceValue: value, 
        tokenCount: null // Clear token count - they work independently
      });
    } else {
      // Token mode: Store token count ONLY, clear investment amount
      setManualInput(value.toFixed(2));
      updateFilter({ 
        tokenPriceValue: null, // Clear investment amount - they work independently
        tokenCount: value
      });
    }
  };

  // Toggle between amount and tokens mode
  const toggleFilterMode = () => {
    const newMode = filterMode === 'amount' ? 'tokens' : 'amount';
    // When switching modes, clear both values - they work independently
    setManualInput('');
    setHasSetTokenValue(false);
    updateFilter({ 
      filterMode: newMode, 
      tokenPriceValue: null, 
      tokenCount: null 
    });
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      height={0.88}
      showDragHandle={true}
      enableSwipeToClose={true}
      enableBackdropPress={true}
      backgroundColor="rgba(22, 22, 22, 1)"
      borderTopRadius={24}
      isDarkColorScheme={true}
        >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>
            Filters
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 120 }}>
          {/* Sort By Section */}
          <View style={{ paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Sort By
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
                { value: 'roi-high', label: 'ROI: High to Low' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateFilter({ sortBy: option.value as SortOption })}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: sortBy === option.value ? '#9EDC5A' : 'rgba(255, 255, 255, 0.06)',
                    borderWidth: sortBy === option.value ? 0 : 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: sortBy === option.value ? '600' : '400',
                      color: sortBy === option.value ? '#0B1A12' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Investment Amount / Tokens Section */}
          <View style={{ paddingTop: 24, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                {filterMode === 'amount' ? 'Investment Amount' : 'Token Count'}
              </Text>
              <TouchableOpacity
                onPress={toggleFilterMode}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons name="swap-horizontal" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginLeft: 4 }}>
                  {filterMode === 'amount' ? 'Switch to Tokens' : 'Switch to Amount'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Manual Input Field */}
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
                paddingVertical: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {filterMode === 'amount' ? (
                  <Text style={{ fontSize: 20, fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', marginRight: 4 }}>$</Text>
                ) : null}
                <TextInput
                  value={manualInput}
                  onChangeText={handleManualInputChange}
                  placeholder={filterMode === 'amount' ? '0' : '0.00'}
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  keyboardType="numeric"
                  style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: hasSetTokenValue ? '#9EDC5A' : 'rgba(255, 255, 255, 0.5)',
                    textAlign: 'center',
                    minWidth: 120,
                    borderBottomWidth: 1,
                    borderBottomColor: hasSetTokenValue ? '#9EDC5A' : 'rgba(255, 255, 255, 0.2)',
                    paddingVertical: 4,
                  }}
                />
                {filterMode === 'tokens' ? (
                  <Text style={{ fontSize: 20, fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', marginLeft: 4 }}> tokens</Text>
                ) : null}
              </View>
              {/* No conversion display - each mode shows only its own value */}
            </View>
            
            {/* Slider */}
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={filterMode === 'amount' ? minTokenPrice : minTokenCount}
              maximumValue={filterMode === 'amount' ? maxTokenPrice : maxTokenCount}
              value={filterMode === 'amount' 
                ? currentTokenPriceValue 
                : (tokenCount !== null ? tokenCount : (minTokenCount + maxTokenCount) / 2)}
              onValueChange={handleSliderChange}
              step={filterMode === 'amount' ? 10 : 0.1} // Step for tokens
              minimumTrackTintColor="#9EDC5A"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#9EDC5A"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {filterMode === 'amount' 
                  ? `$${minTokenPrice.toFixed(0)}`
                  : `${minTokenCount.toFixed(1)} tokens`}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {filterMode === 'amount'
                  ? `$${maxTokenPrice.toFixed(0)}`
                  : `${maxTokenCount.toFixed(1)} tokens`}
              </Text>
            </View>
          </View>

          {/* Expected Return Period Section */}
          <View style={{ paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Expected Return Period
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateFilter({ returnPeriod: option.value as 'monthly' | 'yearly' })}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: returnPeriod === option.value ? '#9EDC5A' : 'rgba(255, 255, 255, 0.1)',
                    borderWidth: returnPeriod === option.value ? 0 : 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: returnPeriod === option.value ? '600' : '400',
                      color: returnPeriod === option.value ? '#0B1A12' : 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Property Type Section */}
          {availablePropertyTypes.length > 0 && (
            <View style={{ paddingTop: 24, paddingBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                Property Type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availablePropertyTypes.map((type) => {
                  const isSelected = selectedPropertyTypes.includes(type);
                  const displayName =
                    type === 'residential'
                      ? 'Residential'
                      : type === 'commercial'
                      ? 'Commercial'
                      : type === 'mixed'
                      ? 'Mixed-use'
                      : type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        if (isSelected) {
                          updateFilter({
                            selectedPropertyTypes: selectedPropertyTypes.filter((t) => t !== type),
                          });
                        } else {
                          updateFilter({
                            selectedPropertyTypes: [...selectedPropertyTypes, type],
                          });
                        }
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: isSelected ? '#9EDC5A' : 'rgba(255, 255, 255, 0.06)',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#0B1A12' : 'rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        {displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Location Section */}
          {availableCities.length > 0 && (
            <View style={{ paddingTop: 24, paddingBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
                Location
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableCities.map((city) => {
                  const isSelected = selectedLocations.includes(city);
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() => {
                        if (isSelected) {
                          updateFilter({
                            selectedLocations: selectedLocations.filter((c) => c !== city),
                          });
                        } else {
                          updateFilter({
                            selectedLocations: [...selectedLocations, city],
                          });
                        }
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        backgroundColor: isSelected ? '#9EDC5A' : '#F5F5F5',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: '#E0E0E0',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#0B1A12' : '#666666',
                        }}
                      >
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Status Section */}
          <View
            style={{
              paddingTop: 24,
              paddingBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                Status
              </Text>
              <Text style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.84)' }}>Active only</Text>
            </View>
            <Switch
              value={activeOnly}
              onValueChange={(value) => updateFilter({ activeOnly: value })}
              trackColor={{ false: '#E0E0E0', true: '#9EDC5A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

        {/* Sticky Footer */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(22, 22, 22, 1)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            paddingHorizontal: 20,
            paddingVertical: 16,
            paddingBottom: 32,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={handleClearFilters}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>
              Clear filters
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: '#9EDC5A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0B1A12' }}>
              Show results
            </Text>
          </TouchableOpacity>
        </View>
    </CustomModal>
  );
}

