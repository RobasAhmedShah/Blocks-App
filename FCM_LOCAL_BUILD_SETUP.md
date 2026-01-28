# FCM Setup for Local Android Builds

## ✅ What's Already Done

1. ✅ `google-services.json` has been copied to `android/app/google-services.json`
2. ✅ Notification routing code in `app/_layout.tsx` is correct
3. ✅ Backend is configured to send notifications

## 📋 Next Steps

### Step 1: Generate Android Native Project

Since you're building locally, you need to generate the native Android project first:

```powershell
cd Blocks-App
npx expo prebuild --platform android
```

This will create the `android/build.gradle` and `android/app/build.gradle` files needed for your build script.

### Step 2: Add Google Services Plugin to Gradle

After running prebuild, you need to add the Google Services plugin:

#### A. In `android/build.gradle` (project level):

Find the `buildscript` section and add the Google Services classpath:

```gradle
buildscript {
    ext {
        // ... existing config ...
    }
    dependencies {
        // ... existing dependencies ...
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

#### B. In `android/app/build.gradle` (app level):

Add this line at the **very bottom** of the file (after all other `apply plugin` statements):

```gradle
// ... existing code ...

apply plugin: 'com.google.gms.google-services'
```

### Step 3: Verify Setup

Run the setup script to verify everything is configured:

```powershell
.\setup-fcm-local-build.ps1
```

### Step 4: Build Your APK/AAB

Now you can build using your existing script:

```powershell
.\build-release-aab.ps1
```

## 🔍 Verification Checklist

After running prebuild and adding Gradle config, verify:

- [ ] `android/app/google-services.json` exists
- [ ] `android/build.gradle` has `classpath 'com.google.gms:google-services:4.4.0'`
- [ ] `android/app/build.gradle` has `apply plugin: 'com.google.gms.google-services'` at the bottom
- [ ] Build completes successfully

## 🐛 Troubleshooting

### Error: "google-services.json not found"
- Make sure the file is in `android/app/google-services.json`
- Re-run: `copy google-services.json android\app\google-services.json`

### Error: "Plugin with id 'com.google.gms.google-services' not found"
- Make sure you added the classpath in `android/build.gradle`
- Make sure you applied the plugin in `android/app/build.gradle`

### Build fails with FCM errors
- Verify your `google-services.json` has the correct `package_name: "com.intelik.Blocks"`
- Check that the Firebase project is set up correctly

## 📝 Quick Commands Summary

```powershell
# 1. Generate Android project
npx expo prebuild --platform android

# 2. (Manually edit Gradle files as shown above)

# 3. Verify setup
.\setup-fcm-local-build.ps1

# 4. Build
.\build-release-aab.ps1
```

---

**Note:** After running `expo prebuild`, the `android/` directory will be generated. You may want to add it to `.gitignore` if you're using Continuous Native Generation (CNG), or commit it if you're managing the native code directly.

