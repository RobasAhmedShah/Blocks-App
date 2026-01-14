import { useEffect, useState } from 'react';
import { useWallet } from '@/services/useWallet';
import { useRouter } from 'expo-router';

export interface RestrictionCheckResult {
  isRestricted: boolean;
  restrictionType?: 'deposits' | 'withdrawals' | 'trading' | 'transfers' | 'general';
  message?: string;
  complianceStatus?: string;
  blockedReason?: string | null;
}

/**
 * Hook to check account restrictions based on complianceStatus
 * Returns restriction status and details
 */
export function useAccountRestrictions(): RestrictionCheckResult {
  const { balance } = useWallet();
  const complianceStatus = balance?.complianceStatus;

  // If complianceStatus is 'restricted', account is blocked
  if (complianceStatus === 'restricted') {
    return {
      isRestricted: true,
      restrictionType: 'general',
      message: balance?.blockedReason || 'Your account is restricted. Please contact Blocks team.',
      complianceStatus,
      blockedReason: balance?.blockedReason,
    };
  }

  // If complianceStatus is 'clear' or undefined, account is not restricted
  return { 
    isRestricted: false, 
    complianceStatus: complianceStatus || 'clear',
  };
}

/**
 * Hook to check if account is restricted and show blocking screen
 * Use this in tab screens to prevent navigation when account is restricted
 * Simplified to check only complianceStatus
 */
export function useRestrictionGuard(restrictionTypes?: ('deposits' | 'withdrawals' | 'trading' | 'transfers' | 'general')[]) {
  const { balance } = useWallet();
  const router = useRouter();
  const [showRestrictionScreen, setShowRestrictionScreen] = useState(false);
  const [restrictionDetails, setRestrictionDetails] = useState<RestrictionCheckResult | null>(null);

  useEffect(() => {
    const complianceStatus = balance?.complianceStatus;
    
    // If complianceStatus is 'restricted', show blocking screen
    if (complianceStatus === 'restricted') {
      setRestrictionDetails({
        isRestricted: true,
        restrictionType: 'general',
        message: balance?.blockedReason || 'Your account is restricted. Please contact Blocks team.',
        complianceStatus,
        blockedReason: balance?.blockedReason,
      });
      setShowRestrictionScreen(true);
    } else {
      // If complianceStatus is 'clear' or undefined, allow access
      setShowRestrictionScreen(false);
      setRestrictionDetails(null);
    }
  }, [balance?.complianceStatus, balance?.blockedReason]);

  return {
    showRestrictionScreen,
    restrictionDetails,
  };
}
