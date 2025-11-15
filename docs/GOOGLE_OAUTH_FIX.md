# Google OAuth Fix - Complete Solution

## 🔴 Current Problem

You're getting "Access blocked, Error 400" because:
1. **You're using Expo Go** - The redirect URI shows `exp://192.168.1.142:8081/--/oauth`
2. **Google OAuth doesn't work in Expo Go** - It requires a development build
3. **Redirect URI mismatch** - Google expects the iOS URL scheme format

## ✅ Solution Steps

### Step 1: Build a Development Build (REQUIRED)

**You MUST build a development build. Expo Go will NOT work for Google OAuth.**

```bash
cd Blocks-App
eas build --profile development --platform ios
```

This will:
- Use your actual bundle ID: `com.intelik.Blocks`
- Include all native modules (Magic SDK, react-native-webview, etc.)
- Support Google OAuth properly

**Wait for the build to complete** (usually 10-20 minutes).

### Step 2: Install the Development Build

1. After the build completes, EAS will provide a download link
2. Open the link on your iPhone
3. Install the `.ipa` file
4. Trust the developer certificate in iPhone Settings → General → VPN & Device Management

### Step 3: Verify Google Cloud Console Configuration

Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

1. **Find your iOS OAuth Client**: `452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g`
2. **Verify Bundle ID**: Should be `com.intelik.Blocks` ✅
3. **Check iOS URL Scheme**: Should show `com.googleusercontent.apps.452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g` ✅

**Note**: For iOS OAuth clients, Google automatically uses the iOS URL scheme. You don't need to manually add redirect URIs for iOS.

### Step 4: Check OAuth Consent Screen

1. Go to **OAuth consent screen**
2. If in **Testing** mode:
   - Add your Google account email as a test user
   - Save changes
3. If in **Production** mode:
   - Ensure app is verified (if required)

### Step 5: Run the Development Build

```bash
cd Blocks-App
npx expo start --dev-client
```

**Important**: 
- Open the **development build app** (not Expo Go) on your iPhone
- The app icon should be your custom app icon, not the Expo Go icon

### Step 6: Test Google OAuth

1. Open the development build app on your iPhone
2. Press the "Continue with Google" button
3. Check the console logs - you should see:
   ```
   Google OAuth Configuration:
   - Platform: ios
   - Client ID: 452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g...
   - Redirect URI: com.googleusercontent.apps.452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g:/oauth
   - Bundle ID: com.intelik.Blocks
   - App Ownership: standalone (or expo, but NOT 'expo' for Expo Go)
   ```

4. If you see "App Ownership: expo" and warnings about Expo Go, you're still using Expo Go - use the development build instead!

## 🔧 What Was Fixed

### 1. Updated Redirect URI Logic
- **Before**: Used `blocks://oauth` (doesn't work with Google's iOS OAuth)
- **After**: Uses Google's iOS URL scheme: `com.googleusercontent.apps.{CLIENT_ID}:/oauth`

### 2. Added iOS URL Scheme to app.json
- Added `CFBundleURLSchemes` to handle Google's redirect
- Includes both `blocks://` and Google's iOS URL scheme

### 3. Added Expo Go Detection
- Code now throws an error if running in Expo Go
- Provides clear instructions to build a development build

## 📋 Checklist

Before testing, ensure:
- [ ] Development build is created with `eas build --profile development --platform ios`
- [ ] Development build is installed on iPhone (not Expo Go)
- [ ] Bundle ID `com.intelik.Blocks` is registered in Google Cloud Console
- [ ] OAuth consent screen has test users (if in Testing mode)
- [ ] Running app with `npx expo start --dev-client`
- [ ] Opening the development build app (not Expo Go)
- [ ] API URL is set to `https://blocks-backend.vercel.app` in app.json

## 🚨 Common Mistakes

1. **Using Expo Go instead of development build**
   - ❌ Wrong: Opening Expo Go app
   - ✅ Right: Opening your custom development build app

2. **Not rebuilding after changes**
   - After changing `app.json`, you need to rebuild
   - Run: `eas build --profile development --platform ios`

3. **Wrong redirect URI in Google Cloud Console**
   - For iOS, you don't need to manually add redirect URIs
   - Google uses the iOS URL scheme automatically
   - Just ensure Bundle ID matches

## 🔍 Debugging

If it still doesn't work:

1. **Check console logs** when pressing Google button:
   - What redirect URI is shown?
   - What bundle ID is shown?
   - What is "App Ownership"?

2. **Verify in Google Cloud Console**:
   - Bundle ID matches exactly: `com.intelik.Blocks`
   - iOS URL scheme matches: `com.googleusercontent.apps.452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g`

3. **Test the backend API**:
   ```bash
   curl https://blocks-backend.vercel.app/api/mobile/auth/me
   ```
   Should return 401 (unauthorized), not connection error.

## 📞 Next Steps

1. Build the development build: `eas build --profile development --platform ios`
2. Install it on your iPhone
3. Run: `npx expo start --dev-client`
4. Open the development build app (not Expo Go)
5. Test Google OAuth

If you still get errors after following these steps, share the console logs and I'll help debug further.

