# Android OAuth Fix - invalid_client Error

## Current Error
**Error 401: invalid_client** - "The OAuth client was not found"

## Root Cause
The redirect URI being used doesn't match what's configured in Google Cloud Console, OR the redirect URI format is incorrect.

## Solution

### Step 1: Check the Generated Redirect URI

When you run the app, check the console logs. You should see:
```
- Redirect URI: http://localhost:8081/--/oauth
```
OR
```
- Redirect URI: http://192.168.1.142:8081/--/oauth
```

**Copy the exact redirect URI from the console logs.**

### Step 2: Add Redirect URI to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your **Web application** client: `452166186757-ob0aov7d61871850ssd1fk8lqaoagg7a`
4. Click on it to edit
5. In **"Authorised redirect URIs"**, add:
   - `http://localhost:8081/--/oauth` (for localhost)
   - `http://192.168.1.142:8081/--/oauth` (if your local IP is different - check console logs)
6. **Important**: The redirect URI must match EXACTLY (including the `--` in the path)
7. Click **Save**

### Step 3: Verify Client ID

Make sure the Web Client ID in `app.json` matches exactly:
```json
"googleWebClientId": "452166186757-ob0aov7d61871850ssd1fk8lqaoagg7a.apps.googleusercontent.com"
```

### Step 4: Wait for Propagation

After saving in Google Cloud Console, wait **5-10 minutes** for changes to propagate.

### Step 5: Test Again

1. Restart the app: `npx expo start -c`
2. Try Google sign-in
3. Check the console logs for the exact redirect URI being used
4. Make sure that exact URI is in Google Cloud Console

## Common Issues

### Issue 1: Redirect URI Mismatch
- **Symptom**: Error 401: invalid_client
- **Fix**: Ensure the redirect URI in Google Cloud Console matches EXACTLY what's in the console logs

### Issue 2: Missing `--` in Path
- **Symptom**: Redirect URI doesn't match
- **Fix**: The path must be `/--/oauth` (with double dash), not `/oauth`

### Issue 3: Wrong Client ID
- **Symptom**: Error 401: invalid_client
- **Fix**: Verify the Web Client ID in `app.json` matches the one in Google Cloud Console

## Testing Checklist

- [ ] Web Client ID is correct in `app.json`
- [ ] Redirect URI from console logs is added to Google Cloud Console
- [ ] Redirect URI matches exactly (including `--` in path)
- [ ] Both `http://localhost:8081/--/oauth` and your local IP version are added
- [ ] Waited 5-10 minutes after saving
- [ ] Restarted the app with `npx expo start -c`

