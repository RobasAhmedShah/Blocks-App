import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useDepositSuccess } from '@/contexts/DepositSuccessContext';
import { Transaction } from '@/types/wallet';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_DEPOSIT_KEY = 'pending_bank_deposit_info';
const SHOWN_DEPOSIT_IDS_KEY = 'shown_deposit_success_ids';

/**
 * Global component that detects when bank transfer deposits are completed
 * and shows the success dialog from any screen
 */
export function DepositSuccessDetector() {
  const { state, loadWallet, loadTransactions } = useApp();
  const { showDepositSuccess } = useDepositSuccess();
  const shownDepositIdsRef = useRef<Set<string>>(new Set());
  const previousTransactionsRef = useRef<Set<string>>(new Set());
  const previousBalanceRef = useRef<number>(0);
  const pendingDepositInfoRef = useRef<{ initialBalance: number; expectedAmount: number } | null>(null);

  // Load shown deposit IDs and pending deposit info from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(SHOWN_DEPOSIT_IDS_KEY);
        if (stored) {
          shownDepositIdsRef.current = new Set(JSON.parse(stored));
        }
        
        // Load pending deposit info
        const pendingStored = await AsyncStorage.getItem(PENDING_DEPOSIT_KEY);
        if (pendingStored) {
          const pendingInfo = JSON.parse(pendingStored);
          pendingDepositInfoRef.current = pendingInfo;
          previousBalanceRef.current = pendingInfo.initialBalance || state.balance?.usdc || 0;
          console.log('📦 DepositSuccessDetector: Loaded pending deposit info', pendingInfo);
        }
      } catch (error) {
        console.error('Error loading deposit data:', error);
      }
    };
    loadData();
  }, [state.balance?.usdc]);

  // Watch for balance changes (primary detection method)
  useEffect(() => {
    if (!pendingDepositInfoRef.current) {
      return;
    }

    const currentBalance = state.balance?.usdc || 0;
    const previousBalance = previousBalanceRef.current;
    const initialBalance = pendingDepositInfoRef.current.initialBalance || 0;
    const expectedAmount = pendingDepositInfoRef.current.expectedAmount || 0;
    
    const balanceIncrease = currentBalance - initialBalance;
    const tolerance = 0.01;
    
    console.log('🔍 DepositSuccessDetector: Checking balance', {
      currentBalance,
      previousBalance,
      initialBalance,
      balanceIncrease,
      expectedAmount,
    });
    
    // If balance increased by the expected amount
    if (balanceIncrease >= expectedAmount - tolerance && balanceIncrease > 0.01 && currentBalance > previousBalance) {
      console.log('✅ DepositSuccessDetector: Deposit detected via balance change!', balanceIncrease);
      
      // Clear pending deposit info
      pendingDepositInfoRef.current = null;
      AsyncStorage.removeItem(PENDING_DEPOSIT_KEY).catch(console.error);
      
      // Show success dialog
      showDepositSuccess(
        'Deposit Successful',
        `Your deposit of $${balanceIncrease.toFixed(2)} has been processed successfully!`
      );
      
      // Reload transactions to get the latest
      if (loadTransactions) {
        loadTransactions();
      }
    }
    
    // Update previous balance
    if (currentBalance !== previousBalance) {
      previousBalanceRef.current = currentBalance;
    }
  }, [state.balance?.usdc, showDepositSuccess, loadTransactions]);

  // Watch for new completed deposit transactions (secondary detection method)
  useEffect(() => {
    const checkForNewDeposits = async () => {
      try {
        // Get all completed deposit transactions
        const completedDeposits = state.transactions.filter(
          (tx: Transaction) => tx.type === 'deposit' && tx.status === 'completed'
        );

        // Check for new deposits we haven't shown success for yet
        for (const deposit of completedDeposits) {
          const depositId = deposit.id || `${deposit.amount}-${deposit.date}`;
          
          // Skip if we've already shown success for this deposit
          if (shownDepositIdsRef.current.has(depositId)) {
            continue;
          }

          // Check if this is a new transaction (not in previous transactions)
          if (!previousTransactionsRef.current.has(depositId)) {
            // Check if there's a pending deposit that matches this amount
            if (pendingDepositInfoRef.current) {
              const expectedAmount = pendingDepositInfoRef.current.expectedAmount || 0;
              const tolerance = 0.01;
              
              // If the deposit amount matches what we were expecting
              if (Math.abs(deposit.amount - expectedAmount) < tolerance) {
                console.log('✅ DepositSuccessDetector: New deposit detected in transactions:', deposit);
                
                // Mark as shown
                shownDepositIdsRef.current.add(depositId);
                await AsyncStorage.setItem(
                  SHOWN_DEPOSIT_IDS_KEY,
                  JSON.stringify(Array.from(shownDepositIdsRef.current))
                );
                
                // Clear pending deposit info
                pendingDepositInfoRef.current = null;
                await AsyncStorage.removeItem(PENDING_DEPOSIT_KEY);
                
                // Show success dialog
                showDepositSuccess(
                  'Deposit Successful',
                  `Your deposit of $${deposit.amount.toFixed(2)} has been processed successfully!`
                );
                
                break; // Only show one at a time
              }
            } else {
              // No pending deposit info, but we have a new completed deposit
              // Check if it's a bank transfer deposit
              if (deposit.description?.toLowerCase().includes('bank transfer')) {
                console.log('✅ DepositSuccessDetector: New bank transfer deposit detected:', deposit);
                
                // Mark as shown
                shownDepositIdsRef.current.add(depositId);
                await AsyncStorage.setItem(
                  SHOWN_DEPOSIT_IDS_KEY,
                  JSON.stringify(Array.from(shownDepositIdsRef.current))
                );
                
                // Show success dialog
                showDepositSuccess(
                  'Deposit Successful',
                  `Your deposit of $${deposit.amount.toFixed(2)} has been processed successfully!`
                );
                
                break;
              }
            }
          }
        }

        // Update previous transactions set
        const currentIds = new Set<string>(
          state.transactions.map((tx: Transaction) => tx.id || `${tx.amount}-${tx.date}`)
        );
        previousTransactionsRef.current = currentIds;
      } catch (error) {
        console.error('Error checking for new deposits:', error);
      }
    };

    // Only check if we have transactions
    if (state.transactions.length > 0) {
      checkForNewDeposits();
    }
  }, [state.transactions, showDepositSuccess]);

  // Reload transactions periodically when we have a pending deposit
  useEffect(() => {
    // Check if we have a pending deposit
    const hasPendingDeposit = pendingDepositInfoRef.current !== null;
    
    if (!hasPendingDeposit) {
      return;
    }

    // Reload transactions every 5 seconds to catch new deposits
    const interval = setInterval(() => {
      // Check again inside interval (ref might have changed)
      if (pendingDepositInfoRef.current && loadTransactions) {
        console.log('🔄 DepositSuccessDetector: Reloading transactions to check for deposit...');
        loadTransactions();
        // Also reload wallet to check balance
        if (loadWallet) {
          loadWallet();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadTransactions, loadWallet]);

  // Reload transactions when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && pendingDepositInfoRef.current && loadTransactions) {
        console.log('🔄 DepositSuccessDetector: App became active, reloading transactions...');
        loadTransactions();
        if (loadWallet) {
          loadWallet();
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [loadTransactions, loadWallet]);

  return null; // This component doesn't render anything
}

