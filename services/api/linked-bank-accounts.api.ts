import { apiClient } from './apiClient';

export interface LinkedBankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  iban?: string;
  bankName: string;
  swiftCode?: string;
  branch?: string;
  accountType?: string;
  status: 'pending' | 'verified' | 'disabled';
  isDefault: boolean;
  displayName?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  maskedAccountNumber?: string; // Computed property from backend
}

export interface CreateLinkedBankAccountDto {
  accountHolderName: string;
  accountNumber: string;
  iban?: string;
  bankName: string;
  swiftCode?: string;
  branch?: string;
  accountType?: string;
  displayName?: string;
  isDefault?: boolean;
}

export interface UpdateLinkedBankAccountDto {
  accountHolderName?: string;
  accountNumber?: string;
  iban?: string;
  bankName?: string;
  swiftCode?: string;
  branch?: string;
  accountType?: string;
  displayName?: string;
  status?: 'pending' | 'verified' | 'disabled';
  isDefault?: boolean;
}

export const linkedBankAccountsApi = {
  getLinkedBankAccounts: async (): Promise<LinkedBankAccount[]> => {
    return apiClient.get<LinkedBankAccount[]>('/api/mobile/linked-bank-accounts');
  },

  getLinkedBankAccount: async (id: string): Promise<LinkedBankAccount> => {
    return apiClient.get<LinkedBankAccount>(`/api/mobile/linked-bank-accounts/${id}`);
  },

  getDefaultLinkedBankAccount: async (): Promise<LinkedBankAccount | null> => {
    try {
      return await apiClient.get<LinkedBankAccount>('/api/mobile/linked-bank-accounts/default');
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createLinkedBankAccount: async (dto: CreateLinkedBankAccountDto): Promise<LinkedBankAccount> => {
    return apiClient.post<LinkedBankAccount>('/api/mobile/linked-bank-accounts', dto);
  },

  updateLinkedBankAccount: async (id: string, dto: UpdateLinkedBankAccountDto): Promise<LinkedBankAccount> => {
    return apiClient.patch<LinkedBankAccount>(`/api/mobile/linked-bank-accounts/${id}`, dto);
  },

  setDefaultLinkedBankAccount: async (id: string, isDefault: boolean): Promise<LinkedBankAccount> => {
    return apiClient.patch<LinkedBankAccount>(`/api/mobile/linked-bank-accounts/${id}/default`, { isDefault });
  },

  deleteLinkedBankAccount: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/mobile/linked-bank-accounts/${id}`);
  },
};
