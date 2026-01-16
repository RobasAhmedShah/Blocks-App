import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { marketplaceAPI, MarketplaceListing } from '@/services/api/marketplace.api';
import { AppAlert } from '@/components/AppAlert';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import { authApi } from '@/services/api/auth.api';
import * as SecureStore from 'expo-secure-store';
import { BuyTokenModal } from '@/components/marketplace/BuyTokenModal';
import { SimpleLineGraph, LineGraphDataPoint } from '@/components/portfolio/SimpleLineGraph';
import { apiClient } from '@/services/api/apiClient';
// Temporarily disable WebSocket to prevent socket.io-client crash
// TODO: Re-enable once socket.io-client polyfill is properly configured
// import { useWebSocket } from '@/services/websocket/useWebSocket';
import { useFocusEffect } from 'expo-router';

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id, propertyListings } = useLocalSearchParams<{ id: string; propertyListings?: string }>();
  const { colors, isDarkColorScheme } = useColorScheme();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [candlesData, setCandlesData] = useState<LineGraphDataPoint[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [allPropertyListings, setAllPropertyListings] = useState<MarketplaceListing[]>([]);
  
  // Parse property listings from params
  React.useEffect(() => {
    if (propertyListings) {
      try {
        const parsed = JSON.parse(propertyListings) as MarketplaceListing[];
        setAllPropertyListings(parsed);
      } catch (error) {
        console.error('Failed to parse property listings:', error);
        setAllPropertyListings([]);
      }
    }
  }, [propertyListings]);

  // WebSocket connection for real-time price updates
  // Temporarily disabled to prevent socket.io-client crash
  // TODO: Re-enable once socket.io-client polyfill is properly configured
  const isConnected = false;
  const subscribe = (_event: string, _callback: (...args: any[]) => void) => () => {};
  const emit = (_event: string, _data?: any) => {};
  // const { isConnected, subscribe, emit } = useWebSocket({
  //   enabled: true, // Always enabled if user is authenticated (handled by hook)
  //   onConnect: () => {
  //     console.log('[Marketplace] WebSocket connected');
  //   },
  //   onDisconnect: () => {
  //     console.log('[Marketplace] WebSocket disconnected');
  //   },
  //   onError: (error) => {
  //     console.error('[Marketplace] WebSocket error:', error);
  //   },
  // });


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

  // Check if this is the user's own listing
  const isOwnListing = listing && currentUserId && listing.sellerId === currentUserId;
  
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
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (id) {
      loadListing();
    }
    loadCurrentUser();
  }, [id]);

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

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await marketplaceAPI.getListing(id as string);
      setListing(data);
      
      // If property listings weren't passed via params, fetch all listings for this property
      if (!propertyListings && data.propertyId) {
        try {
          const response = await marketplaceAPI.getListings({
            propertyId: data.propertyId,
            sortBy: 'price_asc',
            limit: 100,
          });
          setAllPropertyListings(response.listings);
        } catch (err) {
          console.error('Failed to load property listings:', err);
        }
      }
    } catch (error: any) {
      setAlertState({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to load listing',
        type: 'error',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
          router.back();
        },
      });
    } finally {
      setLoading(false);
    }
  };

    // Fetch daily candles data for the property
    useEffect(() => {
      const fetchDailyCandles = async () => {
        // Wait for listing to be loaded to get property ID
        if (!listing || !listing.property?.id) return;
  
        try {
          setLoadingCandles(true);
          // Use property ID from listing, not the listing ID
          const propertyId = listing.property.id;
          const candles: DailyCandle[] = await apiClient.get<DailyCandle[]>(
            `/api/mobile/price-history/candles/${propertyId}?priceSource=marketplace`
          );
  
          // Transform candles data: use close price for each day
          const transformedData: LineGraphDataPoint[] = candles.map((candle) => {
            return {
              date: new Date(candle.date), // Convert YYYY-MM-DD string to Date
              value: candle.closePrice,
              volume: candle.volume,
            };
          });
  
          // Sort by date to ensure chronological order
          transformedData.sort((a, b) => a.date.getTime() - b.date.getTime());
  
          setCandlesData(transformedData);
        } catch (error) {
          console.error('Error fetching daily candles:', error);
          // On error, set empty array (graph will show "No data available")
          setCandlesData([]);
        } finally {
          setLoadingCandles(false);
        }
      };
  
      fetchDailyCandles();
    }, [listing]); // Depend on listing instead of id

  // WebSocket subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to property price updates via WebSocket when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Wait for listing and WebSocket connection
      if (!listing || !listing.property?.id || !isConnected) {
        return;
      }

      // Already subscribed, skip
      if (isSubscribed) {
        return;
      }

      const propertyId = listing.property.id;
      console.log('[Marketplace] Subscribing to property updates:', propertyId);

      // Subscribe to property room
      emit('subscribe:property', { propertyId });

      // Listen for candle updates
      const unsubscribe = subscribe('candle:updated', (data: {
        propertyId: string;
        candle: {
          date: string | Date;
          openPrice: number;
          highPrice: number;
          lowPrice: number;
          closePrice: number;
          volume: number;
          tradeCount: number;
        };
        timestamp: Date;
      }) => {
        // Only process updates for current property
        if (data.propertyId !== propertyId) {
          return;
        }

        console.log('[Marketplace] Received candle update:', data);

        // Update the candles data with the new candle
        setCandlesData((prevData) => {
          const candleDate = new Date(data.candle.date);
          const candleDateStr = candleDate.toISOString().split('T')[0]; // YYYY-MM-DD

          // Check if candle for this date already exists
          const existingIndex = prevData.findIndex(
            (item) => item.date.toISOString().split('T')[0] === candleDateStr
          );

          const newCandle: LineGraphDataPoint = {
            date: candleDate,
            value: data.candle.closePrice,
            volume: data.candle.volume,
          };

          if (existingIndex >= 0) {
            // Update existing candle
            const updated = [...prevData];
            updated[existingIndex] = newCandle;
            return updated.sort((a, b) => a.date.getTime() - b.date.getTime());
          } else {
            // Add new candle
            const updated = [...prevData, newCandle];
            return updated.sort((a, b) => a.date.getTime() - b.date.getTime());
          }
        });
      });

      unsubscribeRef.current = unsubscribe;
      setIsSubscribed(true);

      // Cleanup: unsubscribe when screen loses focus
      return () => {
        console.log('[Marketplace] Unsubscribing from property updates:', propertyId);
        emit('unsubscribe:property', { propertyId });
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setIsSubscribed(false);
      };
    }, [listing, isConnected, subscribe, emit, isSubscribed])
  );

  // Handle connection state changes (re-subscribe if connection is restored)
  useEffect(() => {
    if (isConnected && listing?.property?.id && !isSubscribed) {
      // Connection restored, trigger re-subscription via focus effect
      // This will be handled by the useFocusEffect above
    }
  }, [isConnected, listing, isSubscribed]);

  const handleUnpublish = async () => {
    if (!listing) return;

    // Check if listing is active before allowing unpublish
    if (listing.status !== 'active') {
      setAlertState({
        visible: true,
        title: 'Cannot Unpublish',
        message: `This listing is already ${listing.status}. Only active listings can be unpublished.`,
        type: 'error',
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, visible: false }));
        },
      });
      return;
    }

    // Show confirmation alert
    setAlertState({
      visible: true,
      title: 'Unpublish Listing?',
      message: 'Are you sure you want to remove this listing from the marketplace? Your tokens will be unlocked and available for sale again.',
      type: 'warning',
      onConfirm: async () => {
        setAlertState((prev) => ({ ...prev, visible: false }));
        setIsProcessing(true);
        try {
          await marketplaceAPI.cancelListing(listing.id);
          setAlertState({
            visible: true,
            title: 'Listing Unpublished',
            message: 'Your listing has been removed from the marketplace successfully.',
            type: 'success',
            onConfirm: () => {
              setAlertState((prev) => ({ ...prev, visible: false }));
              router.back();
            },
          });
        } catch (error: any) {
          // Extract error message from response
          let errorMessage = 'Failed to unpublish listing';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.response) {
            try {
              const errorData = await error.response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = `HTTP ${error.response.status}`;
            }
          }
          
          setAlertState({
            visible: true,
            title: 'Unpublish Failed',
            message: errorMessage,
            type: 'error',
            onConfirm: () => {
              setAlertState((prev) => ({ ...prev, visible: false }));
            },
          });
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <MaterialIcons name="error-outline" size={64} color={colors.textMuted} />
        <Text style={{ color: colors.textPrimary }} className="text-lg font-semibold mt-4">
          Listing not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#ffffff' }} className="font-semibold">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const propertyImage = listing ? getPropertyImageUrl(listing.property.images) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Property Image Header */}
        {propertyImage ? (
          <Image
            source={{ uri: propertyImage }}
            style={{ width: '100%', height: 300 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 300,
              backgroundColor: colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="home" size={64} color={colors.primary} />
          </View>
        )}

        {/* Back Button Overlay */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Content */}
        <View className="px-4 py-6">
          {/* Property Title */}
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{ color: colors.textPrimary }}
              className="text-2xl font-bold flex-1"
            >
              {listing.property.title}
            </Text>
          </View>

          {/* Location */}
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-sm ml-1">
              {listing.property.city || 'Location'} • {listing.property.displayCode}
            </Text>
          </View>

          {/* Status Badge */}
          {listing.status !== 'active' && (
            <View
              style={{
                backgroundColor: listing.status === 'sold' 
                  ? '#10b981' 
                  : colors.textMuted,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginBottom: 16,
                alignItems: 'center',
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons 
                  name={listing.status === 'sold' ? 'check-circle' : 'cancel'} 
                  size={20} 
                  color="#ffffff" 
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: '#ffffff' }} className="font-bold text-base">
                  {listing.status === 'sold' ? 'Sold' : 'Unpublished'}
                </Text>
              </View>
            </View>
          )}

          {/* Price Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                  Price per Token
                </Text>
                <Text style={{ color: colors.primary }} className="text-3xl font-bold">
                  ${listing.pricePerToken.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  // backgroundColor: colors.primary + '20',
                  borderWidth: 1,
                  borderColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: colors.primary }} className="font-bold text-lg">
                  {listing.property.expectedROI}% APY
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 16,
              }}
            />

            <View className="flex-row justify-between">
              <Text style={{ color: colors.textMuted }} className="text-sm">
                Available Tokens
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                {listing.remainingTokens.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Price Tiers Component */}
          {allPropertyListings.length > 0 && (() => {
            // Group listings by price and sort
            const priceGroups = new Map<number, MarketplaceListing[]>();
            allPropertyListings.forEach((listing) => {
              const price = listing.pricePerToken;
              if (!priceGroups.has(price)) {
                priceGroups.set(price, []);
              }
              priceGroups.get(price)!.push(listing);
            });

            // Sort prices from low to high
            const sortedPrices = Array.from(priceGroups.keys()).sort((a, b) => a - b);
            
            // Get top 5 prices
            const top5Prices = sortedPrices.slice(0, 5);
            const sixthAndAbove = sortedPrices.slice(5);

            // Calculate combined tokens for 6th+ prices
            const combinedTokens = sixthAndAbove.reduce((sum, price) => {
              const listingsAtPrice = priceGroups.get(price) || [];
              return sum + listingsAtPrice.reduce((s, l) => s + l.remainingTokens, 0);
            }, 0);

            // Get the 6th lowest price (or null if less than 6 prices)
            const sixthLowestPrice = sortedPrices[5] || null;

            return (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
                  Available Prices
                </Text>
                
                {/* Top 5 Prices */}
                {top5Prices.map((price, index) => {
                  const listingsAtPrice = priceGroups.get(price) || [];
                  const totalTokens = listingsAtPrice.reduce((sum, l) => sum + l.remainingTokens, 0);
                  
                  return (
                    <View
                      key={price}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: index < top5Prices.length - 1 || sixthLowestPrice ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View>
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          Price Tier {index + 1}
                        </Text>
                        <Text style={{ color: colors.primary }} className="text-base font-bold">
                          ${price.toFixed(2)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          Available
                        </Text>
                        <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                          {totalTokens.toFixed(2)} tokens
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* 6th+ Combined Entry */}
                {sixthLowestPrice && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingTop: 16,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Price Tier 6+
                      </Text>
                      <Text style={{ color: colors.primary }} className="text-base font-bold">
                        ${sixthLowestPrice.toFixed(2)}+
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Available
                      </Text>
                      <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                        {combinedTokens.toFixed(2)} tokens
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Expected Returns Card */}
          {(() => {
            const roi = listing.property.expectedROI || 0;
            const pricePerToken = listing.pricePerToken;
            const tokens = listing.remainingTokens;
            const investmentValue = pricePerToken * tokens;
            const annualReturn = (roi / 100) * investmentValue;
            const monthlyReturn = annualReturn / 12;
            const dailyReturn = annualReturn / 365;

            return (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
                  Expected Returns
                </Text>
                
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{
                        backgroundColor: isDarkColorScheme ? 'rgba(45, 204, 98, 0.84)' : colors.primary + '80',
                        borderRadius: 10,
                        padding: 10,
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Daily Return
                      </Text>
                      <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                        ${dailyReturn.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{
                        backgroundColor: colors.primary + '20',
                        borderRadius: 10,
                        padding: 10,
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar" size={20} color={colors.textPrimary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Monthly Return
                      </Text>
                      <Text style={{ color: colors.textPrimary }} className="text-base font-bold">
                        ${monthlyReturn.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{
                        backgroundColor: colors.primary + '20',
                        borderRadius: 10,
                        padding: 10,
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar-sharp" size={20} color={colors.textPrimary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Annual Return
                      </Text>
                      <Text style={{ color: colors.primary }} className="text-base font-bold">
                        ${annualReturn.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginVertical: 12,
                  }}
                />

                <View className="flex-row justify-between items-center">
                  <Text style={{ color: colors.textMuted }} className="text-sm">
                    Total Investment Value
                  </Text>
                  <Text style={{ color: colors.primary }} className="text-lg font-bold">
                    ${investmentValue.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Performance Visualization */}
          <View 
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {loadingCandles ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#9EDC5A" />
                <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 8, fontSize: 12 }}>
                  Loading price data...
                </Text>
              </View>
            ) : (
              <>
              <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                Avg Token prices
                </Text>
              <SimpleLineGraph 
                data={candlesData.length > 0 ? candlesData : []}
                lineColor={colors.primary}
                gradientColor={colors.primary}
              />
              </>
            )}
          </View>


          {/* ROI Projection Mini Chart */}
          {(() => {
            const years = [1, 2, 3, 4, 5];
            const baseROI = listing.property.expectedROI || 0;
            const pricePerToken = listing.pricePerToken;
            
            const projections = years.map((year) => {
              const annualReturn = (baseROI / 100) * pricePerToken;
              const totalReturn = annualReturn * year;
              const projectedValue = pricePerToken + totalReturn;
              const roiPercentage = ((projectedValue - pricePerToken) / pricePerToken) * 100;
              
              return {
                year,
                projectedValue,
                roiPercentage,
              };
            });

            const maxValue = Math.max(...projections.map(p => p.projectedValue), pricePerToken);
            const chartData = projections.map((projection) => ({
              ...projection,
              height: (projection.projectedValue / maxValue) * 100,
            }));

            return (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
                  5-Year ROI Projection
                </Text>
                
                {/* Mini Chart */}
                <View
                  style={{
                    height: 140,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 8,
                  }}
                >
                  {chartData.map((data, index) => (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        marginHorizontal: 2,
                      }}
                    >
                      <View
                        style={{
                          width: '100%',
                          height: `${data.height}%`,
                          backgroundColor: colors.primary,
                          borderRadius: 6,
                          minHeight: 20,
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          paddingBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: '#ffffff',
                            fontSize: 9,
                            fontWeight: 'bold',
                          }}
                          numberOfLines={1}
                        >
                          ${data.projectedValue.toFixed(0)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 10,
                          marginTop: 6,
                          fontWeight: '600',
                        }}
                      >
                        Y{data.year}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Projection Summary */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  {projections.map((projection, index) => (
                    <View key={index} style={{ alignItems: 'center' }}>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Year {projection.year}
                      </Text>
                      <Text style={{ color: colors.primary }} className="text-sm font-bold">
                        +{projection.roiPercentage.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* 5-Year Projection Table */}
          {(() => {
            const years = [1, 2, 3, 4, 5];
            const baseROI = listing.property.expectedROI || 0;
            const pricePerToken = listing.pricePerToken;
            
            const projections = years.map((year) => {
              const annualReturn = (baseROI / 100) * pricePerToken;
              const totalReturn = annualReturn * year;
              const projectedValue = pricePerToken + totalReturn;
              const roiPercentage = ((projectedValue - pricePerToken) / pricePerToken) * 100;
              
              return {
                year,
                projectedValue,
                roiPercentage,
              };
            });

            return (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
                  5-Year Projection Details
                </Text>
                {projections.map((projection, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: index < projections.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        Year {projection.year}
                      </Text>
                      <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                        ${projection.projectedValue.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.textMuted }} className="text-xs">
                        ROI
                      </Text>
                      <Text style={{ color: colors.primary }} className="text-base font-bold">
                        +{projection.roiPercentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Investment Metrics Card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-4">
              Investment Metrics
            </Text>
            
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                  Expected ROI (APY)
                </Text>
                <Text style={{ color: colors.primary }} className="text-base font-bold">
                  {listing.property.expectedROI}%
                </Text>
              </View>
              <View className="flex-1" style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                  Token Price
                </Text>
                <Text style={{ color: colors.textPrimary }} className="text-base font-semibold">
                  ${listing.pricePerToken.toFixed(2)}
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 12,
              }}
            />



            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textMuted }} className="text-sm">
                Available Tokens
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                {listing.remainingTokens.toFixed(2)} tokens
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textMuted }} className="text-sm">
                Property Code
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                {listing.property.displayCode}
              </Text>
            </View>

          

            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textMuted }} className="text-sm">
                Minimum Order
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                ${listing.minOrderUSDT.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text style={{ color: colors.textMuted }} className="text-sm">
                Maximum Order
              </Text>
              <Text style={{ color: colors.textPrimary }} className="text-sm font-semibold">
                ${listing.maxOrderUSDT.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Button - Buy or Unpublish */}
          {isOwnListing ? (
            listing.status === 'active' ? (
              <TouchableOpacity
                onPress={handleUnpublish}
                disabled={isProcessing}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  marginBottom: 20,
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <View className="flex-row items-center">
                    <MaterialIcons name="unpublished" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff' }} className="text-lg font-bold">
                      Unpublish Property
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons 
                    name={listing.status === 'sold' ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={listing.status === 'sold' ? '#10b981' : colors.textMuted} 
                    style={{ marginRight: 8 }}
                  />
                  <Text 
                    style={{ 
                      color: listing.status === 'sold' ? '#10b981' : colors.textMuted 
                    }} 
                    className="text-lg font-bold"
                  >
                    {listing.status === 'sold' ? 'Listing Sold' : 'Listing Unpublished'}
                  </Text>
                </View>
                <Text 
                  style={{ color: colors.textMuted }} 
                  className="text-xs mt-2 text-center"
                >
                  {listing.status === 'sold' 
                    ? 'This listing has been sold and cannot be unpublished' 
                    : 'This listing has been removed from the marketplace'}
                </Text>
              </View>
            )
          ) : (
            <TouchableOpacity
              onPress={() => setShowBuyModal(true)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#ffffff' }} className="text-lg font-bold">
                Buy Tokens
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Buy Modal - Only show for non-own listings */}
      <BuyTokenModal
        visible={showBuyModal && !isOwnListing}
        listing={listing}
        allPropertyListings={allPropertyListings}
        onClose={() => setShowBuyModal(false)}
        onSuccess={() => {
          setShowBuyModal(false);
          loadListing(); // Refresh listing data
        }}
      />

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => {
          if (alertState.onConfirm) {
            alertState.onConfirm();
          } else {
            setAlertState((prev) => ({ ...prev, visible: false }));
          }
        }}
      />

    </View>
  );
}


