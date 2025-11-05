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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Trending');

  const filters = ['Trending', 'High Yield', 'New Listings', 'Completed'];

  const filteredProperties = mockProperties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-blocks-bg-dark' : 'bg-blocks-bg-light'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View
        className={`px-4 pt-12 pb-3 ${isDark ? 'bg-blocks-bg-dark/80' : 'bg-blocks-bg-light/80'}`}
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-teal items-center justify-center">
              <Text className="text-white font-bold text-lg">B</Text>
            </View>
            <View className="ml-3">
              <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                Hello,
              </Text>
              <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                Investor
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <MaterialIcons
              name="notifications-none"
              size={24}
              color={isDark ? '#E0E0E0' : '#1F2937'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          className={`flex-row items-center rounded-2xl px-4 py-3 shadow-sm ${
            isDark ? 'bg-blocks-card-dark' : 'bg-white'
          }`}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={isDark ? '#A9A9A9' : '#6B7280'}
          />
          <TextInput
            placeholder="Search by city, address..."
            placeholderTextColor={isDark ? '#A9A9A9' : '#6B7280'}
            className={`flex-1 ml-3 text-base ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}
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
        className={`px-5 py-2 rounded-full ${
          activeFilter === filter
            ? 'bg-teal'
            : isDark
            ? 'bg-transparent '
            : 'bg-white border border-gray-300'
        }`}
      >
        <Text
          className={`text-sm font-semibold ${
            activeFilter === filter
              ? 'text-white'
              : isDark
              ? 'text-blocks-text-dark'
              : 'text-blocks-text-light'
          }`}
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
            className={`mb-6 rounded-2xl overflow-hidden shadow-lg ${
              isDark ? 'bg-blocks-card-dark' : 'bg-white'
            }`}
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
              <View className="absolute top-4 left-4 bg-green-500/90 px-3 py-1.5 rounded-full">
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
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                {property.title}
              </Text>
              <Text className={`text-sm mb-3 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                PKR {(property.valuation / 1000000).toFixed(0)}M Valuation
              </Text>

              {/* Investment Info */}
              <View
                className={`flex-row justify-between items-center pt-3 border-t ${
                  isDark ? 'border-teal/20' : 'border-gray-200'
                }`}
              >
                <View>
                  <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Tokens from
                  </Text>
                  <Text className={`text-lg font-bold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                    ${property.tokenPrice.toFixed(2)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Est. Return
                  </Text>
                  <Text className="text-lg font-bold text-teal">
                    {property.estimatedROI}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="mt-3">
                <View className="flex-row justify-between mb-1.5">
                  <Text className={`text-xs ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
                    Funding Progress
                  </Text>
                  <Text className={`text-xs font-semibold ${isDark ? 'text-blocks-text-dark' : 'text-blocks-text-light'}`}>
                    {((property.soldTokens / property.totalTokens) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <View
                    className="h-2 rounded-full bg-teal"
                    style={{ width: `${(property.soldTokens / property.totalTokens) * 100}%` }}
                  />
                </View>
                <Text className={`text-xs mt-1.5 ${isDark ? 'text-blocks-text-dark-secondary' : 'text-blocks-text-secondary'}`}>
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

