import { apiClient } from './apiClient';

export interface BankTransferRequest {
  id: string;
  displayCode: string;
  userId: string;
  amountUSDT: number;
  currency: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban?: string;
  bankName: string;
  bankSwiftCode?: string;
  bankBranch?: string;
  proofImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  transactionId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountDetails {
  accountName: string;
  accountNumber: string;
  iban: string;
  bankName: string;
  swiftCode: string;
  branch: string;
}

export interface CreateBankTransferRequestDto {
  amountUSDT: number;
  proofImageUrl: string; // Base64 data URL
}

export const bankTransfersAPI = {
  /**
   * Get bank account details (public endpoint)
   * Uses the settings endpoint which reads from database with env fallback
   */
  getBankDetails: async (): Promise<BankAccountDetails> => {
    const response = await apiClient.get<{ success: boolean; data: BankAccountDetails }>(
      '/admin/settings/bank-account',
    );
    return response.data;
  },

  /**
   * Create bank transfer request
   */
  createRequest: async (dto: CreateBankTransferRequestDto): Promise<BankTransferRequest> => {
    const response = await apiClient.post<{ success: boolean; data: BankTransferRequest }>(
      '/api/mobile/bank-transfers',
      dto,
    );
    return response.data;
  },

  /**
   * Upload proof image (multipart file upload)
   */
  uploadProof: async (requestId: string, file: { uri: string; type: string; name: string }): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    formData.append('requestId', requestId);

    const response = await apiClient.post<{ success: boolean; data: { imageUrl: string } }>(
      '/api/mobile/bank-transfers/upload-proof',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data.imageUrl;
  },

  /**
   * Get user's bank transfer requests
   */
  getMyRequests: async (): Promise<BankTransferRequest[]> => {
    const response = await apiClient.get<{ success: boolean; data: BankTransferRequest[] }>(
      '/api/mobile/bank-transfers',
    );
    return response.data;
  },

  /**
   * Get single request by ID
   */
  getRequest: async (id: string): Promise<BankTransferRequest> => {
    const response = await apiClient.get<{ success: boolean; data: BankTransferRequest }>(
      `/api/mobile/bank-transfers/${id}`,
    );
    return response.data;
  },

  /**
   * Get signed URL for proof image
   */
  getProofUrl: async (id: string, expiresIn?: number): Promise<string> => {
    const response = await apiClient.get<{ success: boolean; data: { signedUrl: string } }>(
      `/api/mobile/bank-transfers/${id}/proof-url`,
      {
        params: expiresIn ? { expiresIn } : undefined,
      },
    );
    return response.data.signedUrl;
  },
};
