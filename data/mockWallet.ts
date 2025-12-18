import { WalletBalance, Transaction, DepositMethod, BlockchainNetwork } from "@/types/wallet";

export const initialBalance: WalletBalance = {
  usdc: 50000.0,
  totalValue: 50000.0,
};

export const mockWalletBalance: WalletBalance = {
  usdc: 540.25,
  totalInvested: 4500,
  totalEarnings: 817,
  pendingDeposits: 0,
};

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 1000,
    date: '2025-01-15T10:30:00Z',
    description: 'Deposit via Debit Card',
    status: 'completed',
    currency: 'USDC',
  },
  {
    id: '2',
    type: 'investment',
    amount: -5000,
    date: '2025-01-14T14:20:00Z',
    description: 'Investment in Modern Downtown Loft',
    status: 'completed',
    currency: 'USDC',
  },
  {
    id: '3',
    type: 'rental_income',
    amount: 125.50,
    date: '2025-01-10T08:00:00Z',
    description: 'Rental income from The Grand Plaza',
    status: 'completed',
    currency: 'USDC',
  },
];

export const depositMethods: DepositMethod[] = [
  {
    id: 'card',
    title: 'Debit/Credit Card',
    description: 'Instantly add funds from your card',
    icon: 'credit-card',
    color: '#0fa0bd',
    route: '/wallet/deposit/card',
  },
  {
    id: 'onchain',
    title: 'On-Chain Transfer',
    description: 'Deposit crypto from another wallet',
    icon: 'account-balance-wallet',
    color: '#0fa0bd',
    route: '/wallet/deposit/onchain',
  },
  {
    id: 'binance',
    title: 'Binance Pay',
    description: 'Fast and convenient payment',
    icon: 'paid',
    color: '#F0B90B',
    route: '/wallet/deposit/binance',
  },
  {
    id: 'bank-transfer',
    title: 'Bank Transfer',
    description: 'Manual deposit via bank transfer',
    icon: 'account-balance',
    color: '#0fa0bd',
    route: '/wallet/deposit/bank-transfer',
  },
];

export const quickAmounts: number[] = [100, 250, 500, 1000];

export const blockchainNetworks: BlockchainNetwork[] = [
  {
    id: 'polygon',
    name: 'Polygon',
    icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    tokens: 'USDC / MATIC',
    fee: 'Low',
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    tokens: 'USDC / BNB',
    fee: 'Low',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    tokens: 'USDC / ETH',
    fee: 'High',
  },
];

export const defaultWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

