# Quick Supabase Connection Check
# Simple script to verify DATABASE_URL is set correctly

Write-Host "=========================================="
Write-Host "Supabase Connection Check"
Write-Host "=========================================="
Write-Host ""

$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: powershell scripts/setup-supabase.ps1 -Password 'your-password'"
    exit 1
}

Write-Host "✅ .env.local file found" -ForegroundColor Green

# Check for DATABASE_URL
$content = Get-Content $envFile -Raw
if ($content -match 'DATABASE_URL\s*=\s*"([^"]+)"') {
    $dbUrl = $matches[1]
    Write-Host "✅ DATABASE_URL found in .env.local" -ForegroundColor Green
    
    # Check format
    if ($dbUrl -match '^postgresql://postgres:') {
        Write-Host "✅ Connection string format is correct" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connection string format might be incorrect" -ForegroundColor Yellow
        Write-Host "   Expected: postgresql://postgres:PASSWORD@db.solxqaovtrjivudxecqi.supabase.co:5432/postgres"
    }
    
    # Check project reference
    if ($dbUrl -match 'solxqaovtrjivudxecqi') {
        Write-Host "✅ Correct project reference: solxqaovtrjivudxecqi" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Project reference might be incorrect" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Connection String (password hidden):"
    $hiddenUrl = $dbUrl -replace ':[^@]*@', ':***@'
    Write-Host "  $hiddenUrl" -ForegroundColor Cyan
    
} else {
    Write-Host "❌ DATABASE_URL not found in .env.local" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: powershell scripts/setup-supabase.ps1 -Password 'your-password'"
    exit 1
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Next Steps"
Write-Host "=========================================="
Write-Host ""
Write-Host "1. Test the connection:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2. Check for errors in the console"
Write-Host ""
Write-Host "3. Open http://localhost:3000 and test the app"
Write-Host ""
Write-Host "4. If connection fails, verify:"
Write-Host "   - Password is correct in .env.local"
Write-Host "   - Supabase project is active: https://supabase.com/dashboard/project/solxqaovtrjivudxecqi"
Write-Host "   - Firewall allows port 5432"
Write-Host ""
