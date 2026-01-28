import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { marketplaceAPI, MarketplaceListing } from '@/services/api/marketplace.api';
import { normalizePropertyImages } from '@/utils/propertyUtils';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/services/api/auth.api';
import { MarketplacePreviewCard } from './MarketplacePreviewCard';
import EmeraldLoader from '@/components/EmeraldLoader';

interface MarketplacePreviewRowProps {
  limit?: number;
}

export function MarketplacePreviewRow({ limit = 6 }: MarketplacePreviewRowProps) {
  const router = useRouter();
  const { colors, isDarkColorScheme } = useColorScheme();
  const { isAuthenticated, isGuest } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const hasLoadedRef = useRef(false); // Track if data has been loaded initially
  
  const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ;

  // Helper function to get property image URL
  const getPropertyImageUrl = useCallback((images: any): string | null => {
    if (!images) return null;
    const imageArray = normalizePropertyImages(images);
    if (imageArray.length === 0) return null;
    const firstImage = imageArray[0];
    if (!firstImage) return null;
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
      return firstImage;
    }
    if (firstImage.startsWith('/')) {
      return `${API_BASE_URL}${firstImage}`;
    }
    return `${API_BASE_URL}/${firstImage}`;
  }, [API_BASE_URL]);

  // Load current user ID to exclude own listings
  const loadCurrentUser = useCallback(async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const user = await authApi.getMe(token);
        setCurrentUserId(user.id);
        return user.id;
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
    return null;
  }, []);

  // Load marketplace listings
  const loadListings = useCallback(async (userId: string | null) => {
    if (isGuest || !isAuthenticated) return;
    
    // Skip if already loaded
    if (hasLoadedRef.current) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await marketplaceAPI.getListings({
        sortBy: 'created_at_desc',
        limit: limit + 10, // Fetch extra to account for filtering
      });

      // Filter out user's own listings and only keep active ones
      let filteredListings = response.listings.filter(
        (listing) => listing.status === 'active'
      );

      if (userId) {
        filteredListings = filteredListings.filter(
          (listing) => listing.sellerId !== userId
        );
      }

      // Limit to requested number
      setListings(filteredListings.slice(0, limit));
      hasLoadedRef.current = true; // Mark as loaded
    } catch (error) {
      console.error('Failed to load marketplace listings:', error);
    } finally {
      setLoading(false);
    }
  }, [isGuest, isAuthenticated, limit]);

  // Load data only once on mount
  useEffect(() => {
    if (isAuthenticated && !isGuest && !hasLoadedRef.current) {
      // Load user ID first, then listings
      loadCurrentUser().then((userId) => {
        loadListings(userId);
      });
    }
  }, [isAuthenticated, isGuest, loadCurrentUser, loadListings]);

  if (isGuest || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <EmeraldLoader />
      </View>
    );
  }

  if (listings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No listings available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={256} // CARD_WIDTH + marginRight
      decelerationRate="fast">
      {listings.map((listing) => {
        const imageUrl = getPropertyImageUrl(listing.property.images);
        return (
          <MarketplacePreviewCard
            key={listing.id}
            listing={listing}
            imageUrl={imageUrl}
            onPress={() => router.push(`/marketplace/${listing.id}`)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  emptyContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
  },
});

