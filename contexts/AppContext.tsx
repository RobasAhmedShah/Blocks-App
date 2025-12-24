import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationHelper } from '@/services/notificationHelper';
import { propertiesApi } from '@/services/api/properties.api';
import { profileApi, ProfileResponse } from '@/services/api/profile.api';
import { walletApi } from '@/services/api/wallet.api';
import { transactionsApi } from '@/services/api/transactions.api';
import { investmentsApi, InvestmentResponse } from '@/services/api/investments.api';
import { useAuth } from './AuthContext';
import { normalizePropertyImages } from '@/utils/propertyUtils';

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
  addBankTransferDeposit: (amount: number, proofUrl: string) => Promise<void>;
  addBankTransferWithdrawal: (amount: number, bankDetails: any) => Promise<void>;

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
const BANK_TRANSFER_DEPOSITS_KEY = 'bank_transfer_deposits';

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const currentUserIdRef = useRef<string | null>(null);
  
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
  const { isGuest } = useAuth();

  // Function to clear all user-specific data
  const clearUserData = useCallback(() => {
    setState(prev => ({
      ...prev,
      balance: { ...initialBalance },
      transactions: [],
      investments: [],
      userInfo: { ...mockUserInfo },
      securitySettings: { ...mockSecuritySettings },
      notificationSettings: { ...mockNotificationSettings },
      bankAccounts: [],
      bookmarkedPropertyIds: [],
    }));
    currentUserIdRef.current = null;
  }, []);

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
      
      // Helper function to ensure documents have URLs with fallback
      const ensureDocumentsWithUrls = (documents: Property['documents'] | null | undefined): Property['documents'] => {
        // If documents is null, undefined, or empty array, return fallback documents
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
          return [
            { 
              name: 'Property Deed', 
              type: 'PDF', 
              verified: true,
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            },
            { 
              name: 'Appraisal Report', 
              type: 'PDF', 
              verified: true,
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            },
            { 
              name: 'Legal Opinion', 
              type: 'PDF', 
              verified: true,
              url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            },
          ];
        }
        // Ensure all existing documents have URLs (fallback to placeholder if missing)
        return documents.map(doc => ({
          name: doc.name || 'Document',
          type: doc.type || 'PDF',
          verified: doc.verified !== undefined ? doc.verified : true,
          url: doc.url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        }));
      };

      // Transform API properties to match app structure
      const transformedProperties: Property[] = allProperties.map(prop => ({
        ...prop,
        // Normalize images to handle both array and object formats
        images: normalizePropertyImages(prop.images) || [],
        // Ensure completionDate is a string (can be null from API)
        completionDate: prop.completionDate || '',
        // Ensure documents have URLs (add default documents if none exist)
        documents: ensureDocumentsWithUrls(prop.documents),
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

  // Load bank transfer transactions (deposits and withdrawals) from AsyncStorage on mount
  useEffect(() => {
    const loadBankTransferTransactions = async () => {
      try {
        const stored = await AsyncStorage.getItem(BANK_TRANSFER_DEPOSITS_KEY);
        if (stored) {
          const persistedTransactions: Transaction[] = JSON.parse(stored);
          
          setState(prev => {
            // Merge persisted transactions with existing transactions
            // Avoid duplicates by checking transaction IDs
            const existingIds = new Set(prev.transactions.map(tx => tx.id));
            const newTransactions = persistedTransactions.filter(tx => !existingIds.has(tx.id));
            
            // Calculate pending deposits only from NEW deposit transactions (not duplicates)
            const newPendingAmount = newTransactions
              .filter(tx => tx.type === 'deposit' && tx.status === 'pending')
              .reduce((sum, tx) => sum + tx.amount, 0);
            
            // Calculate balance adjustments from withdrawals
            const withdrawalAmount = newTransactions
              .filter(tx => tx.type === 'withdraw')
              .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            
            return {
              ...prev,
              transactions: [...newTransactions, ...prev.transactions],
              balance: {
                ...prev.balance,
                usdc: prev.balance.usdc - withdrawalAmount,
                pendingDeposits: (prev.balance.pendingDeposits || 0) + newPendingAmount,
              },
            };
          });
        }
      } catch (error) {
        console.error('Error loading bank transfer transactions:', error);
      }
    };
    loadBankTransferTransactions();
  }, []);

  // Wallet Actions
  const loadWallet = useCallback(async () => {
    if(isGuest){
      return;
    }
    try {
      // FIRST: Load bank transfer transactions from AsyncStorage to ensure we have the latest
      let persistedTransactions: Transaction[] = [];
      try {
        const stored = await AsyncStorage.getItem(BANK_TRANSFER_DEPOSITS_KEY);
        if (stored) {
          persistedTransactions = JSON.parse(stored);
        }
      } catch (storageError) {
        console.error('Error loading bank transactions in loadWallet:', storageError);
      }
      
      // THEN: Load backend wallet balance
      const walletBalance = await walletApi.getWallet();
      
      // Load backend transactions to check for approved bank transfers
      let approvedBankTransfers: Transaction[] = [];
      try {
        const transactionsResponse = await transactionsApi.getTransactions({
          page: 1,
          limit: 50,
        });
        approvedBankTransfers = transactionsResponse.data.filter(tx => 
          tx.type === 'deposit' && 
          tx.status === 'completed' &&
          (tx.description?.includes('Bank transfer deposit approved') || 
           tx.description?.includes('bank transfer deposit approved'))
        );
      } catch (error) {
        console.error('Error loading transactions in loadWallet:', error);
      }
      
      // Remove local pending transactions that match approved backend transactions
      let updatedPersistedTransactions = [...persistedTransactions];
      approvedBankTransfers.forEach(approvedTx => {
        const matchingPending = persistedTransactions.find(pendingTx => 
          pendingTx.status === 'pending' &&
          pendingTx.type === 'deposit' &&
          Math.abs(pendingTx.amount - approvedTx.amount) < 0.01
        );
        
        if (matchingPending) {
          updatedPersistedTransactions = updatedPersistedTransactions.filter(tx => tx.id !== matchingPending.id);
        }
      });
      
      // Update AsyncStorage if any deposits were removed
      if (updatedPersistedTransactions.length !== persistedTransactions.length) {
        await AsyncStorage.setItem(BANK_TRANSFER_DEPOSITS_KEY, JSON.stringify(updatedPersistedTransactions));
      }
      
      // Calculate pending deposits from updated AsyncStorage (source of truth for bank transfers)
      const bankTransferPendingDeposits = updatedPersistedTransactions
        .filter(tx => tx.type === 'deposit' && tx.status === 'pending')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate withdrawals from AsyncStorage
      const bankTransferWithdrawals = persistedTransactions
        .filter(tx => tx.type === 'withdraw')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Also check current transactions for any other pending deposits
      setState(prev => {
        const otherPendingDeposits = prev.transactions
          .filter(tx => 
            tx.type === 'deposit' && 
            tx.status === 'pending' && 
            !tx.id.startsWith('tx-bank-') // Exclude bank transfers (already counted)
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        // Merge backend pending deposits with bank transfer pending deposits
        const totalPendingDeposits = (walletBalance.pendingDeposits || 0) + bankTransferPendingDeposits + otherPendingDeposits;
        
        // Adjust USDC balance for bank transfer withdrawals
        const adjustedUsdc = walletBalance.usdc - bankTransferWithdrawals;
        
        return {
          ...prev,
          balance: {
            usdc: adjustedUsdc,
            totalValue: walletBalance.totalValue,
            totalInvested: walletBalance.totalInvested,
            totalEarnings: walletBalance.totalEarnings,
            pendingDeposits: totalPendingDeposits,
          },
        };
      });
    } catch (error) {
      console.error('Error loading wallet:', error);
      // On error, calculate balance adjustments from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(BANK_TRANSFER_DEPOSITS_KEY);
        if (stored) {
          const persistedTransactions: Transaction[] = JSON.parse(stored);
          const bankTransferPendingDeposits = persistedTransactions
            .filter(tx => tx.type === 'deposit' && tx.status === 'pending')
            .reduce((sum, tx) => sum + tx.amount, 0);
          
          const bankTransferWithdrawals = persistedTransactions
            .filter(tx => tx.type === 'withdraw')
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
          
          setState(prev => {
            const otherPendingDeposits = prev.transactions
              .filter(tx => 
                tx.type === 'deposit' && 
                tx.status === 'pending' && 
                !tx.id.startsWith('tx-bank-')
              )
              .reduce((sum, tx) => sum + tx.amount, 0);
            
            return {
              ...prev,
              balance: {
                ...prev.balance,
                usdc: prev.balance.usdc - bankTransferWithdrawals,
                pendingDeposits: bankTransferPendingDeposits + otherPendingDeposits,
              },
            };
          });
        } else {
          // No stored transactions, calculate from transactions only
          setState(prev => {
            const frontendPendingDeposits = prev.transactions
              .filter(tx => tx.type === 'deposit' && tx.status === 'pending')
              .reduce((sum, tx) => sum + tx.amount, 0);
            
            return {
              ...prev,
              balance: {
                ...prev.balance,
                pendingDeposits: frontendPendingDeposits,
              },
            };
          });
        }
      } catch (storageError) {
        console.error('Error loading bank transactions on wallet error:', storageError);
      }
    }
  }, [isGuest]);

  const loadTransactions = useCallback(async () => {
    try {
      // FIRST: Load bank transfer transactions from AsyncStorage (always do this first)
      let persistedTransactions: Transaction[] = [];
      try {
        const stored = await AsyncStorage.getItem(BANK_TRANSFER_DEPOSITS_KEY);
        if (stored) {
          persistedTransactions = JSON.parse(stored);
        }
      } catch (storageError) {
        console.error('Error loading bank transfer transactions from storage:', storageError);
      }
      
      // THEN: Load backend transactions
      const response = await transactionsApi.getTransactions({
        page: 1,
        limit: 50, // Load more transactions for the wallet screen
      });
      
      // Check for approved bank transfer transactions and remove matching pending local transactions
      const approvedBankTransfers = response.data.filter(tx => 
        tx.type === 'deposit' && 
        tx.status === 'completed' &&
        (tx.description?.includes('Bank transfer deposit approved') || 
         tx.description?.includes('bank transfer deposit approved'))
      );
      
      // Remove local pending transactions that match approved backend transactions
      let updatedPersistedTransactions = [...persistedTransactions];
      const depositsToRemove: string[] = [];
      
      approvedBankTransfers.forEach(approvedTx => {
        // Find matching pending local transaction by amount (within 0.01 tolerance)
        const matchingPending = persistedTransactions.find(pendingTx => 
          pendingTx.status === 'pending' &&
          pendingTx.type === 'deposit' &&
          Math.abs(pendingTx.amount - approvedTx.amount) < 0.01
        );
        
        if (matchingPending) {
          depositsToRemove.push(matchingPending.id);
          updatedPersistedTransactions = updatedPersistedTransactions.filter(tx => tx.id !== matchingPending.id);
        }
      });
      
      // Update AsyncStorage if any deposits were removed
      if (depositsToRemove.length > 0) {
        await AsyncStorage.setItem(BANK_TRANSFER_DEPOSITS_KEY, JSON.stringify(updatedPersistedTransactions));
        console.log(`[AppContext] Removed ${depositsToRemove.length} pending bank transfer deposit(s) that were approved`);
      }
      
      // FINALLY: Merge bank deposits with backend transactions
      setState(prev => {
        // Get all bank deposit IDs from updated AsyncStorage (source of truth)
        const bankDepositIds = new Set(updatedPersistedTransactions.map(tx => tx.id));
        
        // Remove any bank transactions from backend response (to avoid duplicates)
        const backendTransactionsWithoutBankTransactions = response.data.filter(
          tx => !bankDepositIds.has(tx.id)
        );
        
        // Merge: bank deposits first, then backend transactions
        const mergedTransactions = [...updatedPersistedTransactions, ...backendTransactionsWithoutBankTransactions];
        
        return {
          ...prev,
          transactions: mergedTransactions,
        };
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      // On error, still try to preserve bank transactions from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(BANK_TRANSFER_DEPOSITS_KEY);
        if (stored) {
          const persistedTransactions: Transaction[] = JSON.parse(stored);
          setState(prev => {
            // Keep existing transactions but ensure bank transactions are included
            const existingIds = new Set(prev.transactions.map(tx => tx.id));
            const newTransactions = persistedTransactions.filter(tx => !existingIds.has(tx.id));
            
            return {
              ...prev,
              transactions: [...newTransactions, ...prev.transactions],
            };
          });
        }
      } catch (storageError) {
        console.error('Error loading bank transactions on transaction error:', storageError);
      }
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

  const addBankTransferDeposit = useCallback(async (amount: number, proofUrl: string) => {
    // Create pending deposit transaction (frontend-only)
    const newTransaction: Transaction = {
      id: `tx-bank-deposit-${Date.now()}`,
      type: 'deposit',
      amount: amount,
      currency: 'USDC',
      status: 'pending',
      date: new Date().toISOString(),
      description: 'Bank Transfer Deposit (Pending Verification)',
      proofUrl: proofUrl, // Store proof URL in transaction
    };

    setState(prev => {
      const currentPending = prev.balance.pendingDeposits || 0;
      const newBalance: WalletBalance = {
        ...prev.balance,
        pendingDeposits: currentPending + amount,
      };

      // Get all bank transfer transactions (deposits and withdrawals)
      const allBankTransactions = [
        ...prev.transactions.filter(tx => tx.id.startsWith('tx-bank-')),
        newTransaction,
      ];

      // Save to AsyncStorage
      AsyncStorage.setItem(BANK_TRANSFER_DEPOSITS_KEY, JSON.stringify(allBankTransactions)).catch(error => {
        console.error('Error saving bank transfer transactions to storage:', error);
      });

      return {
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  }, []);

  const addBankTransferWithdrawal = useCallback(async (amount: number, bankDetails: any) => {
    // Create pending withdrawal transaction (frontend-only)
    const newTransaction: Transaction = {
      id: `tx-bank-withdraw-${Date.now()}`,
      type: 'withdraw',
      amount: -amount, // Negative for withdrawal
      currency: 'USDC',
      status: 'pending',
      date: new Date().toISOString(),
      description: 'Bank Transfer Withdrawal (Pending Processing)',
      bankDetails: bankDetails, // Store bank details in transaction
    };

    setState(prev => {
      const newBalance: WalletBalance = {
        ...prev.balance,
        usdc: prev.balance.usdc - amount, // Deduct from available balance
      };

      // Get all bank transfer transactions (deposits and withdrawals)
      const allBankTransactions = [
        ...prev.transactions.filter(tx => tx.id.startsWith('tx-bank-')),
        newTransaction,
      ];

      // Save to AsyncStorage
      AsyncStorage.setItem(BANK_TRANSFER_DEPOSITS_KEY, JSON.stringify(allBankTransactions)).catch(error => {
        console.error('Error saving bank transfer transactions to storage:', error);
      });

      return {
        ...prev,
        balance: newBalance,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  }, []);

  // Investment Actions
  const loadInvestments = useCallback(async () => {
    if(isGuest){
      return;
               }
    try {
      const investments = await investmentsApi.getMyInvestments();
      
      // Debug: Log certificatePath from API
      console.log('[AppContext] Investments loaded:', investments.length);
      investments.forEach((inv, idx) => {
        console.log(`[AppContext] Investment ${idx + 1}:`, {
          id: inv.id,
          propertyId: inv.property?.id,
          certificatePath: inv.certificatePath,
        });
      });
      
      // Filter out investments with zero or very small token counts (< 0.001)
      // These shouldn't appear in the portfolio
      const validInvestments = investments.filter(inv => (inv.tokens || 0) >= 0.001);
      
      console.log(`[AppContext] Filtered investments: ${validInvestments.length} valid out of ${investments.length} total`);
      
      // Group investments by property ID
      const investmentsByProperty = new Map<string, InvestmentResponse[]>();
      
      validInvestments.forEach((inv) => {
        const propertyId = inv.property.id;
        if (!investmentsByProperty.has(propertyId)) {
          investmentsByProperty.set(propertyId, []);
        }
        investmentsByProperty.get(propertyId)!.push(inv);
      });
      
      // Merge investments for the same property
      const mergedInvestments: Investment[] = Array.from(investmentsByProperty.entries()).map(([propertyId, propertyInvestments]) => {
        // Sort by purchase date (earliest first) to keep the first investment's metadata
        const sortedInvestments = [...propertyInvestments].sort((a, b) => {
          const dateA = new Date(a.purchaseDate || a.createdAt).getTime();
          const dateB = new Date(b.purchaseDate || b.createdAt).getTime();
          return dateA - dateB;
        });
        
        const firstInvestment = sortedInvestments[0];
        
        // Sum up all values
        const totalTokens = sortedInvestments.reduce((sum, inv) => sum + inv.tokens, 0);
        const totalInvestedAmount = sortedInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
        const totalCurrentValue = sortedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalMonthlyRentalIncome = sortedInvestments.reduce((sum, inv) => sum + inv.monthlyRentalIncome, 0);
        
        // Recalculate ROI based on merged totals
        const mergedROI = totalInvestedAmount > 0 
          ? ((totalCurrentValue - totalInvestedAmount) / totalInvestedAmount) * 100 
          : 0;
        
        // Recalculate rental yield based on merged totals
        const mergedRentalYield = totalInvestedAmount > 0 
          ? (totalMonthlyRentalIncome * 12 / totalInvestedAmount) * 100 
          : 0;
        
        // Collect all certificate paths from all investments for this property
        const certificates = sortedInvestments
          .map((inv) => {
            const certPath = inv.certificatePath || null;
            if (certPath) {
              console.log(`[AppContext] Found certificate for investment ${inv.id}: ${certPath}`);
            }
            return certPath;
          })
          .filter((path): path is string => {
            return !!path && typeof path === 'string' && path.trim() !== '';
          });
        
        console.log(`[AppContext] Property ${propertyId}: Collected ${certificates.length} certificate(s) from ${sortedInvestments.length} investment(s)`);
        
        // Find property from state - it should exist since properties are loaded first
        const propertyData = state.properties.find(p => p.id === firstInvestment.property.id);
        
        if (!propertyData) {
          console.warn(`Property ${firstInvestment.property.id} not found in state. Using minimal property data.`);
          // If property not found, we'll need to fetch it or use a minimal version
          // For now, we'll skip this investment or use a fallback
          // This shouldn't happen in normal flow since properties are loaded first
        }
        
        // Use property from state if available, otherwise create minimal fallback
        const property: Property = propertyData || {
          id: firstInvestment.property.id,
          displayCode: firstInvestment.property.displayCode,
          title: firstInvestment.property.title,
          location: `${firstInvestment.property.city}, ${firstInvestment.property.country}`,
          city: firstInvestment.property.city,
          country: firstInvestment.property.country,
          images: firstInvestment.property.images || [],
          tokenPrice: firstInvestment.property.tokenPrice,
          status: firstInvestment.property.status as any,
          valuation: 0,
          minInvestment: firstInvestment.property.tokenPrice,
          totalTokens: 0,
          soldTokens: 0,
          estimatedROI: 0,
          estimatedYield: 0,
          completionDate: '',
          description: '',
          amenities: [],
          builder: {
            name: '',
            rating: 0,
            projectsCompleted: 0,
          },
          features: {},
          documents: [],
          updates: [],
        } as Property;

        return {
          id: firstInvestment.id, // Use the first investment's ID
          property: property,
          tokens: totalTokens,
          investedAmount: totalInvestedAmount,
          currentValue: totalCurrentValue,
          roi: mergedROI,
          rentalYield: mergedRentalYield,
          monthlyRentalIncome: totalMonthlyRentalIncome,
          certificates: certificates, // Include all certificates from merged investments
        };
      });

      setState(prev => ({
        ...prev,
        investments: mergedInvestments,
      }));
    } catch (error) {
      console.error('Error loading investments:', error);
      // Keep existing state on error
    }
  }, [state.properties, isGuest]);

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
            // Holdings based on property's current value (no instant ROI)
            const currentValue = newTokens * property!.tokenPrice;
            
            return {
              ...inv,
              tokens: newTokens,
              investedAmount: newInvestedAmount,
              currentValue: currentValue,
              // ROI will be updated from rewards DB, not auto-calculated
              roi: inv.roi, // Keep existing ROI (will be updated from rewards DB)
              // Monthly rental income will come from rewards DB
              monthlyRentalIncome: inv.monthlyRentalIncome, // Keep existing (will be updated from rewards DB)
            };
          }
          return inv;
        });
      } else {
        // Create new investment
        // Holdings based on property's current value (no instant ROI)
        const currentValue = tokenCount * property.tokenPrice;
        const newInvestment: Investment = {
          id: `inv-${Date.now()}`,
          property: updatedProperties.find(p => p.id === propertyId)!,
          tokens: tokenCount,
          investedAmount: amount,
          currentValue: currentValue,
          // ROI starts at 0, will be updated from rewards DB
          roi: 0,
          rentalYield: property.estimatedYield,
          // Monthly rental income starts at 0, will be updated from rewards DB
          monthlyRentalIncome: 0,
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
      const userId = profile.userInfo.id;
      
      // Check if this is a different user
      if (userId && currentUserIdRef.current && currentUserIdRef.current !== userId) {
        // Different user signed in - clear old data first
        clearUserData();
      }
      
      // Update user ID reference
      currentUserIdRef.current = userId;
      
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
  }, [clearUserData]);

  // Watch for authentication changes and clear/reload data accordingly
  useEffect(() => {
    if (!isAuthenticated) {
      // User signed out - clear all user data
      clearUserData();
      return;
    }

    // User is authenticated - load data
    const loadUserData = async () => {
      try {
        // Load profile first to get user ID
        await loadProfile();
        
        // Then load other user-specific data
        await Promise.all([
          loadWallet(),
          loadTransactions(),
          loadInvestments(),
        ]);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [isAuthenticated, loadProfile, loadWallet, loadTransactions, loadInvestments, clearUserData]);

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
        addBankTransferDeposit,
        addBankTransferWithdrawal,
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

