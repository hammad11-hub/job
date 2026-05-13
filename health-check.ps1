#!/usr/bin/env pwsh

# Health check script for HireOS

$ErrorActionPreference = "Continue"

Write-Host "🏥 HireOS Health Check" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$issues = @()
$warnings = @()

# Test 1: API Service
Write-Host "`n📡 API Service (Port 4000)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:4000/ -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "  ✓ Status: $($data.status)" -ForegroundColor Green
    Write-Host "  ✓ Service: $($data.service)" -ForegroundColor Green
}
catch {
    $issues += "API not responding. Run: npm run dev"
    Write-Host "  ✗ Not responding" -ForegroundColor Red
}

# Test 2: Frontend Service
Write-Host "`n🌐 Frontend Service (Port 3000)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    $warnings += "Frontend not responding. Make sure it's running."
    Write-Host "  ✗ Not responding" -ForegroundColor Yellow
}

# Test 3: Database Connection
Write-Host "`n💾 Database" -ForegroundColor Yellow
if ($env:DATABASE_URL) {
    Write-Host "  ✓ DATABASE_URL configured" -ForegroundColor Green
    
    # Try to parse connection
    if ($env:DATABASE_URL -like "postgresql://*") {
        Write-Host "  ✓ PostgreSQL connection string valid" -ForegroundColor Green
    }
}
else {
    $warnings += "DATABASE_URL not set"
    Write-Host "  ⚠ DATABASE_URL not configured" -ForegroundColor Yellow
}

# Test 4: Environment Variables
Write-Host "`n⚙️  Environment Variables" -ForegroundColor Yellow
$vars = @("DATABASE_URL", "PORT", "NODE_ENV", "OPENAI_API_KEY", "NEXT_PUBLIC_API_URL")
foreach ($var in $vars) {
    $value = Get-Item -Path "env:$var" -ErrorAction SilentlyContinue
    if ($value) {
        $display = if ($var -like "*KEY*") { "***" } else { $value.Value }
        Write-Host "  ✓ $var = $display" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ $var not set" -ForegroundColor Yellow
    }
}

# Test 5: Node/npm Versions
Write-Host "`n📦 Build Tools" -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green

# Test 6: Dependencies
Write-Host "`n📚 Dependencies" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✓ node_modules exists" -ForegroundColor Green
}
else {
    $issues += "node_modules not found. Run: npm install"
    Write-Host "  ✗ node_modules missing" -ForegroundColor Red
}

# Test 7: Build Output
Write-Host "`n🔨 Build Output" -ForegroundColor Yellow
$hasNext = Test-Path "saas/apps/web/.next"
$hasDist = Test-Path "saas/apps/api/dist"
if ($hasNext) { Write-Host "  ✓ Frontend build exists (.next/)" -ForegroundColor Green } 
else { Write-Host "  ⚠ No frontend build. Run: npm run build" -ForegroundColor Yellow }
if ($hasDist) { Write-Host "  ✓ API build exists (dist/)" -ForegroundColor Green }
else { Write-Host "  ⚠ No API build. Run: npm run build" -ForegroundColor Yellow }

# Test 8: Configuration Files
Write-Host "`n📝 Configuration Files" -ForegroundColor Yellow
$configs = @(
    "saas/apps/api/.env",
    "saas/apps/api/tsconfig.json",
    "saas/apps/web/tsconfig.json",
    "package.json"
)
foreach ($config in $configs) {
    if (Test-Path $config) {
        Write-Host "  ✓ $config" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ $config missing" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✨ All systems operational!" -ForegroundColor Green
}
else {
    if ($issues.Count -gt 0) {
        Write-Host "`n🔴 Issues (must fix):" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "  • $_" -ForegroundColor Red }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  Warnings (recommended):" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "  • $_" -ForegroundColor Yellow }
    }
}

Write-Host "`n📚 Quick Commands:" -ForegroundColor Cyan
Write-Host "  npm run dev          # Start development servers" -ForegroundColor Green
Write-Host "  npm run build        # Build for production" -ForegroundColor Green
Write-Host "  npm run migrate      # Run database migrations" -ForegroundColor Green
Write-Host "  npm run test         # Run full test suite" -ForegroundColor Green
Write-Host "  .\health-check.ps1   # Run this check again" -ForegroundColor Green
Write-Host "`n"
