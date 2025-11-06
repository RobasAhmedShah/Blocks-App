import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Property } from '@/types/property';
import { WalletBalance, Transaction } from '@/types/wallet';
import { Investment } from '@/types/portfolio';
import { UserInfo, SecuritySettings, NotificationSettings, BankAccount } from '@/types/profilesettings';
import { mockProperties } from '@/data/mockProperties';
import { initialBalance, mockTransactions } from '@/data/mockWallet';
import { mockInvestments } from '@/data/mockPortfolio';
import { mockUserInfo, mockSecuritySettings, mockNotificationSettings, mockBankAccounts } from '@/data/mockProfile';

interface AppState {
  // Wallet State
  balance: WalletBalance;
  transactions: Transaction[];
  
  // Portfolio State
  investments: Investment[];
  
  // Properties State
  properties: Property[];
  
  // Profile State
  userInfo: UserInfo;
  securitySettings: SecuritySettings;
  notificationSettings: NotificationSettings;
  bankAccounts: BankAccount[];
}

interface AppContextType {
  // State
  state: AppState;
  
  // Wallet Actions
  deposit: (amount: number, method: string) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  
  // Investment Actions
  invest: (amount: number, propertyId: string, tokenCount: number) => Promise<void>;
  
  // Property Actions
  getProperty: (id: string) => Property | undefined;
  
  // Portfolio Actions
  getInvestments: () => Investment[];
  getTotalValue: () => number;
  getTotalInvested: () => number;
  getTotalROI: () => number;
  getMonthlyRentalIncome: () => number;
  
