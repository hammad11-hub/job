#!/usr/bin/env pwsh

# Production startup script for HireOS

Write-Host "🚀 HireOS Production Start" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# Check environment
Write-Host "`n🔍 Checking environment..." -ForegroundColor Yellow

$env:NODE_ENV = "production"

# Check Node version
$nodeVersion = node --version
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green

# Check npm version
$npmVersion = npm --version
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

# Check database connection
Write-Host "`n💾 Checking database..." -ForegroundColor Yellow
if ($env:DATABASE_URL) {
    Write-Host "✓ DATABASE_URL configured" -ForegroundColor Green
}
else {
    Write-Host "⚠ DATABASE_URL not set - using default" -ForegroundColor Yellow
}

# Run migrations
Write-Host "`n📦 Running database migrations..." -ForegroundColor Yellow
Push-Location "saas/apps/api"
npx prisma migrate deploy
Pop-Location

# Build
Write-Host "`n🔨 Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build complete" -ForegroundColor Green

# Start services
Write-Host "`n🚀 Starting services..." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000" -ForegroundColor Cyan

npm start
