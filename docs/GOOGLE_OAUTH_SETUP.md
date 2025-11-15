# Google OAuth Setup & Troubleshooting Guide

## Overview
This guide covers all scenarios for Google OAuth authentication in the Blocks App, including development, EAS preview builds, and production.

---

## Issue 1: Authentication Error ("Authentication required. Please login again")

### Root Cause
The API URL `http://192.168.1.142:3000` is a local network IP that may not be accessible from your iPhone.

### Scenarios & Solutions

#### Scenario A: Testing on Same Network (Development)
**When:** You're testing on your iPhone connected to the same Wi-Fi as your development machine.

**Solution:**
1. Ensure your iPhone and development machine are on the same Wi-Fi network
2. Verify your backend is running: `cd Blocks-Backend && npm run start:dev`
3. Check your local IP hasn't changed:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
4. Update `app.json` if IP changed:
   ```json
   "apiUrl": "http://YOUR_CURRENT_IP:3000"
   ```

#### Scenario B: Testing on Different Network (EAS Preview Build)
**When:** You've built a preview build with EAS and installed it on your iPhone.

**Solution:**
1. **Option 1: Use Production/Staging API** (Recommended)
   - Update `app.json` to use your production/staging API:
   ```json
   "apiUrl": "https://api.yourdomain.com"
   ```
   - Rebuild with EAS: `eas build --profile preview --platform ios`

2. **Option 2: Use ngrok for Local Testing**
   - Install ngrok: `npm install -g ngrok`
   - Start tunnel: `ngrok http 3000`
   - Use the HTTPS URL in `app.json`:
   ```json
   "apiUrl": "https://your-ngrok-url.ngrok.io"
   ```
   - Rebuild with EAS

3. **Option 3: Use Environment Variables with EAS**
   - Set up EAS environment variables:
   ```bash
   eas env:create --name API_URL --value https://api.yourdomain.com --environment preview
   ```
   - Update `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "env": {
           "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com"
         }
       }
     }
   }
   ```
   - Update `app.json` to use env variable:
   ```json
   "apiUrl": process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
   ```

---

## Issue 2: Google OAuth "Access Blocked"

### Root Cause
The iOS bundle ID `com.intelik.Blocks` is not properly registered in Google Cloud Console, or the redirect URI is not configured.

### Scenarios & Solutions

#### Scenario A: Development Build (Local Testing)
**When:** Testing with `expo start` or local development build.

**Requirements:**
1. **Register iOS Bundle ID in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** > **Credentials**
   - Find your iOS OAuth 2.0 Client ID: `452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g`
   - Click **Edit**
   - Under **Bundle ID**, add: `com.intelik.Blocks`
   - Under **Authorized redirect URIs**, add:
     - `blocks://oauth` (for Expo)
     - `exp://localhost:8081/--/oauth` (for Expo Go)
   - Click **Save**

2. **Verify OAuth Consent Screen:**
   - Go to **OAuth consent screen**
   - Ensure your app is in **Testing** mode (for development)
   - Add test users if needed (your Google account)

#### Scenario B: EAS Preview Build
**When:** You've built a preview build with EAS and installed it on your iPhone.

**Requirements:**
1. **Get EAS Build Bundle ID:**
   - The bundle ID should match: `com.intelik.Blocks`
   - Verify in your `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.intelik.Blocks"
   }
   ```

2. **Update Google Cloud Console:**
   - Same as Scenario A, but ensure:
     - Bundle ID: `com.intelik.Blocks` is registered
     - Redirect URI: `blocks://oauth` is added
     - OAuth consent screen is in **Testing** mode or **Production** mode

3. **For Android (if testing):**
   - Get SHA-1 fingerprint from EAS build:
   ```bash
   eas credentials
   ```
   - Add SHA-1 to Android OAuth client in Google Cloud Console

#### Scenario C: Production Build
**When:** Building for App Store/Play Store.

**Requirements:**
1. **OAuth Consent Screen:**
   - Must be in **Production** mode
   - App must be verified by Google (if using sensitive scopes)
   - Privacy policy and terms of service URLs required

2. **Bundle IDs:**
   - iOS: `com.intelik.Blocks` (must match exactly)
   - Android: `com.intelik.Blocks` (must match exactly)

3. **Redirect URIs:**
   - iOS: `blocks://oauth`
   - Android: `com.intelik.Blocks:/oauth` (or as configured)

---

## Complete Setup Checklist

### For Development (Local Testing)
- [ ] Backend running on `http://192.168.1.142:3000` (or your local IP)
- [ ] iPhone connected to same Wi-Fi network
- [ ] iOS bundle ID `com.intelik.Blocks` registered in Google Cloud Console
- [ ] Redirect URI `blocks://oauth` added to iOS OAuth client
- [ ] OAuth consent screen in **Testing** mode
- [ ] Test users added (if needed)

