# Mobile App Rebuild Script
# This script will clean and rebuild the mobile app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobile App Rebuild Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version
Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Step 1: Clean Mobile App
Write-Host "Step 1: Cleaning Mobile App..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  Removing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Write-Host "  Removing package-lock.json..." -ForegroundColor Gray
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
}
Write-Host "✓ Mobile app cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Install Mobile App Dependencies
Write-Host "Step 2: Installing Mobile App Dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install mobile app dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Mobile app dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Check Configuration
Write-Host "Step 3: Verifying Configuration..." -ForegroundColor Yellow

# Check mobile app config
$mobileConfig = Get-Content "utils/config.js" -Raw -ErrorAction SilentlyContinue
if ($mobileConfig -and $mobileConfig -match "EXPO_PUBLIC_API_URL") {
    Write-Host "✓ Mobile app API configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Mobile app API configuration may need review" -ForegroundColor Yellow
}

# Check eas.json
if (Test-Path "eas.json") {
    Write-Host "✓ eas.json found" -ForegroundColor Green
} else {
    Write-Host "⚠️  eas.json not found" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobile App Rebuild Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend server is running" -ForegroundColor White
Write-Host "2. Update utils/config.js with your backend URL if needed" -ForegroundColor White
Write-Host "3. Start mobile app: npm start" -ForegroundColor White
Write-Host "4. For Android: npm run android" -ForegroundColor White
Write-Host "5. For iOS: npm run ios" -ForegroundColor White
Write-Host ""
Write-Host "For full project rebuild, run ..\rebuild.ps1 from root directory" -ForegroundColor Cyan
Write-Host ""

