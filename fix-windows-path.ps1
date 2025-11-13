# Fix Windows Path Length Issue for Android Build
# This script helps resolve the 260 character path limit issue on Windows

Write-Host "=== Windows Path Length Fix for Android Build ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges to enable long path support." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To fix the path length issue, you have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Enable Windows Long Path Support (Recommended)" -ForegroundColor Green
    Write-Host "  1. Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor White
    Write-Host "  2. Run this command:" -ForegroundColor White
    Write-Host "     New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1 -PropertyType DWORD -Force" -ForegroundColor Cyan
    Write-Host "  3. Restart your computer" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Build with single architecture (Quick fix)" -ForegroundColor Green
    Write-Host "  Run: npx expo run:android -- -- -PreactNativeArchitectures=arm64-v8a" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 3: Move project to shorter path" -ForegroundColor Green
    Write-Host "  Move project from:" -ForegroundColor White
    Write-Host "    C:\Users\intel\Desktop\Mudassir\HMR\Block-Nativewind\my-expo-app" -ForegroundColor Gray
    Write-Host "  To something like:" -ForegroundColor White
    Write-Host "    C:\Projects\my-expo-app" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Enable long path support
Write-Host "Enabling Windows Long Path Support..." -ForegroundColor Yellow
try {
    New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force | Out-Null
    Write-Host "✅ Long path support enabled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You must restart your computer for this change to take effect." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After restarting, try building again with:" -ForegroundColor Cyan
    Write-Host "  npx expo run:android" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to enable long path support: $_" -ForegroundColor Red
    exit 1
}


