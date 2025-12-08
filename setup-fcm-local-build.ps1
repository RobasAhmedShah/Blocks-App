# PowerShell script to set up FCM for local Android builds
# This script ensures google-services.json is in place and Gradle is configured

Write-Host "Setting up FCM for local Android builds..." -ForegroundColor Cyan
Write-Host ""

# Check if google-services.json exists in root
$googleServicesRoot = "google-services.json"
$googleServicesTarget = "android\app\google-services.json"

if (Test-Path $googleServicesRoot) {
    Write-Host "✅ Found google-services.json in root directory" -ForegroundColor Green
    
    # Ensure android/app directory exists
    if (-not (Test-Path "android\app")) {
        Write-Host "Creating android\app directory..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "android\app" -Force | Out-Null
    }
    
    # Copy file to android/app
    Copy-Item $googleServicesRoot $googleServicesTarget -Force
    Write-Host "✅ Copied google-services.json to android\app\" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: google-services.json not found in root directory!" -ForegroundColor Red
    Write-Host "Please download it from Firebase Console and place it in the root directory." -ForegroundColor Yellow
    exit 1
}

# Check if android project exists (needs prebuild)
if (-not (Test-Path "android\build.gradle")) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Android native project not found!" -ForegroundColor Yellow
    Write-Host "You need to run 'npx expo prebuild' to generate the Android project." -ForegroundColor Yellow
    Write-Host ""
    $runPrebuild = Read-Host "Would you like to run 'npx expo prebuild' now? (Y/N)"
    if ($runPrebuild -eq 'Y' -or $runPrebuild -eq 'y') {
        Write-Host "Running expo prebuild..." -ForegroundColor Cyan
        npx expo prebuild --platform android
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Prebuild completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Prebuild failed. Please check the errors above." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Skipping prebuild. Make sure to run it before building." -ForegroundColor Yellow
    }
}

# Check and update build.gradle files
if (Test-Path "android\build.gradle") {
    Write-Host ""
    Write-Host "Checking Gradle configuration..." -ForegroundColor Cyan
    
    $projectBuildGradle = Get-Content "android\build.gradle" -Raw
    
    # Check if Google Services plugin is in project-level build.gradle
    if ($projectBuildGradle -notmatch "com\.google\.gms:google-services") {
        Write-Host "⚠️  Google Services plugin not found in android/build.gradle" -ForegroundColor Yellow
        Write-Host "You need to add this to android/build.gradle in the buildscript dependencies:" -ForegroundColor Yellow
        Write-Host "  classpath 'com.google.gms:google-services:4.4.0'" -ForegroundColor White
    } else {
        Write-Host "✅ Google Services plugin found in android/build.gradle" -ForegroundColor Green
    }
    
    # Check app-level build.gradle
    if (Test-Path "android\app\build.gradle") {
        $appBuildGradle = Get-Content "android\app\build.gradle" -Raw
        
        if ($appBuildGradle -notmatch "com\.google\.gms\.google-services") {
            Write-Host "⚠️  Google Services plugin not applied in android/app/build.gradle" -ForegroundColor Yellow
            Write-Host "You need to add this at the bottom of android/app/build.gradle:" -ForegroundColor Yellow
            Write-Host "  apply plugin: 'com.google.gms.google-services'" -ForegroundColor White
        } else {
            Write-Host "✅ Google Services plugin applied in android/app/build.gradle" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "✅ FCM setup check completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. If prebuild was run, verify Gradle configuration above" -ForegroundColor White
Write-Host "  2. Run your build script: .\build-release-aab.ps1" -ForegroundColor White
Write-Host ""

