import { apiClient } from './apiClient';
import { Property, PropertyToken } from '@/types/property';

export interface PropertyTokenWithTitle extends PropertyToken {
  propertyTitle: string;
}

export interface PropertyFilterDto {
  page?: number;
  limit?: number;
  city?: string;
  status?: string;
  minROI?: number;
  maxPricePerToken?: number;
  search?: string;
  filter?: 'Trending' | 'High Yield' | 'New Listings' | 'Completed';
}

export interface PaginatedPropertiesResponse {
  data: Property[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const propertiesApi = {
  getProperties: async (filters?: PropertyFilterDto): Promise<PaginatedPropertiesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiClient.get<PaginatedPropertiesResponse>(
      `/api/mobile/properties${queryString ? `?${queryString}` : ''}`
    );
  },

  getProperty: async (id: string): Promise<Property> => {
    return apiClient.get<Property>(`/api/mobile/properties/${id}`);
  },

  /** All property tokens with token_address (for wallet balance checks). */
  getPropertyTokenContracts: async (): Promise<PropertyTokenWithTitle[]> => {
    return apiClient.get<PropertyTokenWithTitle[]>('/api/mobile/properties/token-contracts');
  },
};

