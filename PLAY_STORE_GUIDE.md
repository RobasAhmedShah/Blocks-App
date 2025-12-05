# Google Play Store Submission Guide

This guide will help you upload your Blocks app to Google Play Store for internal testing.

## Prerequisites

1. **Google Play Console Account**
   - Go to https://play.google.com/console
   - Pay the one-time $25 registration fee (if not already done)
   - Complete your developer account setup

2. **App Requirements**
   - Release keystore (we'll generate this)
   - Android App Bundle (AAB) file (we'll build this)
   - App icon and screenshots
   - Privacy policy URL (required)
   - App description and metadata

## Step 1: Generate Release Keystore

**IMPORTANT**: The keystore is critical! If you lose it, you cannot update your app on Play Store.

```powershell
.\generate-keystore.ps1
```

This will:
- Create a release keystore in `android/keystores/release.keystore`
- Ask you for passwords (SAVE THESE SECURELY!)
- Generate a key alias

**Save the keystore information in a secure location!**

## Step 2: Configure Build.gradle

After generating the keystore, you need to update `android/app/build.gradle` to use it. The script will guide you, or you can manually add:

```gradle
signingConfigs {
    release {
        storeFile file('keystores/release.keystore')
        storePassword 'YOUR_KEYSTORE_PASSWORD'
        keyAlias 'release-key'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... other config
    }
}
```

## Step 3: Build Android App Bundle (AAB)

Google Play Store requires AAB format (not APK) for new apps:

```powershell
.\build-release-aab.ps1
```

This will create: `android/app/build/outputs/bundle/release/app-release.aab`

## Step 4: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name**: Blocks (or your preferred name)
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all that apply (Ads, Data safety, etc.)

## Step 5: Complete Store Listing

### Required Information:

1. **App Details**
   - Short description (80 characters max)
   - Full description (4000 characters max)
   - App icon (512x512 PNG, no transparency)
   - Feature graphic (1024x500 PNG)

2. **Graphics**
   - **Screenshots** (required):
     - Phone: At least 2 screenshots (min 320px, max 3840px)
     - Tablet (optional): At least 2 screenshots
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 PNG

3. **Categorization**
   - App category: Finance (or appropriate category)
   - Content rating: Complete questionnaire
   - Tags: Add relevant tags

4. **Privacy Policy** (REQUIRED)
   - You must provide a privacy policy URL
   - Create one at: https://www.privacypolicygenerator.info/ or similar
   - Must cover: data collection, usage, security, user rights

5. **Data Safety** (REQUIRED)
   - Declare what data you collect
   - How you use it
   - Whether you share it

## Step 6: Upload AAB for Internal Testing

1. In Play Console, go to **Testing > Internal testing**
2. Click **Create new release**
3. **Upload AAB**:
   - Click "Upload" and select your `app-release.aab` file
   - Wait for processing (may take a few minutes)
4. **Upload Mapping File** (IMPORTANT):
   - After AAB is processed, click "Upload mapping file"
   - Select `android/app/build/outputs/mapping/release/mapping.txt`
   - This file is required for readable crash reports
   - See [UPLOAD_MAPPING_FILE.md](./UPLOAD_MAPPING_FILE.md) for detailed instructions
5. **Release name**: e.g., "1.0.0 (Internal Test)"
6. **Release notes**: Describe what's in this version
7. Click **Save**
8. Click **Review release**
9. Review and click **Start rollout to Internal testing**

## Step 7: Add Testers

1. Go to **Testing > Internal testing > Testers**
2. Create a tester list or use email addresses
3. Add testers' email addresses
4. Share the opt-in link with testers

## Step 8: Test Your App

Testers will receive an email with a link to install the app. They can:
- Install directly from Play Store (internal testing track)
- Test all features
- Provide feedback

## Important Notes

### App Signing by Google Play
- When you upload your first AAB, Google will offer to manage your app signing key
- **Accept this!** It's safer and allows key recovery
- Google will use your upload key to sign the app with their app signing key

### Version Management
- **versionCode**: Must increment with each release (currently: 1)
- **versionName**: User-visible version (currently: "1.0.0")
- Update these in `android/app/build.gradle` for each release

### Common Issues

1. **"App not available"**: Check that you've completed all required sections
2. **"Upload failed"**: Ensure AAB is signed with release keystore
3. **"Missing privacy policy"**: Add privacy policy URL in Store listing
4. **"Content rating incomplete"**: Complete the content rating questionnaire

## Next Steps After Internal Testing

Once internal testing is successful:
1. Fix any bugs found
2. Update versionCode and versionName
3. Build new AAB
4. Create production release
5. Submit for review

## Resources

- [Google Play Console](https://play.google.com/console)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Play Store Policies](https://play.google.com/about/developer-content-policy/)

