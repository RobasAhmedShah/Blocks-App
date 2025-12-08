# Verify FCM Key Upload - Troubleshooting Guide

## 🔍 Step 1: Verify the Upload Was Successful

Run this command to check if the FCM key is configured:

```powershell
cd Blocks-App
eas credentials
```

Then navigate:
1. Select **Android**
2. Select **production** (or the profile you uploaded to)
3. Select **Google Service Account**
4. Select **Manage your Google Service Account Key for Push Notifications (FCM V1)**

**Check the status:**
- ✅ Should show: "Google Service Account Key: Configured" or similar
- ❌ If it shows "None assigned yet" → The upload didn't work

## 🔍 Step 2: Verify Expo Account & Project

Check if you're logged in with the correct account:

```powershell
eas whoami
```

This should show the account that owns the project. The project ID in your `app.json` is:
```
"projectId": "ead54695-f47e-4652-809f-4d7992799c28"
```

Make sure:
- You're logged in with the account that owns this project
- The project owner is "robas" (from your app.json)

## 🔍 Step 3: Try Legacy FCM API Instead

Sometimes FCM V1 has issues. Let's try the Legacy API:

### Get Legacy Server Key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **blocks-1b5ba**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Find **"Cloud Messaging API (Legacy)"** section
5. Click **"Enable"** if it's disabled
6. Copy the **Server key** (it's a long string, not a JSON file)

### Upload Legacy Key:

```powershell
eas credentials
```

Then:
1. Select **Android**
2. Select **production**
3. Select **Push Notifications (Legacy): Manage your FCM (Legacy) API Key**
4. Select **Upload an FCM API Key**
5. Paste the Server key (the long string, not a file path)

## 🔍 Step 4: Check User Token Registration

Verify the user's push token is being registered:

1. **Check the database** - Query your NeonDB:
   ```sql
   SELECT id, email, "expoToken" 
   FROM users 
   WHERE id = '7df555db-52ca-47b5-afb6-170b1acdb2f7';
   ```

2. **Check app logs** - When the user logs in, you should see:
   - `✅ Expo push token obtained: ExponentPushToken[...]`
   - `📤 Registering push token with backend...`
   - `✅ Push token registered successfully`

## 🔍 Step 5: Verify Firebase Project Configuration

Make sure your Firebase project is set up correctly:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **blocks-1b5ba**
3. Go to **Project Settings** → **General** tab
4. Under **Your apps**, verify you have an Android app with:
   - **Package name:** `com.intelik.Blocks`
   - This should match your `app.json`

## 🔍 Step 6: Check Expo Project Settings

1. Go to [Expo Dashboard](https://expo.dev/)
2. Find your project: **Blocks** (project ID: `ead54695-f47e-4652-809f-4d7992799c28`)
3. Go to **Credentials** → **Android**
4. Check if FCM credentials are listed there

## 🚨 Common Issues

### Issue 1: Wrong Build Profile
- **Problem:** Uploaded to `development` but building with `production`
- **Solution:** Upload to the profile you actually use for builds

### Issue 2: Wrong Expo Account
- **Problem:** Logged in with different account than project owner
- **Solution:** `eas logout` then `eas login` with correct account

### Issue 3: Project Mismatch
- **Problem:** FCM key uploaded to different Expo project
- **Solution:** Verify project ID matches in `app.json`

### Issue 4: Service Account Permissions
- **Problem:** Service account doesn't have FCM permissions
- **Solution:** In Firebase Console → IAM & Admin → Service Accounts, ensure the service account has "Firebase Cloud Messaging API" enabled

## ✅ Quick Test After Fix

1. Send a notification from admin panel
2. Check Vercel logs - should see:
   ```
   ✅ Expo notification sent to user [userId]
   ```
   NOT the FCM error

3. Notification should appear on device

---

**Start with Step 1** - Verify the upload was successful. If it shows "None assigned yet", the upload didn't work and you need to try again.

