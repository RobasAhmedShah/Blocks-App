# PowerShell script to build an Android App Bundle (AAB) for Google Play Store
# Google Play Store REQUIRES AAB format (not APK) for new apps

Write-Host "Building Android App Bundle (AAB) for Google Play Store..." -ForegroundColor Cyan
Write-Host "Note: Google Play Store requires AAB format for uploads" -ForegroundColor Green
Write-Host ""

# Check for compatible Java version
Write-Host "Checking for compatible Java version..." -ForegroundColor Cyan

$javaPaths = @(
    "C:\Program Files\Java\jdk-21",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Eclipse Adoptium\jdk-21-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-17-hotspot",
    "C:\Program Files\Microsoft\jdk-21",
    "C:\Program Files\Microsoft\jdk-17",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21-hotspot",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17-hotspot"
)

$foundJava = $null

foreach ($path in $javaPaths) {
    if (Test-Path "$path\bin\java.exe") {
        $versionOutput = & "$path\bin\java.exe" -version 2>&1
        if ($versionOutput -match 'version "1[7-9]|version "2[01]') {
            $foundJava = $path
            break
        }
    }
}

# If not found, search in Program Files
if (-not $foundJava) {
    $programFilesPaths = @(
        "C:\Program Files\Java",
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Microsoft"
    )
    
    foreach ($basePath in $programFilesPaths) {
        if (Test-Path $basePath) {
            $javaDirs = Get-ChildItem -Path $basePath -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'jdk-(17|18|19|20|21)' }
            foreach ($dir in $javaDirs) {
                $javaPath = $dir.FullName
                if (Test-Path "$javaPath\bin\java.exe") {
                    $foundJava = $javaPath
                    break
                }
            }
            if ($foundJava) { break }
        }
    }
}

if ($foundJava) {
    $env:JAVA_HOME = $foundJava
    $env:PATH = "$foundJava\bin;$env:PATH"
    Write-Host "Using Java: $foundJava" -ForegroundColor Green
} else {
    Write-Host "ERROR: No compatible Java version (17 or 21) found!" -ForegroundColor Red
    Write-Host "Please install Java 17 or 21 from https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

# Find Android SDK
Write-Host "Checking for Android SDK..." -ForegroundColor Cyan
$androidSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "$env:ANDROID_HOME",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
)

$foundAndroidSdk = $null
foreach ($sdkPath in $androidSdkPaths) {
    if ($sdkPath -and (Test-Path $sdkPath)) {
        $foundAndroidSdk = $sdkPath
        break
    }
}

if ($foundAndroidSdk) {
    $env:ANDROID_HOME = $foundAndroidSdk
    $env:ANDROID_SDK_ROOT = $foundAndroidSdk
    
    # Ensure local.properties exists
    $localPropertiesPath = "android\local.properties"
    if (-not (Test-Path $localPropertiesPath)) {
        $escapedSdkPath = $foundAndroidSdk.Replace('\', '\\')
        Set-Content $localPropertiesPath "sdk.dir=$escapedSdkPath"
    }
    
    Write-Host "Using Android SDK: $foundAndroidSdk" -ForegroundColor Green
} else {
    Write-Host "ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host "Please install Android Studio or set ANDROID_HOME" -ForegroundColor Yellow
    exit 1
}

# Check if release keystore exists
$keystorePath = "android\app\keystores\release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host ""
    Write-Host "ERROR: Release keystore not found!" -ForegroundColor Red
    Write-Host "Please run generate-keystore.ps1 first to create a release keystore." -ForegroundColor Yellow
    Write-Host ""
    $generate = Read-Host "Would you like to generate a keystore now? (Y/N)"
    if ($generate -eq 'Y' -or $generate -eq 'y') {
        & .\generate-keystore.ps1
        if ($LASTEXITCODE -ne 0) {
            exit 1
        }
    } else {
        exit 1
    }
}

Write-Host ""
Write-Host "Stopping any running Gradle daemons..." -ForegroundColor Yellow
cd android
& .\gradlew.bat --stop 2>$null

Write-Host ""
Write-Host "Cleaning previous build artifacts..." -ForegroundColor Yellow
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Building release AAB (this may take a few minutes)..." -ForegroundColor Cyan
Write-Host "Note: Lint is disabled for release builds to avoid memory issues" -ForegroundColor Yellow
Write-Host ""

# Build release AAB (Android App Bundle)
# This is the format required by Google Play Store
& .\gradlew.bat bundleRelease -x lintVitalRelease -x lintVitalAnalyzeRelease

if ($LASTEXITCODE -eq 0) {
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    $mappingPath = "app\build\outputs\mapping\release\mapping.txt"
    
    if (Test-Path $aabPath) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Release AAB built!" -ForegroundColor Green
        Write-Host ""
        Write-Host "AAB Location: $((Get-Item $aabPath).FullName)" -ForegroundColor Cyan
        
        # Check if mapping file exists
        if (Test-Path $mappingPath) {
            Write-Host ""
            Write-Host "✅ Mapping file generated!" -ForegroundColor Green
            Write-Host "Mapping Location: $((Get-Item $mappingPath).FullName)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "IMPORTANT: Upload the mapping.txt file to Play Console!" -ForegroundColor Yellow
            Write-Host "  - Go to: Play Console > Your App > Release > App bundles" -ForegroundColor White
            Write-Host "  - Click on your release > Upload mapping file" -ForegroundColor White
            Write-Host "  - This helps debug crashes and ANRs" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "⚠️  WARNING: Mapping file not found!" -ForegroundColor Yellow
            Write-Host "This may happen if R8/ProGuard is not enabled." -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "Next Steps for Google Play Store:" -ForegroundColor Yellow
        Write-Host "  1. Go to https://play.google.com/console" -ForegroundColor White
        Write-Host "  2. Create a new app (if you haven't already)" -ForegroundColor White
        Write-Host "  3. Go to Production > Create new release (or Internal testing)" -ForegroundColor White
        Write-Host "  4. Upload the AAB file" -ForegroundColor White
        if (Test-Path $mappingPath) {
            Write-Host "  5. Upload the mapping.txt file (for crash reports)" -ForegroundColor White
            Write-Host "  6. Fill in release notes and submit" -ForegroundColor White
        } else {
            Write-Host "  5. Fill in release notes and submit" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "This AAB is ready for Play Store upload! 🎉" -ForegroundColor Green
        
        # Ask if user wants to open the folder
        $openFolder = Read-Host "Open the AAB folder? (Y/N)"
        if ($openFolder -eq 'Y' -or $openFolder -eq 'y') {
            Start-Process explorer.exe -ArgumentList "/select,`"$((Get-Item $aabPath).FullName)`""
        }
    } else {
        Write-Host "ERROR: AAB file not found at expected location" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}

cd ..

