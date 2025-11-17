# Web OAuth Setup for Expo Go (Android)

This guide explains how to set up Google OAuth to work in **Expo Go** for Android using Web OAuth.

## ✅ What This Solves

- ✅ Works in **Expo Go** (no dev client build needed)
- ✅ Works on **Android emulator**
- ✅ Works on **physical Android devices**
- ✅ Works **immediately** (no APK build required)
- ✅ Uses **Web OAuth** (browser popup)

## 📋 Prerequisites

1. Google Cloud Console access
2. Your project already has Android and iOS OAuth clients configured

## 🔧 Step 1: Create Web OAuth Client in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application** as the application type
6. Give it a name (e.g., "Blocks App - Web OAuth")
7. Under **Authorized redirect URIs**, add:
   - `blocks://oauth`
   - `exp://localhost:8081/--/oauth` (for local testing)
   - `exp://192.168.1.142:8081/--/oauth` (replace with your local IP if needed)
8. Click **Create**
9. **Copy the Client ID** (it will look like: `452166186757-xxxxxxxxxxxxx.apps.googleusercontent.com`)

## 🔧 Step 2: Update app.json

Add the Web Client ID to `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleWebClientId": "YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com"
    }
  }
}
```

Replace `YOUR_WEB_CLIENT_ID_HERE` with the Client ID you copied in Step 1.

## 🔧 Step 3: Update Backend Environment Variable

The backend needs the **Web Client ID** to verify tokens. Update your backend `.env`:

```env
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Important**: The backend's `GOOGLE_CLIENT_ID` should be the **Web Client ID** because it's used to verify ID tokens from all client types (Web, Android, iOS).

## ✅ How It Works

1. **In Expo Go (Android)**: Uses Web OAuth flow
   - Opens a browser popup
   - User signs in with Google
   - Returns with `id_token` in the redirect URL
   - Token is sent to backend for verification

2. **In Development Build**: Uses Native OAuth flow
   - Uses Android/iOS client IDs
   - Native Google sign-in experience

## 🧪 Testing

1. Make sure you're running in **Expo Go** (not a dev client build)
2. Run: `npx expo start`
3. Open the app in Expo Go on your Android device/emulator
4. Tap "Continue with Google"
5. You should see a browser popup for Google sign-in
6. After signing in, you should be redirected back to the app

## ⚠️ Important Notes

- **Web OAuth** uses a browser popup (not native Google button)
- This works in **Expo Go** but requires a **Web Client ID**
- The backend must use the **Web Client ID** to verify tokens
- For production, you may want to use a development build for better UX

## 🔍 Troubleshooting

### "Google Web Client ID is required for Expo Go"
- Make sure you added `googleWebClientId` to `app.json` > `extra`

### "No ID token received from Google"
- Check that the redirect URI in Google Cloud Console matches `blocks://oauth`
- Verify the Web Client ID is correct

### "Invalid Google token" (backend error)
- Make sure `GOOGLE_CLIENT_ID` in backend `.env` is the **Web Client ID**
- The Web Client ID must match the one used in the app

### Redirect URI mismatch
- Add `blocks://oauth` to **Authorized redirect URIs** in Google Cloud Console
- For local testing, also add `exp://localhost:8081/--/oauth`

