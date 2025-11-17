import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId;
const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId;
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;

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
 * Works in both Expo Go (Web OAuth) and Development Build (Native OAuth)
 * @returns Promise with Google ID token
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    const isExpoGo = Constants.appOwnership === 'expo';
    const isAndroid = Platform.OS === 'android';

    // Log for debugging
    console.log('Google OAuth Configuration:');
    console.log('- Platform:', Platform.OS);
    console.log('- App Ownership:', Constants.appOwnership || 'unknown');
    console.log('- Is Expo Go:', isExpoGo);

    // For Android (both Expo Go and Dev Build), use Web OAuth
    // Android OAuth clients don't support response_type=id_token (implicit flow)
    // Web OAuth clients support it, so we use Web Client ID for Android
    if (isAndroid) {
      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error('Google Web Client ID is required for Android. Add googleWebClientId to app.json extra config.');
      }

      console.log('📱 Using Web OAuth for Android');
      console.log('- Environment:', isExpoGo ? 'Expo Go' : 'Development Build');
      
      // Generate redirect URI dynamically - this ensures it matches Expo's expectations
      // For Web OAuth, we need http://localhost format (not exp://)
      let finalRedirectUri: string;
      
      // Generate the redirect URI that Expo would use
      const generatedUri = AuthSession.makeRedirectUri({
        path: 'oauth',
      });
      
      // Convert exp:// URI to http://localhost for Web OAuth
      if (generatedUri.startsWith('exp://')) {
        // Extract host and path from exp:// URI
        // exp://localhost:8081/--/oauth -> http://localhost:8081/--/oauth
        // exp://192.168.1.142:8081/--/oauth -> http://192.168.1.142:8081/--/oauth
        const match = generatedUri.match(/exp:\/\/([^/]+)(\/.*)/);
        if (match) {
          const [, host, path] = match;
          
          // Check if using local network IP (physical device)
          if (host.match(/^\d+\.\d+\.\d+\.\d+/)) {
            console.warn('⚠️ WARNING: Physical device detected with IP:', host);
            console.warn('⚠️ Google Web OAuth does NOT accept local network IPs.');
            console.warn('⚠️ This will result in "redirect_uri_mismatch" error.');
            console.warn('');
            console.warn('✅ SOLUTION: Use Android Emulator instead:');
            console.warn('   1. Start emulator: emulator -avd <device_name>');
            console.warn('   2. Run: npx expo start');
            console.warn('   3. Press "a" to open in emulator');
            console.warn('');
            console.warn('📱 For physical device testing, you need to:');
            console.warn('   - Build a development client with native OAuth');
            console.warn('   - See: docs/GOOGLE_OAUTH_TESTING_GUIDE.md');
            console.warn('');
            
            // Force localhost for consistency (will fail, but with better error)
            finalRedirectUri = 'http://localhost:8081/--/oauth';
          } else {
            finalRedirectUri = `http://${host}${path}`;
          }
        } else {
          // Fallback to standard localhost
          finalRedirectUri = 'http://localhost:8081/--/oauth';
        }
      } else if (generatedUri.startsWith('http://') || generatedUri.startsWith('https://')) {
        // Already in the correct format
        finalRedirectUri = generatedUri;
      } else {
        // Fallback to standard localhost
        finalRedirectUri = 'http://localhost:8081/--/oauth';
      }

      console.log('- Client ID (Web):', GOOGLE_WEB_CLIENT_ID);
      console.log('- Redirect URI:', finalRedirectUri);
      console.log('- Full OAuth URL will be logged below');

      // Use Web OAuth with id_token response type
      const nonce = Math.random().toString(36).substring(2, 15);
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(finalRedirectUri)}` +
        `&response_type=id_token` +
        `&scope=openid profile email` +
        `&nonce=${nonce}`;

      console.log('🔗 OAuth Request Details:');
      console.log('- Auth URL (first 100 chars):', authUrl.substring(0, 100) + '...');
      console.log('- Client ID:', GOOGLE_WEB_CLIENT_ID);
      console.log('- Redirect URI:', finalRedirectUri);
      console.log('- Response Type: id_token');
      console.log('- Nonce:', nonce);

      // Start OAuth flow using WebBrowser (works in Expo Go)
      const result = await WebBrowser.openAuthSessionAsync(authUrl, finalRedirectUri);

      if (result.type === 'success' && result.url) {
        // Extract id_token from the redirect URL
        // For response_type=id_token, the token is in the URL fragment (after #)
        const urlParts = result.url.split('#');
        const fragment = urlParts.length > 1 ? urlParts[1] : '';
        const params = new URLSearchParams(fragment);
        
        // Also check query params (some flows use ? instead of #)
        if (!params.get('id_token')) {
          const queryParts = result.url.split('?');
          const query = queryParts.length > 1 ? queryParts[1] : '';
          const queryParams = new URLSearchParams(query);
          const idTokenFromQuery = queryParams.get('id_token');
          if (idTokenFromQuery) {
            params.set('id_token', idTokenFromQuery);
          }
        }

        const idToken = params.get('id_token');

        if (!idToken) {
          console.error('Failed to extract id_token from URL:', result.url);
          throw new Error('No ID token received from Google');
        }

        console.log('✅ Google OAuth successful (Web)');
        return {
          idToken,
          accessToken: params.get('access_token') || undefined,
        };
      } else if (result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled');
      } else {
        const errorMsg = result.type === 'dismiss' ? 'User dismissed the authentication' : 'Unknown error';
        console.error('Google OAuth error:', errorMsg);
        throw new Error(`Google sign-in error: ${errorMsg}`);
      }
    }

    // For iOS or Development Build, use native OAuth flow
    const clientId = Platform.OS === 'ios' ? GOOGLE_IOS_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID;
    let redirectUri: string;
    
    if (Platform.OS === 'ios') {
      // Extract the client ID without the .apps.googleusercontent.com suffix
      const clientIdWithoutSuffix = clientId.replace('.apps.googleusercontent.com', '');
      // Use Google's iOS URL scheme format
      redirectUri = `com.googleusercontent.apps.${clientIdWithoutSuffix}:/oauth`;
    } else {
      // For Android, use the reverse client ID format (similar to iOS)
      // Google doesn't accept custom schemes like blocks://oauth for Android OAuth clients
      const clientIdWithoutSuffix = clientId.replace('.apps.googleusercontent.com', '');
      redirectUri = `com.googleusercontent.apps.${clientIdWithoutSuffix}:/oauth`;
    }

    console.log('📱 Using Native OAuth flow');
    console.log('- Client ID:', clientId);
    console.log('- Redirect URI:', redirectUri);
    console.log('- Bundle ID:', Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'Unknown');

    // For Android, manually construct the OAuth URL to avoid PKCE issues
    // AuthRequest with ResponseType.IdToken adds PKCE which Android doesn't support
    if (Platform.OS === 'android') {
      const nonce = Math.random().toString(36).substring(2, 15);
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=openid profile email` +
        `&nonce=${nonce}`;

      // Use WebBrowser for Android to avoid PKCE issues
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Extract id_token from the redirect URL
        const urlParts = result.url.split('#');
        const fragment = urlParts.length > 1 ? urlParts[1] : '';
        const params = new URLSearchParams(fragment);
        
        // Also check query params
        if (!params.get('id_token')) {
          const queryParts = result.url.split('?');
          const query = queryParts.length > 1 ? queryParts[1] : '';
          const queryParams = new URLSearchParams(query);
          const idTokenFromQuery = queryParams.get('id_token');
          if (idTokenFromQuery) {
            params.set('id_token', idTokenFromQuery);
          }
        }

        const idToken = params.get('id_token');

        if (!idToken) {
          console.error('Failed to extract id_token from URL:', result.url);
          throw new Error('No ID token received from Google');
        }

        console.log('✅ Google OAuth successful (Android Native)');
        return {
          idToken,
          accessToken: params.get('access_token') || undefined,
        };
      } else if (result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled');
      } else {
        const errorMsg = result.type === 'dismiss' ? 'User dismissed the authentication' : 'Unknown error';
        console.error('Google OAuth error:', errorMsg);
        throw new Error(`Google sign-in error: ${errorMsg}`);
      }
    }

    // For iOS, use AuthRequest (iOS supports PKCE properly)
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

