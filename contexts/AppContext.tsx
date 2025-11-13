import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Property } from '@/types/property';
import { WalletBalance, Transaction } from '@/types/wallet';
import { Investment } from '@/types/portfolio';
import { UserInfo, SecuritySettings, NotificationSettings, BankAccount } from '@/types/profilesettings';
import { mockProperties } from '@/data/mockProperties';
import { initialBalance, mockTransactions } from '@/data/mockWallet';
import { mockInvestments } from '@/data/mockPortfolio';
import { mockUserInfo, mockSecuritySettings, mockNotificationSettings, } from '@/data/mockProfile';
import { professionalBankAccounts } from '@/data/mockProfile';
import * as SecureStore from 'expo-secure-store';
import { NotificationHelper } from '@/services/notificationHelper';
import { propertiesApi } from '@/services/api/properties.api';
import { profileApi, ProfileResponse } from '@/services/api/profile.api';
import { walletApi } from '@/services/api/wallet.api';
import { transactionsApi } from '@/services/api/transactions.api';
import { investmentsApi } from '@/services/api/investments.api';

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
  
  // Bookmarks State
  bookmarkedPropertyIds: string[];
}

interface AppContextType {
  // State
  state: AppState;
  
  // Loading States
  isLoadingProperties: boolean;
  propertiesError: string | null;
  
  // Wallet Actions
  loadWallet: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  deposit: (amount: number, paymentMethodId?: string) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  
  // Investment Actions
  loadInvestments: () => Promise<void>;
  invest: (amount: number, propertyId: string, tokenCount: number) => Promise<void>;
  
  // Property Actions
  getProperty: (id: string) => Property | undefined;
  refreshProperties: () => Promise<void>;
  
  // Portfolio Actions
  getInvestments: () => Investment[];
  getTotalValue: () => number;
  getTotalInvested: () => number;
  getTotalROI: () => number;
  getMonthlyRentalIncome: () => number;
  
  // Profile Actions
  loadProfile: () => Promise<void>;
  updateUserInfo: (updates: Partial<UserInfo>) => Promise<void>;
  updateSecuritySettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;
  removeBankAccount: (accountId: string) => Promise<void>;
  setPrimaryBankAccount: (accountId: string) => Promise<void>;
  
