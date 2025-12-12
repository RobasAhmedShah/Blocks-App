import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kycApi, KycStatus } from '@/services/api/kyc.api';

const KYC_CACHE_KEY = '@kyc_status_cache';
const CACHE_DURATION = 30 * 1000; // 30 seconds (reduced for faster updates)
const POLLING_INTERVAL = 5 * 1000; // Poll every 5 seconds when pending

export function useKycCheck() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const hasLoadedCache = useRef(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  const loadKycStatus = useCallback(async (showLoading = true, forceRefresh = false) => {
    try {
      // Only show loading spinner if we don't have cached data
      if (showLoading && !hasLoadedCache.current) {
        setKycLoading(true);
      }
      
      const status = await kycApi.getStatus();
      
      // Ensure status is properly set - if backend returns pending but no submittedAt, treat as not_submitted
      if (status.status === 'pending' && !status.submittedAt) {
        status.status = 'not_submitted';
      }
      
      // Check if status has changed (important for detecting admin approval)
      const statusChanged = previousStatusRef.current !== status.status;
      previousStatusRef.current = status.status;
      
      setKycStatus(status);
      setIsVerified(status.status === 'verified');
      
      // Cache the status (always update cache to reflect latest)
      try {
        await AsyncStorage.setItem(KYC_CACHE_KEY, JSON.stringify({
          status,
          timestamp: Date.now(),
        }));
      } catch (cacheError) {
        console.error('Error caching KYC status:', cacheError);
      }
      
      hasLoadedCache.current = true;
      
      // If status changed to verified, stop polling
      if (statusChanged && status.status === 'verified') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
      // Only set error state if we don't have cached data
      if (!hasLoadedCache.current) {
        setKycStatus({ status: 'not_submitted' });
        setIsVerified(false);
      }
    } finally {
      setKycLoading(false);
    }
  }, []);

  // Load cached status on mount (immediate display), then fetch fresh data
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const cached = await AsyncStorage.getItem(KYC_CACHE_KEY);
        if (cached) {
          const { status, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // Use cache if less than 30 seconds old
          if (age < CACHE_DURATION) {
            setKycStatus(status);
            setIsVerified(status.status === 'verified');
            previousStatusRef.current = status.status;
            setKycLoading(false);
            hasLoadedCache.current = true;
            // Refresh in background
            loadKycStatus(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading cached KYC status:', error);
      }
      // If no cache or cache expired, fetch fresh data
      hasLoadedCache.current = false;
      loadKycStatus(true);
    };
    
    loadCachedStatus();
  }, [loadKycStatus]);

  // Auto-poll when status is pending (to catch admin approval)
  useEffect(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Start polling if status is pending
    if (kycStatus?.status === 'pending') {
      pollingIntervalRef.current = setInterval(() => {
        // Refresh status in background (no loading spinner)
        loadKycStatus(false);
      }, POLLING_INTERVAL);
    }

    // Cleanup on unmount or when status changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [kycStatus?.status, loadKycStatus]);

  const handleInvestPress = useCallback((onInvest: () => void) => {
    if (isVerified) {
      onInvest();
    } else {
      // Redirect to KYC verification screen
      router.push('../profilesettings/kyc');
    }
  }, [isVerified, router]);

  // Clear cache (useful after submitting KYC)
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(KYC_CACHE_KEY);
      hasLoadedCache.current = false;
    } catch (error) {
      console.error('Error clearing KYC cache:', error);
    }
  }, []);

  // Optimistically update KYC status (for immediate UI updates after submission)
  const setKycStatusOptimistic = useCallback((status: KycStatus) => {
    setKycStatus(status);
    setIsVerified(status.status === 'verified');
    previousStatusRef.current = status.status;
    // Also update cache immediately
    AsyncStorage.setItem(KYC_CACHE_KEY, JSON.stringify({
      status,
      timestamp: Date.now(),
    })).catch((error) => {
      console.error('Error caching optimistic KYC status:', error);
    });
    hasLoadedCache.current = true;
  }, []);

  return {
    kycStatus,
    kycLoading,
    isVerified,
    loadKycStatus,
    handleInvestPress,
    clearCache,
    setKycStatusOptimistic,
  };
}

