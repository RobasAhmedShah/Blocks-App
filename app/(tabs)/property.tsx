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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { mockProperties } from '@/data/mockProperties';
import { propertyFilters } from '@/data/mockCommon';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<typeof propertyFilters[number]>('Trending');

  const filters = propertyFilters;

  const filteredProperties = mockProperties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase())
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
          <View className="flex-row items-center">
            <View style={{ backgroundColor: colors.primary }} className="w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-white font-bold text-lg">B</Text>
            </View>
            <View className="ml-3">
              <Text style={{ color: colors.textSecondary }} className="text-xs">
                Hello,
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                Investor
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <MaterialIcons
              name="notifications-none"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={{ backgroundColor: colors.card }}
          className="flex-row items-center rounded-2xl px-4 py-3 shadow-sm"
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
<View className=" mx-auto">
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
      >
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
                source={{ uri: property.images[0] }}
                className="w-full h-56"
                resizeMode="cover"
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
              {/* Bookmark */}
              <TouchableOpacity className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur items-center justify-center">
                <MaterialIcons name="bookmark-border" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Property Details */}
            <View className="p-4">
              <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
                {property.title}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mb-3">
                PKR {((typeof property.valuation === 'number' ? property.valuation : parseFloat(String(property.valuation).replace(/[^0-9.]/g, ''))) / 1000000).toFixed(0)}M Valuation
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
                      width: `${(property.soldTokens / property.totalTokens) * 100}%`
                    }}
                    className="h-2 rounded-full"
                  />
                </View>
                <Text style={{ color: colors.textSecondary }} className="text-xs mt-1.5">
                  {property.soldTokens} / {property.totalTokens} Tokens
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

