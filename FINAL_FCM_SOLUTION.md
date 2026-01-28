# ✅ FINAL FCM SOLUTION - Complete Guide

## 🎯 Problem
Notifications not working in standalone APK. Error in Vercel logs:
```
Expo push error: Unable to retrieve the FCM server key for the recipient's app
```

## ✅ Solution Status

### ✓ Local Build Setup (COMPLETE)
Your local Android build is already configured correctly:
- ✅ `google-services.json` is in `android/app/`
- ✅ Google Services classpath in `android/build.gradle`
- ✅ Google Services plugin applied in `android/app/build.gradle`

### ⚠️ EAS Credentials (NEEDS ACTION)
You need to upload the FCM Service Account Key to Expo:

## 📋 What You Need to Do

### Option A: Upload FCM V1 Service Account (Recommended)

**You already have the file:** `blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json`

**Steps:**

1. **Run the command:**
   ```powershell
   cd Blocks-App
   eas credentials
   ```

2. **Navigate through menus:**
   - Select: **Android**
   - Select: **production**
   - Select: **Google Service Account**
   - Select: **Manage your Google Service Account Key for Push Notifications (FCM V1)**
   - Select: **Upload a Google Service Account Key**

3. **When prompted for file path, enter:**
   ```
   blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json
   ```

4. **Press Enter** to upload

5. **Verify:** You should see "Successfully uploaded"

---

### Option B: Use Legacy FCM API (If Option A fails)

**Steps:**

1. **Get Legacy Server Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: **blocks-1b5ba**
   - Go to **Project Settings** → **Cloud Messaging** tab
   - Find **"Cloud Messaging API (Legacy)"** section
   - Click **"Enable"** if it's disabled
   - Copy the **Server key** (it's a long string like: `AAAAxxxx...`)

2. **Upload to EAS:**
   ```powershell
   eas credentials
   ```
   
   Then:
   - Select: **Android**
   - Select: **production**
   - Select: **Push Notifications (Legacy): Manage your FCM (Legacy) API Key**
   - Select: **Upload an FCM API Key**
   - Paste the Server key (the string, NOT a file path)

---

## 🧪 Testing After Upload

### Step 1: Verify Upload
```powershell
eas credentials
```
Navigate to Android → production → Google Service Account (or Push Notifications)
Should show: **"Configured"** ✅

### Step 2: Test Notification
1. **Send notification** from your admin panel
2. **Check Vercel logs** - should see:
   ```
   ✅ Expo notification sent to user [userId]
   ```
   NOT the FCM error anymore

3. **Notification should appear** on your APK device

---

## ⚡ Important Notes

### No Rebuild Required!
- ✅ After uploading FCM key to EAS, notifications work **immediately**
- ✅ You don't need to rebuild your APK
- ✅ Existing APK will start receiving notifications

### Local vs EAS Builds
- **Local builds** (via Gradle): Only need `google-services.json` ✅ (already done)
- **EAS builds**: Need FCM key uploaded via `eas credentials` ⚠️ (needs to be done)

### Troubleshooting

**If upload doesn't work:**
1. Check you're logged in: `eas whoami`
2. Should show: **robas** (the project owner from app.json)
3. If wrong account: `eas logout` then `eas login`

**If Legacy API is disabled:**
- Firebase might require you to enable billing for Legacy API
- In that case, use Option A (FCM V1 with Service Account)

**If still no notifications:**
1. Check user's `expoToken` in database:
   ```sql
   SELECT id, email, "expoToken" 
   FROM users 
   WHERE id = '7df555db-52ca-47b5-afb6-170b1acdb2f7';
   ```
2. If `expoToken` is null, user needs to log out and log back in

---

## 📁 Files Status

### ✅ Already Configured
- `Blocks-App/google-services.json` ✓
- `Blocks-App/android/app/google-services.json` ✓
- `Blocks-App/android/build.gradle` ✓ (Google Services classpath added)
- `Blocks-App/android/app/build.gradle` ✓ (Google Services plugin applied)
- `Blocks-App/blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json` ✓

### ⚠️ Needs Action
- Upload Service Account JSON to EAS (see Option A above)

---

## 🎯 Final Checklist

- [ ] Run `eas credentials`
- [ ] Navigate to Android → production → Google Service Account → FCM V1
- [ ] Upload `blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json`
- [ ] Verify upload shows "Configured"
- [ ] Test: Send notification from admin panel
- [ ] Check Vercel logs for success message (not FCM error)
- [ ] Notification appears on APK device

---

## 🚀 Summary

**What's done:**
- Local Android build fully configured for FCM
- All necessary files in place

**What you need to do:**
- Upload Service Account JSON to EAS using `eas credentials`
- Test notifications

**Expected result:**
- Notifications work immediately after EAS upload
- No rebuild required
- Vercel logs show success instead of FCM error

**Time required:**
- 5 minutes to upload key
- Immediate effect (no waiting for builds)

---

**Need help?** Run the setup script:
```powershell
cd Blocks-App
powershell -ExecutionPolicy Bypass -File FCM_COMPLETE_SETUP.ps1
```

