# Google Sign-In Setup for Blocks App (Native)

This app uses **native Google Sign-In** via `@react-native-google-signin/google-signin` for Android.

## ⚠️ Important: Dev Build Required

**Google Sign-In will NOT work in Expo Go.** This feature requires a **dev build** because it uses native modules.

### Why?
- `@react-native-google-signin/google-signin` is a **native module**
- Expo Go only includes pre-built modules, not custom native code
- Native modules must be compiled into the app binary

### Solution
You **must** use a dev build:
```bash
# Build dev client
eas build --profile development --platform android

# Install APK on device, then run:
expo start --dev-client
```

## Prerequisites

- **Dev Build Required**: Native modules don't work in Expo Go
- **Android Only**: iOS support can be added later

## Setup Steps

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**

### 2. Create OAuth Client IDs

You need **two** OAuth client IDs:

#### A. Android OAuth Client ID
- Type: **Android**
- Package name: `com.intelik.Blocks` (from `google-services.json`)
- SHA-1 fingerprint: Get from your keystore (see below)

#### B. Web OAuth Client ID  
- Type: **Web application**
- This is for backend token verification
- No redirect URIs needed for native sign-in

### 3. Get SHA-1 Fingerprint

For **debug** builds:
```bash
cd android
./gradlew signingReport
```

Look for `SHA1` under `Variant: debug` → `Config: debug`

For **release** builds, use your release keystore:
```bash
keytool -list -v -keystore android/app/release.keystore -alias blocks
```

### 4. Environment Variables

Add to your `.env`:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

Backend `.env`:
```env
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

⚠️ **Note**: Use the **Web Client ID** (not Android Client ID) for backend verification.

## How It Works

1. App calls `signInWithGoogle()` → Opens native Google account picker
2. User selects account and approves
3. App receives `idToken` and user info
4. App sends `idToken` to backend for verification
5. Backend validates token and creates session

## Testing

1. Build a dev build: `eas build --profile development --platform android`
2. Install APK on device
3. Tap "Continue with Google"
4. Select your Google account
5. Should see "Sign-in successful" in logs

## Troubleshooting

### "DEVELOPER_ERROR" or "Sign-in failed"
- Check SHA-1 fingerprint matches your keystore
- Verify package name is `com.intelik.Blocks`
- Make sure you're using Web Client ID for configuration

### "Play Services not available"
- Test on a real device or emulator with Google Play Services
- Update Google Play Services on device

## Files Changed

- `src/lib/googleSignin.ts` - Sign-in functions
- `app/_layout.tsx` - Initialization
- `app/onboarding/signin.tsx` - UI integration