  // Bookmark Actions
  toggleBookmark: (propertyId: string) => Promise<void>;
  isBookmarked: (propertyId: string) => boolean;
  getBookmarkedProperties: () => Property[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BOOKMARKS_STORAGE_KEY = 'bookmarked_property_ids';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    balance: { ...initialBalance },
    transactions: [...mockTransactions],
    investments: [...mockInvestments],
    properties: [...mockProperties], // Start with mock data, will be replaced by API
    userInfo: { ...mockUserInfo },
    securitySettings: { ...mockSecuritySettings },
    notificationSettings: { ...mockNotificationSettings },
    bankAccounts: [...professionalBankAccounts],
    bookmarkedPropertyIds: [],
  });

  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  // Fetch properties from API
  const fetchProperties = useCallback(async () => {
    try {
      setIsLoadingProperties(true);
      setPropertiesError(null);
      
      // Fetch all properties (with pagination if needed)
      let allProperties: Property[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Fetch 100 at a time
      
      while (hasMore) {
        const response = await propertiesApi.getProperties({ page, limit });
        allProperties = [...allProperties, ...response.data];
        
        if (page >= response.meta.totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      // Transform API properties to match app structure
      const transformedProperties: Property[] = allProperties.map(prop => ({
        ...prop,
        // Ensure completionDate is a string (can be null from API)
        completionDate: prop.completionDate || '',
        // Ensure documents and updates arrays exist (API doesn't return these yet)
        documents: prop.documents || [],
        updates: prop.updates || [],
        // Ensure rentalIncome exists for generating-income properties
        rentalIncome: prop.rentalIncome || (prop.status === 'generating-income' ? undefined : undefined),
      }));
      
      setState(prev => ({
        ...prev,
        properties: transformedProperties,
      }));
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      setPropertiesError(error.message || 'Failed to load properties');
      // Keep mock data on error for fallback
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  // Load properties on mount
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Load bookmarks from secure storage on mount
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const stored = await SecureStore.getItemAsync(BOOKMARKS_STORAGE_KEY);
        if (stored) {
          const bookmarkedIds = JSON.parse(stored);
          setState(prev => ({
            ...prev,
            bookmarkedPropertyIds: bookmarkedIds,
          }));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    };
    loadBookmarks();
  }, []);

  // Wallet Actions
  const loadWallet = useCallback(async () => {
    try {
      const walletBalance = await walletApi.getWallet();
      setState(prev => ({
        ...prev,
        balance: {
          usdc: walletBalance.usdc,
          totalValue: walletBalance.totalValue,
          totalInvested: walletBalance.totalInvested,
          totalEarnings: walletBalance.totalEarnings,
          pendingDeposits: walletBalance.pendingDeposits,
        },
      }));
    } catch (error) {
      console.error('Error loading wallet:', error);
      // Keep existing state on error
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const response = await transactionsApi.getTransactions({
        page: 1,
        limit: 50, // Load more transactions for the wallet screen
      });
      setState(prev => ({
        ...prev,
        transactions: response.data,
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Keep existing state on error
    }
  }, []);

  const deposit = useCallback(async (amount: number, paymentMethodId?: string) => {
    try {
      // Call backend API to process deposit
      const response = await walletApi.deposit({
        amountUSDT: amount,
        paymentMethodId: paymentMethodId,
      });

      // Update wallet balance with the response from backend
      setState(prev => ({
        ...prev,
        balance: {
          usdc: response.wallet.usdc,
          totalValue: response.wallet.totalValue,
          totalInvested: response.wallet.totalInvested,
          totalEarnings: response.wallet.totalEarnings,
          pendingDeposits: response.wallet.pendingDeposits,
        },
      }));

      // Reload transactions to show the new deposit
      await loadTransactions();

      // Send notification after successful deposit
      const notificationSettings = state.notificationSettings;
      await NotificationHelper.depositSuccess(
        amount,
        'Card', // Using card as default method for now
        notificationSettings,
      );
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }, [state.notificationSettings, loadTransactions]);

  const withdraw = useCallback(async (amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let notificationSettings: NotificationSettings | undefined;
    
    setState(prev => {
      if (prev.balance.usdc < amount) {
        throw new Error('Insufficient funds');
      }

      notificationSettings = prev.notificationSettings;

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

    // Send notification after state update
    await NotificationHelper.withdrawalSuccess(amount, notificationSettings);
  }, []);

  // Investment Actions
  const loadInvestments = useCallback(async () => {
    try {
      const investments = await investmentsApi.getMyInvestments();
      
      // Transform API investments to app format
      const transformedInvestments: Investment[] = investments.map((inv) => {
        // Find property from state or create minimal property object
        const propertyData = state.properties.find(p => p.id === inv.property.id) || {
          id: inv.property.id,
          displayCode: inv.property.displayCode,
          title: inv.property.title,
          images: inv.property.images || [],
          tokenPrice: inv.property.tokenPrice,
          status: inv.property.status as any,
          city: inv.property.city,
          country: inv.property.country,
        } as Property;

        return {
          id: inv.id,
          property: propertyData,
          tokens: inv.tokens,
          investedAmount: inv.investedAmount,
          currentValue: inv.currentValue,
          roi: inv.roi,
          rentalYield: inv.rentalYield,
          monthlyRentalIncome: inv.monthlyRentalIncome,
        };
      });

      setState(prev => ({
        ...prev,
        investments: transformedInvestments,
      }));
    } catch (error) {
      console.error('Error loading investments:', error);
      // Keep existing state on error
    }
  }, [state.properties]);

  const invest = useCallback(async (amount: number, propertyId: string, tokenCount: number) => {
    try {
      // Call backend API to create investment
      const investment = await investmentsApi.createInvestment({
        propertyId,
        tokenCount,
      });

      // Reload wallet balance and transactions after investment
      await loadWallet();
      await loadTransactions();
      await loadInvestments();

      // Send notification with correct parameters
      const notificationSettings = state.notificationSettings;
      const propertyTitle = investment.property?.title || 'Property';
      const investedAmount = investment.investedAmount || amount;
      
      await NotificationHelper.investmentSuccess(
        propertyTitle,
        investedAmount,
        tokenCount,
        propertyId,
        notificationSettings
      );
    } catch (error: any) {
      console.error('Error creating investment:', error);
      throw error;
    }
  }, [state.notificationSettings, loadWallet, loadTransactions, loadInvestments]);

  // Legacy invest function for backward compatibility (not used anymore)
  const investLegacy = useCallback(async (amount: number, propertyId: string, tokenCount: number) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let property: Property | undefined;
    let notificationSettings: NotificationSettings | undefined;
    let totalPortfolioValue: number = 0;
    
    setState(prev => {
      if (prev.balance.usdc < amount) {
        throw new Error('Insufficient funds');
      }

      property = prev.properties.find(p => p.id === propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      notificationSettings = prev.notificationSettings;

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
            const estimatedValue = newTokens * property!.tokenPrice * 1.15; // 15% growth estimate
            const newROI = ((estimatedValue - newInvestedAmount) / newInvestedAmount) * 100;
            
            return {
              ...inv,
              tokens: newTokens,
              investedAmount: newInvestedAmount,
              currentValue: estimatedValue,
              roi: newROI,
              monthlyRentalIncome: (estimatedValue * property!.estimatedYield / 100) / 12,
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

      // Calculate total portfolio value for milestone check
      totalPortfolioValue = updatedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);

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

    // Send notifications after state update
    if (property) {
      await NotificationHelper.investmentSuccess(
        property.title,
        amount,
        tokenCount,
        property.id,
        notificationSettings
      );

      // Check for portfolio milestones (e.g., $10k, $50k, $100k, etc.)
      const milestones = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
      const previousValue = totalPortfolioValue - (property.tokenPrice * tokenCount * 1.15);
      const crossedMilestone = milestones.find(
        milestone => previousValue < milestone && totalPortfolioValue >= milestone
      );

      if (crossedMilestone && notificationSettings) {
        await NotificationHelper.portfolioMilestone(
          `$${(crossedMilestone / 1000).toFixed(0)}k Portfolio`,
          totalPortfolioValue,
          notificationSettings
        );
      }
    }
  }, []);

  // Property Actions
  const getProperty = useCallback((id: string) => {
    return state.properties.find(p => p.id === id || p.displayCode === id);
  }, [state.properties]);

  const refreshProperties = useCallback(async () => {
    await fetchProperties();
  }, [fetchProperties]);

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

  // Load profile from backend
  const loadProfile = useCallback(async () => {
    try {
      const profile = await profileApi.getProfile();
      setState(prev => ({
        ...prev,
        userInfo: profile.userInfo as UserInfo,
        securitySettings: profile.securitySettings as SecuritySettings,
        notificationSettings: profile.notificationSettings as NotificationSettings,
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
      // Keep existing state on error
    }
  }, []);

  // Load profile on mount if authenticated
  useEffect(() => {
    const checkAndLoadProfile = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        await loadProfile();
      }
    };
    
    // Check immediately
    checkAndLoadProfile();
    
    // Also check after a short delay in case token was just set (e.g., after sign up)
    const timeout = setTimeout(checkAndLoadProfile, 2000);
    
    return () => clearTimeout(timeout);
  }, [loadProfile]);

  // Load wallet and investments on mount if authenticated
  useEffect(() => {
    const checkAndLoadData = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        await Promise.all([
          loadWallet(),
          loadTransactions(),
          loadInvestments(),
        ]);
      }
    };
    
    // Check immediately
    checkAndLoadData();
    
    // Also check after a short delay in case token was just set (e.g., after sign up)
    const timeout = setTimeout(checkAndLoadData, 2000);
    
    return () => clearTimeout(timeout);
  }, [loadWallet, loadTransactions, loadInvestments]);

  // Profile Actions
  const updateUserInfo = useCallback(async (updates: Partial<UserInfo>) => {
    try {
      // Update backend
      const profile = await profileApi.updateProfile({
        fullName: updates.fullName,
        email: updates.email,
        phone: updates.phone || undefined,
        dob: updates.dob || undefined,
        address: updates.address || undefined,
        profileImage: updates.profileImage || undefined,
      });
      
      // Update local state
      setState(prev => ({
        ...prev,
        userInfo: profile.userInfo as UserInfo,
        securitySettings: profile.securitySettings as SecuritySettings,
        notificationSettings: profile.notificationSettings as NotificationSettings,
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
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

  // Bookmark Actions
  const toggleBookmark = useCallback(async (propertyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setState(prev => {
      const isBookmarked = prev.bookmarkedPropertyIds.includes(propertyId);
      const newBookmarkedIds = isBookmarked
        ? prev.bookmarkedPropertyIds.filter(id => id !== propertyId)
        : [...prev.bookmarkedPropertyIds, propertyId];
      
      // Persist to secure storage
      SecureStore.setItemAsync(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarkedIds)).catch(
        error => console.error('Error saving bookmarks:', error)
      );
      
      return {
        ...prev,
        bookmarkedPropertyIds: newBookmarkedIds,
      };
    });
  }, []);

  const isBookmarked = useCallback((propertyId: string) => {
    return state.bookmarkedPropertyIds.includes(propertyId);
  }, [state.bookmarkedPropertyIds]);

  const getBookmarkedProperties = useCallback(() => {
    return state.properties.filter(p => state.bookmarkedPropertyIds.includes(p.id));
  }, [state.properties, state.bookmarkedPropertyIds]);

  return (
    <AppContext.Provider
      value={{
        state,
        isLoadingProperties,
        propertiesError,
        loadWallet,
        loadTransactions,
        deposit,
        withdraw,
        loadInvestments,
        invest,
        getProperty,
        refreshProperties,
        getInvestments,
        getTotalValue,
        getTotalInvested,
        getTotalROI,
        getMonthlyRentalIncome,
        loadProfile,
        updateUserInfo,
        updateSecuritySettings,
        updateNotificationSettings,
        addBankAccount,
        removeBankAccount,
        setPrimaryBankAccount,
        toggleBookmark,
        isBookmarked,
        getBookmarkedProperties,
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

