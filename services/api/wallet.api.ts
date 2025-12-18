import { apiClient } from './apiClient';

export interface WalletBalance {
  usdc: number;
  totalValue: number;
  totalInvested: number;
  totalEarnings: number;
  pendingDeposits: number;
}

export interface DepositRequest {
  amountUSDT: number;
  paymentMethodId?: string; // Optional - will use default if not provided
}

export interface BankTransferDepositRequest {
  amountUSDT: number;
  proofUrl: string; // URL of uploaded proof document
}

export interface DepositResponse {
  success: boolean;
  transaction: {
    id: string;
    displayCode: string;
    type: string;
    amountUSDT: number;
    status: string;
    description: string;
    createdAt: string;
  };
  wallet: WalletBalance;
}

export const walletApi = {
  /**
   * Get wallet balance and summary
   */
  getWallet: async (): Promise<WalletBalance> => {
    return apiClient.get<WalletBalance>('/api/mobile/wallet');
  },

  /**
   * Deposit funds to wallet using a payment method
   */
  deposit: async (dto: DepositRequest): Promise<DepositResponse> => {
    return apiClient.post<DepositResponse>('/api/mobile/wallet/deposit', dto);
  },

  /**
   * Submit bank transfer deposit request (manual deposit with proof)
   * Creates a PENDING_VERIFICATION transaction
   */
  depositBankTransfer: async (dto: BankTransferDepositRequest): Promise<DepositResponse> => {
    return apiClient.post<DepositResponse>('/api/mobile/wallet/deposit/bank-transfer', dto);
  },
};

