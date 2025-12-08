# Quick Start: Upload to Google Play Store

## 🚀 Quick Steps

### 1. Generate Release Keystore (One-time setup)
```powershell
.\generate-keystore.ps1
```
- Enter a strong password (save it securely!)
- This creates `android/app/keystores/release.keystore`
- Automatically creates `android/keystore.properties`

### 2. Build Android App Bundle (AAB)
```powershell
.\build-release-aab.ps1
```
- Creates `android/app/build/outputs/bundle/release/app-release.aab`
- This is the file you'll upload to Play Store

### 3. Upload to Google Play Console

1. **Go to**: https://play.google.com/console
2. **Create App** (if first time):
   - App name: "Blocks"
   - Default language: English
   - App type: App
   - Free or Paid: Free
3. **Complete Store Listing** (required):
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2, phone format)
   - Short description (80 chars)
   - Full description (4000 chars)
   - Privacy Policy URL (REQUIRED - create one if needed)
4. **Upload AAB**:
   - Go to: **Testing > Internal testing**
   - Click: **Create new release**
   - Upload: `app-release.aab`
   - Add release notes
   - Click: **Start rollout to Internal testing**
5. **Add Testers**:
   - Go to: **Testing > Internal testing > Testers**
   - Add email addresses or create tester list
   - Share opt-in link

## ⚠️ Important Notes

- **Keystore**: Keep it safe! If lost, you can't update your app
- **AAB Required**: Google Play requires AAB format (not APK)
- **Privacy Policy**: Required - create one at https://www.privacypolicygenerator.info/
- **Content Rating**: Complete the questionnaire
- **Data Safety**: Declare what data you collect

## 📋 Checklist Before Upload

- [ ] Release keystore generated
- [ ] AAB file built successfully
- [ ] App icon ready (512x512)
- [ ] Screenshots ready (at least 2)
- [ ] Privacy policy URL ready
- [ ] App description written
- [ ] Content rating completed
- [ ] Data safety form completed

## 🔗 Resources

- [Full Guide](./PLAY_STORE_GUIDE.md) - Detailed instructions
- [Google Play Console](https://play.google.com/console)
- [Play Store Policies](https://play.google.com/about/developer-content-policy/)

