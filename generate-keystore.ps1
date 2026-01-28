# PowerShell script to generate a release keystore for Google Play Store
# This keystore is REQUIRED for Play Store uploads

Write-Host "Generating Release Keystore for Google Play Store..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Keep this keystore file safe! If you lose it, you won't be able to update your app on Play Store!" -ForegroundColor Yellow
Write-Host ""

# Check for Java
$javaPaths = @(
    "C:\Program Files\Java\jdk-21",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Eclipse Adoptium\jdk-21-hotspot",
    "C:\Program Files\Eclipse Adoptium\jdk-17-hotspot",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21-hotspot",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17-hotspot"
)

$foundJava = $null
foreach ($path in $javaPaths) {
    if (Test-Path "$path\bin\keytool.exe") {
        $foundJava = $path
        break
    }
}

if (-not $foundJava) {
    Write-Host "ERROR: Java keytool not found!" -ForegroundColor Red
    Write-Host "Please install Java 17 or 21 from https://adoptium.net/" -ForegroundColor Yellow
    exit 1
}

$keytoolPath = "$foundJava\bin\keytool.exe"

# Create keystores directory if it doesn't exist
$keystoreDir = "android\app\keystores"
if (-not (Test-Path $keystoreDir)) {
    New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null
}

$keystorePath = "$keystoreDir\release.keystore"

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "WARNING: Release keystore already exists at: $keystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (Y/N) - WARNING: This will break existing Play Store uploads!"
    if ($overwrite -ne 'Y' -and $overwrite -ne 'y') {
        Write-Host "Keystore generation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Please provide the following information for your keystore:" -ForegroundColor Cyan
Write-Host ""

# Get keystore information
$keystorePassword = Read-Host "Enter keystore password (min 6 characters)" -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

if ($keystorePasswordPlain.Length -lt 6) {
    Write-Host "ERROR: Password must be at least 6 characters!" -ForegroundColor Red
    exit 1
}

$keyPassword = Read-Host "Enter key password (or press Enter to use same as keystore password)" -AsSecureString
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))
if ([string]::IsNullOrEmpty($keyPasswordPlain)) {
    $keyPasswordPlain = $keystorePasswordPlain
}

$keyAlias = Read-Host "Enter key alias (default: release-key)"
if ([string]::IsNullOrEmpty($keyAlias)) {
    $keyAlias = "release-key"
}

Write-Host ""
Write-Host "Generating keystore (this may take a moment)..." -ForegroundColor Cyan

# Generate keystore
$dname = "CN=Blocks App, OU=Mobile, O=Intelik, L=Karachi, ST=Sindh, C=PK"

$keytoolArgs = @(
    "-genkey",
    "-v",
    "-storetype", "JKS",
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-storepass", $keystorePasswordPlain,
    "-keypass", $keyPasswordPlain,
    "-alias", $keyAlias,
    "-keystore", $keystorePath,
    "-dname", $dname
)

try {
    & $keytoolPath $keytoolArgs
    
    Write-Host ""
    Write-Host "✅ Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Keystore Location: $((Get-Item $keystorePath).FullName)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Save these credentials securely!" -ForegroundColor Yellow
    Write-Host "  Keystore Password: [You entered this]" -ForegroundColor White
    Write-Host "  Key Password: [You entered this]" -ForegroundColor White
    Write-Host "  Key Alias: $keyAlias" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Update android/app/build.gradle with keystore configuration" -ForegroundColor White
    Write-Host "  2. Build AAB file using build-release-aab.ps1" -ForegroundColor White
    Write-Host "  3. Upload to Google Play Console" -ForegroundColor White
    Write-Host ""
    
    # Save credentials to a secure file (user should save this separately)
    $credentialsFile = "android\app\keystores\keystore-info.txt"
    $credentials = @"
RELEASE KEYSTORE INFORMATION
============================
IMPORTANT: Keep this file secure and private!

Keystore Path: $keystorePath
Keystore Password: [REDACTED - You know this]
Key Alias: $keyAlias
Key Password: [REDACTED - You know this]

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

WARNING: If you lose this keystore, you cannot update your app on Play Store!
"@
    
    Set-Content -Path $credentialsFile -Value $credentials
    Write-Host "Keystore info saved to: $credentialsFile" -ForegroundColor Green
    Write-Host "(Passwords are not saved - remember them!)" -ForegroundColor Yellow
    
    # Create keystore.properties file
    Write-Host ""
    Write-Host "Creating keystore.properties file..." -ForegroundColor Cyan
    $keystorePropsPath = "android\keystore.properties"
    $keystorePropsContent = @"
storeFile=app/keystores/release.keystore
storePassword=$keystorePasswordPlain
keyAlias=$keyAlias
keyPassword=$keyPasswordPlain
"@
    Set-Content -Path $keystorePropsPath -Value $keystorePropsContent
    Write-Host "✅ keystore.properties created at: $keystorePropsPath" -ForegroundColor Green
    Write-Host "This file is configured for your build.gradle" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Failed to generate keystore" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

