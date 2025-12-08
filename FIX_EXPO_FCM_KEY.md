# Fix: Expo Push Notifications Not Working

## 🔴 Problem

The error in your Vercel logs shows:
```
Expo push error: Unable to retrieve the FCM server key for the recipient's app. 
Make sure you have provided a server key as directed by the Expo FCM documentation.
```

**Root Cause:** Expo Push Notification Service needs the FCM server key configured in Expo's system, even for locally built APKs.

## ✅ Solution

You need to provide the FCM server key to Expo via `eas credentials`. This is **separate** from the `google-services.json` file.

### Step 1: Get FCM Server Key from Firebase

You have two options:

#### Option A: Enable Legacy API (Easier)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **blocks-1b5ba**
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Find **"Cloud Messaging API (Legacy)"** section
5. Click **"Enable"** if it's disabled
6. Copy the **Server key** that appears

#### Option B: Use Service Account (V1 API - Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **blocks-1b5ba**
3. Go to **Project Settings** → **Service Accounts** tab
4. Click **"Generate new private key"**
5. Download the JSON file (this is your service account key)
6. You can use this JSON file with `eas credentials`

### Step 2: Configure FCM Key in Expo

Run this command:

```powershell
cd Blocks-App
eas credentials
```

Then follow these steps:
1. Select **Android**
2. Select **Push Notifications: Manage your FCM Api Key**
3. Choose one of:
   - **"Upload FCM Server Key"** (if you have the legacy server key)
   - **"Upload Service Account JSON"** (if you have the service account JSON)
4. Paste/upload your key
5. Save

### Step 3: Verify Configuration

After uploading, verify it worked:

```powershell
eas credentials
# Select Android → Push Notifications
# You should see your FCM key is configured
```

### Step 4: Test Notifications

1. **Rebuild your APK** (if you haven't already with FCM configured)
2. **Install the APK** on a device
3. **Log in** to the app (this registers the push token)
4. **Send a test notification** from admin panel
5. **Check Vercel logs** - the error should be gone

## 🔍 Why This Is Needed

- **`google-services.json`** = Needed for local Android builds (you already have this ✅)
- **FCM Server Key in Expo** = Needed for Expo Push Notification Service to deliver to Android devices (you're missing this ❌)

Even though you're building locally, the push tokens are still Expo push tokens, and Expo's servers need the FCM key to deliver notifications to Android devices.

## 📝 Important Notes

1. **You don't need to rebuild** if you already have an APK - just configure the FCM key in Expo
2. **The FCM key is stored on Expo's servers** - it's used when your backend calls Expo's push API
3. **Both `google-services.json` AND FCM key in Expo are needed** for notifications to work

## 🧪 Testing After Fix

1. Send a notification from admin panel
2. Check Vercel logs - should see:
   ```
   ✅ Expo notification sent to user [userId]
   ```
   Instead of the error message

3. Notification should appear on the device
4. Tapping notification should route to the correct page

---

**After completing Step 2, notifications should start working immediately!** 🎉

