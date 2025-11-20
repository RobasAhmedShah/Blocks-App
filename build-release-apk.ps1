# PowerShell script to build a standalone release APK
# This APK will work on your phone without needing the dev server

Write-Host "Building Standalone Release APK..." -ForegroundColor Cyan
Write-Host "This APK will bundle all JavaScript and assets, no dev server needed!" -ForegroundColor Green
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

Write-Host ""
Write-Host "Stopping any running Gradle daemons to avoid file lock issues..." -ForegroundColor Yellow
cd android
& .\gradlew.bat --stop 2>$null

Write-Host ""
Write-Host "Cleaning previous build artifacts..." -ForegroundColor Yellow
# Clean only the app module to avoid settings.gradle issues
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Building release APK (this may take a few minutes)..." -ForegroundColor Cyan
Write-Host "Note: Lint is disabled for release builds to avoid memory issues" -ForegroundColor Yellow
Write-Host ""

# Build release APK
# This will bundle all JS code and assets into the APK
# -x lintVitalRelease skips lint to avoid Metaspace errors
& .\gradlew.bat assembleRelease -x lintVitalRelease -x lintVitalAnalyzeRelease

if ($LASTEXITCODE -eq 0) {
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "✅ SUCCESS! Release APK built!" -ForegroundColor Green
        Write-Host ""
        Write-Host "APK Location: $((Get-Item $apkPath).FullName)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To install on your phone:" -ForegroundColor Yellow
        Write-Host "  1. Transfer the APK to your phone (USB, email, cloud, etc.)" -ForegroundColor White
        Write-Host "  2. Enable 'Install from Unknown Sources' in your phone settings" -ForegroundColor White
        Write-Host "  3. Open the APK file on your phone and install" -ForegroundColor White
        Write-Host ""
        Write-Host "This APK works completely standalone - no dev server needed! 🎉" -ForegroundColor Green
        
        # Ask if user wants to open the folder
        $openFolder = Read-Host "Open the APK folder? (Y/N)"
        if ($openFolder -eq 'Y' -or $openFolder -eq 'y') {
            Start-Process explorer.exe -ArgumentList "/select,`"$((Get-Item $apkPath).FullName)`""
        }
    } else {
        Write-Host "ERROR: APK file not found at expected location" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    exit 1
}

cd ..

