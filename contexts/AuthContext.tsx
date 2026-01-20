// @path: contexts/AuthContext.tsx
import * as React from 'react';
import { InteractionManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, useSegments } from 'expo-router';
import { authApi } from '@/services/api/auth.api';
import { signOutFromGoogle } from '@/src/lib/googleSignin';

// --- Define Storage Keys ---
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';
const BIOMETRIC_REFRESH_TOKEN_KEY = 'biometric_refresh_token';
const PENDING_NOTIFICATION_URL_KEY = 'pending_notification_url';

// --- Define State and Context Shapes ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
  isGuest: boolean;
}

interface AuthContextProps extends Omit<AuthState, 'token'> {
  signIn: (token: string, refreshToken: string, enableBiometrics?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  setInitialGuestMode: () => void;
}

const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);

// --- AuthProvider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = React.useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isBiometricSupported: false,
    isBiometricEnrolled: false,
    isGuest: false,
  });
  
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    // 1. Check Biometric Hardware on load
    const checkBiometricHardware = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      // Check if biometric login is enabled (stored as a flag)
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
      
      setAuthState(prev => ({
        ...prev,
        isBiometricSupported: hasHardware && isEnrolled,
        isBiometricEnrolled: biometricEnabled === 'true',
      }));
    };

    // 2. Check Auth Status on load
    const checkAuthStatus = async () => {
      try {
        await checkBiometricHardware();

        // Always check for standard token keys
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');
        
        // If biometric is enabled, don't auto-authenticate - require biometric verification
        if (biometricEnabled === 'true' && token) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false, // Require biometric verification
          }));
          return;
        }
        
        if (token) {
          // Validate token with backend
          try {
            await authApi.getMe(token);
            // Token is valid
            setAuthState(prev => ({
              ...prev,
              token: token,
              isAuthenticated: true,
              isLoading: false,
              isGuest: false, // Clear guest mode if valid token exists
            }));
            // Profile will be loaded by AppContext's useEffect when it detects the token
          } catch (error) {
            // Token is invalid or expired, try to refresh
            if (refreshToken) {
              try {
                const refreshed = await authApi.refreshToken(refreshToken);
                await SecureStore.setItemAsync(TOKEN_KEY, refreshed.token);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshed.refreshToken);
                setAuthState(prev => ({
                  ...prev,
                  token: refreshed.token,
                  isAuthenticated: true,
                  isLoading: false,
                  isGuest: false, // Clear guest mode if token refreshed
                }));
                // Profile will be loaded by AppContext's useEffect when it detects the token
              } catch (refreshError) {
                // Refresh failed, clear tokens and require login
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                setAuthState(prev => ({
                  ...prev,
                  isLoading: false,
                  isAuthenticated: false,
                }));
              }
            } else {
              // No refresh token, clear and require login
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              setAuthState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
              }));
            }
          }
        } else {
          // No tokens at all
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      } catch (e) {
        console.error('Error checking auth status:', e);
        setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      }
    };

    checkAuthStatus();
  }, []);
  
  // Helper function to navigate to pending notification URL
  const navigateToPendingNotification = async (): Promise<boolean> => {
    try {
      const pendingUrl = await SecureStore.getItemAsync(PENDING_NOTIFICATION_URL_KEY);
      if (!pendingUrl) {
        return false; // No pending URL
      }
      
      console.log('🔔 Found pending notification URL after auth, navigating to:', pendingUrl);
      // Clear the pending URL immediately
      await SecureStore.deleteItemAsync(PENDING_NOTIFICATION_URL_KEY);
      
      // Import Linking for external URLs
      const { Linking } = require('react-native');
      
      // Check if it's an external URL
      if (pendingUrl.startsWith('http://') || pendingUrl.startsWith('https://')) {
        Linking.openURL(pendingUrl).catch((err: any)=> {
          console.error('❌ Failed to open external URL:', err);
        });
        return true;
      }
      
      // Check if it looks like an external website
      const knownInternalRoutes = ['properties', 'wallet', 'portfolio', 'notifications'];
      const urlWithoutSlash = pendingUrl.startsWith('/') ? pendingUrl.slice(1) : pendingUrl;
      const firstPart = urlWithoutSlash.split('/')[0].split('?')[0];
      
      if (
        pendingUrl.includes('.') && 
        !pendingUrl.startsWith('/') && 
        !knownInternalRoutes.includes(firstPart) &&
        !firstPart.startsWith('property')
      ) {
        const externalUrl = pendingUrl.startsWith('http') ? pendingUrl : `https://${pendingUrl}`;
        Linking.openURL(externalUrl).catch((err: any) => {
          console.error('❌ Failed to open external URL:', err);
        });
        return true;
      }
      
      // Handle internal routes
      const cleanUrl = pendingUrl.startsWith('/') ? pendingUrl.slice(1) : pendingUrl;
      
      if (cleanUrl.includes('?')) {
        const [pathname, queryString] = cleanUrl.split('?');
        const params: Record<string, string> = {};
        
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
        
        if (pathname.startsWith('properties/')) {
          const propertyId = pathname.split('/')[1];
          router.replace(`/property/${propertyId}` as any);
        } else if (pathname === 'properties') {
          router.replace('/(tabs)/property' as any);
        } else if (pathname.startsWith('notifications')) {
          router.replace({
            pathname: '/notifications' as any,
            params,
          } as any);
        } else if (pathname === 'wallet' || pathname.startsWith('wallet')) {
          router.replace('/(tabs)/wallet' as any);
        } else if (pathname === 'portfolio' || pathname.startsWith('portfolio')) {
          router.replace('/(tabs)/portfolio' as any);
        } else {
          router.replace({
            pathname: pathname as any,
            params,
          } as any);
        }
      } else {
        if (cleanUrl.startsWith('properties/')) {
          const propertyId = cleanUrl.split('/')[1];
          router.replace(`/property/${propertyId}` as any);
        } else if (cleanUrl === 'properties') {
          router.replace('/(tabs)/property' as any);
        } else if (cleanUrl === 'wallet') {
          router.replace('/(tabs)/wallet' as any);
        } else if (cleanUrl === 'portfolio') {
          router.replace('/(tabs)/portfolio' as any);
        } else if (cleanUrl === 'notifications') {
          router.replace('/notifications' as any);
        } else {
          router.replace(`/${cleanUrl}` as any);
        }
      }
      
      return true; // Navigation attempted
    } catch (error) {
      console.error('Error navigating to pending notification:', error);
      return false;
    }
  };

  // 3. Handle Protected Routes
  React.useEffect(() => {
    if (authState.isLoading) return; 

    const inOnboardingGroup = segments[0] === 'onboarding';

    // Allow guest mode to access non-onboarding routes
    if (!authState.isAuthenticated && !authState.isGuest && !inOnboardingGroup) {
      // Not authenticated, not guest, and NOT in onboarding, redirect to signin
      // Use InteractionManager to defer navigation until all interactions complete
      // This prevents hooks errors during render by ensuring navigation happens after render cycle
      const interaction = InteractionManager.runAfterInteractions(() => {
        router.replace('/onboarding/signin');
      });
      
      // Cleanup function to cancel navigation if component unmounts
      return () => {
        interaction.cancel();
      };
    } else if (authState.isAuthenticated && inOnboardingGroup) {
      // Authenticated and in onboarding - check for pending notification route first
      navigateToPendingNotification().then((navigated) => {
        // If no pending notification or navigation failed, go to default home
        if (!navigated) {
          InteractionManager.runAfterInteractions(() => {
            router.replace('/(tabs)/home');
          });
        }
      });
    }
  }, [authState.isAuthenticated, authState.isGuest, authState.isLoading, segments, router]);

  // --- Auth Actions ---
  const signIn = async (token: string, refreshToken: string, enableBiometrics: boolean = false) => {
    try {
      // Always store tokens in standard keys
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      
      // If biometrics is enabled, set the flag
      if (enableBiometrics) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
      }
      
      setAuthState(prev => ({
        ...prev,
        token: token,
        isAuthenticated: true,
        isLoading: false,
        isBiometricEnrolled: enableBiometrics,
        isGuest: false, // Clear guest mode on sign in
      }));
      
      // Profile will be loaded by AppContext's useEffect when it detects the token
    } catch (e) {
      console.error('Error saving token:', e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      // Try to call logout API if we have a token
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (token) {
        try {
          await authApi.logout(token);
        } catch (error) {
          // Ignore logout API errors, still clear local tokens
          console.error('Logout API error:', error);
        }
      }
      
      // Sign out from Google to clear cached account selection
      // This ensures the account picker shows next time user signs in
      try {
        await signOutFromGoogle();
      } catch (error) {
        // Ignore Google sign-out errors (e.g., if not signed in with Google)
        console.log('Google sign-out (non-critical):', error);
      }
      
      // Clear ALL tokens and flags on sign out
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync('biometric_enabled');
      // Clean up old biometric keys if they exist (for migration)
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => {});
      
      // Use functional update to ensure state is updated correctly
      setAuthState(prev => ({
        ...prev,
        token: null,
        isAuthenticated: false,
        isBiometricEnrolled: false,
        isLoading: false, // Ensure loading is false after logout
      }));
    } catch (e) {
      console.error('Error removing token:', e);
      // Even on error, clear the auth state
      setAuthState(prev => ({
        ...prev,
        token: null,
        isAuthenticated: false,
        isBiometricEnrolled: false,
        isGuest: false,
        isLoading: false,
      }));
    }
  };

  const enterGuestMode = () => {
    setAuthState(prev => ({
      ...prev,
      isGuest: true,
      isLoading: false,
    }));
  };

  const setInitialGuestMode = () => {
    setAuthState(prev => ({
      ...prev,
      isGuest: false
    }));
  };
  const exitGuestMode = () => {
    // setAuthState(prev => ({
    //   ...prev,
    //   isGuest: false,
    // }));
    router.replace('/onboarding/signin');
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    try {
      // Check available authentication types and prefer Face ID
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to your account',
        fallbackLabel: hasFaceID ? 'Use Passcode' : undefined,
        disableDeviceFallback: false, // Allow passcode fallback if biometric fails
      });

      if (result.success) {
        // Use standard token keys - biometric is just a gate to access them
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        
        if (token) {
          // Validate token with backend
          try {
            await authApi.getMe(token);
            setAuthState(prev => ({
              ...prev,
              token: token,
              isAuthenticated: true,
              isGuest: false, // Clear guest mode on biometric login
            }));
            // Navigation will be handled by the route protection effect
            return true;
          } catch (error) {
            // Token expired, try to refresh
            if (refreshToken) {
              try {
                const refreshed = await authApi.refreshToken(refreshToken);
                await SecureStore.setItemAsync(TOKEN_KEY, refreshed.token);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshed.refreshToken);
                setAuthState(prev => ({
                  ...prev,
                  token: refreshed.token,
                  isAuthenticated: true,
                  isGuest: false, // Clear guest mode on biometric login
                }));
                // Navigation will be handled by the route protection effect
                return true;
              } catch (refreshError) {
                // Refresh failed, clear tokens
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                await SecureStore.deleteItemAsync('biometric_enabled');
                setAuthState(prev => ({
                  ...prev,
                  isBiometricEnrolled: false,
                }));
                return false;
              }
            }
            return false;
          }
        }
      }
      return false;
    } catch (e) {
      console.error('Biometric login error:', e);
      return false;
    }
  };

  const enableBiometrics = async (): Promise<boolean> => {
    try {
      // Check available authentication types and prefer Face ID
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
        fallbackLabel: hasFaceID ? 'Use Passcode' : undefined,
        disableDeviceFallback: false, // Allow passcode fallback if biometric fails
      });

      if (result.success) {
        // Check if tokens exist
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        
        if (token && refreshToken) {
          // Just set the flag - tokens stay in standard keys
          await SecureStore.setItemAsync('biometric_enabled', 'true');
          setAuthState(prev => ({ ...prev, isBiometricEnrolled: true }));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Error enabling biometrics:', e);
      return false;
    }
  };

  const disableBiometrics = async (): Promise<boolean> => {
    try {
      // Check available authentication types and prefer Face ID
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Disable Biometric Login',
        fallbackLabel: hasFaceID ? 'Use Passcode' : undefined,
        disableDeviceFallback: false, // Allow passcode fallback if biometric fails
      });

      if (result.success) {
        // Just remove the flag - tokens stay in standard keys
        await SecureStore.deleteItemAsync('biometric_enabled');
        // Clean up old biometric keys if they exist (for migration)
        await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => {});
        setAuthState(prev => ({ ...prev, isBiometricEnrolled: false }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error disabling biometrics:', e);
      return false;
    }
  };
  
  // Provide the auth state and actions
  const value = {
    signIn,
    signOut,
    enableBiometrics,
    disableBiometrics,
    loginWithBiometrics,
    enterGuestMode,
    exitGuestMode,
    setInitialGuestMode,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isBiometricSupported: authState.isBiometricSupported,
    isBiometricEnrolled: authState.isBiometricEnrolled,
    isGuest: authState.isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- useAuth Hook ---
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