  // Profile Actions
  updateUserInfo: (updates: Partial<UserInfo>) => Promise<void>;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;
  removeBankAccount: (accountId: string) => Promise<void>;
  setPrimaryBankAccount: (accountId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    balance: { ...initialBalance },
    transactions: [...mockTransactions],
    investments: [...mockInvestments],
    properties: [...mockProperties],
    userInfo: { ...mockUserInfo },
    securitySettings: { ...mockSecuritySettings },
    notificationSettings: { ...mockNotificationSettings },
    bankAccounts: [...mockBankAccounts],
  });

  // Wallet Actions
  const deposit = useCallback(async (amount: number, method: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setState(prev => {
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'deposit',
        amount,
        currency: 'USDC',
        status: 'completed',
        date: new Date().toISOString(),
        description: `Deposit via ${method}`,
      };

      const newBalance: WalletBalance = {
        ...prev.balance,
        usdc: prev.balance.usdc + amount,
        totalValue: (prev.balance.totalValue || prev.balance.usdc) + amount,
      };

      return {
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  }, []);

  const withdraw = useCallback(async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setState(prev => {
      if (prev.balance.usdc < amount) {
        throw new Error('Insufficient funds');
      }

      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'withdraw',
        amount: -amount,
        currency: 'USDC',
        status: 'completed',
        date: new Date().toISOString(),
        description: 'Withdrawal',
      };

      const newBalance: WalletBalance = {
        ...prev.balance,
        usdc: prev.balance.usdc - amount,
        totalValue: (prev.balance.totalValue || prev.balance.usdc) - amount,
      };

      return {
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  }, []);

  // Investment Actions
  const invest = useCallback(async (amount: number, propertyId: string, tokenCount: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setState(prev => {
      if (prev.balance.usdc < amount) {
        throw new Error('Insufficient funds');
      }

      const property = prev.properties.find(p => p.id === propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Update property tokens
      const updatedProperties = prev.properties.map(p => {
        if (p.id === propertyId) {
          return {
            ...p,
            soldTokens: p.soldTokens + tokenCount,
          };
        }
        return p;
      });

      // Check if investment exists, update it or create new
      const existingInvestmentIndex = prev.investments.findIndex(
        inv => inv.property.id === propertyId
      );

      let updatedInvestments: Investment[];
      if (existingInvestmentIndex >= 0) {
        // Update existing investment
        updatedInvestments = prev.investments.map((inv, idx) => {
          if (idx === existingInvestmentIndex) {
            const newTokens = inv.tokens + tokenCount;
            const newInvestedAmount = inv.investedAmount + amount;
            const estimatedValue = newTokens * property.tokenPrice * 1.15; // 15% growth estimate
            const newROI = ((estimatedValue - newInvestedAmount) / newInvestedAmount) * 100;
            
            return {
              ...inv,
              tokens: newTokens,
              investedAmount: newInvestedAmount,
              currentValue: estimatedValue,
              roi: newROI,
              monthlyRentalIncome: (estimatedValue * property.estimatedYield / 100) / 12,
            };
          }
          return inv;
        });
      } else {
        // Create new investment
        const estimatedValue = tokenCount * property.tokenPrice * 1.15;
        const newInvestment: Investment = {
          id: `inv-${Date.now()}`,
          property: updatedProperties.find(p => p.id === propertyId)!,
          tokens: tokenCount,
          investedAmount: amount,
          currentValue: estimatedValue,
          roi: ((estimatedValue - amount) / amount) * 100,
          rentalYield: property.estimatedYield,
          monthlyRentalIncome: (estimatedValue * property.estimatedYield / 100) / 12,
        };
        updatedInvestments = [...prev.investments, newInvestment];
      }

      // Add transaction
      const newTransaction: Transaction = {
        id: `tx-${Date.now()}`,
        type: 'investment',
        amount: -amount,
        currency: 'USDC',
        status: 'completed',
        date: new Date().toISOString(),
        description: `Investment in ${property.title}`,
        propertyId: property.id,
        propertyTitle: property.title,
      };

      // Update balance
      const totalInvestedAmount = updatedInvestments.reduce(
        (sum, inv) => sum + inv.investedAmount,
        0
      );
      const totalEarnings = updatedInvestments.reduce(
        (sum, inv) => sum + (inv.currentValue - inv.investedAmount),
        0
      );

      const newBalance: WalletBalance = {
        usdc: prev.balance.usdc - amount,
        totalValue: (prev.balance.totalValue || prev.balance.usdc) - amount,
        totalInvested: totalInvestedAmount,
        totalEarnings: totalEarnings,
        pendingDeposits: prev.balance.pendingDeposits || 0,
      };

      return {
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
        investments: updatedInvestments,
        properties: updatedProperties,
      };
    });
  }, []);

  // Property Actions
  const getProperty = useCallback((id: string) => {
    return state.properties.find(p => p.id === id);
  }, [state.properties]);

  // Portfolio Actions
  const getInvestments = useCallback(() => {
    return state.investments;
  }, [state.investments]);

  const getTotalValue = useCallback(() => {
    return state.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  }, [state.investments]);

  const getTotalInvested = useCallback(() => {
    return state.investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  }, [state.investments]);

  const getTotalROI = useCallback(() => {
    const totalInvested = getTotalInvested();
    const totalValue = getTotalValue();
    return totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
  }, [getTotalInvested, getTotalValue]);

  const getMonthlyRentalIncome = useCallback(() => {
    return state.investments.reduce((sum, inv) => sum + inv.monthlyRentalIncome, 0);
  }, [state.investments]);

  // Profile Actions
  const updateUserInfo = useCallback(async (updates: Partial<UserInfo>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, ...updates },
    }));
  }, []);

  const updateSecuritySettings = useCallback(async (updates: Partial<SecuritySettings>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => ({
      ...prev,
      securitySettings: { ...prev.securitySettings, ...updates },
    }));
  }, []);

  const updateNotificationSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => ({
      ...prev,
      notificationSettings: { ...prev.notificationSettings, ...updates },
    }));
  }, []);

  const addBankAccount = useCallback(async (account: Omit<BankAccount, 'id'>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => {
      const newAccount: BankAccount = {
        ...account,
        id: `bank-${Date.now()}`,
      };
      return {
        ...prev,
        bankAccounts: [...prev.bankAccounts, newAccount],
      };
    });
  }, []);

  const removeBankAccount = useCallback(async (accountId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter(acc => acc.id !== accountId),
    }));
  }, []);

  const setPrimaryBankAccount = useCallback(async (accountId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setState(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId,
      })),
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        deposit,
        withdraw,
        invest,
        getProperty,
        getInvestments,
        getTotalValue,
        getTotalInvested,
        getTotalROI,
        getMonthlyRentalIncome,
        updateUserInfo,
        updateSecuritySettings,
        updateNotificationSettings,
        addBankAccount,
        removeBankAccount,
        setPrimaryBankAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

