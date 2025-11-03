# Simple API Test Script
# Tests all API endpoints

$baseUrl = "http://localhost:3000/api"
$passed = 0
$failed = 0

Write-Host "Testing API endpoints..." -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Gray
Write-Host ""

# Test endpoints
$endpoints = @(
    "/health",
    "/node/manager/status",
    "/node/managers",
    "/node/versions",
    "/node/current",
    "/git/status",
    "/git/config",
    "/projects",
    "/system/directory-picker"
)

# Check service first
Write-Host "Checking service connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  Service is running (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  Service is not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the service first:" -ForegroundColor Yellow
    Write-Host "  pnpm start:dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Test each endpoint
foreach ($endpoint in $endpoints) {
    $name = $endpoint -replace "^/", "" -replace "/", " "
    Write-Host "Testing: $name..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "  PASS (Status: $($response.StatusCode))" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

# Summary
Write-Host "Test Results: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

if ($failed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Check service logs." -ForegroundColor Yellow
}

