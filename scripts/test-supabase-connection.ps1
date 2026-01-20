# Test Supabase Connection Script
# This script tests if the database connection is working

param(
    [string]$Password = $null
)

$projectRef = "solxqaovtrjivudxecqi"

# Try to get password from parameter or env var
if (-not $Password) {
    $Password = $env:SUPABASE_PASSWORD
}

# Try to get DATABASE_URL from .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'DATABASE_URL\s*=\s*"([^"]+)"') {
        $existingUrl = $matches[1]
        Write-Host "Found existing DATABASE_URL in .env.local"
        Write-Host ""
    }
}

if (-not $Password -and -not $existingUrl) {
    Write-Host "ERROR: Password not provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage options:" -ForegroundColor Yellow
    Write-Host "  1. As parameter: powershell scripts/test-supabase-connection.ps1 -Password 'your-password'" -ForegroundColor Cyan
    Write-Host "  2. Via env var: `$env:SUPABASE_PASSWORD = 'your-password'; powershell scripts/test-supabase-connection.ps1" -ForegroundColor Cyan
    Write-Host "  3. If DATABASE_URL is already in .env.local, just run: powershell scripts/test-supabase-connection.ps1" -ForegroundColor Cyan
    exit 1
}

# Use existing URL or construct new one
if ($existingUrl) {
    $databaseUrl = $existingUrl
} else {
    $encodedPassword = [System.Uri]::EscapeDataString($Password)
    $databaseUrl = "postgresql://postgres:$encodedPassword@db.$projectRef.supabase.co:5432/postgres"
}

Write-Host "=========================================="
Write-Host "Testing Supabase Connection"
Write-Host "=========================================="
Write-Host ""
Write-Host "Project Reference: $projectRef"
Write-Host "Connection String: postgresql://postgres:***@db.$projectRef.supabase.co:5432/postgres"
Write-Host ""

# Test connection using Node.js
Write-Host "Testing connection..." -ForegroundColor Yellow
Write-Host ""

$testScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await prisma.\$connect();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await prisma.\$queryRaw\`SELECT 1 as test\`;
    console.log('✅ Query test successful:', JSON.stringify(result));
    
    // Check if tables exist
    const tables = await prisma.\$queryRaw\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    \`;
    console.log('✅ Found', tables.length, 'tables in database');
    
    await prisma.\$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

testConnection();
"@

$testScript | Out-File -FilePath "test-connection-temp.js" -Encoding UTF8

# Set DATABASE_URL and run test
$env:DATABASE_URL = $databaseUrl
try {
    node test-connection-temp.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "✅ Supabase connection is working!" -ForegroundColor Green
        Write-Host "=========================================="
    } else {
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "❌ Connection failed" -ForegroundColor Red
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Verify your password is correct"
        Write-Host "2. Check if Supabase project is active: https://supabase.com/dashboard/project/$projectRef"
        Write-Host "3. Verify firewall allows port 5432"
        Write-Host "4. Try using connection pooling (port 6543) instead"
    }
} catch {
    Write-Host "Error running test: $_" -ForegroundColor Red
} finally {
    Remove-Item -Path "test-connection-temp.js" -ErrorAction SilentlyContinue
}
