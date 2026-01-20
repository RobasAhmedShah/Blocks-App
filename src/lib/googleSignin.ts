import Constants from 'expo-constants';

// Lazy load the Google Sign-In module to prevent crashes in Expo Go
let GoogleSignin: any = null;
let isSuccessResponse: any = null;
let GoogleSigninModule: any = null;

/**
 * Check if running in Expo Go (where native modules don't work)
 */
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

/**
 * Lazily load Google Sign-In module
 * Returns null if module is not available (Expo Go)
 */
function loadGoogleSigninModule() {
  if (GoogleSigninModule !== null) {
    return GoogleSigninModule; // Already loaded
  }

  if (isExpoGo()) {
    console.warn('⚠️ Google Sign-In: Running in Expo Go, native modules not available');
    return null;
  }

  try {
    GoogleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleSigninModule.GoogleSignin;
    isSuccessResponse = GoogleSigninModule.isSuccessResponse;
    return GoogleSigninModule;
  } catch (error) {
    console.error('Failed to load Google Sign-In module:', error);
    return null;
  }
}

// Re-export User type for TypeScript (when available)
export type User = {
  user: {
    id: string;
    name: string | null;
    email: string;
    photo: string | null;
    familyName: string | null;
    givenName: string | null;
  };
  scopes: string[];
  idToken: string | null;
  serverAuthCode: string | null;
};

/**
 * Initialize Google Sign-In
 * Must be called once at app startup
 * 
 * ⚠️ NOTE: This requires a dev build. It will NOT work in Expo Go.
 * 
 * @param webClientId - Web Client ID from Google Cloud Console
 */
export function initGoogleSignin(webClientId?: string) {
  // Check if running in Expo Go
  if (isExpoGo()) {
    console.warn(
      '⚠️ Google Sign-In: Native modules are not available in Expo Go.\n' +
      'Please use a dev build: eas build --profile development --platform android'
    );
    return;
  }

  // Try to load the module
  const module = loadGoogleSigninModule();
  if (!module || !GoogleSignin) {
    console.warn('⚠️ Google Sign-In module could not be loaded');
    return;
  }

  const clientId = webClientId ||'1016447845766-t2ssou19db7n487j61mvli1kfv19tcal.apps.googleusercontent.com';
  
  if (!clientId) {
    console.warn('Google Sign-In: No Web Client ID provided. Sign-in will not work.');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: clientId,
      offlineAccess: true, // Get refresh token for backend
    });

    console.log('✅ Google Sign-In configured');
  } catch (error) {
    console.error('❌ Failed to configure Google Sign-In:', error);
    console.warn(
      '⚠️ This feature requires a dev build. Expo Go does not support native modules.\n' +
      'Build a dev client: eas build --profile development --platform android'
    );
  }
}

/**
 * Sign in with Google using native Google account picker
 * 
 * ⚠️ NOTE: This requires a dev build. It will NOT work in Expo Go.
 * 
 * This function always shows the account picker by signing out from Google first
 * to clear any cached account selection.
 * 
 * @returns User object containing idToken and user details
 */
export async function signInWithGoogle(): Promise<User> {
  // Check if running in Expo Go
  if (isExpoGo()) {
    throw new Error(
      'Google Sign-In requires a dev build.\n\n' +
      'Expo Go does not support native modules like @react-native-google-signin/google-signin.\n\n' +
      'To use Google Sign-In:\n' +
      '1. Build a dev client: eas build --profile development --platform android\n' +
      '2. Install the APK on your device\n' +
      '3. Run: expo start --dev-client'
    );
  }

  // Try to load the module
  const module = loadGoogleSigninModule();
  if (!module || !GoogleSignin || !isSuccessResponse) {
    throw new Error(
      'Google Sign-In module not available.\n\n' +
      'This feature requires a dev build. Expo Go does not support native modules.\n\n' +
      'Build a dev client: eas build --profile development --platform android'
    );
  }

  try {
    // Check if device has Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign out from Google first to clear cached account selection
    // This ensures the account picker always shows, allowing users to choose any account
    try {
      await GoogleSignin.signOut();
      console.log('✅ Cleared previous Google sign-in to show account picker');
    } catch (signOutError) {
      // Ignore sign-out errors (e.g., if not signed in)
      // This is non-critical - we just want to ensure fresh sign-in
      console.log('ℹ️ No previous Google sign-in to clear');
    }
    
    // Sign in and get user info
    // After signing out, this will always show the account picker
    const response = await GoogleSignin.signIn();
    
    // Check if sign-in was successful
    if (!isSuccessResponse(response)) {
      throw new Error('Sign-in was cancelled');
    }
    
    const userInfo = response.data;
    
    console.log('✅ Google Sign-In successful:', {
      email: userInfo.user.email,
      name: userInfo.user.name,
    });

    return userInfo;
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    
    // Check for native module not found error
    if (error.message?.includes('TurboModuleRegistry') || error.message?.includes('RNGoogleSignin')) {
      throw new Error(
        'Google Sign-In native module not found.\n\n' +
        'This feature requires a dev build. Expo Go does not support native modules.\n\n' +
        'Build a dev client: eas build --profile development --platform android'
      );
    }
    
    // Handle specific error codes
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services is not available');
    }
    
    throw error;
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle() {
  const module = loadGoogleSigninModule();
  if (!module || !GoogleSignin) {
    console.warn('Google Sign-In module not available');
    return;
  }

  try {
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-Out successful');
  } catch (error) {
    console.error('❌ Google Sign-Out error:', error);
  }
}

/**
 * Check if user is currently signed in to Google
 */
export async function isSignedInToGoogle() {
  const module = loadGoogleSigninModule();
  if (!module || !GoogleSignin) {
    return false;
  }

  try {
    return GoogleSignin.hasPreviousSignIn();
  } catch (error) {
    return false;
  }
}

/**
 * Get current user info if signed in
 */
export async function getCurrentGoogleUser(): Promise<User | null> {
  const module = loadGoogleSigninModule();
  if (!module || !GoogleSignin) {
    return null;
  }

  try {
    const response = await GoogleSignin.signInSilently();
    
    // Check if we got a success response (not noSavedCredentialFound)
    if (response.type === 'success') {
      return response.data;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
