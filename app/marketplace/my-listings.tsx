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
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { marketplaceAPI, MarketplaceListing } from '@/services/api/marketplace.api';
import { LinearGradient } from 'expo-linear-gradient';
import { AppAlert } from '@/components/AppAlert';
import { useAuth } from '@/contexts/AuthContext';
import { SignInGate } from '@/components/common/SignInGate';
import EmeraldLoader from '@/components/EmeraldLoader';

export default function MyListingsScreen() {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' ;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      loadListings();
    }
  }, [isAuthenticated, isGuest]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await marketplaceAPI.getMyListings();
      setListings(data);
    } catch (error: any) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadListings();
  };

  const handleCancel = async (listingId: string) => {
    setAlertState({
      visible: true,
      title: 'Cancel Listing?',
      message: 'Are you sure you want to cancel this listing? Your tokens will be unlocked.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await marketplaceAPI.cancelListing(listingId);
          setAlertState({
            visible: true,
            title: 'Listing Cancelled',
            message: 'Your tokens have been unlocked',
            type: 'success',
            onConfirm: () => {
              setAlertState((prev) => ({ ...prev, visible: false }));
              loadListings();
            },
          });
        } catch (error: any) {
          setAlertState({
            visible: true,
            title: 'Error',
            message: error.message || 'Failed to cancel listing',
            type: 'error',
            onConfirm: () => {
              setAlertState((prev) => ({ ...prev, visible: false }));
            },
          });
        }
      },
    });
  };

  if (isGuest || !isAuthenticated) {
    return <SignInGate />;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');
  const cancelledListings = listings.filter((l) => l.status === 'cancelled');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <LinearGradient
        colors={
          isDarkColorScheme ? ['#022c22', '#064e3b'] : ['#ecfdf5', '#d1fae5']
        }
        className="px-4 pb-6"
        style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkColorScheme ? '#ffffff' : '#064e3b'}
            />
          </TouchableOpacity>
          <Text
            style={{ color: isDarkColorScheme ? '#ffffff' : '#064e3b' }}
            className="text-xl font-bold"
          >
            My Listings
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
              Active
            </Text>
            <Text style={{ color: colors.primary }} className="text-xl font-bold">
              {activeListings.length}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
              Sold
            </Text>
            <Text style={{ color: colors.textPrimary }} className="text-xl font-bold">
              {soldListings.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <EmeraldLoader />
        </View>
      ) : listings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="store" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary }} className="text-lg font-semibold mt-4">
            No listings yet
          </Text>
          <Text style={{ color: colors.textMuted }} className="text-sm text-center mt-2">
            Start selling your tokens to other users
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/marketplace/sell')}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#ffffff' }} className="font-semibold">
              Create Listing
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View className="py-4">
            {/* Active Listings */}
            {activeListings.length > 0 && (
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Active Listings
                </Text>
                {activeListings.map((listing) => {
                  const propertyImage =
                    listing.property.images && listing.property.images.length > 0
                      ? listing.property.images[0]
                      : null;

                  return (
                    <View
                      key={listing.id}
                      style={{
                        backgroundColor: colors.card,
                        borderRadius: 20,
                        marginBottom: 16,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      {propertyImage && (
                        <Image
                          source={{ uri: propertyImage }}
                          style={{ width: '100%', height: 150 }}
                          resizeMode="cover"
                        />
                      )}
                      <View className="p-4">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="text-lg font-bold mb-1"
                        >
                          {listing.property.title}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="text-xs mb-3">
                          {listing.displayCode}
                        </Text>

                        <View className="flex-row justify-between mb-3">
                          <View>
                            <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                              Price per Token
                            </Text>
                            <Text style={{ color: colors.primary }} className="text-lg font-bold">
                              {formatPrice(listing.pricePerToken)}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text style={{ color: colors.textMuted }} className="text-xs mb-1">
                              Remaining
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="text-lg font-bold">
                              {listing.remainingTokens.toFixed(2)} tokens
                            </Text>
                          </View>
                        </View>

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
                          <View className="flex-row justify-between mb-1">
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              Order Range
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="text-xs font-medium">
                              {formatPrice(listing.minOrderUSDT)} - {formatPrice(listing.maxOrderUSDT)}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text style={{ color: colors.textMuted }} className="text-xs">
                              Total Value
                            </Text>
                            <Text style={{ color: colors.primary }} className="text-xs font-semibold">
                              {formatPrice(listing.remainingTokens * listing.pricePerToken)}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleCancel(listing.id)}
                          style={{
                            backgroundColor: colors.destructive + '20',
                            borderRadius: 12,
                            paddingVertical: 12,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: colors.destructive }} className="font-semibold">
                            Cancel Listing
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sold Listings */}
            {soldListings.length > 0 && (
              <View className="mb-6">
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Sold ({soldListings.length})
                </Text>
                {soldListings.map((listing) => (
                  <View
                    key={listing.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: 0.7,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="font-semibold mb-1"
                        >
                          {listing.property.title}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          {listing.displayCode} • Sold on{' '}
                          {new Date(listing.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Cancelled Listings */}
            {cancelledListings.length > 0 && (
              <View>
                <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-3">
                  Cancelled ({cancelledListings.length})
                </Text>
                {cancelledListings.map((listing) => (
                  <View
                    key={listing.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      opacity: 0.6,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          style={{ color: colors.textPrimary }}
                          className="font-semibold mb-1"
                        >
                          {listing.property.title}
                        </Text>
                        <Text style={{ color: colors.textMuted }} className="text-xs">
                          {listing.displayCode} • Cancelled on{' '}
                          {new Date(listing.updatedAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <MaterialIcons name="cancel" size={24} color={colors.textMuted} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={alertState.onConfirm || (() => {})}
      />
    </View>
  );
}

