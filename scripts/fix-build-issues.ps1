# Fix Next.js Build Issues
# Cleans build artifacts and reinstalls dependencies

Write-Host "=========================================="
Write-Host "Fixing Next.js Build Issues"
Write-Host "=========================================="
Write-Host ""

# Step 1: Clean build artifacts
Write-Host "1. Cleaning build artifacts..."
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "   ✅ Removed .next directory"
} else {
    Write-Host "   ℹ️  .next directory doesn't exist"
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "   ✅ Removed node_modules/.cache"
} else {
    Write-Host "   ℹ️  node_modules/.cache doesn't exist"
}

if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo"
    Write-Host "   ✅ Removed .turbo directory"
}

# Step 2: Regenerate Prisma Client
Write-Host ""
Write-Host "2. Regenerating Prisma Client..."
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client regenerated"
} else {
    Write-Host "   ⚠️  Prisma Client generation failed"
}

# Step 3: Verify environment variables
Write-Host ""
Write-Host "3. Verifying environment variables..."
if (Test-Path ".env") {
    $envContent = Get-Content .env | Select-String "DATABASE_URL"
    if ($envContent) {
        Write-Host "   ✅ DATABASE_URL configured"
    } else {
        Write-Host "   ⚠️  DATABASE_URL not found in .env"
    }
} else {
    Write-Host "   ⚠️  .env file not found"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Next Steps:"
Write-Host "=========================================="
Write-Host "1. Try building again:"
Write-Host "   npm run build"
Write-Host ""
Write-Host "2. Or start development:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. If issues persist, reinstall dependencies:"
Write-Host "   Remove-Item -Recurse -Force node_modules"
Write-Host "   Remove-Item package-lock.json"
Write-Host '   npm install'
Write-Host ''
