# How to Upload Mapping File to Google Play Console

The mapping file (`mapping.txt`) is required for Google Play Store to deobfuscate crash reports and ANRs. This makes debugging much easier.

## What is the Mapping File?

When R8/ProGuard obfuscates your code, it renames classes and methods. The mapping file contains the translation between obfuscated names and original names, allowing Play Console to show readable stack traces.

## Location

After building your AAB, the mapping file is located at:
```
android/app/build/outputs/mapping/release/mapping.txt
```

## How to Upload

### Method 1: During Release Upload (Recommended)

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Release** > **Production** (or **Internal testing**)
4. Click **Create new release**
5. Upload your AAB file
6. **After the AAB is processed**, you'll see an option to **"Upload mapping file"**
7. Click it and select your `mapping.txt` file
8. Complete the release and submit

### Method 2: After Release is Published

1. Go to **Release** > **Production** (or your testing track)
2. Find your release version
3. Click on the version number
4. Look for **"Upload mapping file"** or **"Deobfuscation file"** option
5. Upload the `mapping.txt` file

### Method 3: Via App Bundle Explorer

1. Go to **Release** > **App bundles**
2. Find your uploaded AAB
3. Click on it to open details
4. Look for **"Upload mapping file"** option
5. Upload the `mapping.txt` file

## Important Notes

- **Keep your mapping files safe!** Store them securely for each release version
- **Version-specific**: Each release needs its own mapping file
- **Required for crash reports**: Without it, crash reports will be obfuscated and hard to debug
- **File size**: Usually a few MB, depending on your app size

## Best Practice

1. **Save mapping files** for each release version in a secure location
2. **Name them clearly**: e.g., `mapping-v1.0.0-build1.txt`
3. **Upload immediately** after uploading the AAB
4. **Keep backups** - you may need them later for debugging old crashes

## Troubleshooting

**Q: I don't see the "Upload mapping file" option**
- Make sure your AAB has been processed by Google Play
- Wait a few minutes after uploading the AAB
- Check if R8/ProGuard is enabled in your build

**Q: The mapping file is too large**
- This is normal for large apps
- Google Play accepts files up to 50MB
- If larger, contact Google Play support

**Q: I lost my mapping file**
- You can rebuild the same version to regenerate it
- Make sure to use the exact same code and build configuration
- Or extract it from your build artifacts if you saved them

## Verification

After uploading, you can verify it worked:
1. Go to **Quality** > **Android vitals** > **Crashes and ANRs**
2. Check if stack traces are readable (not obfuscated)
3. If you see readable class/method names, the mapping file is working!

