# Live Tracking Test Script for PowerShell
# This script simulates a moving truck by sending location updates

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Live Truck Tracking Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$API_BASE_URL = "http://localhost:3000/api"
$TRUCK_ID = "8cf20524-e0be-4589-9572-a9efc37b0bf4"

# Get token from user
Write-Host "📋 Steps to get your auth token:" -ForegroundColor Yellow
Write-Host "   1. Login to http://localhost:5173" -ForegroundColor Gray
Write-Host "   2. Open DevTools (F12) → Console tab" -ForegroundColor Gray
Write-Host "   3. Run: localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "   4. Copy the token (without quotes)`n" -ForegroundColor Gray

$TOKEN = Read-Host "Paste your token here"

if ([string]::IsNullOrWhiteSpace($TOKEN)) {
    Write-Host "`n❌ No token provided. Exiting...`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Token received!" -ForegroundColor Green
Write-Host "🚚 Starting truck movement simulation...`n" -ForegroundColor Green

# Starting position (from mobile logs)
$lat = 22.540638
$lng = 88.353808
$count = 0

# Headers
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "📍 Starting position: ($lat, $lng)" -ForegroundColor Cyan
Write-Host "⏱️  Sending updates every 11 seconds (respects 10s rate limit)..." -ForegroundColor Cyan
Write-Host "⚠️  Note: Backend rate limit is 10 seconds per update" -ForegroundColor Yellow
Write-Host "🗺️  Open http://localhost:5173 → Fleet → Live Tracking to see movement!`n" -ForegroundColor Cyan

try {
    while ($true) {
        # Move truck slightly (simulate movement)
        $lat += 0.0001  # ~11 meters north
        $lng += 0.0001  # ~11 meters east
        $count++
        
        # Prepare location data
        $locationData = @{
            truckId = $TRUCK_ID
            lat = $lat
            lng = $lng
            speed = 30 + (Get-Random -Minimum 0 -Maximum 10)
            heading = 45
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json

        # Send location update
        $response = Invoke-RestMethod -Uri "$API_BASE_URL/tracking/location" `
            -Method Post `
            -Headers $headers `
            -Body $locationData `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "[$count] ✅ Location sent: Lat=$($lat.ToString('F6')), Lng=$($lng.ToString('F6'))" -ForegroundColor Green
        
        # Wait 11 seconds (slightly more than rate limit to avoid errors)
        Start-Sleep -Seconds 11
    }
}
catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "`n🔑 Token expired or invalid!" -ForegroundColor Yellow
        Write-Host "Please get a new token and try again.`n" -ForegroundColor Yellow
    }
    
    exit 1
}
