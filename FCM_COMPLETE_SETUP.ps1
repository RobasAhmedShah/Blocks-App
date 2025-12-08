# FCM Complete Setup Script for Blocks APK
# This script verifies your FCM configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FCM Setup for Blocks APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Files Exist
Write-Host "Step 1: Verifying required files..." -ForegroundColor Yellow
$serviceAccountJson = "blocks-1b5ba-firebase-adminsdk-fbsvc-9decb41279.json"
$googleServicesJson = "google-services.json"

if (Test-Path $serviceAccountJson) {
    Write-Host "[OK] Service Account JSON found: $serviceAccountJson" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Service Account JSON NOT found: $serviceAccountJson" -ForegroundColor Red
    Write-Host "  Please download it from Firebase Console" -ForegroundColor Red
    exit 1
}

if (Test-Path $googleServicesJson) {
    Write-Host "[OK] google-services.json found" -ForegroundColor Green
} else {
    Write-Host "[FAIL] google-services.json NOT found" -ForegroundColor Red
    Write-Host "  Please download it from Firebase Console" -ForegroundColor Red
    exit 1
}

# Step 2: Check if google-services.json is in correct location
Write-Host ""
Write-Host "Step 2: Checking google-services.json location..." -ForegroundColor Yellow
if (Test-Path "android\app\google-services.json") {
    Write-Host "[OK] google-services.json is in correct location: android\app\" -ForegroundColor Green
} else {
    Write-Host "[INFO] google-services.json needs to be moved to android\app\" -ForegroundColor Yellow
    
    if (Test-Path "android\app") {
        Write-Host "  Moving google-services.json to android\app\..." -ForegroundColor Cyan
        Copy-Item $googleServicesJson "android\app\google-services.json" -Force
        Write-Host "[OK] google-services.json moved successfully" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] android\app directory not found." -ForegroundColor Red
        Write-Host "  Run 'npx expo prebuild' first." -ForegroundColor Red
        exit 1
    }
}

# Step 3: Verify android/build.gradle
Write-Host ""
Write-Host "Step 3: Verifying android/build.gradle..." -ForegroundColor Yellow
if (Test-Path "android\build.gradle") {
    $buildGradle = Get-Content "android\build.gradle" -Raw
    if ($buildGradle -match "com\.google\.gms:google-services") {
        Write-Host "[OK] Google Services classpath found in android\build.gradle" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Google Services classpath NOT found in android\build.gradle" -ForegroundColor Yellow
        Write-Host "  Add this to dependencies block:" -ForegroundColor Yellow
        Write-Host "  classpath('com.google.gms:google-services:4.4.0')" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] android\build.gradle not found (normal for EAS builds)" -ForegroundColor Cyan
}

# Step 4: Verify android/app/build.gradle
Write-Host ""
Write-Host "Step 4: Verifying android/app/build.gradle..." -ForegroundColor Yellow
if (Test-Path "android\app\build.gradle") {
    $appBuildGradle = Get-Content "android\app\build.gradle" -Raw
    if ($appBuildGradle -match "com\.google\.gms\.google-services") {
        Write-Host "[OK] Google Services plugin applied in android\app\build.gradle" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Google Services plugin NOT applied in android\app\build.gradle" -ForegroundColor Yellow
        Write-Host "  Add this at the bottom:" -ForegroundColor Yellow
        Write-Host "  apply plugin: 'com.google.gms.google-services'" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] android\app\build.gradle not found (normal for EAS builds)" -ForegroundColor Cyan
}

# Step 5: EAS Credentials Upload Instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEP: Upload FCM Key to EAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your local files are ready. Now upload to Expo:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command:" -ForegroundColor Cyan
Write-Host "  eas credentials" -ForegroundColor White
Write-Host ""
Write-Host "Then navigate:" -ForegroundColor Cyan
Write-Host "  1. Select: Android" -ForegroundColor White
Write-Host "  2. Select: production" -ForegroundColor White
Write-Host "  3. Select: Google Service Account" -ForegroundColor White
Write-Host "  4. Select: Manage your Google Service Account Key for Push Notifications (FCM V1)" -ForegroundColor White
Write-Host "  5. Select: Upload a Google Service Account Key" -ForegroundColor White
Write-Host ""
Write-Host "When prompted for file path, enter:" -ForegroundColor Cyan
Write-Host "  $serviceAccountJson" -ForegroundColor White
Write-Host ""

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Local Build:" -ForegroundColor Green
Write-Host "  [OK] google-services.json configured" -ForegroundColor Green
Write-Host "  [OK] All required files in place" -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  1. Run 'eas credentials' and upload the Service Account JSON" -ForegroundColor White
Write-Host "  2. Test: Send notification from admin panel" -ForegroundColor White
Write-Host "  3. Check Vercel logs for success (no FCM error)" -ForegroundColor White
Write-Host ""
Write-Host "After EAS upload, notifications work immediately!" -ForegroundColor Green
Write-Host ""

