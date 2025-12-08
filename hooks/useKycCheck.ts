import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { kycApi, KycStatus } from '@/services/api/kyc.api';

export function useKycCheck() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const loadKycStatus = useCallback(async () => {
    try {
      setKycLoading(true);
      const status = await kycApi.getStatus();
      
      // Ensure status is properly set - if backend returns pending but no submittedAt, treat as not_submitted
      if (status.status === 'pending' && !status.submittedAt) {
        status.status = 'not_submitted';
      }
      
      setKycStatus(status);
      setIsVerified(status.status === 'verified');
    } catch (error) {
      console.error('Error loading KYC status:', error);
      // If error, assume not verified
      setKycStatus({ status: 'not_submitted' });
      setIsVerified(false);
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKycStatus();
  }, [loadKycStatus]);

  const handleInvestPress = useCallback((onInvest: () => void) => {
    if (isVerified) {
      onInvest();
    } else {
      // Redirect to KYC verification screen
      router.push('../profilesettings/kyc');
    }
  }, [isVerified, router]);

  return {
    kycStatus,
    kycLoading,
    isVerified,
    loadKycStatus,
    handleInvestPress,
  };
}

