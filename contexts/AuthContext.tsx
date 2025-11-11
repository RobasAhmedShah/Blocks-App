// @path: contexts/AuthContext.tsx
import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, useSegments } from 'expo-router';
import { verifySession, getUserInfo, logout as magicLogout, getStoredDIDToken } from '@/services/magicService';

// --- Define Storage Keys ---
const TOKEN_KEY = 'auth_token';
const BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';
const MAGIC_USER_INFO_KEY = 'magic_user_info';

// --- Define State and Context Shapes ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
  userEmail: string | null;
  userWalletAddress: string | null;
}

interface AuthContextProps extends Omit<AuthState, 'token'> {
  signIn: (token: string, enableBiometrics?: boolean, userInfo?: { email?: string; publicAddress?: string }) => Promise<void>;
  signOut: () => void;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
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
    userEmail: null,
    userWalletAddress: null,
  });
  
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    // 1. Check Biometric Hardware on load
    const checkBiometricHardware = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      let biometricToken: string | null = null;
      if (hasHardware && isEnrolled) {
        // Check if we have a biometric token stored
        biometricToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      }

      setAuthState(prev => ({
        ...prev,
        isBiometricSupported: hasHardware,
        isBiometricEnrolled: !!biometricToken, // Enrolled *in our app* if token exists
      }));

      return biometricToken;
    };

    // 2. Check Auth Status on load
    const checkAuthStatus = async () => {
      try {
        const biometricToken = await checkBiometricHardware();

        if (biometricToken) {
          // If a biometric token exists, the user is "enrolled" but not yet authenticated.
          // We will wait for them to trigger loginWithBiometrics() from the signin screen.
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
          }));
        } else {
          // Check Magic session first
          const isMagicSessionValid = await verifySession();
          
          if (isMagicSessionValid) {
            // Get user info from Magic
            try {
              const userInfo = await getUserInfo();
              // Get DID token from Magic service (it stores it)
              const didToken = await getStoredDIDToken();
              // Also store in TOKEN_KEY for compatibility
              if (didToken) {
                await SecureStore.setItemAsync(TOKEN_KEY, didToken);
              }
              
              setAuthState(prev => ({
                ...prev,
                token: didToken,
                isAuthenticated: true,
                isLoading: false,
                userEmail: userInfo.email || null,
                userWalletAddress: userInfo.publicAddress || null,
              }));
            } catch (error) {
              console.error('Error fetching Magic user info:', error);
              // Fall back to stored token
              const token = await getStoredDIDToken() || await SecureStore.getItemAsync(TOKEN_KEY);
              if (token) {
                setAuthState(prev => ({
                  ...prev,
                  token: token,
                  isAuthenticated: true,
                  isLoading: false,
                }));
              } else {
                setAuthState(prev => ({
                  ...prev,
                  isLoading: false,
                  isAuthenticated: false,
                }));
              }
            }
          } else {
            // No valid session
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: false,
            }));
          }
        }
      } catch (e) {
        console.error('Error checking auth status:', e);
        setAuthState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      }
    };

    checkAuthStatus();
  }, []);
  
  // 3. Handle Protected Routes
  React.useEffect(() => {
    if (authState.isLoading) return; 

    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!authState.isAuthenticated && !inOnboardingGroup) {
      // Not authenticated and NOT in onboarding, redirect to signin
      router.replace('/onboarding/signin');
    } else if (authState.isAuthenticated && inOnboardingGroup) {
      // Authenticated and in onboarding, redirect to app home
      router.replace('/(tabs)/home'); 
    }
  }, [authState.isAuthenticated, authState.isLoading, segments, router]);

  // --- Auth Actions ---
  const signIn = async (token: string, enableBiometrics: boolean = false, userInfo?: { email?: string; publicAddress?: string }) => {
    try {
      const key = enableBiometrics ? BIOMETRIC_TOKEN_KEY : TOKEN_KEY;
      await SecureStore.setItemAsync(key, token);
      
      // Store user info if provided
      if (userInfo) {
        await SecureStore.setItemAsync(MAGIC_USER_INFO_KEY, JSON.stringify(userInfo));
      }
      
      setAuthState(prev => ({
        ...prev,
        token: token,
        isAuthenticated: true,
        isLoading: false,
        isBiometricEnrolled: enableBiometrics,
        userEmail: userInfo?.email || null,
        userWalletAddress: userInfo?.publicAddress || null,
      }));
    } catch (e) {
      console.error('Error saving token:', e);
    }
  };

  const signOut = async () => {
    try {
      // Logout from Magic first
      try {
        await magicLogout();
      } catch (error) {
        console.error('Error logging out from Magic:', error);
      }
      
      // Clear ALL keys on sign out
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      await SecureStore.deleteItemAsync(MAGIC_USER_INFO_KEY);
      
      setAuthState(prev => ({
        ...prev,
        token: null,
        isAuthenticated: false,
        isBiometricEnrolled: false,
        userEmail: null,
        userWalletAddress: null,
      }));
    } catch (e) {
      console.error('Error removing token:', e);
    }
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to your account',
      });

      if (result.success) {
        const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
        if (token) {
          setAuthState(prev => ({
            ...prev,
            token: token,
            isAuthenticated: true,
          }));
          return true;
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
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
      });

      if (result.success) {
        // Move token from standard to biometric key
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
          await SecureStore.deleteItemAsync(TOKEN_KEY); // Delete standard key
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
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Disable Biometric Login',
      });

      if (result.success) {
        // Move token from biometric to standard key
        const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
        if (token) {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY); // Delete biometric key
          setAuthState(prev => ({ ...prev, isBiometricEnrolled: false }));
          return true;
        }
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
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    isBiometricSupported: authState.isBiometricSupported,
    isBiometricEnrolled: authState.isBiometricEnrolled,
    userEmail: authState.userEmail,
    userWalletAddress: authState.userWalletAddress,
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