### For EAS Preview Build
- [ ] Production/staging API URL configured in `app.json` or EAS env variables
- [ ] iOS bundle ID `com.intelik.Blocks` registered in Google Cloud Console
- [ ] Redirect URI `blocks://oauth` added to iOS OAuth client
- [ ] OAuth consent screen in **Testing** mode (or **Production** if verified)
- [ ] Build created: `eas build --profile preview --platform ios`
- [ ] App installed on iPhone from EAS build

### For Production Build
- [ ] Production API URL configured
- [ ] OAuth consent screen in **Production** mode
- [ ] App verified by Google (if required)
- [ ] Privacy policy and terms of service URLs added
- [ ] Bundle IDs match exactly in Google Cloud Console
- [ ] All redirect URIs configured correctly

---

## Google Cloud Console Configuration Steps

### Step 1: Configure iOS OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your iOS OAuth 2.0 Client ID
5. Under **Bundle ID**, add: `com.intelik.Blocks`
6. Under **Authorized redirect URIs**, add:
   - `blocks://oauth`
   - `exp://localhost:8081/--/oauth` (for Expo Go testing)
7. Click **Save**

### Step 2: Configure OAuth Consent Screen
1. Navigate to **OAuth consent screen**
2. For development: Set to **Testing** mode
3. Add test users (your Google account email)
4. For production: Set to **Production** mode and complete verification

### Step 3: Verify Client IDs in app.json
```json
{
  "extra": {
    "googleAndroidClientId": "452166186757-unrelq5fmdrkd06dqeb0huks2b3fjeve.apps.googleusercontent.com",
    "googleIosClientId": "452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g.apps.googleusercontent.com"
  }
}
```

---

## Common Error Messages & Solutions

### "Access blocked: This app's request is invalid"
- **Cause:** Bundle ID not registered or redirect URI mismatch
- **Solution:** Verify bundle ID and redirect URI in Google Cloud Console

### "Error 400: redirect_uri_mismatch"
- **Cause:** Redirect URI doesn't match what's configured
- **Solution:** Ensure `blocks://oauth` is in authorized redirect URIs

### "Authentication required. Please login again"
- **Cause:** API URL not accessible or token expired
- **Solution:** Check API URL configuration and network connectivity

### "This app isn't verified"
- **Cause:** OAuth consent screen not verified (for production)
- **Solution:** For testing, add your email as a test user. For production, complete Google verification.

---

## Testing Checklist

### Before Testing Google OAuth:
1. [ ] Backend is running and accessible
2. [ ] API URL is correct in `app.json`
3. [ ] Bundle ID matches in Google Cloud Console
4. [ ] Redirect URI is configured
5. [ ] OAuth consent screen is in correct mode
6. [ ] Test users added (if in Testing mode)

### Testing Flow:
1. Open app on iPhone
2. Tap "Continue with Google"
3. Should redirect to Google sign-in
4. After signing in, should redirect back to app
5. Should receive JWT tokens from backend
6. Should be logged in successfully

---

## EAS Build Commands

### Build Preview for iOS:
```bash
eas build --profile preview --platform ios
```

### Build Preview for Android:
```bash
eas build --profile preview --platform android
```

### Build Production:
```bash
eas build --profile production --platform ios
```

### View Credentials:
```bash
eas credentials
```

---

## Environment Variables Setup (Optional)

### Using EAS Environment Variables:
```bash
# Set API URL for preview builds
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.yourdomain.com --environment preview

# Set API URL for production builds
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.yourdomain.com --environment production
```

### Update app.json to use env:
```json
{
  "extra": {
    "apiUrl": process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
  }
}
```

---

## Quick Fix for Current Issue

**For your current situation (iPhone with EAS preview build):**

1. **Fix API URL:**
   - Update `app.json` with production/staging API URL
   - Or use ngrok for local testing
   - Rebuild: `eas build --profile preview --platform ios`

2. **Fix Google OAuth:**
   - Go to Google Cloud Console
   - Edit iOS OAuth client: `452166186757-qelam6ha1qtarj3vjm0aiv9lu667r76g`
   - Add bundle ID: `com.intelik.Blocks`
   - Add redirect URI: `blocks://oauth`
   - Save changes
   - No rebuild needed (changes are server-side)

3. **Test again:**
   - Install new build (if API URL changed)
   - Try Google sign-in again

---

## Support Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Environment Variables](https://docs.expo.dev/build-reference/variables/)

