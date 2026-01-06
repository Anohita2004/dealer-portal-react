# Dealer Portal Rebuild Script
# This script will clean and rebuild the application

# Get the script's directory and navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = $scriptPath

# If running from mobile-app directory, go up one level
if (Split-Path -Leaf $scriptPath -eq "mobile-app") {
    $projectRoot = Split-Path -Parent $scriptPath
}

# Change to project root
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dealer Portal Rebuild Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project Root: $projectRoot" -ForegroundColor Gray
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

# Step 1: Clean Frontend
Write-Host "Step 1: Cleaning Frontend..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  Removing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Write-Host "  Removing package-lock.json..." -ForegroundColor Gray
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
}
Write-Host "✓ Frontend cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Install Frontend Dependencies
Write-Host "Step 2: Installing Frontend Dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Clean Mobile App
Write-Host "Step 3: Cleaning Mobile App..." -ForegroundColor Yellow
Push-Location mobile-app
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

# Step 4: Install Mobile App Dependencies
Write-Host "Step 4: Installing Mobile App Dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install mobile app dependencies!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✓ Mobile app dependencies installed" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 5: Check Environment Files
Write-Host "Step 5: Checking Environment Configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  ⚠️  .env file not found. Creating .env.example reference..." -ForegroundColor Yellow
    Write-Host "  Please create .env file with:" -ForegroundColor Yellow
    Write-Host "    VITE_API_URL=http://localhost:3000/api" -ForegroundColor Gray
    Write-Host "    VITE_SOCKET_URL=http://localhost:3000" -ForegroundColor Gray
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Step 6: Verify Configuration
Write-Host "Step 6: Verifying Configuration..." -ForegroundColor Yellow

# Check frontend API config
$apiConfig = Get-Content "src/services/api.js" -Raw
if ($apiConfig -match "VITE_API_URL") {
    Write-Host "✓ Frontend API configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend API configuration may need review" -ForegroundColor Yellow
}

# Check mobile app config
$mobileConfig = Get-Content "mobile-app/utils/config.js" -Raw
if ($mobileConfig -match "EXPO_PUBLIC_API_URL") {
    Write-Host "✓ Mobile app API configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Mobile app API configuration may need review" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Rebuild Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Ensure backend server is running on port 3000" -ForegroundColor White
Write-Host "2. Create .env file if needed (see .env.example)" -ForegroundColor White
Write-Host "3. Start frontend: npm run dev" -ForegroundColor White
Write-Host "4. Start mobile app: cd mobile-app && npm start" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see REBUILD_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

