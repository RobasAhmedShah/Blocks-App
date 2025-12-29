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

// 1LINK QR Payment Types
export interface OneLinkQrRequest {
  amountPkr: number;
  purpose?: string; // Optional, default: "Wallet Top Up"
}

export interface OneLinkQrResponse {
  depositId: string;
  referenceId: string;
  amountPkr: string;
  qrCodeBase64: string;
  qrCodeDataUri: string; // Ready to use in Image component
  currency: string; // Always "PKR"
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

  /**
   * Generate 1LINK QR code for PKR deposit
   * Returns a Base64 PNG QR code that can be scanned with any Pakistani bank app
   * 
   * Note: This endpoint is at /api/payments/1link/1qr (not /api/mobile/)
   * because it's in a separate payments module, not the mobile module
   */
  generateOneLinkQr: async (dto: OneLinkQrRequest): Promise<OneLinkQrResponse> => {
    return apiClient.post<OneLinkQrResponse>('/api/payments/1link/1qr', dto);
  },
};

