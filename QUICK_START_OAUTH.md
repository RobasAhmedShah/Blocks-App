# 🚀 Quick Start: Google OAuth Testing

## ⚡ TL;DR

```bash
# 1. Start Android Emulator
emulator -avd Pixel_5_API_33

# 2. Start Expo (in new terminal)
cd Blocks-App
npx expo start --clear

# 3. Press 'a' to open in emulator
# 4. Test Google Sign-In ✅
```

---

## ✅ What's Fixed

- ✅ Magic SDK SSR error (`window is not defined`)
- ✅ Google OAuth Client ID mismatch
- ✅ OAuth consent screen test users
- ✅ Clear error messages for physical devices

---

## 🎯 Testing on Android Emulator

### Option 1: Android Studio AVD Manager
1. Open Android Studio
2. Click **Device Manager** (phone icon)
3. Select a device and click **Play** ▶️
4. Run `npx expo start`
5. Press `a` in terminal

### Option 2: Command Line
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <device_name>

# In new terminal
cd Blocks-App
npx expo start

# Press 'a' to open in emulator
```

---

## 🧪 Testing on iOS

```bash
cd Blocks-App
npx expo start

# Press 'i' to open in iOS simulator
```

✅ iOS uses native OAuth - no redirect URI issues

---

## 🌐 Testing on Web

```bash
cd Blocks-App
npx expo start

# Press 'w' to open in web browser
# OR visit http://localhost:8081 in your browser
```

✅ Web OAuth works with the Web Client ID
✅ Opens Google sign-in in same browser window
✅ No redirect URI issues

---

## ⚠️ Physical Android Device

**Not supported with Expo Go + Web OAuth**

Why? Google Web OAuth doesn't accept local network IPs (`192.168.x.x`)

**Solutions**:
1. Use Android emulator (recommended for now)
2. Build development client (see `docs/GOOGLE_OAUTH_TESTING_GUIDE.md`)

---

## 🐛 Troubleshooting

### "invalid_client" Error
✅ Already fixed - Client IDs now match

### "redirect_uri_mismatch" Error  
⚠️ Using physical device → Switch to emulator

### "This app's request is invalid"
- Wait 10-15 minutes for Google changes to propagate
- Check that your email is in test users list

### Magic SDK "window is not defined"
✅ Already fixed - Platform checks added

---

## 📚 Documentation

- **Quick Start**: This file
- **Comprehensive Guide**: `docs/GOOGLE_OAUTH_TESTING_GUIDE.md`
- **Implementation Details**: `docs/OAUTH_IMPLEMENTATION_SUMMARY.md`

---

## ✨ Expected Flow

1. User taps "Sign in with Google"
2. Google sign-in page opens
3. User selects account
4. Redirects back to app
5. ID token sent to backend
6. User signed in ✅

---

## 🎉 You're Ready!

Start the emulator and test Google OAuth - it should work now! 🚀

