import { apiClient } from './apiClient';

export interface MarketplaceListing {
  id: string;
  displayCode: string;
  sellerId: string;
  seller?: {
    id: string;
    displayCode: string;
  };
  propertyId: string;
  property: {
    id: string;
    displayCode: string;
    title: string;
    images?: string[];
    expectedROI: number;
    city?: string;
    country?: string;
  };
  pricePerToken: number;
  totalTokens: number;
  remainingTokens: number;
  minOrderUSDT: number;
  maxOrderUSDT: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceTrade {
  id: string;
  displayCode: string;
  listingId?: string;
  buyerId: string;
  sellerId: string;
  propertyId: string;
  property?: {
    id: string;
    title: string;
  };
  tokensBought: number;
  totalUSDT: number;
  pricePerToken: number;
  certificatePath?: string | null;
  createdAt: string;
}

export interface CreateListingDto {
  propertyId: string;
  pricePerToken: number;
  totalTokens: number;
  minOrderUSDT: number;
  maxOrderUSDT: number;
}

export interface BuyTokensDto {
  listingId: string;
  tokensToBuy: number;
}

export interface GetListingsParams {
  propertyId?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'created_at_desc' | 'created_at_asc' | 'roi_desc';
  limit?: number;
  offset?: number;
}

export interface GetListingsResponse {
  listings: MarketplaceListing[];
  total: number;
  limit: number;
  offset: number;
}

export interface AvailableTokensResponse {
  availableTokens: string;
}

export const marketplaceAPI = {
  /**
   * Get all active listings
   */
  getListings: async (params?: GetListingsParams): Promise<GetListingsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.propertyId) queryParams.append('propertyId', params.propertyId);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<GetListingsResponse>(
      `/api/marketplace/listings?${queryParams.toString()}`,
    );
    return response;
  },

  /**
   * Get a single listing by ID
   */
  getListing: async (id: string): Promise<MarketplaceListing> => {
    const response = await apiClient.get<MarketplaceListing>(`/api/marketplace/listings/${id}`);
    return response;
  },

  /**
   * Create a new listing
   */
  createListing: async (dto: CreateListingDto): Promise<MarketplaceListing> => {
    const response = await apiClient.post<MarketplaceListing>('/api/marketplace/listings', dto);
    return response;
  },

  /**
   * Buy tokens from a listing
   */
  buyTokens: async (listingId: string, dto: BuyTokensDto): Promise<MarketplaceTrade> => {
    const response = await apiClient.post<MarketplaceTrade>(
      `/api/marketplace/listings/${listingId}/buy`,
      dto,
    );
    return response;
  },

  /**
   * Cancel a listing
   */
  cancelListing: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/marketplace/listings/${id}`);
  },

  /**
   * Get current user's listings
   */
  getMyListings: async (): Promise<MarketplaceListing[]> => {
    const response = await apiClient.get<MarketplaceListing[]>('/api/marketplace/my-listings');
    return response;
  },

  /**
   * Get current user's trade history
   */
  getMyTrades: async (): Promise<MarketplaceTrade[]> => {
    const response = await apiClient.get<MarketplaceTrade[]>('/api/marketplace/my-trades');
    return response;
  },

  /**
   * Get available tokens for a property (for sell form)
   */
  getAvailableTokens: async (propertyId: string): Promise<AvailableTokensResponse> => {
    const response = await apiClient.get<AvailableTokensResponse>(
      `/api/marketplace/available-tokens/${propertyId}`,
    );
    return response;
  },

  /**
   * Get marketplace trade certificate
   */
  getTradeCertificate: async (tradeId: string): Promise<string> => {
    const response = await apiClient.get<{ success: boolean; certificateUrl: string }>(
      `/api/mobile/certificates/marketplace-trades/${tradeId}`,
    );
    return response.certificateUrl;
  },
};

