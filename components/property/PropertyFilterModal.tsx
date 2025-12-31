import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Slider from '@react-native-community/slider';

const { height } = Dimensions.get('window');
const SCREEN_HEIGHT = height;

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'roi-high';

export interface PropertyFilterState {
  sortBy: SortOption;
  tokenPriceRange: [number, number]; // Keep for backward compatibility, but use tokenPriceValue
  tokenPriceValue: number | null; // Single investment amount
  roiRange: [number, number]; // Keep for backward compatibility, but use roiValue
  roiValue: number | null; // Single ROI target
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
  minROI: number;
  maxROI: number;
  availableCities: string[];
  availablePropertyTypes: string[];
}

export default function PropertyFilterModal({
  visible,
  onClose,
  filterState,
  onFilterChange,
  onClearFilters,
  minTokenPrice,
  maxTokenPrice,
  minROI,
  maxROI,
  availableCities,
  availablePropertyTypes,
}: PropertyFilterModalProps) {
  const {
    sortBy,
    tokenPriceRange,
    tokenPriceValue,
    roiRange,
    roiValue,
    selectedPropertyTypes,
    selectedLocations,
    activeOnly,
  } = filterState;

  // Use slider values, defaulting to middle of range if not set
  // These are just for display - filter only applies when user explicitly sets a value
  const currentTokenPriceValue = tokenPriceValue ?? (minTokenPrice + maxTokenPrice) / 2;
  const currentROIValue = roiValue ?? (minROI + maxROI) / 2;
  
  // Track if user has interacted with sliders
  const [hasSetTokenValue, setHasSetTokenValue] = useState(tokenPriceValue !== null);
  const [hasSetROIValue, setHasSetROIValue] = useState(roiValue !== null);
  
  // Sync interaction state when filter state changes
  useEffect(() => {
    setHasSetTokenValue(tokenPriceValue !== null);
    setHasSetROIValue(roiValue !== null);
  }, [tokenPriceValue, roiValue]);

  const updateFilter = (updates: Partial<PropertyFilterState>) => {
    onFilterChange({ ...filterState, ...updates });
  };

  const handleClearFilters = () => {
    setHasSetTokenValue(false);
    setHasSetROIValue(false);
    onClearFilters();
  };

  return (
    <Modal
      isVisible={visible}
      onSwipeComplete={onClose}
      swipeDirection="down"
      propagateSwipe={false}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      avoidKeyboard={true}
      onBackdropPress={onClose}
      swipeThreshold={50}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriverForBackdrop={true}
      scrollTo={null}
      scrollOffset={0}
      scrollOffsetMax={400}
    >
      <View
        style={{
          height: SCREEN_HEIGHT * 0.88,
          backgroundColor: 'rgba(22, 22, 22, 1)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <View
          style={{
            height: 40,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <View
            style={{
              height: 6,
              width: 40,
              borderRadius: 3,
              backgroundColor: '#E5E5E5',
            }}
          />
        </View>

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

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          bounces={true}
          scrollEventThrottle={16}
        >
          {/* Sort By Section */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
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
                    backgroundColor: sortBy === option.value ? '#9EDC5A' : '#F5F5F5',
                    borderWidth: sortBy === option.value ? 0 : 1,
                    borderColor: '#E0E0E0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: sortBy === option.value ? '600' : '400',
                      color: sortBy === option.value ? 'rgb(32, 32, 32)' : 'rgba(0, 0, 0, 0.98)',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Investment Amount Section */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Investment Amount
            </Text>
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '700', color: hasSetTokenValue ? '#9EDC5A' : 'rgba(255, 255, 255, 0.5)', marginBottom: 4 }}>
                ${currentTokenPriceValue.toFixed(0)}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                {hasSetTokenValue ? 'Investment amount set' : 'Drag to set your investment amount'}
              </Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={minTokenPrice}
              maximumValue={maxTokenPrice}
              value={currentTokenPriceValue}
              onValueChange={(value) => {
                setHasSetTokenValue(true);
                updateFilter({ tokenPriceValue: value });
              }}
              step={10}
              minimumTrackTintColor="#9EDC5A"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#9EDC5A"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                ${minTokenPrice.toFixed(0)}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                ${maxTokenPrice.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Target ROI Section */}
          <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 }}>
              Target ROI
            </Text>
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: '700', color: hasSetROIValue ? '#9EDC5A' : 'rgba(255, 255, 255, 0.5)', marginBottom: 4 }}>
                {currentROIValue.toFixed(1)}%
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
                {hasSetROIValue ? 'Target ROI set' : 'Drag to set your target ROI'}
              </Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={minROI}
              maximumValue={maxROI}
              value={currentROIValue}
              onValueChange={(value) => {
                setHasSetROIValue(true);
                updateFilter({ roiValue: value });
              }}
              step={0.1}
              minimumTrackTintColor="#9EDC5A"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#9EDC5A"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {minROI.toFixed(1)}%
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {maxROI.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Property Type Section */}
          {availablePropertyTypes.length > 0 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
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
            <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
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
              paddingHorizontal: 20,
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
        </ScrollView>

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
              backgroundColor: '#F5F5F5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#666666' }}>
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
      </View>
    </Modal>
  );
}

