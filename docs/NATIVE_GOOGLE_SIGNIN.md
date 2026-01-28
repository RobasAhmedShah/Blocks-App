# Native Google Sign-In Implementation

## Overview

This document describes the native Google Sign-In implementation for the Blocks app using `@react-native-google-signin/google-signin`.

## Implementation Details

### Package Used
- **Package**: `@react-native-google-signin/google-signin` v16.1.1
- **Type**: Native module (requires dev build)
- **Platform**: Android only (iOS can be added later)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Flow                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. User taps "Continue with Google"                        │
│     → signInWithGoogle() called                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Native Google Account Picker Opens                      │
│     → User selects account                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Google Returns User Info + idToken                      │
│     → App receives User object                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Send idToken to Backend                                 │
│     → authApi.googleLogin({ idToken, expoToken })            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Backend Verifies Token                                  │
│     → Returns JWT + user data                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Frontend Stores Session                                 │
│     → signIn(token, refreshToken)                            │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified

### 1. `src/lib/googleSignin.ts` (NEW)
Core Google Sign-In functionality:

```typescript
// Main functions:
- initGoogleSignin(webClientId?: string)
- signInWithGoogle(): Promise<User>
- signOutFromGoogle()
- isSignedInToGoogle()
- getCurrentGoogleUser(): Promise<User | null>
```

### 2. `app/_layout.tsx`
- Added `initGoogleSignin()` call on app startup (Android only)
- Runs once in useEffect when app loads

### 3. `app/onboarding/signin.tsx`
- Removed: `expo-auth-session`, `expo-web-browser`, `AuthSession` imports
- Removed: All OAuth redirect logic
- Removed: `WebBrowser.maybeCompleteAuthSession()`
- Added: Direct call to `signInWithGoogle()`
- Simplified error handling for native errors

### 4. `GOOGLE_OAUTH_SETUP.md`
- Updated with native sign-in instructions
- Removed redirect URI configuration
- Added SHA-1 fingerprint setup
- Clarified Android vs Web Client ID usage

## Configuration Requirements

### Environment Variables

```env
# Frontend (.env)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx-xxx.apps.googleusercontent.com

# Backend (.env)
GOOGLE_CLIENT_ID=xxx-xxx.apps.googleusercontent.com  # Same as above
```

### Google Cloud Console Setup

1. **Android OAuth Client**:
   - Type: Android
   - Package name: `com.intelik.Blocks`
   - SHA-1 fingerprint: From your keystore

2. **Web OAuth Client**:
   - Type: Web application
   - Used for backend token verification
   - No redirect URIs needed

## Key Benefits

### ✅ What We Gained
- **Native Experience**: Uses system Google account picker (no browser)
- **Better UX**: Faster, more reliable, feels native
- **Simpler Code**: No redirect URIs, no deep linking complexity
- **Better Security**: Tokens never pass through browser
- **Offline Access**: Can request refresh tokens for backend

### ❌ What We Removed
- `expo-auth-session` complexity
- Browser-based OAuth flow
- Custom redirect URIs (`blocks://oauth`)
- Deep linking for OAuth
- `WebBrowser.maybeCompleteAuthSession()` calls

## User Experience

### Before (Browser OAuth)
1. Tap "Sign in with Google"
2. Browser/modal opens
3. Sign in to Google in browser
4. Browser redirects to app
5. App processes redirect

### After (Native)
1. Tap "Continue with Google"
2. Native Google picker appears
3. Select account (one tap)
4. Done - instant sign-in

## Error Handling

The implementation handles these scenarios:

```typescript
// User cancels sign-in
SIGN_IN_CANCELLED → Silent return (not an error)

// Sign-in already in progress
IN_PROGRESS → Show "Already in progress" error

// Google Play Services missing
PLAY_SERVICES_NOT_AVAILABLE → Show setup instructions

// Other errors
Generic → Show friendly error message
```

## Testing

### Prerequisites
- Real Android device or emulator with Google Play Services
- Dev build (not Expo Go)
- Correct SHA-1 fingerprint configured

### Steps
1. Build dev client: `eas build --profile development --platform android`
2. Install APK on device
3. Open app → Navigate to Sign In
4. Tap "Continue with Google"
5. Select account in picker
6. Verify successful sign-in

### Debug Logs
Look for these console messages:
```
✅ Google Sign-In configured
✅ Google Sign-In successful: { email, name }
```

## Troubleshooting

### "DEVELOPER_ERROR"
**Cause**: SHA-1 fingerprint mismatch or missing
**Fix**: Run `./gradlew signingReport` and add SHA-1 to Google Console

### "Sign-in failed"
**Cause**: Wrong Client ID or package name
**Fix**: Verify `webClientId` and package name match Google Console

### "Play Services not available"
**Cause**: Testing on emulator without Google Play
**Fix**: Use device or emulator with Google Play Services

## Migration Notes

### Removed Dependencies
While `expo-auth-session` and `expo-web-browser` are still in `package.json` (used by other features), they are no longer used for Google Sign-In.

### Breaking Changes
None for users. Backend API remains the same:
- Still sends `idToken` to `/api/mobile/auth/google`
- Backend still verifies using Web Client ID
- Session flow unchanged

## Future Enhancements

1. **iOS Support**: Add iOS native sign-in (same package supports it)
2. **One Tap Sign-In**: Use Google One Tap for returning users
3. **Sign-In Hints**: Pre-fill email if user started with email/password
4. **Server Auth Code**: Get server auth code for backend offline access

## References

- [Package Documentation](https://react-native-google-signin.github.io/docs/install)
- [Google Sign-In Guide](https://developers.google.com/identity/sign-in/android/start)
- [SHA-1 Fingerprint Guide](https://developers.google.com/android/guides/client-auth)
