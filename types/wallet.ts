export interface AccountRestrictions {
  blockDeposits: boolean;
  blockWithdrawals: boolean;
  blockTokenTransfers: boolean;
  blockTrading: boolean;
  isUnderReview: boolean;
  isRestricted: boolean;
  restrictionReason?: string | null;
}

export interface WalletBalance {
  usdc: number;
  totalValue?: number; // For backward compatibility
  totalInvested?: number;
  totalEarnings?: number;
  pendingDeposits?: number;
  complianceStatus?: 'clear' | 'restricted' | string; // Primary check: 'clear' allows actions, 'restricted' blocks
  blockedReason?: string | null; // Reason for blocking if complianceStatus is 'restricted'
  restrictions?: AccountRestrictions | null; // Granular restriction flags (e.g. blockTokenTransfers)
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'rental_income' | 'rental' | 'transfer' | 'reward';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  currency?: 'USDC' | 'PKR';
  propertyId?: string;
  propertyTitle?: string;
  proofUrl?: string; // For bank transfer deposits (frontend-only)
  bankDetails?: any; // For bank transfer withdrawals (frontend-only)
  metadata?: {
    bankTransactionId?: string; // Bank transaction ID from admin (for withdrawals)
    bankWithdrawalRequestId?: string;
    [key: string]: any;
  };
}

export interface DepositMethod {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

export interface BlockchainNetwork {
  id: string;
  name: string;
  icon: string;
  tokens: string;
  fee: 'Low' | 'Medium' | 'High';
}

