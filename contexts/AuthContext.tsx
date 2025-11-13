// @path: contexts/AuthContext.tsx
import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, useSegments } from 'expo-router';
import { authApi } from '@/services/api/auth.api';

// --- Define Storage Keys ---
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';
const BIOMETRIC_REFRESH_TOKEN_KEY = 'biometric_refresh_token';

// --- Define State and Context Shapes ---
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
}

interface AuthContextProps extends Omit<AuthState, 'token'> {
  signIn: (token: string, refreshToken: string, enableBiometrics?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
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
          // No biometric token, check for a standard token
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          
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
              }));
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
                  }));
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
  const signIn = async (token: string, refreshToken: string, enableBiometrics: boolean = false) => {
    try {
      if (enableBiometrics) {
        await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
        await SecureStore.setItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      setAuthState(prev => ({
        ...prev,
        token: token,
        isAuthenticated: true,
        isLoading: false,
        isBiometricEnrolled: enableBiometrics,
      }));
    } catch (e) {
      console.error('Error saving token:', e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      // Try to call logout API if we have a token
      const token = await SecureStore.getItemAsync(TOKEN_KEY) || 
                    await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
      
      if (token) {
        try {
          await authApi.logout(token);
        } catch (error) {
          // Ignore logout API errors, still clear local tokens
          console.error('Logout API error:', error);
        }
      }
      
      // Clear ALL tokens on sign out
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
      
      setAuthState(prev => ({
        ...prev,
        token: null,
        isAuthenticated: false,
        isBiometricEnrolled: false,
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
        const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
        
        if (token) {
          // Validate token with backend
          try {
            await authApi.getMe(token);
            setAuthState(prev => ({
              ...prev,
              token: token,
              isAuthenticated: true,
            }));
            return true;
          } catch (error) {
            // Token expired, try to refresh
            if (refreshToken) {
              try {
                const refreshed = await authApi.refreshToken(refreshToken);
                await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, refreshed.token);
                await SecureStore.setItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, refreshed.refreshToken);
                setAuthState(prev => ({
                  ...prev,
                  token: refreshed.token,
                  isAuthenticated: true,
                }));
                return true;
              } catch (refreshError) {
                // Refresh failed, clear tokens
                await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
                await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
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
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
      });

      if (result.success) {
        // Move tokens from standard to biometric keys
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        
        if (token && refreshToken) {
          await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
          await SecureStore.setItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, refreshToken);
          await SecureStore.deleteItemAsync(TOKEN_KEY); // Delete standard keys
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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
        // Move tokens from biometric to standard keys
        const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
        
        if (token && refreshToken) {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
          await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY); // Delete biometric keys
          await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY);
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
