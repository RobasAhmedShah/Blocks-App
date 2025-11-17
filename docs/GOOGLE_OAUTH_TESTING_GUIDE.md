# Google OAuth Testing Guide

## Current Setup

Your Google OAuth is configured with **Web OAuth Client** for Android (in Expo Go), which has specific limitations.

## ✅ What Works

### Android Emulator
- **Redirect URI**: `http://localhost:8081/--/oauth`
- **Status**: ✅ Configured in Google Cloud Console
- **Why it works**: Google Web OAuth accepts `localhost` for development

### iOS Physical Device / Emulator
- **OAuth Type**: Native iOS OAuth
- **Client ID**: iOS Client ID (different from Web)
- **Status**: Should work (uses native `ASWebAuthenticationSession`)

## ❌ What Doesn't Work

### Android Physical Device (Current Limitation)
- **Redirect URI**: `http://192.168.x.x:8081/--/oauth` (local network IP)
- **Status**: ❌ **Google Web OAuth rejects local network IPs**
- **Error**: `Error 400: redirect_uri_mismatch`

## Why This Happens

Google's **Web OAuth clients** only accept:
- ✅ `http://localhost` (development exception)
- ✅ `https://` URLs with valid public domains
- ❌ Local network IPs (`192.168.x.x`, `10.0.x.x`, etc.)

This is a **security restriction** by Google, not a configuration issue.

## 🔧 Solutions

### Option 1: Use Android Emulator (Recommended for Development)

**Setup:**
1. Install Android Studio or Android emulator
2. Start emulator: `emulator -avd <device_name>`
3. Run Expo: `npx expo start`
4. Press `a` to open in Android emulator
5. Sign in with Google ✅

**Pros:**
- Works immediately
- Uses `localhost` redirect
- No additional setup needed

**Cons:**
- Requires emulator installation
- Slower than physical device

---

### Option 2: Build Development Client (For Physical Device Testing)

If you need to test on a physical Android device, you must build a **development client** that uses **native Android OAuth** (not Web OAuth).

**Steps:**

1. **Create `google-services.json`** (required for native OAuth):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Add Android app with package: `com.intelik.Blocks`
   - Download `google-services.json`
   - Place in `Blocks-App/android/app/`

2. **Update `app.json`** to use native OAuth:
   ```json
   {
     "expo": {
       "plugins": [
         "@react-native-google-signin/google-signin"
       ],
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

3. **Install native Google Sign-In**:
   ```bash
   npx expo install @react-native-google-signin/google-signin
   ```

4. **Update `googleAuth.ts`** to use native SDK on dev builds

5. **Build development client**:
   ```bash
   npx eas build --profile development --platform android
   ```

6. **Install APK on physical device**

**Pros:**
- Works on physical devices
- Uses native OAuth (better UX)
- Production-ready approach

**Cons:**
- Requires build process (~10-20 minutes)
- More complex setup
- Need Firebase project

---

### Option 3: Use Expo Tunnel (Experimental)

**Try this:**
```bash
npx expo start --tunnel
```

This creates a public URL (e.g., `https://abc123.exp.direct`) that might work with Google OAuth.

**Note**: This is experimental and may not work reliably.

---

## 🎯 Recommended Workflow

### For Development (Now)
1. ✅ Use **Android Emulator** for Google OAuth testing
2. ✅ Current setup works perfectly with emulator
3. ✅ Test other features on physical device (non-OAuth)

### For Production (Later)
1. Build **development client** or **production build**
2. Configure native Android OAuth
3. Test on physical devices

---

## Current Configuration

### Google Cloud Console
- **Web OAuth Client ID**: `452166186757-ob0aov7d6l87l850ssd1fk8lqaoagg7a`
- **Authorized Redirect URIs**:
  - ✅ `http://localhost:8081/--/oauth` (works with emulator)
  - ✅ `https://auth.magic.link/...` (Magic.link)
  - ❌ Cannot add `192.168.x.x` URIs (Google restriction)

### Backend (Vercel)
- **GOOGLE_CLIENT_ID**: `452166186757-ob0aov7d6l87l850ssd1fk8lqaoagg7a` (Web Client ID)
- ✅ Correctly configured

### Frontend (app.json)
- **googleWebClientId**: `452166186757-ob0aov7d6l87l850ssd1fk8lqaoagg7a`
- ✅ Matches backend and Google Cloud Console

---

## Testing Steps (Android Emulator)

1. **Start Android Emulator**:
   ```bash
   emulator -avd Pixel_5_API_33
   # Or use Android Studio's AVD Manager
   ```

2. **Start Expo with Cache Clear**:
   ```bash
   cd Blocks-App
   npx expo start --clear
   ```

3. **Open in Emulator**:
   - Press `a` in terminal, or
   - Scan QR code from emulator's camera

4. **Test Google Sign-In**:
   - Tap "Sign in with Google"
   - Should open Google sign-in page
   - Select account
   - Redirect back to app ✅

---

## Troubleshooting

### "invalid_client" Error
- ✅ **Fixed**: Web Client ID now matches across all systems

### "redirect_uri_mismatch" Error
- **Cause**: Using physical device with local network IP
- **Solution**: Use Android emulator instead

### "Access blocked: This app's request is invalid"
- **Cause**: OAuth consent screen not configured or user not in test users
- **Solution**: 
  1. Go to Google Cloud Console → OAuth consent screen
  2. Add your email to "Test users"
  3. Wait 5-10 minutes for changes to propagate

### Magic SDK "window is not defined"
- ✅ **Fixed**: Added platform checks to avoid SSR initialization

---

## Summary

✅ **Current Status**: Google OAuth works on Android emulator
⚠️ **Limitation**: Physical devices require development client build
📱 **Next Step**: Use emulator for testing OAuth flow

Your setup is **correct** - the limitation is inherent to Google's Web OAuth policy. Use the emulator for now, and plan for a development build later if physical device testing is critical.

