import { Magic } from '@magic-sdk/react-native-expo';
import * as SecureStore from 'expo-secure-store';

// Initialize Magic instance with your publishable key
const MAGIC_PUBLISHABLE_KEY = 'pk_live_9E93488C0CC96A3B';
const DID_TOKEN_KEY = 'magic_did_token';

// Create Magic instance
let magicInstance: Magic | null = null;

export const getMagicInstance = (): Magic => {
  if (!magicInstance) {
    magicInstance = new Magic(MAGIC_PUBLISHABLE_KEY);
  }
  return magicInstance;
};

/**
 * Login with Email OTP (One-Time Password)
 * This handles the entire OTP flow
 */
export const loginWithEmailOTP = async (
  email: string,
  onOTPSent: () => void,
  onOTPRequired: () => Promise<string>,
  onInvalidOTP: () => void
): Promise<string | null> => {
  try {
    const magic = getMagicInstance();
    
    // Initiate OTP login with custom UI
    const handle = magic.auth.loginWithEmailOTP({ 
      email,
      showUI: false,
      deviceCheckUI: false 
    });

    return new Promise((resolve, reject) => {
      handle
        .on('email-otp-sent', async () => {
          console.log('📧 OTP sent to email');
          onOTPSent();
          
          // Get OTP from user
          const otp = await onOTPRequired();
          
          // Verify the OTP
          handle.emit('verify-email-otp', otp);
        })
        .on('invalid-email-otp', () => {
          console.log('❌ Invalid OTP');
          onInvalidOTP();
          // User can retry - we'll handle this in the UI
        })
        .on('done', async (didToken) => {
          console.log('✅ Login successful');
          
          if (didToken) {
            // Store DID token securely
            await SecureStore.setItemAsync(DID_TOKEN_KEY, didToken);
            resolve(didToken);
          } else {
            reject(new Error('No DID token received'));
          }
        })
        .on('error', (error) => {
          console.error('🚫 Magic login error:', error);
          reject(error);
        })
        .on('settled', () => {
          console.log('🏁 Magic login process settled');
        });
    });
  } catch (error) {
    console.error('Error in loginWithEmailOTP:', error);
    throw error;
  }
};

/**
 * Get user information after authentication
 * Returns user info with email and publicAddress (handles both legacy and new wallet formats)
 */
export const getUserInfo = async (): Promise<{ email?: string; publicAddress?: string }> => {
  try {
    const magic = getMagicInstance();
    const userInfo: any = await magic.user.getInfo();
    
    // Extract email
    const email = userInfo.email || undefined;
    
    // Extract publicAddress - handle both legacy and new wallet formats
    // Legacy format (SDK < v31): userInfo.publicAddress
    // New format (SDK >= v31): userInfo.wallets.ethereum.publicAddress or userInfo.wallets.eth.publicAddress
    let publicAddress: string | undefined;
    
    if (userInfo.publicAddress) {
      // Legacy format
      publicAddress = userInfo.publicAddress;
    } else if (userInfo.wallets) {
      // New format - try ethereum first, then eth
      publicAddress = userInfo.wallets.ethereum?.publicAddress || 
                      userInfo.wallets.eth?.publicAddress ||
                      undefined;
    }
    
    return {
      email,
      publicAddress,
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const magic = getMagicInstance();
    return await magic.user.isLoggedIn();
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const magic = getMagicInstance();
    await magic.user.logout();
    
    // Clear stored DID token (both Magic's key and auth token key for compatibility)
    await SecureStore.deleteItemAsync(DID_TOKEN_KEY);
    await SecureStore.deleteItemAsync('auth_token'); // Also clear auth_token for compatibility
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get stored DID token
 */
export const getStoredDIDToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(DID_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored DID token:', error);
    return null;
  }
};

/**
 * Verify if current session is valid
 */
export const verifySession = async (): Promise<boolean> => {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return false;
    
    // Also verify we have a stored DID token
    const didToken = await getStoredDIDToken();
    return !!didToken;
  } catch (error) {
    console.error('Error verifying session:', error);
    return false;
  }
};

/**
 * Export logout function with alias for AuthContext compatibility
 */
export { logout as magicLogout };

