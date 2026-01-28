import React, { useState, useCallback, useMemo } from 'react';
import { useWallet } from '@/services/useWallet';
import { RestrictionModal } from '@/components/restrictions/RestrictionModal';

type RestrictionType = 'deposits' | 'withdrawals' | 'trading' | 'transfers' | 'investment' | 'general';

/**
 * Hook to check compliance and show restriction modal
 * Returns a function to check if action is allowed, and the modal component
 */
export function useRestrictionModal() {
  const { balance } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalType, setModalType] = useState<RestrictionType>('general');

  const checkAndBlock = useCallback((
    restrictionType: RestrictionType,
    onAllowed?: () => void
  ) => {
    const complianceStatus = balance?.complianceStatus;
    const restrictions = balance?.restrictions;
    
    // Debug logging
    console.log('[RestrictionModal] Checking compliance:', {
      complianceStatus,
      restrictions,
      blockedReason: balance?.blockedReason,
      balanceKeys: balance ? Object.keys(balance) : 'balance is null/undefined',
      fullBalance: balance,
    });
    
    // Check granular restrictions first
    let isBlocked = false;
    if (restrictions) {
      switch (restrictionType) {
        case 'deposits':
          isBlocked = restrictions.blockDeposits || false;
          break;
        case 'withdrawals':
          isBlocked = restrictions.blockWithdrawals || false;
          break;
        case 'trading':
          isBlocked = restrictions.blockTrading || false;
          break;
        case 'investment':
          // Investment uses blockTokenTransfers restriction (investments are token transfers)
          // Token trading = marketplace buy/sell, Token transfers = investments
          isBlocked = restrictions.blockTokenTransfers || false;
          break;
        case 'transfers':
          isBlocked = restrictions.blockTokenTransfers || false;
          break;
        case 'general':
          isBlocked = restrictions.isRestricted || restrictions.isUnderReview || false;
          break;
      }
    }
    
    // Also check overall complianceStatus
    if (!isBlocked) {
      if (complianceStatus === 'restricted') {
        // Restricted: Block everything
        isBlocked = true;
      } else if (complianceStatus === 'under_review') {
        // Under Review: Block financial actions (deposits, withdrawals, trading, investment, transfers)
        // But allow viewing (general restriction type is not blocked)
        if (restrictionType === 'deposits' || restrictionType === 'withdrawals' || 
            restrictionType === 'trading' || restrictionType === 'investment' || restrictionType === 'transfers') {
          isBlocked = true;
        }
        // 'general' type is not blocked for under_review (allows navigation)
      }
    }
    
    if (isBlocked) {
      // Different messages for 'under_review' vs 'restricted'
      const isUnderReview = complianceStatus === 'under_review';
      
      const messages = {
        deposits: {
          title: isUnderReview ? 'Account Under Review' : 'Deposits Blocked',
          default: isUnderReview 
            ? 'Your account is under review. Deposits are temporarily disabled. Please contact Blocks team for assistance.'
            : 'Your deposits have been blocked kindly contact blocks team',
        },
        withdrawals: {
          title: isUnderReview ? 'Account Under Review' : 'Withdrawals Blocked',
          default: isUnderReview
            ? 'Your account is under review. Withdrawals are temporarily disabled. Please contact Blocks team for assistance.'
            : 'Your withdrawals are blocked. Please contact Blocks team for assistance.',
        },
        trading: {
          title: isUnderReview ? 'Account Under Review' : 'Trading Blocked',
          default: isUnderReview
            ? 'Your account is under review. Trading is temporarily disabled. Please contact Blocks team for assistance.'
            : 'Trading is blocked for your account. Please contact Blocks team for assistance.',
        },
        investment: {
          title: isUnderReview ? 'Account Under Review' : 'Investment Blocked',
          default: isUnderReview
            ? 'Your account is under review. Investment is temporarily disabled. Please contact Blocks team for assistance.'
            : 'Investment is blocked for your account. Please contact Blocks team for assistance.',
        },
        transfers: {
          title: isUnderReview ? 'Account Under Review' : 'Transfers Blocked',
          default: isUnderReview
            ? 'Your account is under review. Token transfers are temporarily disabled. Please contact Blocks team for assistance.'
            : 'Token transfers are blocked for your account. Please contact Blocks team for assistance.',
        },
        general: {
          title: isUnderReview ? 'Account Under Review' : 'Account Restricted',
          default: isUnderReview
            ? 'Your account is under review. Financial transactions are temporarily disabled. Please contact Blocks team for assistance.'
            : 'Your account is restricted. Please contact Blocks team for assistance.',
        },
      };

      const messageConfig = messages[restrictionType];
      const customMessage = balance?.blockedReason || messageConfig.default;

      setModalTitle(messageConfig.title);
      setModalMessage(customMessage);
      setModalType(restrictionType);
      setModalVisible(true);
      
      return false; // Action blocked
    }

    // If account is clear, allow action
    if (onAllowed) {
      onAllowed();
    }
    return true; // Action allowed
  }, [balance?.complianceStatus, balance?.restrictions, balance?.blockedReason]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Return modal props instead of component, so component can render it directly
  const modalProps = useMemo(() => ({
    visible: modalVisible,
    onClose: closeModal,
    title: modalTitle,
    message: modalMessage,
    restrictionType: modalType,
  }), [modalVisible, modalTitle, modalMessage, modalType, closeModal]);

  return {
    checkAndBlock,
    modalProps,
  };
}
