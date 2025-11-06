import { useState, useEffect } from 'react';
import { WalletBalance, Transaction } from '@/types/wallet';
import { useApp } from '@/contexts/AppContext';

export function useWallet() {
  const { state, deposit: depositAction, withdraw: withdrawAction } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const initialize = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoading(false);
    };
    initialize();
  }, []);

  const deposit = async (amount: number, method: string = 'Debit Card') => {
    await depositAction(amount, method);
  };

  const withdraw = async (amount: number) => {
    await withdrawAction(amount);
  };

  // Legacy invest method - kept for compatibility
  const invest = async (amount: number, propertyId: string) => {
    console.warn('Use AppContext invest method directly for full functionality');
  };

  return {
    balance: state.balance,
    transactions: state.transactions,
    loading,
    deposit,
    withdraw,
    invest,
  };
}
