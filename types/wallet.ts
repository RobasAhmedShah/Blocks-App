export interface WalletBalance {
  usdc: number;
  totalValue?: number; // For backward compatibility
  totalInvested?: number;
  totalEarnings?: number;
  pendingDeposits?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'rental_income' | 'rental' | 'transfer';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  currency?: 'USDC' | 'PKR';
  propertyId?: string;
  propertyTitle?: string;
  proofUrl?: string; // For bank transfer deposits (frontend-only)
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

