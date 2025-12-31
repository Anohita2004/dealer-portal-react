# PowerShell script to set Android environment variables
# Run this script as Administrator or add to your PowerShell profile

# Common Android SDK locations
$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
    "C:\Android\Sdk",
    "$env:ProgramFiles\Android\Android Studio\sdk"
)

$sdkPath = $null

# Find Android SDK
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "Android SDK not found. Please install Android Studio first." -ForegroundColor Red
    Write-Host "Download from: https://developer.android.com/studio" -ForegroundColor Yellow
    exit 1
}

# Set environment variables for current session
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Add platform-tools to PATH (contains adb)
$platformTools = Join-Path $sdkPath "platform-tools"
if (Test-Path $platformTools) {
    $env:PATH = "$platformTools;$env:PATH"
    Write-Host "Added platform-tools to PATH" -ForegroundColor Green
} else {
    Write-Host "Warning: platform-tools not found at $platformTools" -ForegroundColor Yellow
}

# Verify adb
$adbPath = Join-Path $platformTools "adb.exe"
if (Test-Path $adbPath) {
    Write-Host "adb found at: $adbPath" -ForegroundColor Green
    Write-Host "Testing adb..." -ForegroundColor Cyan
    & $adbPath version
} else {
    Write-Host "adb.exe not found. Please install Android SDK Platform Tools." -ForegroundColor Red
}

# Set permanently (requires admin)
Write-Host "`nTo set permanently, run as Administrator:" -ForegroundColor Cyan
Write-Host "[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', '$sdkPath', 'User')" -ForegroundColor Yellow
Write-Host "[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', '$sdkPath', 'User')" -ForegroundColor Yellow
Write-Host "`nThen add to PATH:" -ForegroundColor Cyan
Write-Host "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';$platformTools', 'User')" -ForegroundColor Yellow

