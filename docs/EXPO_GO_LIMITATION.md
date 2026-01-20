# Expo Go Limitation: Native Modules

## The Issue

When you try to use Google Sign-In in **Expo Go**, you'll see this error:

```
ERROR [Invariant Violation: TurboModuleRegistry.getEnforcing(...): 
'RNGoogleSignin' could not be found. Verify that a module by this name 
is registered in the native binary.]
```

## Why This Happens

`@react-native-google-signin/google-signin` is a **native module** that requires:
- Native code compilation (Java/Kotlin for Android)
- Custom native binaries linked into the app
- Access to device-level Google Play Services

**Expo Go** is a pre-built app that only includes:
- Standard Expo SDK modules
- Pre-compiled native code
- **NOT** custom native modules like Google Sign-In

## Solution: Use a Dev Build

You **must** use a development build instead of Expo Go:

### Step 1: Build Dev Client

```bash
# Build a dev client for Android
eas build --profile development --platform android

# Or for local build (if configured):
npx expo run:android
```

### Step 2: Install APK

- Download the APK from EAS Build dashboard
- Install on your Android device/emulator
- Or use `adb install` if building locally

### Step 3: Start Dev Server

```bash
# Start Expo with dev client
expo start --dev-client

# Or use the dev client flag
npx expo start --dev-client
```

### Step 4: Open in Dev Client

- Open the **Expo Dev Client** app (not Expo Go)
- Scan the QR code or connect via tunnel
- Your app will load with native modules enabled

## What Changed in the Code

The app now includes **automatic detection** for Expo Go:

1. **Initialization Check** (`src/lib/googleSignin.ts`):
   - Detects if running in Expo Go
   - Shows warning in console (doesn't crash)
   - Skips Google Sign-In configuration

2. **Sign-In Check** (`signInWithGoogle()`):
   - Throws helpful error if called in Expo Go
   - Provides clear instructions on how to fix

3. **UI Error Handling** (`app/onboarding/signin.tsx`):
   - Catches Expo Go errors
   - Shows user-friendly alert with instructions
   - Explains why it doesn't work and how to fix it

## Testing

### ✅ Works In:
- Dev builds (EAS or local)
- Production builds
- Custom development clients

### ❌ Doesn't Work In:
- Expo Go app
- Expo Snack
- Web (different implementation needed)

## Quick Reference

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| Standard Expo SDK | ✅ | ✅ |
| Custom Native Modules | ❌ | ✅ |
| Google Sign-In | ❌ | ✅ |
| Fast Refresh | ✅ | ✅ |
| Over-the-Air Updates | ✅ | ✅ |

## Troubleshooting

### "Still getting the error in dev build"
- Make sure you're using **Expo Dev Client**, not Expo Go
- Rebuild the dev client after adding native modules
- Clear cache: `expo start --clear`

### "How do I know if I'm in Expo Go?"
- Check the app icon: Expo Go has a different icon
- Check console logs: You'll see warnings about native modules
- The error message will mention "TurboModuleRegistry"

### "Can I disable Google Sign-In in Expo Go?"
The code already handles this gracefully:
- Initialization is skipped (no crash)
- Button still shows, but shows helpful error if clicked
- App continues to work for other features

## Summary

**Expo Go** = Quick testing, limited to Expo SDK  
**Dev Build** = Full native module support, required for Google Sign-In

For Google Sign-In, you **must** use a dev build. This is a limitation of Expo Go, not a bug in the code.
