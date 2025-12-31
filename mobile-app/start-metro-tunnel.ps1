# Start Metro bundler with tunnel mode for easier connection
Write-Host "Starting Metro bundler with tunnel mode..." -ForegroundColor Cyan
Write-Host "This allows connection even if devices are on different networks" -ForegroundColor Yellow
Write-Host ""

npx expo start --tunnel

