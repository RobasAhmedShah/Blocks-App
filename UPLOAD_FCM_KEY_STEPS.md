# Quick Steps to Upload FCM Service Account Key

## File Location
Your Service Account JSON file is at:
```
C:\Users\Pc\Desktop\Blocks\Blocks-App\blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json
```

## Steps to Upload

1. **Run the command:**
   ```powershell
   cd Blocks-App
   eas credentials
   ```

2. **Navigate through the menus:**
   - Select: **Android**
   - Select: **production** (or the profile you use for builds)
   - Select: **Google Service Account**
   - Select: **Manage your Google Service Account Key for Push Notifications (FCM V1)**
   - Select: **Upload a Google Service Account Key**

3. **When prompted for the file path, enter:**
   ```
   blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json
   ```
   
   Or the full path:
   ```
   C:\Users\Pc\Desktop\Blocks\Blocks-App\blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json
   ```

4. **Press Enter** to upload

5. **Verify it worked** - You should see a success message

## After Upload

✅ Notifications should work immediately - no rebuild needed!

Test by sending a notification from your admin panel and check Vercel logs - the error should be gone.

