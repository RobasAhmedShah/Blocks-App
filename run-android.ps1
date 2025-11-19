# PowerShell script to run Android build with compatible Java version
# This script finds Java 17 or 21 and sets JAVA_HOME before running the build

Write-Host "Checking for compatible Java version..." -ForegroundColor Cyan

# Common Java installation paths
$javaPaths = @(
    "C:\Program Files\Java\jdk-21",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Java\jdk-21.0.1",
    "C:\Program Files\Java\jdk-17.0.1",
    "C:\Program Files\Eclipse Adoptium\jdk-21-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-17-hotspot",
    "C:\Program Files\Microsoft\jdk-21",
    "C:\Program Files\Microsoft\jdk-17",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21-hotspot",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17-hotspot"
)

$foundJava = $null

# Check each path
foreach ($path in $javaPaths) {
    if (Test-Path "$path\bin\java.exe") {
        $versionOutput = & "$path\bin\java.exe" -version 2>&1
        if ($versionOutput -match 'version "1[7-9]|version "2[01]') {
            $foundJava = $path
            Write-Host "Found compatible Java at: $path" -ForegroundColor Green
            break
        }
    }
}

# If not found in common paths, search in Program Files
if (-not $foundJava) {
    Write-Host "Searching for Java installations..." -ForegroundColor Yellow
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
                    Write-Host "Found compatible Java at: $javaPath" -ForegroundColor Green
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
    Write-Host "Java version:" -ForegroundColor Cyan
    & "$foundJava\bin\java.exe" -version
    
    # Find Android SDK
    Write-Host "`nChecking for Android SDK..." -ForegroundColor Cyan
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
            Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green
            break
        }
    }
    
    if ($foundAndroidSdk) {
        $env:ANDROID_HOME = $foundAndroidSdk
        $env:ANDROID_SDK_ROOT = $foundAndroidSdk
        
        # Create or update local.properties file
        $localPropertiesPath = "android\local.properties"
        # Escape backslashes for properties file (C:\Users\... becomes C\:\\Users\\...)
        $escapedSdkPath = $foundAndroidSdk.Replace('\', '\\')
        $sdkDirLine = "sdk.dir=$escapedSdkPath"
        
        if (Test-Path $localPropertiesPath) {
            $content = Get-Content $localPropertiesPath -Raw
            if ($content -notmatch "sdk\.dir=") {
                Add-Content $localPropertiesPath "`n$sdkDirLine"
                Write-Host "Updated local.properties with SDK location" -ForegroundColor Green
            } else {
                # Update existing sdk.dir line
                $content = $content -replace "sdk\.dir=.*", $sdkDirLine
                Set-Content $localPropertiesPath $content
                Write-Host "Updated local.properties SDK location" -ForegroundColor Green
            }
        } else {
            Set-Content $localPropertiesPath $sdkDirLine
            Write-Host "Created local.properties with SDK location" -ForegroundColor Green
        }
    } else {
        Write-Host "WARNING: Android SDK not found!" -ForegroundColor Yellow
        Write-Host "Please install Android Studio or set ANDROID_HOME environment variable" -ForegroundColor Yellow
        Write-Host "Default location: $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Yellow
    }
    
    Write-Host "`nStarting Android build..." -ForegroundColor Cyan
    npm run android
} else {
    Write-Host "`nERROR: No compatible Java version (17 or 21) found!" -ForegroundColor Red
    Write-Host "`nPlease install Java 17 or Java 21:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://adoptium.net/" -ForegroundColor White
    Write-Host "  2. Install Java 17 or 21" -ForegroundColor White
    Write-Host "  3. Or set JAVA_HOME environment variable to point to Java 17/21" -ForegroundColor White
    Write-Host "`nAlternatively, you can temporarily set JAVA_HOME:" -ForegroundColor Yellow
    Write-Host "  `$env:JAVA_HOME = 'C:\Path\To\Java17'" -ForegroundColor White
    Write-Host "  npm run android" -ForegroundColor White
    exit 1
}

