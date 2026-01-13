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
  PanResponder,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProperty } from "@/services/useProperty";
import { useWallet } from "@/services/useWallet";
import { useColorScheme } from "@/lib/useColorScheme";
import { useApp } from "@/contexts/AppContext";
import * as Linking from "expo-linking";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import PropertyChatbot from "@/components/chatbot/PropertyChatbot";
import { PropertyInvestmentCalculator } from "@/components/PropertyInvestmentCalculator";
import { useKycCheck } from "@/hooks/useKycCheck";
import { useAuth } from "@/contexts/AuthContext";
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import { PropertyToken } from '@/types/property';

// In the current backend, tokenPrice and minInvestment are already "real" prices.
// No more /10 scaling.
const getEffectiveTokenPrice = (tokenPrice: number) => tokenPrice;

const { width, height } = Dimensions.get("window");
// const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

// Interface for daily candle data from API
interface DailyCandle {
  date: string; // YYYY-MM-DD format
  propertyId: string;
  priceSource: 'base' | 'marketplace';
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  tradeCount: number;
}

// Helper Components
const GlassCard = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <BlurView intensity={20} tint="dark" style={[{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' }, style]}>
    {children}
  </BlurView>
);

const FeatureChip = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
  <GlassCard style={{ flex: 1, padding: 16, alignItems: 'center', minWidth: '30%' }}>
    <Ionicons name={icon as any} size={24} color="#FFFFFF" style={{ marginBottom: 8 }} />
    <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{value}</Text>
    {label ? <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{label}</Text> : null}
  </GlassCard>
);

const AmenityChip = ({ icon, name }: { icon: string; name: string }) => (
  <GlassCard style={{ flex: 1,  padding: 16, alignItems: 'center', minWidth: 50, maxWidth: '20px' }}>
    <Ionicons name={icon as any} size={24} color="#FFFFFF" style={{ marginBottom: 8 }} />
    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>{name}</Text>
  </GlassCard>
);

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { property, loading, error } = useProperty(id || "");
  const { balance } = useWallet();
  const { toggleBookmark, isBookmarked } = useApp();
  const [activeTab, setActiveTab] = useState<"Financials" | "Calculator" | "Documents" | "Location">("Financials");
  const [imageIndex, setImageIndex] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [initialInvestmentAmount, setInitialInvestmentAmount] = useState<number | null>(null);
  const [mapCoordinates, setMapCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PropertyToken | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isVerified, handleInvestPress } = useKycCheck();
  const { isGuest, exitGuestMode, isAuthenticated } = useAuth();

  const bookmarked = id ? isBookmarked(id) : false;

  // Tab swipe handler
  const tabs = ["Financials", "Calculator", "Documents", "Location"];
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentIndex = tabs.indexOf(activeTab);
        
        if (gestureState.dx > 50 && currentIndex > 0) {
          // Swipe right - go to previous tab
          setActiveTab(tabs[currentIndex - 1] as any);
        } else if (gestureState.dx < -50 && currentIndex < tabs.length - 1) {
          // Swipe left - go to next tab
          setActiveTab(tabs[currentIndex + 1] as any);
        }
      },
    })
  ).current;

  // Debug: Log tokens to see if they're being received (must be before any early returns)
  useEffect(() => {
    if (property) {
      console.log('[Property Detail] Property loaded:', property.title);
      console.log('[Property Detail] Property has tokens array?', Array.isArray(property.tokens));
      console.log('[Property Detail] Tokens count:', property.tokens?.length || 0);
      if (property.tokens && property.tokens.length > 0) {
        console.log('[Property Detail] All tokens:', property.tokens.map(t => ({ 
          id: t.id, 
          name: t.name, 
          symbol: t.tokenSymbol, 
          isActive: t.isActive,
          roi: t.expectedROI 
        })));
        const activeTokens = property.tokens.filter(t => t.isActive);
        console.log('[Property Detail] Active tokens:', activeTokens.length);
        console.log('[Property Detail] Active token details:', activeTokens.map(t => ({ 
          name: t.name, 
          symbol: t.tokenSymbol, 
          roi: t.expectedROI,
          price: t.pricePerTokenUSDT,
          available: t.availableTokens
        })));
      } else {
        console.log('[Property Detail] ⚠️ No tokens found in property object');
        console.log('[Property Detail] Property keys:', Object.keys(property));
        console.log('[Property Detail] Full property object:', JSON.stringify(property, null, 2).substring(0, 500));
      }
    }
  }, [property]);

  // Geocode property location to coordinates - run on mount for hero map
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!property || !property.location) {
        return;
      }

      try {
        const address = `${property.location}, ${property.city || ''}${property.country ? `, ${property.country}` : ''}`.trim();
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
          {
            headers: {
              'User-Agent': 'Blocks-App/1.0',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setMapCoordinates({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          });
          setGeocodingError(null);
        }
      } catch (error: any) {
        console.error("Geocoding error:", error);
        setGeocodingError(error.message || "Failed to geocode property location.");
        setMapCoordinates(null);
      }
    };

    if (property) {
      geocodeLocation();
    }
  }, [property]);

  // Get property images
  const propertyImages = property ? normalizePropertyImages(property.images || property.image) : [];
  const primaryImage = propertyImages[0] || property?.image || null;
  const getImageUrl = (img: string | undefined) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    // return `${API_BASE_URL}${img.startsWith('/') ? img : `/${img}`}`;
    return img;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1A12' }} className="items-center justify-center">
        <ActivityIndicator size="large" color="#9EDC5A" />
        <Text style={{ color: 'rgba(255,255,255,0.55)' }} className="mt-4 text-base">
          Loading property...
        </Text>
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1A12' }} className="items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.55)" />
        <Text style={{ color: 'rgba(255,255,255,0.55)' }} className="mt-4 text-base text-center">
          {error || "Property not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: '#9EDC5A', marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleInvest = () => {
    if(isGuest){
      exitGuestMode();
      return;
    }
    if (!property || !id) {
      Alert.alert("Error", "Property information not available");
      return;
    }

    handleInvestPress(() => {
      const params: any = {};
      if (initialInvestmentAmount) {
        params.initialInvestmentAmount = initialInvestmentAmount.toString();
      }
      // Pass selected token ID if a token is selected
      if (currentToken?.id) {
        params.tokenId = currentToken.id;
      }
      router.push({
        pathname: `/invest/${id}`,
        params,
      } as any);
    });
  };

  const handleBookmark = async () => {
    if (!id) return;
    try {
      await toggleBookmark(id);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!id || !property) return;

    try {
      const propertyUrl = Linking.createURL(`/property/${id}`);
      const shareMessage = `Check out ${property.title} - ${property.location}\n\nEstimated ROI: ${
        property.estimatedROI
      }%\nToken Price: $${getEffectiveTokenPrice(property.tokenPrice).toFixed(2)}\n\nView property: ${propertyUrl}`;

      if (Platform.OS === "web") {
        if ((navigator as any).share) {
          await (navigator as any).share({
            title: property.title,
            text: shareMessage,
            url: propertyUrl,
          });
        } else {
          await Clipboard.setStringAsync(shareMessage);
          Alert.alert("Copied!", "Property link copied to clipboard.");
        }
      } else {
        const result = await Share.share({
          message: shareMessage,
          title: property.title,
          url: propertyUrl,
        });

        if (result.action === Share.sharedAction) {
          console.log("Shared successfully");
        } else if (result.action === Share.dismissedAction) {
          console.log("Share dismissed");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      if (error instanceof Error && !error.message.includes("cancelled") && !error.message.includes("dismissed")) {
        Alert.alert("Error", "Failed to share property. Please try again.");
      }
    }
  };

  const handleDownloadPDF = async (docUrl: string, docName: string) => {
    try {
      setDownloadingDoc(docName);
      const canOpen = await Linking.canOpenURL(docUrl);
      if (canOpen) {
        try {
          await Linking.openURL(docUrl);
          return;
        } catch (openError) {
          console.log("Failed to open with default viewer, trying Google Drive...");
        }
      }
      const encodedUrl = encodeURIComponent(docUrl);
      const googleDriveViewerUrl = `https://drive.google.com/viewer?url=${encodedUrl}`;
      await WebBrowser.openBrowserAsync(googleDriveViewerUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        enableBarCollapsing: false,
        showTitle: true,
        toolbarColor: '#9EDC5A',
      });
    } catch (error: any) {
      console.error("Error opening PDF:", error);
      Alert.alert("Error", "Unable to open the PDF. Please check your internet connection and try again.", [
        { text: "OK" },
      ]);
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Calculate investment example
  const exampleInvestment = 1000;
  // Get all tokens (don't filter by isActive for now to debug)
  const allTokens = property?.tokens || [];
  const activeTokens = allTokens.filter(t => t.isActive !== false).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const defaultToken = activeTokens.length > 0 ? activeTokens[0] : null;
  
  // Debug: Log activeTokens calculation
  console.log('[Property Detail] activeTokens calculation:', {
    hasProperty: !!property,
    hasTokensProperty: 'tokens' in (property || {}),
    tokensArray: Array.isArray(property?.tokens),
    tokensLength: property?.tokens?.length || 0,
    activeTokensLength: activeTokens.length,
  });
  const currentToken = selectedToken || defaultToken;
  const tokenROI = currentToken?.expectedROI || property?.estimatedROI || 0;
  const tokenPrice = currentToken?.pricePerTokenUSDT || property?.tokenPrice || 0;
  const yearlyIncome = (exampleInvestment * tokenROI) / 100;
  const appreciationLevel = tokenROI >= 15 ? 'High' : tokenROI >= 10 ? 'Medium' : 'Low';
  
  // Calculate total tokens left and average ROI across all tokens
  const totalTokensLeft = activeTokens.length > 0 
    ? activeTokens.reduce((sum, token) => sum + (token.availableTokens || 0), 0)
    : 0;
  const averageROI = activeTokens.length > 0 
    ? activeTokens.reduce((sum, token) => sum + (token.expectedROI || 0), 0) / activeTokens.length 
    : (property?.estimatedROI || 0);

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.97)' }}>
      {/* Top Hero Section - Property Images */}
      <View style={{ height: height * 0.5, position: 'relative' }}>
        {propertyImages.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / width);
              setImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {propertyImages.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: getImageUrl(img) || undefined }}
                style={{ width: width, height: height * 0.5 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : primaryImage ? (
          <Image
            source={{ uri: getImageUrl(primaryImage) || undefined }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(158, 220, 90, 0.1)' }} />
        )}

        {/* Dark Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.64)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' }}
        />

        {/* Back Button */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>

       

        {/* Image Pagination Dots */}
        {propertyImages.length > 1 && (
          <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {propertyImages.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === imageIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: idx === imageIndex ? '#9EDC5A' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Bottom Sheet Overlay */}
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgb(22, 22, 22)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderBottomWidth: 0,
          marginTop: -20,
          paddingTop: 20,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header Row - Title and Heart */}
          <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }} numberOfLines={2}>
                  {property.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.55)" />
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginLeft: 6 }}>
                    {property.city || property.location}
                    {property.country ? `, ${property.country}` : ''}
                  </Text>
                   {/* Heart Button - Top Right */}
        <SafeAreaView style={{ position: 'absolute', top: -50, right: -15 }} edges={['top']}>
          <TouchableOpacity
            onPress={handleBookmark}
            style={{ margin: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons
              name={bookmarked ? "heart" : "heart-outline"}
              size={24}
              color={bookmarked ? "#FF6B35" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </SafeAreaView>

                </View>
              </View>
            </View>
          </View>

          {/* Image Thumbnails Row */}
          {propertyImages.length > 0 && (
            <View style={{ paddingHorizontal: 18, marginBottom: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {propertyImages.slice(0, 4).map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: getImageUrl(img) || undefined }}
                    style={{ width: 56, height: 56, borderRadius: 14 }}
                    resizeMode="cover"
                  />
                ))}
                {propertyImages.length > 4 && (
                  <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>+{propertyImages.length - 4}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Feature Chips Row */}
          {/* <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {property.features?.area && (
                <FeatureChip
                  icon="resize-outline"
                  value={`${property.features.area.toLocaleString()} sqm`}
                  label="Area"
                />
              )}
              {(property.features?.bedrooms || property.features?.bathrooms) && (
                <FeatureChip
                  icon="bed-outline"
                  value={`${property.features.bedrooms || 0}, ${property.features.bathrooms || 0}bath`}
                  label="Rooms"
                />
              )}
              <FeatureChip
                icon="car-outline"
                value={property.features?.units ? `${property.features.units} garage` : '2 garage'}
                label="Parking"
              />
              <FeatureChip
                icon="car-outline"
                value={property.features?.units ? `${property.features.units} garage` : '2 garage'}
                label="Parking"
              />
              <FeatureChip
                icon="car-outline"
                value={property.features?.units ? `${property.features.units} garage` : '2 garage'}
                label="Parking"
              />
            </View>
          </View> */}

          {/* Amenities Section */}
          {property.amenities && property.amenities.length > 0 && (
            <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Amenities</Text>
              {/* <GlassCard style={{ padding: 16 }}> */}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {property.amenities.map((amenity: string, index: number) => {
                    const getAmenityIcon = (name: string): string => {
                      const lowerName = name.toLowerCase();
                      if (lowerName.includes('pool') || lowerName.includes('swimming')) return 'water-outline';
                      if (lowerName.includes('gym') || lowerName.includes('gymnasium') || lowerName.includes('fitness')) return 'barbell-outline';
                      if (lowerName.includes('parking') || lowerName.includes('garage')) return 'car-outline';
                      if (lowerName.includes('security') || lowerName.includes('24/7')) return 'shield-checkmark-outline';
                      if (lowerName.includes('garden') || lowerName.includes('park')) return 'leaf-outline';
                      if (lowerName.includes('elevator') || lowerName.includes('lift')) return 'arrow-up-outline';
                      if (lowerName.includes('power') || lowerName.includes('backup')) return 'flash-outline';
                      if (lowerName.includes('water') || lowerName.includes('treatment')) return 'water-outline';
                      if (lowerName.includes('club') || lowerName.includes('house')) return 'home-outline';
                      if (lowerName.includes('playground') || lowerName.includes('play')) return 'happy-outline';
                      return 'star-outline';
                    };

                    return (
                      <AmenityChip
                        key={index}
                        icon={getAmenityIcon(amenity)}
                        name={amenity}
                      />
                    );
                  })}
                </ScrollView>
              {/* </GlassCard> */}
            </View>
          )}

          {/* Description Preview */}
          <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Description</Text>
            <Text
              style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 22 }}
              numberOfLines={3}
            >
              {property.description || 'No description available.'}
            </Text>
          </View>

          {/* Tabs with Swipe Support */}
          <View style={{ paddingHorizontal: 18, marginBottom: 20 }}>
            <View 
              style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.10)' }}
              {...panResponder.panHandlers}
            >
              {["Financials", "Calculator", "Documents", "Location"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as any)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: activeTab === tab ? 2 : 0,
                    borderBottomColor: activeTab === tab ? '#9EDC5A' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === tab ? '600' : '500',
                      color: activeTab === tab ? '#9EDC5A' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab Content */}
          <View style={{ paddingHorizontal: 18 }}>
          {activeTab === "Financials" && (
            <View>
              {/* Token Summary Cards - Show if tokens exist */}
              {activeTokens.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <GlassCard style={{ flex: 1, padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 152, 0, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="cube-outline" size={20} color="#FF9800" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>
                          Tokens Left
                        </Text>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>
                          {totalTokensLeft.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                  <GlassCard style={{ flex: 1, padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(156, 39, 176, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="trending-up-outline" size={20} color="#9C27B0" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>
                          ROI
                        </Text>
                        <Text style={{ color: '#9EDC5A', fontSize: 20, fontWeight: 'bold' }}>
                          {averageROI.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              )}

              {/* Token Tiers Section - Show all tokens */}
              {activeTokens.length > 0 && (
                <GlassCard style={{ padding: 20, marginBottom: 24 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                    Token Tiers
                  </Text>
                  <View style={{ gap: 12 }}>
                    {activeTokens.map((token) => (
                      <TouchableOpacity
                        key={token.id}
                        onPress={() => setSelectedToken(token)}
                        style={{
                          padding: 16,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: selectedToken?.id === token.id ? token.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: selectedToken?.id === token.id 
                            ? `${token.color}15` 
                            : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          {/* Token Symbol Badge */}
                          <View 
                            style={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: 12, 
                              backgroundColor: token.color,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }} 
                          >
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                              {token.tokenSymbol}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                              {token.name}
                            </Text>
                            {token.apartmentType && (
                              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                                {token.apartmentType}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                          <View style={{ flex: 1, minWidth: '45%' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>
                              Price
                            </Text>
                            <Text style={{ color: token.color, fontSize: 16, fontWeight: 'bold' }}>
                              ${token.pricePerTokenUSDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: '45%' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>
                              ROI
                            </Text>
                            <Text style={{ color: '#9EDC5A', fontSize: 16, fontWeight: 'bold' }}>
                              {token.expectedROI}%
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: '45%' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>
                              Available
                            </Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                              {token.availableTokens.toLocaleString()} / {token.totalTokens.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GlassCard>
              )}

              {/* Entry Anchor */}
              <GlassCard style={{ padding: 24, marginBottom: 24 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
                  Invest from ${property.minInvestment.toFixed(2)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>
                  Expected annual yield: {tokenROI}%
                  {currentToken && activeTokens.length > 0 && (
                    <Text style={{ color: currentToken.color, fontSize: 14, marginLeft: 8 }}>
                      ({currentToken.name})
                    </Text>
                  )}
                </Text>
                {currentToken && (
                  <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View 
                      style={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: 8, 
                        backgroundColor: currentToken.color,
                      }} 
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
                      Token Price: ${tokenPrice.toFixed(2)} | Available: {currentToken.availableTokens.toLocaleString()} tokens
                    </Text>
                  </View>
                )}
              </GlassCard>


              {/* Simple Return Explanation */}
              <GlassCard style={{ padding: 24, marginBottom: 24 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                  If you invest ${exampleInvestment.toLocaleString()}
                </Text>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 4 }}>Estimated yearly income</Text>
                  <Text style={{ color: '#9EDC5A', fontSize: 24, fontWeight: 'bold' }}>
                    ${yearlyIncome.toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 4 }}>Property appreciation</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                    {appreciationLevel}
                  </Text>
                </View>
              </GlassCard>

              {/* Trust Signals */}
              <GlassCard style={{ padding: 20, marginBottom: 24 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                  Developer / Builder
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {property.builder.logo ? (
                    <Image
                      source={{ uri: property.builder.logo }}
                      style={{ width: 64, height: 64, borderRadius: 32 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(158, 220, 90, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="business" size={32} color="#9EDC5A" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 }}>
                      {property.builder.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Ionicons name="star" size={16} color="#9EDC5A" />
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                        {property.builder.rating.toFixed(1)} Rating
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="rgba(255,255,255,0.55)" />
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                        {property.builder.projectsCompleted} {property.builder.projectsCompleted === 1 ? 'Project' : 'Projects'} Completed
                      </Text>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {/* Project Size & Ownership Model */}
              <GlassCard style={{ padding: 20 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 4 }}>Project Size</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                    {property.totalTokens.toLocaleString()} Tokens
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 4 }}>Ownership Model</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>
                    Tokenized Real Asset
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}

          {activeTab === "Calculator" && (
            <View style={{ marginBottom: 64 }}>
              <PropertyInvestmentCalculator
                property={property}
                colors={colors}
                isDarkColorScheme={isDarkColorScheme}
                onInvest={(investmentAmount) => {
                  setInitialInvestmentAmount(investmentAmount);
                  setActiveTab("Financials");
                  if (id) {
                    router.push({
                      pathname: `/invest/${id}`,
                      params: { initialInvestmentAmount: investmentAmount.toString() },
                    } as any);
                  }
                }}
              />
            </View>
          )}

          {activeTab === "Documents" && (
            <View style={{ marginBottom: 64 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
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
                  {property.documents.map((doc: any) => (
                    <GlassCard
                      key={doc.name}
                      style={{
                        width: width * 0.8,
                        marginRight: 16,
                        padding: 24,
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(158, 220, 90, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Ionicons name="document-text" size={42} color="#9EDC5A" />
                      </View>
                      <Text style={{ fontWeight: '700', color: '#FFFFFF', fontSize: 18, marginBottom: 8, textAlign: 'center' }} numberOfLines={2}>
                        {doc.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                        {doc.verified ? (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#9EDC5A" />
                            <Text style={{ fontSize: 12, color: '#9EDC5A', fontWeight: '600' }}>
                              Verified & On-Chain
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.55)" />
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Pending Verification</Text>
                          </>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
                        {doc.type} Document
                      </Text>
                      {doc.url ? (
                        <TouchableOpacity
                          onPress={() => handleDownloadPDF(doc.url!, doc.name)}
                          disabled={downloadingDoc === doc.name}
                          style={{
                            backgroundColor: downloadingDoc === doc.name ? 'rgba(158, 220, 90, 0.3)' : '#9EDC5A',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderRadius: 12,
                            width: '100%',
                            alignItems: 'center',
                            opacity: downloadingDoc === doc.name ? 0.6 : 1,
                          }}
                        >
                          {downloadingDoc === doc.name ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                                Download PDF
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontSize: 14 }}>
                            Document Not Available
                          </Text>
                        </View>
                      )}
                    </GlassCard>
                  ))}
                </ScrollView>
              ) : (
                <GlassCard style={{ padding: 32, alignItems: 'center' }}>
                  <Ionicons name="document-outline" size={48} color="rgba(255,255,255,0.55)" />
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                    No documents available for this property
                  </Text>
                </GlassCard>
              )}
            </View>
          )}

          {activeTab === "Location" && (
            <View style={{ marginBottom: 64 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
                Location
              </Text>
              
              <GlassCard style={{ padding: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ backgroundColor: 'rgba(158, 220, 90, 0.2)', padding: 12, borderRadius: 12 }}>
                    <Ionicons name="location" size={24} color="#9EDC5A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 }}>
                      {property.location}
                    </Text>
                    {(property.city || property.country) && (
                      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
                        {property.city}
                        {property.country ? `, ${property.country}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              </GlassCard>

              <View style={{ height: 300, width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#064E3B' }}>
                {!property.location && !property.city ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Ionicons name="map-outline" size={60} color="#9EDC5A" />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: 16, textAlign: 'center' }}>
                      Location not available
                    </Text>
                  </View>
                ) : geocodingError ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
                      Geocoding Failed
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 }}>
                      {geocodingError}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const address = `${property.location}, ${property.city}${property.country ? ', ' + property.country : ''}`;
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
                      }}
                      style={{ marginTop: 16, backgroundColor: '#9EDC5A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                        Open in Google Maps
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : mapCoordinates ? (
                  <View style={{ flex: 1, position: 'relative' }}>
                    {!mapError ? (
                      <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1, borderRadius: 16 }}
                        initialRegion={{
                          latitude: mapCoordinates.latitude,
                          longitude: mapCoordinates.longitude,
                          latitudeDelta: 0.008,
                          longitudeDelta: 0.008,
                        }}
                        mapType="standard"
                        showsUserLocation={false}
                        showsMyLocationButton={false}
                        showsCompass={true}
                        showsScale={false}
                        toolbarEnabled={false}
                        loadingEnabled={true}
                        loadingIndicatorColor="#9EDC5A"
                        loadingBackgroundColor="#064E3B"
                        pitchEnabled={true}
                        rotateEnabled={true}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        onMapReady={() => {
                          setIsMapReady(true);
                          setMapError(null);
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: mapCoordinates.latitude,
                            longitude: mapCoordinates.longitude,
                          }}
                          title={property.title}
                          description={property.location}
                        >
                          <View style={{ backgroundColor: '#FF6B35', borderRadius: 20, padding: 8, borderWidth: 3, borderColor: '#FFFFFF' }}>
                            <Ionicons name="location" size={24} color="#FFFFFF" />
                          </View>
                        </Marker>
                      </MapView>
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                        <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.55)" />
                        <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                          {mapError || "Google Maps failed to load"}
                        </Text>
                      </View>
                    )}
                    
                    {!mapError && mapCoordinates && (
                      <TouchableOpacity
                        onPress={() => {
                          const address = `${property.location}, ${property.city}${property.country ? ', ' + property.country : ''}`;
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 16,
                          left: 16,
                          right: 16,
                          backgroundColor: '#9EDC5A',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="navigate" size={18} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                          Open in Maps
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <ActivityIndicator size="large" color="#9EDC5A" />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                      Loading map coordinates...
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          </View>
        </ScrollView>

        {/* Bottom CTA Bar - Fixed at bottom of sheet */}
        <SafeAreaView edges={['bottom']}>
          <View
            style={{
              paddingHorizontal: 18,

              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 4 }}>From</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>
                ${property.minInvestment.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowChatbot(true)}
                style={{ padding: 8 }}
              >
                <Ionicons name="chatbubble-outline" size={22} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleInvest}
                style={{
                  backgroundColor: '#9EDC5A',
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                  borderRadius: 18,
                  minHeight: 48,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  {isVerified ? 'Invest' : isGuest ? 'Sign In' : 'Verify KYC'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
                <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

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