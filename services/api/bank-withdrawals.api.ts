import { apiClient } from './apiClient';

export interface BankWithdrawalRequest {
  id: string;
  displayCode: string;
  userId: string;
  amountUSDT: number;
  currency: string;
  userBankAccountName: string;
  userBankAccountNumber: string;
  userBankIban?: string;
  userBankName: string;
  userBankSwiftCode?: string;
  userBankBranch?: string;
  status: 'pending' | 'completed' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  bankTransactionId?: string;
  bankTransactionProofUrl?: string;
  transactionId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankWithdrawalDto {
  amountUSDT: number;
  userBankAccountName: string;
  userBankAccountNumber: string;
  userBankIban?: string;
  userBankName: string;
  userBankSwiftCode?: string;
  userBankBranch?: string;
}

export const bankWithdrawalsAPI = {
  /**
   * Create withdrawal request
   */
  createRequest: async (dto: CreateBankWithdrawalDto): Promise<BankWithdrawalRequest> => {
    const response = await apiClient.post<{ success: boolean; data: BankWithdrawalRequest }>(
      '/api/mobile/bank-withdrawals',
      dto,
    );
    return response.data;
  },

  /**
   * Get user's withdrawal requests
   */
  getMyRequests: async (): Promise<BankWithdrawalRequest[]> => {
    const response = await apiClient.get<{ success: boolean; data: BankWithdrawalRequest[] }>(
      '/api/mobile/bank-withdrawals',
    );
    return response.data;
  },

  /**
   * Get single request by ID
   */
  getRequest: async (id: string): Promise<BankWithdrawalRequest> => {
    const response = await apiClient.get<{ success: boolean; data: BankWithdrawalRequest }>(
      `/api/mobile/bank-withdrawals/${id}`,
    );
    return response.data;
  },
};


