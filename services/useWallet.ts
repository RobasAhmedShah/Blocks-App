import { useState, useEffect } from 'react';

export interface WalletBalance {
  usdc: number;
  totalValue: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'rental_income';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

const initialBalance: WalletBalance = {
  usdc: 50000.0,
  totalValue: 50000.0,
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 1000,
    date: '2025-01-15T10:30:00Z',
    description: 'Deposit via Debit Card',
    status: 'completed',
  },
  {
    id: '2',
    type: 'investment',
    amount: -5000,
    date: '2025-01-14T14:20:00Z',
    description: 'Investment in Modern Downtown Loft',
    status: 'completed',
  },
  {
    id: '3',
    type: 'rental_income',
    amount: 125.50,
    date: '2025-01-10T08:00:00Z',
    description: 'Rental income from The Grand Plaza',
    status: 'completed',
  },
];

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance>(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(false);

  const deposit = async (amount: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBalance(prev => ({
      usdc: prev.usdc + amount,
      totalValue: prev.totalValue + amount,
    }));
    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: 'deposit',
        amount,
        date: new Date().toISOString(),
        description: 'Deposit via Debit Card',
        status: 'completed',
      },
      ...prev,
    ]);
    setLoading(false);
  };

  const withdraw = async (amount: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBalance(prev => ({
      usdc: prev.usdc - amount,
      totalValue: prev.totalValue - amount,
    }));
    setLoading(false);
  };

  const invest = async (amount: number, propertyId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBalance(prev => ({
      usdc: prev.usdc - amount,
      totalValue: prev.totalValue - amount,
    }));
    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: 'investment',
        amount: -amount,
        date: new Date().toISOString(),
        description: `Investment in property ${propertyId}`,
        status: 'completed',
      },
      ...prev,
    ]);
    setLoading(false);
  };

  return {
    balance,
    transactions,
    loading,
    deposit,
    withdraw,
    invest,
  };
}

