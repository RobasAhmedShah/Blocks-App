import { apiClient } from './apiClient';
import { Transaction } from '@/types/wallet';

export interface TransactionFilter {
  page?: number;
  limit?: number;
  type?: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';
  status?: 'pending' | 'completed' | 'failed';
  propertyId?: string;
}

export interface PaginatedTransactionsResponse {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const transactionsApi = {
  /**
   * Get user transactions with optional filters
   */
  getTransactions: async (filters?: TransactionFilter): Promise<PaginatedTransactionsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters?.page) {
      queryParams.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }
    if (filters?.type) {
      queryParams.append('type', filters.type);
    }
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    if (filters?.propertyId) {
      queryParams.append('propertyId', filters.propertyId);
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/mobile/transactions${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<PaginatedTransactionsResponse>(endpoint);
  },
};

