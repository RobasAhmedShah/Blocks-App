import { apiClient } from './apiClient';
import { Investment } from '@/types/portfolio';

export interface CreateInvestmentDto {
  propertyId: string;
  tokenCount: number;
  transactionFee?: number;
}

export interface InvestmentResponse {
  id: string;
  displayCode: string;
  property: {
    id: string;
    displayCode: string;
    title: string;
    images: string[];
    tokenPrice: number;
    status: string;
    city: string;
    country: string;
  };
  tokens: number;
  investedAmount: number;
  currentValue: number;
  roi: number;
  rentalYield: number;
  monthlyRentalIncome: number;
  status: string;
  paymentStatus: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  certificatePath?: string | null;
}

export interface InvestmentsListResponse {
  investments: InvestmentResponse[];
}

export const investmentsApi = {
  /**
   * Create a new investment
   */
  createInvestment: async (dto: CreateInvestmentDto): Promise<InvestmentResponse> => {
    return apiClient.post<InvestmentResponse>('/api/mobile/investments', dto);
  },

  /**
   * Get all investments for the current user
   */
  getMyInvestments: async (): Promise<InvestmentResponse[]> => {
    const response = await apiClient.get<InvestmentsListResponse>('/api/mobile/investments');
    return response.investments;
  },

  /**
   * Get a specific investment by ID
   */
  getInvestment: async (id: string): Promise<InvestmentResponse> => {
    return apiClient.get<InvestmentResponse>(`/api/mobile/investments/${id}`);
  },
};

