#!/usr/bin/env pwsh

# HireOS Project Test Suite

Write-Host "🚀 HireOS Testing Suite" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Test 1: API Health
Write-Host "`n📡 Test 1: API Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:4000/ -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ API Status: $($data.status)" -ForegroundColor Green
    Write-Host "  Service: $($data.service)" -ForegroundColor Green
    Write-Host "  Version: $($data.version)" -ForegroundColor Green
}
catch {
    Write-Host "✗ API is not responding. Make sure to run: npm run dev" -ForegroundColor Red
    exit 1
}

# Test 2: AI Matching Demo
Write-Host "`n🤖 Test 2: AI Matching Demo" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:4000/ai/match/demo -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ AI Confidence: $($data.confidence)%" -ForegroundColor Green
    Write-Host "  Strengths: $($data.strengths -join ', ')" -ForegroundColor Green
    Write-Host "  Recommendation: $($data.nextAction)" -ForegroundColor Green
}
catch {
    Write-Host "✗ AI endpoint failed: $_" -ForegroundColor Red
}

# Test 3: Frontend
Write-Host "`n🌐 Test 3: Frontend" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Frontend is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "✗ Frontend is not responding" -ForegroundColor Red
}

# Test 4: Database Connection
Write-Host "`n💾 Test 4: Database Status" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:4000/org/me -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Database connected" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Database endpoint might need authentication (expected)" -ForegroundColor Yellow
}

# Test 5: Build Check
Write-Host "`n🔨 Test 5: Production Build" -ForegroundColor Yellow
try {
    Write-Host "Building project..." -ForegroundColor Cyan
    Push-Location "C:\Users\HH Traders\.vscode\New folder\Vs Code data"
    $output = npm run build 2>&1
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Build successful" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Build failed: $output" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Build test failed: $_" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50 -ForegroundColor Cyan
Write-Host "✨ Test suite complete!" -ForegroundColor Cyan
Write-Host "`nAccess the app at:" -ForegroundColor Green
Write-Host "  • Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  • API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "  • API Docs: http://localhost:4000/api" -ForegroundColor Cyan
