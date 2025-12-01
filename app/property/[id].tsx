import React, { useState, useRef, useEffect } from "react";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProperty } from "@/services/useProperty";
import { useWallet } from "@/services/useWallet";
import { useColorScheme } from "@/lib/useColorScheme";
import { useApp } from "@/contexts/AppContext";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Location from "expo-location";
import InvestScreen from "@/app/invest/[id]";
import PropertyChatbot from "@/components/chatbot/PropertyChatbot";
import { PropertyInvestmentCalculator } from "@/components/PropertyInvestmentCalculator";

// Effective token price (divided by 10 for fractional investments)
const getEffectiveTokenPrice = (tokenPrice: number) => tokenPrice ;

const { width } = Dimensions.get("window");

interface PropertyLocationMapProps {
  property: any;
  colors: any;
  isDarkColorScheme?: boolean;
}

// Property Location Map Component
function PropertyLocationMap({ property, colors, isDarkColorScheme = false }: PropertyLocationMapProps) {
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      setIsLoading(true);
      setGeocodingError(null);

      try {
        // Web-based geocoding using OpenStreetMap Nominatim (no API key required, no permissions needed)
        const geocodeWithWebAPI = async (locationString: string): Promise<{ latitude: number; longitude: number } | null> => {
          try {
            const encodedLocation = encodeURIComponent(locationString);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`;
            
            console.log('🌐 Attempting web geocoding:', locationString);
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Blocks-Property-App/1.0', // Required by Nominatim
              },
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
              const { lat, lon } = data[0];
              const latitude = parseFloat(lat);
              const longitude = parseFloat(lon);
              console.log('✅ Web geocoding successful:', { latitude, longitude, locationString });
              return { latitude, longitude };
            }
            
            return null;
          } catch (error: any) {
            console.log(`⚠️ Web geocoding failed for "${locationString}":`, error?.message || error);
            return null;
          }
        };

        // Helper function to try geocoding with multiple location string variations
        const tryGeocode = async (locationStrings: string[]): Promise<{ latitude: number; longitude: number } | null> => {
          // First, try device-based geocoding (if permissions are available)
          for (const locationString of locationStrings) {
            if (!locationString || locationString.trim() === '') continue;
            
            try {
              // Check if we have permissions first
              const { status } = await Location.getForegroundPermissionsAsync();
              
              if (status === 'granted') {
                console.log('🔍 Attempting device geocoding:', locationString);
                const geocodeResult = await Location.geocodeAsync(locationString);
                
                if (geocodeResult && geocodeResult.length > 0) {
                  const { latitude, longitude } = geocodeResult[0];
                  console.log('✅ Device geocoding successful:', { latitude, longitude, locationString });
                  return { latitude, longitude };
                }
              }
            } catch (error: any) {
              // Permission denied or other error - will fall through to web geocoding
              console.log(`⚠️ Device geocoding unavailable for "${locationString}":`, error?.message || error);
            }
          }
          
          // If device geocoding fails or no permissions, try web-based geocoding
          for (const locationString of locationStrings) {
            if (!locationString || locationString.trim() === '') continue;
            
            const result = await geocodeWithWebAPI(locationString);
            if (result) {
              return result;
            }
          }
          
          return null;
        };

        // PRIORITY 1: Try to geocode with multiple location string variations
        const locationVariations: string[] = [];
        
        // Build multiple location string variations for better geocoding success
        if (property.location) {
          locationVariations.push(property.location); // Full location string (e.g., "DHA Phase 8, Karachi")
        }
        
        if (property.city) {
          // City with country
          if (property.country) {
            locationVariations.push(`${property.city}, ${property.country}`);
          }
          // City alone
          locationVariations.push(property.city);
          // City with default country if no country specified
          if (!property.country) {
            locationVariations.push(`${property.city}, Pakistan`);
          }
        }
        
        // Try geocoding with all variations
        const geocodeResult = await tryGeocode(locationVariations);
        
        if (geocodeResult) {
          setCoordinates({
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setIsLoading(false);
          return; // Success! Exit early
        }

        // PRIORITY 2: Use latitude/longitude if available
        if (property.latitude && property.longitude) {
          console.log('✅ Using direct coordinates:', property.latitude, property.longitude);
          setCoordinates({
            latitude: property.latitude,
            longitude: property.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setIsLoading(false);
          return;
        }

        // PRIORITY 3: No location data available - show placeholder
        console.warn('⚠️ No location data available after all attempts, showing placeholder');
        console.warn('Tried location variations:', locationVariations);
        setCoordinates(null);
        setGeocodingError('Unable to determine location coordinates');
        
      } catch (error: any) {
        console.error('❌ Error fetching coordinates:', error);
        console.error('Error details:', error?.message, error?.stack);
        // On error, show placeholder instead of default coordinates
        setCoordinates(null);
        setGeocodingError(error?.message || 'Failed to load location');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch coordinates (will use web geocoding if permissions not available)
    fetchCoordinates();
  }, [property]);

  const handleOpenInMaps = async () => {
    if (!coordinates) {
      Alert.alert('Error', 'Location coordinates not available');
      return;
    }

    const { latitude, longitude } = coordinates;
    const locationName = property.location || property.title || 'Property Location';
    
    let url: string;
    
    if (Platform.OS === 'ios') {
      // Apple Maps URL scheme
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(locationName)}`;
    } else {
      // Google Maps URL scheme for Android
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(locationName)})`;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web-based Google Maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Unable to open maps application');
    }
  };

  if (isLoading) {
    return (
      <View style={{ marginBottom: 64 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Location
        </Text>
        <View style={{ 
          height: 220, 
          width: '100%', 
          backgroundColor: colors.muted, 
          borderWidth: 1, 
          borderColor: colors.border, 
          borderRadius: 16, 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            Loading map...
          </Text>
        </View>
      </View>
    );
  }

  if (!coordinates) {
    return (
      <View style={{ marginBottom: 64 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Location
        </Text>
        
        {/* Beautiful Placeholder */}
        <View style={{ 
          height: 220, 
          width: '100%', 
          backgroundColor: colors.card, 
          borderWidth: 1, 
          borderColor: colors.border, 
          borderRadius: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: 24,
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Content */}
          <View style={{ alignItems: 'center', zIndex: 1 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isDarkColorScheme 
                ? 'rgba(59, 246, 159, 0.25)' 
                : 'rgba(59, 130, 246, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="map-outline" size={40} color={colors.primary} />
            </View>
            
            <Text style={{ 
              color: colors.textPrimary, 
              fontSize: 18, 
              fontWeight: '600',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {property.location || property.city || "Location"}
            </Text>
            
            <Text style={{ 
              color: colors.textSecondary, 
              fontSize: 14, 
              textAlign: 'center',
              marginBottom: 4
            }}>
              {property.city && property.country 
                ? `${property.city}, ${property.country}`
                : property.city || property.country || "Location details coming soon"
              }
            </Text>
            
            <View style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: isDarkColorScheme 
                ? 'rgba(59, 130, 246, 0.15)' 
                : 'rgba(59, 130, 246, 0.1)',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDarkColorScheme 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'rgba(59, 130, 246, 0.2)',
            }}>
              <Text style={{ 
                color: colors.primary, 
                fontSize: 12, 
                fontWeight: '500'
              }}>
                Map view unavailable
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 64 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Location
      </Text>
      
      {/* Map View */}
      <View style={{ 
        height: 220, 
        width: '100%', 
        borderWidth: 1, 
        borderColor: colors.border, 
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12
      }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={coordinates}
          region={coordinates}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
          mapType="standard"
        >
          <Marker
            coordinate={{
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }}
            title={property.title}
            description={property.location}
          />
        </MapView>
      </View>

      {/* Location Info and Open in Maps Button */}
      <View style={{ gap: 12 }}>
        <View style={{ 
          backgroundColor: colors.muted, 
          borderRadius: 12, 
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8
        }}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14 }}>
            {property.location || `${property.city}${property.country ? `, ${property.country}` : ''}`}
          </Text>
        </View>

        {geocodingError && (
          <View style={{ 
            backgroundColor: isDarkColorScheme ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
            borderWidth: 1,
            borderColor: colors.warning || colors.primary,
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.warning || colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>
              {geocodingError}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleOpenInMaps}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="map-outline" size={20} color={colors.primaryForeground || '#FFFFFF'} />
          <Text style={{ 
            color: colors.primaryForeground || '#FFFFFF', 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            Open in Maps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [initialInvestmentAmount, setInitialInvestmentAmount] = useState<number | null>(null);
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
    if (!property || !id) {
      Alert.alert('Error', 'Property information not available');
      return;
    }
    
    // Always open the invest modal - it will show insufficient balance message inline
    console.log('Opening invest modal for property:', property.title);
    setShowInvestModal(true);
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
      const shareMessage = `Check out ${property.title} - ${property.location}\n\nEstimated ROI: ${property.estimatedROI}%\nToken Price: $${getEffectiveTokenPrice(property.tokenPrice).toFixed(2)}\n\nView property: ${propertyUrl}`;
      
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

  const handleDownloadPDF = async (docUrl: string, docName: string) => {
    try {
      setDownloadingDoc(docName);
      
      // First, try to open with device's default PDF viewer using deep linking
      const canOpen = await Linking.canOpenURL(docUrl);
      
      if (canOpen) {
        try {
          // Try to open with OS default PDF viewer
          await Linking.openURL(docUrl);
          return; // Successfully opened, exit function
        } catch (openError) {
          console.log('Failed to open with default viewer, trying Google Drive...');
          // Continue to fallback
        }
      }
      
      // Fallback: Use Google Drive viewer
      const encodedUrl = encodeURIComponent(docUrl);
      const googleDriveViewerUrl = `https://drive.google.com/viewer?url=${encodedUrl}`;
      
      // Open in WebBrowser which will use Google Drive's viewer
      await WebBrowser.openBrowserAsync(googleDriveViewerUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        enableBarCollapsing: false,
        showTitle: true,
        toolbarColor: colors.primary,
      });
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      Alert.alert(
        'Error',
        'Unable to open the PDF. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingDoc(null);
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
                    source={{ 
                      uri: img || property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
                    }}
                    style={{ width, height: '100%' }}
                    resizeMode="cover"
                    defaultSource={require('@/assets/blank.png')}
                    onError={(error) => {
                      console.log('Image load error:', error.nativeEvent);
                    }}
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
          ) : property.image ? (
            <Image
              source={{ uri: property.image }}
              style={{ width, height: '100%' }}
              resizeMode="cover"
              defaultSource={require('@/assets/blank.png')}
              onError={(error) => {
                console.log('Fallback image load error:', error.nativeEvent);
              }}
            />
          ) : (
            <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.muted }}>
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
              className="bg-black/20 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            {/* <TouchableOpacity style={{
              backgroundColor: isDarkColorScheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)',
              padding: 8,
              borderRadius: 9999,
            }}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
            </TouchableOpacity> */}
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
                  ${getEffectiveTokenPrice(property.tokenPrice).toFixed(2)}
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
                ${getEffectiveTokenPrice((property.minInvestment)/10).toFixed(2)}
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
            {["Financials", "Calculator", "Documents", "Location"].map((tab) => (
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

              {/* Key Facts Section */}
              <View style={{ 
                backgroundColor: colors.card, 
                borderRadius: 16, 
                padding: 20, 
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                  Key Facts
                </Text>
                <View style={{ flexDirection: 'column', gap: 16 }}>
                  {property.valuation && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        padding: 10, 
                        borderRadius: 12 
                      }}>
                        <Ionicons name="cash-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Property Valuation</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                          {typeof property.valuation === 'number' 
                            ? `$${property.valuation.toLocaleString()}` 
                            : property.valuation}
                        </Text>
                      </View>
                    </View>
                  )}

                  {property.type && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        padding: 10, 
                        borderRadius: 12 
                      }}>
                        <Ionicons name="business-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Property Type</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                          {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {(property.city || property.country) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        padding: 10, 
                        borderRadius: 12 
                      }}>
                        <Ionicons name="globe-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Location</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                          {property.city}{property.country ? `, ${property.country}` : ''}
                        </Text>
                      </View>
                    </View>
                  )}

                  {property.completionDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        padding: 10, 
                        borderRadius: 12 
                      }}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Completion Date</Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                          {property.completionDate}
                        </Text>
                      </View>
                    </View>
                  )}

                  {property.slug && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ 
                        backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        padding: 10, 
                        borderRadius: 12 
                      }}>
                        <Ionicons name="prism-outline" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Slug</Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'monospace' }}>
                          {property.slug}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Amenities Section */}
              <View style={{ 
                backgroundColor: colors.card, 
                borderRadius: 16, 
                padding: 20, 
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                  Amenities
                </Text>
                {property.amenities && property.amenities.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {property.amenities.map((amenity, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: isDarkColorScheme 
                            ? 'rgba(59, 130, 246, 0.15)' 
                            : 'rgba(59, 130, 246, 0.1)',
                          borderWidth: 1,
                          borderColor: isDarkColorScheme 
                            ? 'rgba(59, 130, 246, 0.3)' 
                            : 'rgba(59, 130, 246, 0.2)',
                          borderRadius: 20,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '500' }}>
                          {amenity}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.textMuted, fontSize: 14, fontStyle: 'italic' }}>
                    No amenities listed
                  </Text>
                )}
              </View>

              {/* Property Features Section */}
              {(property.features?.bedrooms || 
                property.features?.bathrooms || 
                property.features?.area || 
                property.features?.floors || 
                property.features?.units) && (
                <View style={{ 
                  backgroundColor: colors.card, 
                  borderRadius: 16, 
                  padding: 20, 
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                    Property Features
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                    {property.features.bedrooms && (
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        <View style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="bed-outline" size={24} color={colors.primary} />
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
                            Bedrooms
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                            {property.features.bedrooms}
                          </Text>
                        </View>
                      </View>
                    )}

                    {property.features.bathrooms && (
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        <View style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="water-outline" size={24} color={colors.primary} />
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
                            Bathrooms
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                            {property.features.bathrooms}
                          </Text>
                        </View>
                      </View>
                    )}

                    {property.features.area && (
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        <View style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="resize-outline" size={24} color={colors.primary} />
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
                            Area
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                            {property.features.area.toLocaleString()} sq ft
                          </Text>
                        </View>
                      </View>
                    )}

                    {property.features.floors && (
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        <View style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="layers-outline" size={24} color={colors.primary} />
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
                            Floors
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                            {property.features.floors}
                          </Text>
                        </View>
                      </View>
                    )}

                    {property.features.units && (
                      <View style={{ flex: 1, minWidth: '45%' }}>
                        <View style={{ 
                          backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          borderRadius: 12,
                          padding: 16,
                          alignItems: 'center',
                        }}>
                          <Ionicons name="business-outline" size={24} color={colors.primary} />
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8, marginBottom: 4 }}>
                            Units
                          </Text>
                          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
                            {property.features.units}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Developer / Builder Info Section */}
              <View style={{ 
                backgroundColor: colors.card, 
                borderRadius: 16, 
                padding: 20, 
                marginBottom: 24,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                  Developer / Builder
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {property.builder.logo ? (
                    <Image
                      source={{ uri: property.builder.logo }}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: colors.muted,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: isDarkColorScheme ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Ionicons name="business" size={32} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 }}>
                      {property.builder.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Ionicons name="star" size={16} color={colors.primary} />
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {property.builder.rating.toFixed(1)} Rating
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                        {property.builder.projectsCompleted} {property.builder.projectsCompleted === 1 ? 'Project' : 'Projects'} Completed
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {activeTab === "Calculator" && (
            <View style={{ marginBottom: 64 }}>
              <PropertyInvestmentCalculator
                property={property}
                colors={colors}
                isDarkColorScheme={isDarkColorScheme}
                onInvest={(investmentAmount) => {
                  // Store the calculated investment amount
                  setInitialInvestmentAmount(investmentAmount);
                  // Close calculator tab and open invest modal
                  setActiveTab("Financials");
                  setShowInvestModal(true);
                }}
              />
            </View>
          )}

          {activeTab === "Documents" && (
            <View style={{ marginBottom: 64 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                Documents & Verification
              </Text>
              {property.documents && property.documents.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width * 0.8 + 16}
                  decelerationRate="fast"
                  contentContainerStyle={{ 
                    paddingHorizontal: (width - width * 0.8) / 2,
                    paddingRight: (width - width * 0.8) / 2 + 16,
                  }}
                  style={{ marginHorizontal: -16 }}
                >
                  {property.documents.map((doc, index) => (
                    <View
                      key={doc.name}
                      style={{
                        width: width * 0.8,
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: doc.verified 
                          ? (isDarkColorScheme ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                          : colors.border,
                        marginRight: 16,
                        padding: 24,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                        alignItems: 'center',
                        marginBottom: 64,
                      }}
                    >
                      <View
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 40,
                          backgroundColor: isDarkColorScheme
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(16, 185, 129, 0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 16,
                        }}
                      >
                        <Ionicons
                          name="document-text"
                          size={42}
                          color={colors.primary}
                        />
                      </View>
                      <Text 
                        style={{ 
                          fontWeight: '700', 
                          color: colors.textPrimary, 
                          fontSize: 18,
                          marginBottom: 8,
                          textAlign: 'center',
                        }}
                        numberOfLines={2}
                      >
                        {doc.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 16,
                        }}
                      >
                        {doc.verified ? (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                              Verified & On-Chain
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                            <Text style={{ fontSize: 12, color: colors.textMuted }}>
                              Pending Verification
                            </Text>
                          </>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 20 }}>
                        {doc.type} Document
                      </Text>
                      {doc.url ? (
                        <TouchableOpacity
                          onPress={() => handleDownloadPDF(doc.url!, doc.name)}
                          disabled={downloadingDoc === doc.name}
                          style={{
                            backgroundColor: downloadingDoc === doc.name ? colors.muted : colors.primary,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                            width: '100%',
                            alignItems: 'center',
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: downloadingDoc === doc.name ? 0 : 0.3,
                            shadowRadius: 4,
                            elevation: downloadingDoc === doc.name ? 0 : 3,
                            opacity: downloadingDoc === doc.name ? 0.6 : 1,
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {downloadingDoc === doc.name ? (
                              <>
                                <ActivityIndicator size="small" color={colors.primaryForeground} />
                                <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 15 }}>
                                  Downloading...
                                </Text>
                              </>
                            ) : (
                              <>
                                <Ionicons name="download-outline" size={18} color={colors.primaryForeground} />
                                <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 15 }}>
                                  Download PDF
                                </Text>
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={{
                            backgroundColor: colors.muted,
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                            width: '100%',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 14 }}>
                            Document Not Available
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="document-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                    No documents available for this property
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "Location" && (
            <PropertyLocationMap property={property} colors={colors} isDarkColorScheme={isDarkColorScheme} />
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
        // paddingBottom: 50,
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
      {showInvestModal && id && property && (
        <InvestScreen 
          propertyId={id} 
          initialInvestmentAmount={initialInvestmentAmount || undefined}
          onClose={() => {
            console.log('Closing invest modal');
            setShowInvestModal(false);
            setInitialInvestmentAmount(null); // Reset initial amount
          }} 
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
