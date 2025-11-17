# Web OAuth Fix - Google Cloud Console Redirect URI Issue

## Problem

Google Cloud Console is rejecting `exp://localhost:8081/--/oauth` for Web application OAuth clients because:
- Web application clients **only accept**:
  - HTTPS URLs (`https://...`)
  - HTTP localhost URLs (`http://localhost:...`)
- They **do NOT accept**:
  - `exp://` schemes
  - Custom schemes like `blocks://`
  - IP addresses like `exp://192.168.1.142:...`

## Solution

Use `http://localhost:8081/--/oauth` instead of `exp://localhost:8081/--/oauth`.

### Step 1: Update Google Cloud Console

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your Web application client ID
3. In "Authorised redirect URIs", **remove** `exp://localhost:8081/--/oauth`
4. **Add** `http://localhost:8081/--/oauth`
5. Click **Save**

### Step 2: Verify the Code

The code has been updated to use `http://localhost:8081/--/oauth` for Expo Go.

### Step 3: Test

1. Make sure you're running in Expo Go
2. Run: `npx expo start`
3. Open the app in Expo Go
4. Try Google sign-in

## Important Notes

- **Web OAuth clients** have strict URI requirements
- Only `http://localhost` and `https://` URLs are accepted
- The `exp://` scheme is Expo-specific and not recognized by Google's Web OAuth clients
- This is a limitation of using Web OAuth with Expo Go

## Alternative Solution

If `http://localhost:8081/--/oauth` doesn't work with Expo Go's redirect handling, you may need to:
1. Use a development build instead of Expo Go
2. Or use a different OAuth flow that's more compatible with Expo Go

