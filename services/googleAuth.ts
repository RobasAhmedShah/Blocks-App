import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId;
const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId;

if (!GOOGLE_ANDROID_CLIENT_ID || !GOOGLE_IOS_CLIENT_ID) {
  throw new Error('Google OAuth client IDs are not configured in app.json');
}

// Use discovery document for Google OAuth
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleAuthResult {
  idToken: string;
  accessToken?: string;
}

/**
 * Sign in with Google OAuth
 * @returns Promise with Google ID token
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    // Select client ID based on platform
    const clientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;

    // For iOS, Google OAuth requires using the iOS URL scheme from the client ID
    // Format: com.googleusercontent.apps.{CLIENT_ID_WITHOUT_SUFFIX}:/oauth
    let redirectUri: string;
    
    if (Platform.OS === 'ios') {
      // Extract the client ID without the .apps.googleusercontent.com suffix
      const clientIdWithoutSuffix = clientId.replace('.apps.googleusercontent.com', '');
      // Use Google's iOS URL scheme format
      redirectUri = `com.googleusercontent.apps.${clientIdWithoutSuffix}:/oauth`;
    } else {
      // For Android, use the custom scheme
      redirectUri = AuthSession.makeRedirectUri({
        scheme: 'blocks',
        path: 'oauth',
      });
    }

    // Log for debugging
    console.log('Google OAuth Configuration:');
    console.log('- Platform:', Platform.OS);
    console.log('- Client ID:', clientId);
    console.log('- Redirect URI:', redirectUri);
    console.log('- Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'Unknown (Expo Go)');
    console.log('- App Ownership:', Constants.appOwnership || 'unknown');

    // Check if running in Expo Go
    if (Constants.appOwnership === 'expo') {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      console.error('❌ ERROR: Running in Expo Go. Google OAuth WILL NOT WORK in Expo Go!');
      console.error('❌ You MUST use a development build (expo-dev-client) for Google OAuth.');
      console.error(`❌ Build with: eas build --profile preview --platform ${platform}`);
      console.error('❌ Then install the build and run: npx expo start --dev-client');
      console.error('❌ Make sure to open the development build app (not Expo Go)');
      throw new Error(`Google OAuth requires a development build. Expo Go is not supported. Build with: eas build --profile preview --platform ${platform}`);
    }

    // Create auth request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
    });

    // Perform authentication
    const result = await request.promptAsync(discovery, {
      showInRecents: true,
    });

    if (result.type === 'success') {
      const { id_token, access_token } = result.params;

      if (!id_token) {
        throw new Error('No ID token received from Google');
      }

      return {
        idToken: id_token,
        accessToken: access_token,
      };
    } else if (result.type === 'cancel') {
      const errorMsg = 'Google sign-in was cancelled. This may be due to:\n' +
        '1. Redirect URI mismatch in Google Cloud Console\n' +
        '2. Bundle ID not registered in Google Cloud Console\n' +
        '3. Running in Expo Go (use development build instead)\n' +
        `Current redirect URI: ${redirectUri}\n` +
        `Current bundle ID: ${Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'Unknown (Expo Go)'}`;
      console.error('Google sign-in cancelled:', errorMsg);
      throw new Error(errorMsg);
    } else if (result.type === 'error') {
      const errorDetails = result.error?.message || 'Unknown error';
      const errorCode = result.error?.code || 'unknown';
      console.error('Google sign-in error:', {
        error: errorDetails,
        code: errorCode,
        redirectUri,
        clientId,
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'Unknown (Expo Go)',
      });
      throw new Error(`Google sign-in error: ${errorDetails} (Code: ${errorCode})`);
    } else {
      throw new Error('Unexpected authentication result');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

